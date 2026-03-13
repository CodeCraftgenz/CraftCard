/**
 * ═══════════════════════════════════════════════════
 *  BLOCO 4 — REQUISITOS NÃO FUNCIONAIS
 *  Fire-and-forget, assincronicidade, resiliência
 * ═══════════════════════════════════════════════════
 *
 * Verifica que operações assíncronas (emails, webhooks)
 * NÃO bloqueiam o tempo de resposta da API.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/auth/auth.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { UsersService } from '../../src/users/users.service';
import { MailService } from '../../src/mail/mail.service';
import { OrganizationsService } from '../../src/organizations/organizations.service';
import { PAYMENT_GATEWAY } from '../../src/payments/gateway/payment-gateway.interface';
import {
  createPrismaMock,
  createConfigMock,
  createMailMock,
  createGatewayMock,
  mockGatewayFetchPayment,
  TEST_USERS,
} from '../helpers/test-utils';

// ══════════════════════════════════════════════════
// 4.1 — Email de boas-vindas não bloqueia registro
// ══════════════════════════════════════════════════

describe('Non-functional — Assincronicidade do email de boas-vindas', () => {
  let authService: AuthService;
  let mailMock: ReturnType<typeof createMailMock>;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailMock = createMailMock();

    const usersServiceMock = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null), // new user
      findById: jest.fn(),
      createFromGoogle: jest.fn(),
      createNative: jest.fn().mockResolvedValue({
        id: 'new-user-id',
        email: 'new@test.local',
        name: 'New User',
        avatarUrl: null,
        role: 'USER',
      }),
      addGoogleIdToUser: jest.fn(),
      addPasswordToUser: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetToken: jest.fn(),
      updatePassword: jest.fn(),
      clearPasswordResetToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: MailService, useValue: mailMock },
        { provide: OrganizationsService, useValue: { acceptInvite: jest.fn() } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('registro deve completar mesmo se email de boas-vindas falhar (fire-and-forget)', async () => {
    // Email vai falhar
    mailMock.sendWelcome.mockRejectedValue(new Error('SMTP connection failed'));

    // Mock para profile creation
    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});

    const result = await authService.register('new@test.local', 'New User', 'SecureP@ss123');

    // Registro deve ter sucesso mesmo com falha de email
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('new@test.local');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Verificar que email FOI chamado (fire-and-forget)
    expect(mailMock.sendWelcome).toHaveBeenCalledWith('new@test.local', 'New User');
  });

  it('registro deve ser rápido (< 500ms) independente de delay no email', async () => {
    // Simula email lento (3 segundos)
    mailMock.sendWelcome.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 3000)),
    );

    prisma.profile.findUnique.mockResolvedValue(null);
    prisma.profile.create.mockResolvedValue({});
    prisma.refreshToken.create.mockResolvedValue({});

    const start = Date.now();
    const result = await authService.register('fast@test.local', 'Fast User', 'SecureP@ss123');
    const elapsed = Date.now() - start;

    expect(result.user).toBeDefined();
    // Registro NÃO deve esperar o email (fire-and-forget via .catch)
    expect(elapsed).toBeLessThan(500);
  });
});

// ══════════════════════════════════════════════════
// 4.2 — Email de confirmação de pagamento é fire-and-forget
// ══════════════════════════════════════════════════

describe('Non-functional — Email de confirmação de pagamento', () => {
  let paymentsService: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mailMock: ReturnType<typeof createMailMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    mailMock = createMailMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: mailMock },
        { provide: PAYMENT_GATEWAY, useValue: createGatewayMock() },
      ],
    }).compile();

    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('webhook deve completar mesmo se email de confirmação falhar', async () => {
    const mpPaymentId = 'mp-async-001';
    const paymentId = 'pay-async-001';

    const gw = createGatewayMock();
    mockGatewayFetchPayment(gw, mpPaymentId, paymentId, 'approved', 30);
    // Re-create module with this specific gateway mock
    const module2 = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: mailMock },
        { provide: PAYMENT_GATEWAY, useValue: gw },
      ],
    }).compile();
    paymentsService = module2.get<PaymentsService>(PaymentsService);

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

    // Email vai falhar
    mailMock.sendPaymentConfirmation.mockRejectedValue(new Error('SMTP down'));

    // NÃO deve lançar erro
    await expect(
      paymentsService.handleWebhook(
        { type: 'payment', data: { id: mpPaymentId } },
        { xSignature: undefined, xRequestId: undefined },
      ),
    ).resolves.not.toThrow();

    // Pagamento e plano devem ter sido atualizados normalmente
    expect(prisma.payment.updateMany).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: TEST_USERS.freeUser.id },
      data: { plan: 'PRO' },
    });
  });
});

// ══════════════════════════════════════════════════
// 4.3 — Validação de idempotência sob carga
// ══════════════════════════════════════════════════

describe('Non-functional — Idempotência sob webhooks concorrentes', () => {
  let paymentsService: PaymentsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
  });

  afterEach(() => jest.restoreAllMocks());

  it('múltiplos webhooks simultâneos devem resultar em apenas 1 ativação', async () => {
    const mpPaymentId = 'mp-concurrent-001';
    const paymentId = 'pay-concurrent-001';

    const gw = createGatewayMock();
    mockGatewayFetchPayment(gw, mpPaymentId, paymentId, 'approved');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: createConfigMock() },
        { provide: MailService, useValue: createMailMock() },
        { provide: PAYMENT_GATEWAY, useValue: gw },
      ],
    }).compile();
    paymentsService = module.get<PaymentsService>(PaymentsService);

    prisma.payment.findUnique.mockResolvedValue({
      id: paymentId,
      userId: TEST_USERS.freeUser.id,
      status: 'pending',
      plan: 'PRO',
      mpPaymentId: null,
    });

    // Apenas o primeiro updateMany retorna count=1, os outros retornam count=0
    let callCount = 0;
    prisma.payment.updateMany.mockImplementation(async () => {
      callCount++;
      return { count: callCount === 1 ? 1 : 0 };
    });
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUnique.mockResolvedValue({
      email: TEST_USERS.freeUser.email,
      name: TEST_USERS.freeUser.name,
    });

    const webhook = { type: 'payment', data: { id: mpPaymentId } };
    const headers = { xSignature: undefined, xRequestId: undefined };

    // Simula 5 webhooks "concorrentes"
    await Promise.all([
      paymentsService.handleWebhook(webhook, headers),
      paymentsService.handleWebhook(webhook, headers),
      paymentsService.handleWebhook(webhook, headers),
      paymentsService.handleWebhook(webhook, headers),
      paymentsService.handleWebhook(webhook, headers),
    ]);

    // user.update (plano) deve ter sido chamado APENAS 1 vez
    expect(prisma.user.update).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════
// 4.4 — Admin Operations com auditoria
// ══════════════════════════════════════════════════

describe('Non-functional — Admin Activate Plan (auditoria)', () => {
  let paymentsService: PaymentsService;
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

    paymentsService = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('adminActivatePlan deve criar registro de auditoria com amount=0', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'target-user',
      email: 'target@test.local',
      name: 'Target',
    });
    prisma.user.update.mockResolvedValue({});
    prisma.payment.create.mockResolvedValue({});

    const result = await paymentsService.adminActivatePlan(
      TEST_USERS.superAdmin.id,
      'target@test.local',
      'BUSINESS',
      90, // 90 dias custom
    );

    expect(result.activated).toBe(true);
    expect(result.plan).toBe('BUSINESS');

    // Verificar registro de auditoria
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'target-user',
          amount: 0, // gratuito (admin)
          status: 'approved',
          plan: 'BUSINESS',
        }),
      }),
    );

    // Verificar expiresAt com days customizado (~90 dias)
    const createCall = prisma.payment.create.mock.calls[0][0];
    const expiresAt = new Date(createCall.data.expiresAt);
    const daysFromNow = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysFromNow).toBeGreaterThan(89);
    expect(daysFromNow).toBeLessThan(91);
  });

  it('adminActivatePlan FREE não deve criar registro de pagamento', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'target-user',
      email: 'target@test.local',
      name: 'Target',
    });
    prisma.user.update.mockResolvedValue({});

    const result = await paymentsService.adminActivatePlan(
      TEST_USERS.superAdmin.id,
      'target@test.local',
      'FREE',
    );

    expect(result.plan).toBe('FREE');
    expect(result.expiresAt).toBeNull();
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });
});
