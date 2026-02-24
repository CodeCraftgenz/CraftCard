import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';
import { getPlanLimits, type PlanType, type PlanLimits } from './plan-limits';

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

const PLAN_PRICES: Record<string, number> = {
  PRO: 30.0,
  BUSINESS: 299.0,
};
const PLAN_TITLES: Record<string, string> = {
  PRO: 'CraftCard Pro - Cartao Digital Profissional (Anual)',
  BUSINESS: 'CraftCard Business - Plano Empresarial (Anual)',
};
const SUBSCRIPTION_DAYS = 365;

/** Emails with permanent free access (founders / team) */
const FREE_ACCESS_EMAILS = new Set([
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com',
]);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly preference: Preference;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
    private readonly mailService: MailService,
  ) {
    const mpClient = new MercadoPagoConfig({
      accessToken: this.configService.get('MP_ACCESS_TOKEN', { infer: true })!,
    });
    this.preference = new Preference(mpClient);
  }

  async getActiveSubscription(userId: string): Promise<{ active: boolean; expiresAt: Date | null }> {
    const planInfo = await this.getUserPlanInfo(userId);
    return { active: planInfo.plan !== 'FREE', expiresAt: planInfo.expiresAt };
  }

  /**
   * Get the user's plan, limits, and subscription info.
   * Source of truth: user.plan column (synced on payment approval).
   * FREE_ACCESS_EMAILS get ENTERPRISE (full access) for free.
   */
  async getUserPlanInfo(userId: string): Promise<{
    plan: PlanType;
    planLimits: PlanLimits;
    expiresAt: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, plan: true },
    });

    if (!user) {
      return { plan: 'FREE', planLimits: getPlanLimits('FREE'), expiresAt: null };
    }

    // Free-access whitelist → ENTERPRISE (full access) regardless of DB
    if (FREE_ACCESS_EMAILS.has(user.email.toLowerCase())) {
      return { plan: 'ENTERPRISE', planLimits: getPlanLimits('ENTERPRISE'), expiresAt: null };
    }

    const plan = (user.plan || 'FREE') as PlanType;

    // For paid plans, check expiration
    if (plan !== 'FREE') {
      const payment = await this.prisma.payment.findFirst({
        where: {
          userId,
          status: 'approved',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        orderBy: { paidAt: 'desc' },
        select: { expiresAt: true },
      });

      // If no active payment, downgrade to FREE
      if (!payment) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { plan: 'FREE' },
        }).catch(() => {});
        return { plan: 'FREE', planLimits: getPlanLimits('FREE'), expiresAt: null };
      }

      return { plan, planLimits: getPlanLimits(plan), expiresAt: payment.expiresAt };
    }

    return { plan: 'FREE', planLimits: getPlanLimits('FREE'), expiresAt: null };
  }

  async createCheckoutPreference(userId: string, email: string, plan: 'PRO' | 'BUSINESS' = 'PRO'): Promise<{ url: string }> {
    const subscription = await this.getActiveSubscription(userId);
    if (subscription.active) {
      throw AppException.conflict('Voce ja possui uma assinatura ativa');
    }

    const price = PLAN_PRICES[plan];
    const title = PLAN_TITLES[plan];
    if (!price || !title) {
      throw AppException.badRequest('Plano invalido. Use PRO ou BUSINESS.');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: price,
        currency: 'BRL',
        status: 'pending',
        plan,
        payerEmail: email,
      },
    });

    const backendUrl = this.configService.get('BACKEND_URL', { infer: true });

    const mpResponse = await this.preference.create({
      body: {
        items: [
          {
            id: payment.id,
            title,
            description: `Assinatura anual CraftCard ${plan}`,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: price,
          },
        ],
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/editor?payment=failed`,
          pending: `${frontendUrl}/editor?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/api/payments/webhook`,
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

    this.logger.log(`Checkout preference created for user ${userId} (${plan}): ${mpResponse.id}`);

    return { url: checkoutUrl };
  }

  async handleWebhook(
    body: { type?: string; action?: string; data?: { id?: string } },
    headers: { xSignature?: string; xRequestId?: string },
  ): Promise<void> {
    const webhookSecret = this.configService.get('MP_WEBHOOK_SECRET', { infer: true });

    // Validate signature if secret is configured (non-blocking: log warning instead of rejecting)
    if (webhookSecret && webhookSecret !== 'placeholder') {
      const { xSignature, xRequestId } = headers;
      if (xSignature && xRequestId) {
        const parts = xSignature.split(',');
        const ts = parts.find((p) => p.trim().startsWith('ts='))?.split('=')[1];
        const v1 = parts.find((p) => p.trim().startsWith('v1='))?.split('=')[1];

        const dataId = body.data?.id;
        const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

        const expected = crypto.createHmac('sha256', webhookSecret).update(template).digest('hex');

        if (v1 !== expected) {
          this.logger.warn(`Webhook signature mismatch - proceeding anyway (verified via MP API)`);
        }
      } else {
        this.logger.warn('Webhook received without signature headers - proceeding (verified via MP API)');
      }
    }

    // Handle payment.created, payment.updated actions or type: payment
    const isPayment =
      body.type === 'payment' ||
      body.action?.startsWith('payment.');

    if (!isPayment || !body.data?.id) {
      this.logger.log(`Ignoring non-payment webhook: type=${body.type}, action=${body.action}`);
      return;
    }

    await this.processPaymentNotification(String(body.data.id));
  }

  /**
   * Process payment notification by MP payment ID (used by IPN query param format)
   */
  async processPaymentNotificationById(mpPaymentId: string): Promise<void> {
    await this.processPaymentNotification(mpPaymentId);
  }

  /**
   * Verify pending payments for a user by querying MP API directly.
   * Used as fallback when webhook doesn't arrive.
   */
  async verifyPendingPayments(userId: string): Promise<{ synced: boolean; status: string }> {
    const pendingPayments = await this.prisma.payment.findMany({
      where: { userId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (pendingPayments.length === 0) {
      return { synced: false, status: 'no_pending_payments' };
    }

    const accessToken = this.configService.get('MP_ACCESS_TOKEN', { infer: true });

    for (const payment of pendingPayments) {
      if (!payment.preferenceId) continue;

      // Search for payments by external_reference (our payment ID)
      try {
        const searchResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${payment.id}&sort=date_created&criteria=desc`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );

        if (!searchResponse.ok) {
          this.logger.warn(`Failed to search MP payments for ${payment.id}: ${searchResponse.status}`);
          continue;
        }

        const searchResult = await searchResponse.json();
        const results = searchResult.results || [];

        for (const mpPayment of results) {
          const newStatus = MP_STATUS_MAP[mpPayment.status] || 'pending';

          if (newStatus === 'approved' && payment.status !== 'approved') {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'approved',
                mpPaymentId: String(mpPayment.id),
                mpResponseJson: JSON.stringify(mpPayment),
                paidAt: now,
                expiresAt,
              },
            });

            // Sync user plan (use plan from payment record, fallback PRO for old records)
            const targetPlan = payment.plan || 'PRO';
            await this.prisma.user.update({
              where: { id: userId },
              data: { plan: targetPlan },
            }).catch(() => {});

            this.logger.log(`Payment verified and approved: ${payment.id} (MP: ${mpPayment.id}, plan: ${targetPlan})`);
            return { synced: true, status: 'approved' };
          }
        }
      } catch (err) {
        this.logger.error(`Error verifying payment ${payment.id}: ${err}`);
      }
    }

    return { synced: false, status: 'still_pending' };
  }

  /** Admin-only: activate a plan for any user by email */
  async adminActivatePlan(adminUserId: string, targetEmail: string, plan: string, days?: number): Promise<{ activated: boolean; email: string; plan: string; expiresAt: string | null }> {
    // Verify caller is admin
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { email: true } });
    if (!admin || !FREE_ACCESS_EMAILS.has(admin.email.toLowerCase())) {
      throw AppException.forbidden('Acesso restrito a administradores');
    }

    const validPlans = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'];
    const normalizedPlan = plan.toUpperCase();
    if (!validPlans.includes(normalizedPlan)) {
      throw AppException.badRequest(`Plano invalido. Use: ${validPlans.join(', ')}`);
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { email: { equals: targetEmail } },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      throw AppException.notFound(`Usuario com email ${targetEmail}`);
    }

    // Update user plan
    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: { plan: normalizedPlan },
    });

    // Create payment record for audit
    const subscriptionDays = days || SUBSCRIPTION_DAYS;
    const now = new Date();
    const expiresAt = normalizedPlan === 'FREE' ? null : new Date(now.getTime() + subscriptionDays * 24 * 60 * 60 * 1000);

    if (normalizedPlan !== 'FREE') {
      await this.prisma.payment.create({
        data: {
          userId: targetUser.id,
          amount: 0,
          currency: 'BRL',
          status: 'approved',
          plan: normalizedPlan,
          payerEmail: targetEmail,
          paidAt: now,
          expiresAt,
        },
      });
    }

    this.logger.log(`Admin ${admin.email} activated ${normalizedPlan} for ${targetEmail} (expires: ${expiresAt?.toISOString() || 'never'})`);

    return {
      activated: true,
      email: targetEmail,
      plan: normalizedPlan,
      expiresAt: expiresAt?.toISOString() || null,
    };
  }

  /** Admin-only: list all users with their plans */
  async adminListUsers(adminUserId: string): Promise<{ id: string; name: string | null; email: string; plan: string; createdAt: Date }[]> {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId }, select: { email: true } });
    if (!admin || !FREE_ACCESS_EMAILS.has(admin.email.toLowerCase())) {
      throw AppException.forbidden('Acesso restrito a administradores');
    }

    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
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

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.payment.update({
      where: { id: externalRef },
      data: {
        status: newStatus,
        mpPaymentId: String(mpPaymentId),
        mpResponseJson: JSON.stringify(mpPayment),
        paidAt: newStatus === 'approved' ? now : undefined,
        expiresAt: newStatus === 'approved' ? expiresAt : undefined,
      },
    });

    // Sync user plan on approval (use plan from payment record, fallback PRO for old records)
    if (newStatus === 'approved') {
      const targetPlan = existing.plan || 'PRO';
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: { plan: targetPlan },
      }).catch((err) => this.logger.error(`Failed to update user plan: ${err}`));

      // Send payment confirmation email (fire-and-forget)
      const user = await this.prisma.user.findUnique({ where: { id: existing.userId }, select: { email: true, name: true } });
      if (user) {
        this.mailService.sendPaymentConfirmation(user.email, user.name, targetPlan).catch(() => {});
      }
    }

    this.logger.log(`Payment ${externalRef} → ${newStatus} (MP: ${mpPaymentId}, expires: ${expiresAt.toISOString()})`);
  }
}
