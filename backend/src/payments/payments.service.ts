import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY', { infer: true })!, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async hasUserPaid(userId: string): Promise<boolean> {
    const payment = await this.prisma.payment.findFirst({
      where: { userId, status: 'paid' },
    });
    return !!payment;
  }

  async createCheckoutSession(userId: string, email: string): Promise<{ url: string }> {
    const alreadyPaid = await this.hasUserPaid(userId);
    if (alreadyPaid) {
      throw AppException.conflict('Pagamento ja realizado');
    }

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'CraftCard - Cartao Digital Profissional',
              description: 'Pagamento unico para criar e publicar seu cartao digital',
            },
            unit_amount: 2000, // R$20.00 in centavos
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/editor?payment=cancelled`,
      metadata: { userId },
    });

    // Create pending payment record
    await this.prisma.payment.create({
      data: {
        userId,
        stripeSessionId: session.id,
        amount: 20.0,
        currency: 'BRL',
        status: 'pending',
      },
    });

    this.logger.log(`Checkout session created for user ${userId}: ${session.id}`);

    return { url: session.url! };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET', { infer: true })!;

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw AppException.badRequest('Assinatura do webhook invalida');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.processPayment(session);
    }
  }

  private async processPayment(session: Stripe.Checkout.Session): Promise<void> {
    const { id: sessionId, client_reference_id: userId, payment_intent } = session;

    if (!userId) {
      this.logger.warn(`Webhook: no client_reference_id in session ${sessionId}`);
      return;
    }

    // Idempotency: check if already processed
    const existing = await this.prisma.payment.findFirst({
      where: { stripeSessionId: sessionId, status: 'paid' },
    });
    if (existing) {
      this.logger.log(`Payment already processed for session ${sessionId}`);
      return;
    }

    await this.prisma.payment.updateMany({
      where: { stripeSessionId: sessionId },
      data: {
        status: 'paid',
        stripePaymentIntentId: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Payment confirmed for user ${userId}, session ${sessionId}`);
  }
}
