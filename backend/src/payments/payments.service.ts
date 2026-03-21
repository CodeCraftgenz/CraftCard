/**
 * Serviço de pagamentos e gerenciamento de planos.
 *
 * Responsável por:
 * - Criar preferências de checkout no gateway (Mercado Pago)
 * - Processar webhooks de pagamento (com verificação HMAC obrigatória)
 * - Determinar o plano ativo do usuário (considerando whitelist, expiração e herança B2B)
 * - Ativação manual de planos por admin (SUPER_ADMIN)
 * - Consulta de informações de billing
 *
 * Regras de negócio importantes:
 * - Emails na whitelist (FREE_ACCESS_EMAILS) recebem ENTERPRISE grátis
 * - Membros de organização herdam o plano do OWNER se for BUSINESS+
 * - Pagamentos usam updateMany com filtro "status not approved" para evitar race conditions
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppException } from '../common/exceptions/app.exception';
import type { EnvConfig } from '../common/config/env.config';
import { getPlanLimits, type PlanType, type PlanLimits } from './plan-limits';
import { PAYMENT_GATEWAY, type PaymentGateway } from './gateway/payment-gateway.interface';
import { FREE_ACCESS_EMAILS } from '../common/constants/admin-whitelist';

// Preços fixos do plano PRO (em BRL)
const PRO_MONTHLY = 19.9;
const PRO_YEARLY_MONTH = 15.9; // ~20% de desconto no anual

// Preços escalonados do plano BUSINESS por assento/mês — de 5 a 100 assentos
// Quanto mais assentos, menor o preço unitário (volume discount)
const BUSINESS_TIERS = [
  { min: 1, max: 10, price: 39.9 },
  { min: 11, max: 25, price: 34.9 },
  { min: 26, max: 50, price: 29.9 },
  { min: 51, max: 100, price: 22.9 },
];

/** Calcula o preço por assento com base na faixa de volume */
function getBusinessPricePerSeat(seats: number): number {
  for (const tier of BUSINESS_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier.price;
  }
  // Acima de 100 assentos, usa o preço da última faixa
  return BUSINESS_TIERS[BUSINESS_TIERS.length - 1].price;
}

// Preços legados (compatibilidade com registros antigos de pagamento)
const PLAN_PRICES: Record<string, number> = {
  PRO: 19.9,
  BUSINESS: 19.9,
  ENTERPRISE: 0,
};

// Títulos exibidos na tela de checkout do Mercado Pago
const PLAN_TITLES: Record<string, string> = {
  PRO: 'CraftCard Pro - Cartão Digital Profissional',
  BUSINESS: 'CraftCard Business - Plano Empresarial',
  ENTERPRISE: 'CraftCard Enterprise - Plano Completo',
};
const SUBSCRIPTION_DAYS_MONTHLY = 30;
const SUBSCRIPTION_DAYS_YEARLY = 365;

// Hierarquia de planos — usado para comparar se upgrade/downgrade e para herança B2B
const PLAN_HIERARCHY: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2, ENTERPRISE: 3 };


@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
    private readonly mailService: MailService,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway,
  ) {}

  /** Verifica se o usuário tem assinatura ativa (qualquer plano diferente de FREE) */
  async getActiveSubscription(userId: string): Promise<{ active: boolean; expiresAt: Date | null }> {
    const planInfo = await this.getUserPlanInfo(userId);
    return { active: planInfo.plan !== 'FREE', expiresAt: planInfo.expiresAt };
  }

  /**
   * Get the user's plan, limits, and subscription info.
   * Source of truth: user.plan column (synced on payment approval).
   * FREE_ACCESS_EMAILS get ENTERPRISE (full access) for free.
   * Org members inherit the OWNER's plan if higher (B2B plan inheritance).
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

    let plan = (user.plan || 'FREE') as PlanType;
    let expiresAt: Date | null = null;

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

      if (!payment) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { plan: 'FREE' },
        }).catch(() => {});
        plan = 'FREE';
      } else {
        expiresAt = payment.expiresAt;
      }
    }

    // B2B plan inheritance: if user is member of an org with a BUSINESS+ OWNER, inherit that plan
    const orgPlan = await this.getOrgInheritedPlan(userId);
    if (orgPlan && (PLAN_HIERARCHY[orgPlan] ?? 0) > (PLAN_HIERARCHY[plan] ?? 0)) {
      return { plan: orgPlan, planLimits: getPlanLimits(orgPlan), expiresAt };
    }

    return { plan, planLimits: getPlanLimits(plan), expiresAt };
  }

  /**
   * Check if user inherits a plan from an org OWNER.
   * If the user is a MEMBER/ADMIN of an org whose OWNER has BUSINESS+,
   * the member inherits that plan level.
   */
  private async getOrgInheritedPlan(userId: string): Promise<PlanType | null> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { orgId: true },
    });

    if (memberships.length === 0) return null;

    // Batch query: fetch all org owners in one query instead of N queries
    const orgIds = memberships.map((m) => m.orgId);
    const owners = await this.prisma.organizationMember.findMany({
      where: { orgId: { in: orgIds }, role: 'OWNER' },
      include: { user: { select: { plan: true, email: true } } },
    });

    let bestPlan: PlanType = 'FREE';
    for (const owner of owners) {
      let ownerPlan: PlanType;
      if (FREE_ACCESS_EMAILS.has(owner.user.email.toLowerCase())) {
        ownerPlan = 'ENTERPRISE';
      } else {
        ownerPlan = (owner.user.plan || 'FREE') as PlanType;
      }

      // Only inherit if owner has BUSINESS or higher
      if ((PLAN_HIERARCHY[ownerPlan] ?? 0) >= PLAN_HIERARCHY.BUSINESS && (PLAN_HIERARCHY[ownerPlan] ?? 0) > (PLAN_HIERARCHY[bestPlan] ?? 0)) {
        bestPlan = ownerPlan;
      }
    }

    return bestPlan !== 'FREE' ? bestPlan : null;
  }

  /**
   * Cria uma preferência de checkout no gateway de pagamento (Mercado Pago).
   *
   * Fluxo:
   * 1. Valida que o usuário pode fazer upgrade (não permite downgrade)
   * 2. Calcula preço com desconto por volume (BUSINESS) e ciclo anual
   * 3. Cria registro de pagamento pendente no banco
   * 4. Gera a preferência no gateway e retorna a URL de checkout
   *
   * O ENTERPRISE não é vendido online — requer contato comercial.
   * BUSINESS tem mínimo de 5 assentos.
   */
  async createCheckoutPreference(
    userId: string,
    email: string,
    plan: 'PRO' | 'BUSINESS' | 'ENTERPRISE' = 'PRO',
    billingCycle: 'MONTHLY' | 'YEARLY' = 'YEARLY',
    seatsCount = 1,
  ): Promise<{ url: string }> {
    const planInfo = await this.getUserPlanInfo(userId);
    const planHierarchy: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2, ENTERPRISE: 3 };
    const currentLevel = planHierarchy[planInfo.plan] ?? 0;
    const targetLevel = planHierarchy[plan] ?? 0;

    // Impede downgrade ou recompra do mesmo plano
    if (currentLevel >= targetLevel && planInfo.plan !== 'FREE') {
      throw AppException.conflict('Você já possui este plano ou superior ativo');
    }

    // ENTERPRISE só via contato comercial (WhatsApp/email)
    if (plan === 'ENTERPRISE') {
      throw AppException.badRequest('Enterprise requer contato comercial via WhatsApp.');
    }

    // Cálculo de preço com desconto por volume e ciclo
    // BUSINESS tem mínimo de 5 assentos; PRO sempre 1 assento
    const seats = plan === 'BUSINESS' ? Math.max(seatsCount, 5) : 1;
    let monthlyPerSeat: number;
    if (plan === 'PRO') {
      monthlyPerSeat = billingCycle === 'YEARLY' ? PRO_YEARLY_MONTH : PRO_MONTHLY;
    } else {
      monthlyPerSeat = getBusinessPricePerSeat(seats);
      if (billingCycle === 'YEARLY') monthlyPerSeat = Math.round(monthlyPerSeat * 0.8 * 100) / 100; // 20% desconto anual
    }
    const months = billingCycle === 'YEARLY' ? 12 : 1;
    const totalPrice = Math.round(monthlyPerSeat * seats * months * 100) / 100;

    const title = PLAN_TITLES[plan];
    const cycleLabel = billingCycle === 'YEARLY' ? 'Anual' : 'Mensal';
    const subscriptionDays = billingCycle === 'YEARLY' ? SUBSCRIPTION_DAYS_YEARLY : SUBSCRIPTION_DAYS_MONTHLY;

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    const backendUrl = this.configService.get('BACKEND_URL', { infer: true });

    // Create pending payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: totalPrice,
        currency: 'BRL',
        status: 'pending',
        plan,
        billingCycle,
        seatsCount: seats,
        payerEmail: email,
      },
    });

    const result = await this.gateway.createPreference({
      paymentId: payment.id,
      title: `${title} (${cycleLabel}${seats > 1 ? ` - ${seats} licenças` : ''})`,
      description: `CraftCard ${plan} ${cycleLabel}${seats > 1 ? ` × ${seats} licenças` : ''}`,
      price: totalPrice,
      currency: 'BRL',
      payerEmail: email,
      backUrls: {
        success: `${frontendUrl}/billing/success`,
        failure: `${frontendUrl}/editor?payment=failed`,
        pending: `${frontendUrl}/editor?payment=pending`,
      },
      notificationUrl: `${backendUrl}/api/payments/webhook`,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { preferenceId: result.preferenceId },
    });

    this.logger.log(`Checkout preference created for user ${userId} (${plan}): ${result.preferenceId}`);

    return { url: result.checkoutUrl };
  }

  /**
   * Processa webhook do Mercado Pago.
   *
   * Segurança: verificação HMAC é OBRIGATÓRIA — se o secret não estiver configurado,
   * o webhook é rejeitado para prevenir falsificação de pagamentos.
   *
   * Apenas eventos de pagamento são processados; outros tipos são ignorados.
   */
  async handleWebhook(
    body: { type?: string; action?: string; data?: { id?: string } },
    headers: { xSignature?: string; xRequestId?: string },
  ): Promise<void> {
    const webhookSecret = this.configService.get('MP_WEBHOOK_SECRET', { infer: true });

    // Verificação HMAC OBRIGATÓRIA — rejeita se secret ausente ou placeholder
    if (!webhookSecret || webhookSecret === 'placeholder') {
      this.logger.error('MP_WEBHOOK_SECRET not configured — rejecting webhook to prevent forgery');
      throw AppException.forbidden('Webhook secret não configurado');
    }

    const xSig = headers.xSignature || '';
    const xReq = headers.xRequestId || '';

    if (!xSig || !xReq) {
      this.logger.warn('Webhook rejected: missing x-signature or x-request-id headers');
      throw AppException.forbidden('Webhook sem assinatura');
    }

    const valid = this.gateway.verifyWebhookSignature(body, { xSignature: xSig, xRequestId: xReq }, webhookSecret);
    if (!valid) {
      this.logger.error(`Webhook rejected: HMAC signature mismatch (possible forgery attempt)`);
      throw AppException.forbidden('Assinatura do webhook invalida');
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
   * Processa notificação de pagamento por ID do Mercado Pago (formato IPN via query param).
   * Wrapper público para o método privado processPaymentNotification.
   */
  async processPaymentNotificationById(mpPaymentId: string): Promise<void> {
    await this.processPaymentNotification(mpPaymentId);
  }

  /**
   * Verifica pagamentos pendentes consultando a API do Mercado Pago diretamente.
   * Usado como fallback quando o webhook não chega (comum no free tier do Render
   * que pode estar dormindo quando o webhook é enviado).
   *
   * O frontend chama esse endpoint na tela de "sucesso" para sincronizar.
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

    for (const payment of pendingPayments) {
      if (!payment.preferenceId) continue;

      try {
        const searchResult = await this.gateway.searchPaymentsByReference(payment.id);

        for (const gatewayPayment of searchResult.payments) {
          if (gatewayPayment.status === 'approved' && payment.status !== 'approved') {
            const now = new Date();
            const subDays = payment.billingCycle === 'MONTHLY' ? SUBSCRIPTION_DAYS_MONTHLY : SUBSCRIPTION_DAYS_YEARLY;
            const expiresAt = new Date(now.getTime() + subDays * 24 * 60 * 60 * 1000);

            // Atomic update to prevent race with concurrent webhook processing
            const { count } = await this.prisma.payment.updateMany({
              where: { id: payment.id, status: { not: 'approved' } },
              data: {
                status: 'approved',
                mpPaymentId: gatewayPayment.externalReference || payment.id,
                mpResponseJson: gatewayPayment.rawResponse,
                paidAt: now,
                expiresAt,
              },
            });

            if (count === 0) {
              this.logger.log(`Payment already approved by concurrent process: ${payment.id}`);
              return { synced: true, status: 'approved' };
            }

            // Sync user plan (use plan from payment record, fallback PRO for old records)
            const targetPlan = payment.plan || 'PRO';
            await this.prisma.user.update({
              where: { id: userId },
              data: { plan: targetPlan },
            }).catch(() => {});

            this.logger.log(`Payment verified and approved: ${payment.id} (plan: ${targetPlan})`);
            return { synced: true, status: 'approved' };
          }
        }
      } catch (err) {
        this.logger.error(`Error verifying payment ${payment.id}: ${err}`);
      }
    }

    return { synced: false, status: 'still_pending' };
  }

  /**
   * Ativação manual de plano por admin (SUPER_ADMIN).
   * Cria um registro de pagamento com amount=0 para auditoria.
   * Usado para contas parceiras, testes e situações especiais.
   */
  async adminActivatePlan(adminUserId: string, targetEmail: string, plan: string, days?: number): Promise<{ activated: boolean; email: string; plan: string; expiresAt: string | null }> {
    const validPlans = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'];
    const normalizedPlan = plan.toUpperCase();
    if (!validPlans.includes(normalizedPlan)) {
      throw AppException.badRequest(`Plano inválido. Use: ${validPlans.join(', ')}`);
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { email: { equals: targetEmail } },
      select: { id: true, email: true, name: true },
    });
    if (!targetUser) {
      throw AppException.notFound(`Usuário com email ${targetEmail}`);
    }

    // Update user plan
    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: { plan: normalizedPlan },
    });

    // Create payment record for audit
    const subscriptionDays = days || SUBSCRIPTION_DAYS_YEARLY;
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

    this.logger.log(`Admin ${adminUserId} activated ${normalizedPlan} for ${targetEmail} (expires: ${expiresAt?.toISOString() || 'never'})`);

    return {
      activated: true,
      email: targetEmail,
      plan: normalizedPlan,
      expiresAt: expiresAt?.toISOString() || null,
    };
  }

  /** Retorna informações de billing do usuário: plano atual, limites, histórico e flags de upgrade/renovação */
  async getBillingInfo(userId: string) {
    const planInfo = await this.getUserPlanInfo(userId);

    const payments = await this.prisma.payment.findMany({
      where: { userId },
      select: { id: true, amount: true, status: true, plan: true, paidAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    let daysRemaining: number | null = null;
    if (planInfo.expiresAt) {
      daysRemaining = Math.max(0, Math.ceil((planInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    }

    const planHierarchy: Record<string, number> = { FREE: 0, PRO: 1, BUSINESS: 2, ENTERPRISE: 3 };
    const currentLevel = planHierarchy[planInfo.plan] ?? 0;

    return {
      plan: planInfo.plan,
      planLimits: planInfo.planLimits,
      expiresAt: planInfo.expiresAt?.toISOString() ?? null,
      daysRemaining,
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        paidAt: p.paidAt?.toISOString() ?? null,
        expiresAt: p.expiresAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      canUpgrade: currentLevel < 2,
      canRenew: planInfo.plan !== 'FREE' && daysRemaining !== null && daysRemaining <= 30,
    };
  }

  /** Admin: lista todos os usuários com seus planos (protegido por @Roles('SUPER_ADMIN') no controller) */
  async adminListUsers(): Promise<{ id: string; name: string | null; email: string; plan: string; role: string; createdAt: Date }[]> {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, plan: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Processa notificação de pagamento internamente.
   *
   * Fluxo:
   * 1. Busca detalhes do pagamento na API do Mercado Pago
   * 2. Localiza o registro pendente no banco via external_reference
   * 3. Verifica deduplicação (mesmo MP ID ou já aprovado)
   * 4. Atualiza status atomicamente (previne race condition de webhooks duplicados)
   * 5. Se aprovado: atualiza plano do usuário e envia email de confirmação
   */
  private async processPaymentNotification(mpPaymentId: string): Promise<void> {
    // Busca o pagamento na API do gateway para obter status real
    let fetched;
    try {
      fetched = await this.gateway.fetchPayment(mpPaymentId);
    } catch (err) {
      this.logger.error(`Failed to fetch payment ${mpPaymentId}: ${err}`);
      return;
    }

    // Proteção contra retorno nulo do gateway (pagamento inexistente no MP)
    if (!fetched) {
      this.logger.warn(`Gateway returned null for payment ${mpPaymentId}`);
      return;
    }

    // external_reference é o ID do nosso registro Payment (definido na criação da preferência)
    const externalRef = fetched.externalReference;

    if (!externalRef) {
      this.logger.warn(`No external_reference in payment ${mpPaymentId}`);
      return;
    }

    const newStatus = fetched.status;

    // Deduplicação: ignora se já processamos este pagamento
    const existing = await this.prisma.payment.findUnique({
      where: { id: externalRef },
    });

    if (!existing) {
      this.logger.warn(`Payment record not found: ${externalRef}`);
      return;
    }

    // Já aprovado — não reprocessar
    if (existing.status === 'approved') {
      this.logger.log(`Payment already approved, skipping: ${externalRef} (MP: ${mpPaymentId})`);
      return;
    }

    // Mesmo MP ID e mesmo status — webhook duplicado
    if (existing.mpPaymentId === String(mpPaymentId) && existing.status === newStatus) {
      this.logger.log(`Duplicate webhook for same MP payment and status, skipping: ${externalRef}`);
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SUBSCRIPTION_DAYS_YEARLY * 24 * 60 * 60 * 1000);

    // Atualização atômica: só atualiza se status ainda NÃO é 'approved'.
    // Previne race condition quando webhooks duplicados chegam simultaneamente.
    const { count } = await this.prisma.payment.updateMany({
      where: {
        id: externalRef,
        status: { not: 'approved' },
      },
      data: {
        status: newStatus,
        mpPaymentId: String(mpPaymentId),
        mpResponseJson: fetched.rawResponse,
        paidAt: newStatus === 'approved' ? now : undefined,
        expiresAt: newStatus === 'approved' ? expiresAt : undefined,
      },
    });

    if (count === 0) {
      this.logger.log(`Payment already approved by concurrent request, skipping: ${externalRef}`);
      return;
    }

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
