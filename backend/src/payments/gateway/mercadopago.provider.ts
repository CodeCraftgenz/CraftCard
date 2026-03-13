import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as crypto from 'crypto';
import type { EnvConfig } from '../../common/config/env.config';
import type {
  PaymentGateway,
  CheckoutPreferenceInput,
  CheckoutPreferenceResult,
  FetchedPayment,
  PaymentSearchResult,
} from './payment-gateway.interface';

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
export class MercadoPagoProvider implements PaymentGateway {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private readonly preference: Preference;
  private readonly accessToken: string;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.accessToken = this.configService.get('MP_ACCESS_TOKEN', { infer: true })!;
    this.isProduction = this.configService.get('NODE_ENV', { infer: true }) === 'production';

    const mpClient = new MercadoPagoConfig({ accessToken: this.accessToken });
    this.preference = new Preference(mpClient);
  }

  async createPreference(input: CheckoutPreferenceInput): Promise<CheckoutPreferenceResult> {
    const mpResponse = await this.preference.create({
      body: {
        items: [
          {
            id: input.paymentId,
            title: input.title,
            description: input.description,
            quantity: 1,
            currency_id: input.currency,
            unit_price: input.price,
          },
        ],
        back_urls: input.backUrls,
        auto_return: 'approved',
        notification_url: input.notificationUrl,
        external_reference: input.paymentId,
        payment_methods: { installments: 4 },
        payer: { email: input.payerEmail },
      },
    });

    const checkoutUrl = this.isProduction
      ? mpResponse.init_point!
      : mpResponse.sandbox_init_point!;

    return { checkoutUrl, preferenceId: mpResponse.id! };
  }

  async fetchPayment(providerPaymentId: string): Promise<FetchedPayment> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${providerPaymentId}`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } },
    );

    if (!response.ok) {
      throw new Error(`MP API error ${response.status} for payment ${providerPaymentId}`);
    }

    const mp = await response.json();
    return {
      status: MP_STATUS_MAP[mp.status] || 'pending',
      externalReference: mp.external_reference || null,
      amount: mp.transaction_amount || 0,
      payerEmail: mp.payer?.email || null,
      rawResponse: JSON.stringify(mp),
    };
  }

  async searchPaymentsByReference(externalRef: string): Promise<PaymentSearchResult> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${externalRef}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } },
    );

    if (!response.ok) {
      throw new Error(`MP search API error ${response.status} for ref ${externalRef}`);
    }

    const result = await response.json();
    const payments: FetchedPayment[] = (result.results || []).map((mp: any) => ({
      status: MP_STATUS_MAP[mp.status] || 'pending',
      externalReference: mp.external_reference || null,
      amount: mp.transaction_amount || 0,
      payerEmail: mp.payer?.email || null,
      rawResponse: JSON.stringify(mp),
    }));

    return { payments };
  }

  verifyWebhookSignature(
    body: any,
    headers: Record<string, string>,
    secret: string,
  ): boolean {
    const xSignature = headers['x-signature'] || headers['xSignature'];
    const xRequestId = headers['x-request-id'] || headers['xRequestId'];

    if (!xSignature || !xRequestId) return false;

    const parts = xSignature.split(',');
    const ts = parts.find((p) => p.trim().startsWith('ts='))?.split('=')[1];
    const v1 = parts.find((p) => p.trim().startsWith('v1='))?.split('=')[1];

    const dataId = body?.data?.id;
    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const expected = crypto.createHmac('sha256', secret).update(template).digest('hex');

    return v1 === expected;
  }
}
