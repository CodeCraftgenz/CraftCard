/**
 * ═══════════════════════════════════════════════════
 *  BLOCO 1 — PAGAMENTOS & FEATURE GATING
 *  Webhook do Mercado Pago + Checkout + PlanGuard
 * ═══════════════════════════════════════════════════
 *
 * SEGURANÇA: Todos os testes usam mocks.
 * Nenhuma chamada real ao MP ou ao banco de produção.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { MailService } from '../../src/mail/mail.service';
import { PAYMENT_GATEWAY } from '../../src/payments/gateway/payment-gateway.interface';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  createGatewayMock,
  mockGatewayFetchPayment,
  mockGatewayFetchError,
  buildMpWebhookPayload,
  TEST_USERS,
} from '../helpers/test-utils';

describe('Payments — Webhook Processing (Sandbox/Mock)', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailMock: ReturnType<typeof createMailMock>;
  let gatewayMock: ReturnType<typeof createGatewayMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailMock = createMailMock();
    gatewayMock = createGatewayMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: mailMock },
        { provide: PAYMENT_GATEWAY, useValue: gatewayMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  // ──────────────────────────────────────────────
  // 1.1 — Webhook: Aprovação PRO
  // ──────────────────────────────────────────────

  describe('Webhook → Aprovação de pagamento PRO', () => {
    const mpPaymentId = 'mp-sandbox-pay-001';
    const paymentId = 'internal-pay-uuid-001';

    it('deve aprovar pagamento, definir expiresAt +365d e atualizar plano do usuário', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved', 30);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      // Verificar update atômico com guard de status
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: paymentId, status: { not: 'approved' } },
          data: expect.objectContaining({
            status: 'approved',
            mpPaymentId: mpPaymentId,
          }),
        }),
      );

      // Verificar que expiresAt está ~365 dias no futuro
      const updateCall = prisma.payment.updateMany.mock.calls[0][0];
      const expiresAt = new Date(updateCall.data.expiresAt);
      const daysFromNow = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysFromNow).toBeGreaterThan(364);
      expect(daysFromNow).toBeLessThan(366);

      // Verificar sync do plano do usuário
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USERS.freeUser.id },
        data: { plan: 'PRO' },
      });

      // Verificar envio de email de confirmação
      expect(mailMock.sendPaymentConfirmation).toHaveBeenCalledWith(
        TEST_USERS.freeUser.email,
        TEST_USERS.freeUser.name,
        'PRO',
      );
    });
  });

  // ──────────────────────────────────────────────
  // 1.2 — Webhook: Aprovação BUSINESS
  // ──────────────────────────────────────────────

  describe('Webhook → Aprovação de pagamento BUSINESS', () => {
    const mpPaymentId = 'mp-sandbox-pay-002';
    const paymentId = 'internal-pay-uuid-002';

    it('deve aprovar BUSINESS e ativar features orgDashboard/branding', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved', 189.9);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'BUSINESS',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USERS.freeUser.id },
        data: { plan: 'BUSINESS' },
      });
    });
  });

  // ──────────────────────────────────────────────
  // 1.3 — Webhook: Aprovação ENTERPRISE
  // ──────────────────────────────────────────────

  describe('Webhook → Aprovação de pagamento ENTERPRISE', () => {
    const mpPaymentId = 'mp-sandbox-pay-003';
    const paymentId = 'internal-pay-uuid-003';

    it('deve aprovar ENTERPRISE e ativar customDomain', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved', 299.9);

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'ENTERPRISE',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue({
        email: TEST_USERS.freeUser.email,
        name: TEST_USERS.freeUser.name,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USERS.freeUser.id },
        data: { plan: 'ENTERPRISE' },
      });
    });
  });

  // ──────────────────────────────────────────────
  // 1.4 — Idempotência: Pagamento já aprovado
  // ──────────────────────────────────────────────

  describe('Idempotência', () => {
    const mpPaymentId = 'mp-sandbox-pay-004';
    const paymentId = 'internal-pay-uuid-004';

    it('deve ignorar webhook se pagamento já está approved', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved');

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.proUser.id,
        status: 'approved',
        plan: 'PRO',
        mpPaymentId: mpPaymentId,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });

    it('deve ignorar webhook duplicado (mesmo mpPaymentId + status)', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'pending');

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: mpPaymentId,
      });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('NÃO deve ativar plano quando update atômico retorna count=0 (race condition)', async () => {
      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'approved');

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      // Simula: request concorrente já aprovou
      prisma.payment.updateMany.mockResolvedValue({ count: 0 });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(mailMock.sendPaymentConfirmation).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // 1.5 — Webhook: Status não-approved
  // ──────────────────────────────────────────────

  describe('Status não-approved', () => {
    it('deve atualizar status para pending sem ativar plano', async () => {
      const mpPaymentId = 'mp-sandbox-pay-005';
      const paymentId = 'internal-pay-uuid-005';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'pending');

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'pending' }),
        }),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('deve mapear status "rejected" corretamente', async () => {
      const mpPaymentId = 'mp-sandbox-pay-006';
      const paymentId = 'internal-pay-uuid-006';

      mockGatewayFetchPayment(gatewayMock, mpPaymentId, paymentId, 'rejected');

      prisma.payment.findUnique.mockResolvedValue({
        id: paymentId,
        userId: TEST_USERS.freeUser.id,
        status: 'pending',
        plan: 'PRO',
        mpPaymentId: null,
      });
      prisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await service.handleWebhook(
        buildMpWebhookPayload(mpPaymentId),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'rejected' }),
        }),
      );
    });
  });

  // ──────────────────────────────────────────────
  // 1.6 — Ignorar notificações não-payment
  // ──────────────────────────────────────────────

  describe('Filtragem de notificações', () => {
    it('deve ignorar type=merchant_order', async () => {
      await service.handleWebhook(
        { type: 'merchant_order', data: { id: '123' } },
        { xSignature: undefined, xRequestId: undefined },
      );
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('deve ignorar webhook sem data.id', async () => {
      await service.handleWebhook(
        { type: 'payment', data: {} },
        { xSignature: undefined, xRequestId: undefined },
      );
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('deve ignorar webhook sem external_reference na resposta do gateway', async () => {
      gatewayMock.fetchPayment.mockResolvedValue({
        status: 'approved',
        externalReference: null,
        amount: 30,
        payerEmail: 'test@test.local',
        rawResponse: JSON.stringify({ id: 'mp-123', status: 'approved' }),
      });

      await service.handleWebhook(
        buildMpWebhookPayload('mp-123'),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('deve ignorar quando payment record não existe no banco', async () => {
      mockGatewayFetchPayment(gatewayMock, 'mp-123', 'nonexistent', 'approved');
      prisma.payment.findUnique.mockResolvedValue(null);

      await service.handleWebhook(
        buildMpWebhookPayload('mp-123'),
        { xSignature: undefined, xRequestId: undefined },
      );

      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  // 1.7 — Resiliência: Falha de rede com Gateway API
  // ──────────────────────────────────────────────

  describe('Resiliência — Falhas de comunicação Gateway', () => {
    it('deve tratar erro 500 da API do gateway sem quebrar', async () => {
      mockGatewayFetchError(gatewayMock, 'MP API error 500 for payment mp-fail-1');

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fail-1'),
          { xSignature: undefined, xRequestId: undefined },
        ),
      ).resolves.not.toThrow();

      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('deve tratar erro de rede gracefully (gateway captura)', async () => {
      mockGatewayFetchError(gatewayMock, 'ECONNREFUSED');

      // Gateway errors are now caught by processPaymentNotification try/catch
      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fail-2'),
          { xSignature: undefined, xRequestId: undefined },
        ),
      ).resolves.not.toThrow();
    });

    it('deve tratar erro 401 (token inválido) da API do gateway', async () => {
      mockGatewayFetchError(gatewayMock, 'MP API error 401 for payment mp-fail-3');

      await expect(
        service.handleWebhook(
          buildMpWebhookPayload('mp-fail-3'),
          { xSignature: undefined, xRequestId: undefined },
        ),
      ).resolves.not.toThrow();
    });
  });
});

// ══════════════════════════════════════════════════
// Feature Gating — getUserPlanInfo + PlanGuard
// ══════════════════════════════════════════════════

describe('Feature Gating — PlanGuard via getUserPlanInfo', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: createMailMock() },
        { provide: PAYMENT_GATEWAY, useValue: createGatewayMock() },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('FREE user: analytics=false, gallery=false, orgDashboard=false', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'free@test.local', plan: 'FREE' });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await service.getUserPlanInfo('user-free');
    expect(info.plan).toBe('FREE');
    expect(info.planLimits.analytics).toBe(false);
    expect(info.planLimits.gallery).toBe(false);
    expect(info.planLimits.orgDashboard).toBe(false);
    expect(info.planLimits.customDomain).toBe(false);
    expect(info.planLimits.maxCards).toBe(1);
    expect(info.planLimits.maxLinks).toBe(5);
    expect(info.planLimits.watermark).toBe(true);
  });

  it('PRO user: analytics=true, gallery=true, orgDashboard=false', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue({ email: 'pro@test.local', plan: 'PRO' });
    prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await service.getUserPlanInfo('user-pro');
    expect(info.plan).toBe('PRO');
    expect(info.planLimits.analytics).toBe(true);
    expect(info.planLimits.gallery).toBe(true);
    expect(info.planLimits.orgDashboard).toBe(false);
    expect(info.planLimits.webhooks).toBe(false);
    expect(info.planLimits.watermark).toBe(false);
    expect(info.planLimits.maxCards).toBe(3);
  });

  it('BUSINESS user: orgDashboard=true, webhooks=true, customDomain=false', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue({ email: 'biz@test.local', plan: 'BUSINESS' });
    prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await service.getUserPlanInfo('user-biz');
    expect(info.plan).toBe('BUSINESS');
    expect(info.planLimits.orgDashboard).toBe(true);
    expect(info.planLimits.webhooks).toBe(true);
    expect(info.planLimits.branding).toBe(true);
    expect(info.planLimits.customDomain).toBe(false);
  });

  it('ENTERPRISE user: tudo habilitado incluindo customDomain', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue({ email: 'ent@test.local', plan: 'ENTERPRISE' });
    prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await service.getUserPlanInfo('user-ent');
    expect(info.plan).toBe('ENTERPRISE');
    expect(info.planLimits.customDomain).toBe(true);
    expect(info.planLimits.orgDashboard).toBe(true);
  });

  it('deve fazer downgrade para FREE quando pagamento expirou', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'expired@test.local', plan: 'PRO' });
    prisma.payment.findFirst.mockResolvedValue(null); // nenhum pagamento válido
    prisma.user.update.mockResolvedValue({});
    prisma.organizationMember.findMany.mockResolvedValue([]);

    const info = await service.getUserPlanInfo('user-expired');
    expect(info.plan).toBe('FREE');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-expired' },
      data: { plan: 'FREE' },
    });
  });

  it('whitelist user retorna ENTERPRISE independente do plano no banco', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'ricardocoradini97@gmail.com',
      plan: 'FREE',
    });

    const info = await service.getUserPlanInfo('wl-user');
    expect(info.plan).toBe('ENTERPRISE');
    expect(info.planLimits.customDomain).toBe(true);
    expect(info.expiresAt).toBeNull();
  });

  it('deve retornar FREE para usuário inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const info = await service.getUserPlanInfo('ghost');
    expect(info.plan).toBe('FREE');
    expect(info.planLimits.maxCards).toBe(1);
  });
});

// ══════════════════════════════════════════════════
// Checkout Preference — Validação de regras
// ══════════════════════════════════════════════════

describe('Checkout — Regras de criação de preferência', () => {
  let service: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: createMailMock() },
        { provide: PAYMENT_GATEWAY, useValue: createGatewayMock() },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('deve rejeitar checkout se usuário já possui plano igual ou superior', async () => {
    const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000);
    prisma.user.findUnique.mockResolvedValue({ email: 'biz@test.local', plan: 'BUSINESS' });
    prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    await expect(
      service.createCheckoutPreference(TEST_USERS.businessOwner.id, 'biz@test.local', 'PRO'),
    ).rejects.toThrow('ja possui este plano ou superior');
  });

  it('deve rejeitar plano inválido', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'user@test.local', plan: 'FREE' });
    prisma.organizationMember.findMany.mockResolvedValue([]);

    await expect(
      service.createCheckoutPreference('user-1', 'user@test.local', 'INVALID' as any),
    ).rejects.toThrow('Plano invalido');
  });
});
