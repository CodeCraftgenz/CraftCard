import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

const MP_STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  pending: 'pending',
  authorized: 'pending',
  in_process: 'pending',
  in_mediation: 'pending',
  rejected: 'rejected',
  cancelled: 'cancelled',
  refunded: 'refunded',
  charged_back: 'refunded',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly preference: Preference;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    const mpClient = new MercadoPagoConfig({
      accessToken: this.configService.get('MP_ACCESS_TOKEN', { infer: true })!,
    });
    this.preference = new Preference(mpClient);
  }

  async hasUserPaid(userId: string): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: { userId, status: 'approved' },
    });
    return !!payment;
  }

  async createCheckoutPreference(userId: string, email: string): Promise<{ url: string }> {
    const alreadyPaid = await this.hasUserPaid(userId);
    if (alreadyPaid) {
      throw AppException.conflict('Pagamento ja realizado');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: 20.0,
        currency: 'BRL',
        status: 'pending',
        payerEmail: email,
      },
    });

    const mpResponse = await this.preference.create({
      body: {
        items: [
          {
            id: payment.id,
            title: 'CraftCard - Cartao Digital Profissional',
            description: 'Pagamento unico para criar e publicar seu cartao digital',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: 20.0,
          },
        ],
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/editor?payment=failed`,
          pending: `${frontendUrl}/editor?payment=pending`,
        },
        auto_return: 'approved',
        external_reference: payment.id,
        payment_methods: {
          installments: 4,
        },
        payer: {
          email,
        },
      },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { preferenceId: mpResponse.id },
    });

    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    const checkoutUrl =
      nodeEnv === 'production' ? mpResponse.init_point! : mpResponse.sandbox_init_point!;

    this.logger.log(`Checkout preference created for user ${userId}: ${mpResponse.id}`);

    return { url: checkoutUrl };
  }

  async handleWebhook(
    body: { type?: string; data?: { id?: string } },
    headers: { xSignature?: string; xRequestId?: string },
  ): Promise<void> {
    const webhookSecret = this.configService.get('MP_WEBHOOK_SECRET', { infer: true });

    // Validate signature if secret is configured
    if (webhookSecret && webhookSecret !== 'placeholder') {
      const { xSignature, xRequestId } = headers;
      if (!xSignature || !xRequestId) {
        throw AppException.unauthorized('Assinatura do webhook ausente');
      }

      const parts = xSignature.split(',');
      const ts = parts.find((p) => p.trim().startsWith('ts='))?.split('=')[1];
      const v1 = parts.find((p) => p.trim().startsWith('v1='))?.split('=')[1];

      const dataId = body.data?.id;
      const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      const expected = crypto.createHmac('sha256', webhookSecret).update(template).digest('hex');

      if (v1 !== expected) {
        this.logger.warn('Webhook signature mismatch');
        throw AppException.unauthorized('Assinatura do webhook invalida');
      }
    }

    if (body.type !== 'payment' || !body.data?.id) {
      return;
    }

    await this.processPaymentNotification(String(body.data.id));
  }

  private async processPaymentNotification(mpPaymentId: string): Promise<void> {
    const accessToken = this.configService.get('MP_ACCESS_TOKEN', { infer: true });
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(`Failed to fetch MP payment ${mpPaymentId}: ${response.status}`);
      return;
    }

    const mpPayment = await response.json();
    const externalRef = mpPayment.external_reference;

    if (!externalRef) {
      this.logger.warn(`No external_reference in MP payment ${mpPaymentId}`);
      return;
    }

    const newStatus = MP_STATUS_MAP[mpPayment.status] || 'pending';

    // Idempotency check
    const existing = await this.prisma.payment.findUnique({
      where: { id: externalRef },
    });

    if (!existing) {
      this.logger.warn(`Payment record not found: ${externalRef}`);
      return;
    }

    if (existing.status === 'approved') {
      this.logger.log(`Payment already approved: ${externalRef}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: externalRef },
      data: {
        status: newStatus,
        mpPaymentId: String(mpPaymentId),
        mpResponseJson: JSON.stringify(mpPayment),
        paidAt: newStatus === 'approved' ? new Date() : undefined,
      },
    });

    this.logger.log(`Payment ${externalRef} → ${newStatus} (MP: ${mpPaymentId})`);
  }
}
