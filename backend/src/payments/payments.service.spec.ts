import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    user: { findUnique: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    payment: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
    organizationMember: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      payment: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      organizationMember: { findMany: jest.fn() },
    };

    const configMock = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          MP_ACCESS_TOKEN: 'APP_USR-fake-token',
          MP_WEBHOOK_SECRET: 'placeholder',
          MP_PUBLIC_KEY: 'APP_USR-fake-public-key',
          BACKEND_URL: 'http://localhost:3000',
          FRONTEND_URL: 'http://localhost:5173',
          NODE_ENV: 'development',
          CORS_ORIGIN: 'http://localhost:5173',
        };
        return values[key];
      }),
    };

    const mailMock = {
      sendPaymentConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configMock },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('getUserPlanInfo', () => {
    it('should return FREE for nonexistent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.getUserPlanInfo('nonexistent');
      expect(result.plan).toBe('FREE');
      expect(result.expiresAt).toBeNull();
    });

    it('should return ENTERPRISE for whitelist email', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'ricardocoradini97@gmail.com', plan: 'FREE' });

      const result = await service.getUserPlanInfo('user-1');
      expect(result.plan).toBe('ENTERPRISE');
      expect(result.planLimits.customDomain).toBe(true);
      expect(result.expiresAt).toBeNull();
    });

    it('should return PRO with expiration for paid user', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'PRO' });
      prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
      prisma.organizationMember.findMany.mockResolvedValue([]);

      const result = await service.getUserPlanInfo('user-1');
      expect(result.plan).toBe('PRO');
      expect(result.expiresAt).toEqual(futureDate);
    });

    it('should downgrade to FREE when no valid payment exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'PRO' });
      prisma.payment.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({});
      prisma.organizationMember.findMany.mockResolvedValue([]);

      const result = await service.getUserPlanInfo('user-1');
      expect(result.plan).toBe('FREE');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { plan: 'FREE' },
      });
    });

    it('should inherit BUSINESS plan from org owner', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'member@test.com', plan: 'FREE' });
      prisma.organizationMember.findMany
        .mockResolvedValueOnce([{ orgId: 'org-1' }]) // user memberships
        .mockResolvedValueOnce([{ user: { plan: 'BUSINESS', email: 'owner@test.com' } }]); // org owners

      const result = await service.getUserPlanInfo('member-1');
      expect(result.plan).toBe('BUSINESS');
      expect(result.planLimits.orgDashboard).toBe(true);
    });

    it('should not inherit from org owner with PRO (only BUSINESS+)', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'member@test.com', plan: 'FREE' });
      prisma.organizationMember.findMany
        .mockResolvedValueOnce([{ orgId: 'org-1' }])
        .mockResolvedValueOnce([{ user: { plan: 'PRO', email: 'owner@test.com' } }]);

      const result = await service.getUserPlanInfo('member-1');
      expect(result.plan).toBe('FREE');
    });

    it('should keep own plan if higher than org inherited plan', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'ENTERPRISE' });
      prisma.payment.findFirst.mockResolvedValue({ expiresAt: futureDate });
      prisma.organizationMember.findMany
        .mockResolvedValueOnce([{ orgId: 'org-1' }])
        .mockResolvedValueOnce([{ user: { plan: 'BUSINESS', email: 'owner@test.com' } }]);

      const result = await service.getUserPlanInfo('user-1');
      expect(result.plan).toBe('ENTERPRISE');
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active for paid user', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'PRO' });
      prisma.payment.findFirst.mockResolvedValue({ expiresAt: new Date(Date.now() + 86400000) });
      prisma.organizationMember.findMany.mockResolvedValue([]);

      const result = await service.getActiveSubscription('user-1');
      expect(result.active).toBe(true);
    });

    it('should return not active for FREE user', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'FREE' });
      prisma.organizationMember.findMany.mockResolvedValue([]);

      const result = await service.getActiveSubscription('user-1');
      expect(result.active).toBe(false);
    });

    it('should return active for whitelist user', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'codecraftgenz@gmail.com', plan: 'FREE' });

      const result = await service.getActiveSubscription('user-1');
      expect(result.active).toBe(true);
    });
  });

  describe('handleWebhook', () => {
    it('should ignore non-payment notifications', async () => {
      await service.handleWebhook(
        { type: 'merchant_order', data: { id: '123' } },
        { xSignature: undefined, xRequestId: undefined },
      );
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('should ignore webhook without data id', async () => {
      await service.handleWebhook(
        { type: 'payment', data: {} },
        { xSignature: undefined, xRequestId: undefined },
      );
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('adminActivatePlan', () => {
    it('should throw for invalid plan', async () => {
      await expect(
        service.adminActivatePlan('admin-1', 'user@test.com', 'INVALID'),
      ).rejects.toThrow('Plano invalido');
    });

    it('should throw for nonexistent user email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.adminActivatePlan('admin-1', 'nobody@test.com', 'PRO'),
      ).rejects.toThrow('nao encontrado');
    });

    it('should activate PRO plan for existing user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@test.com', name: 'User' });
      prisma.user.update.mockResolvedValue({});
      prisma.payment.create.mockResolvedValue({});

      const result = await service.adminActivatePlan('admin-1', 'user@test.com', 'PRO');
      expect(result.activated).toBe(true);
      expect(result.plan).toBe('PRO');
      expect(result.expiresAt).not.toBeNull();
    });

    it('should not create payment record when activating FREE', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1', email: 'user@test.com', name: 'User' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.adminActivatePlan('admin-1', 'user@test.com', 'FREE');
      expect(result.plan).toBe('FREE');
      expect(result.expiresAt).toBeNull();
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('getBillingInfo', () => {
    it('should return billing info with days remaining', async () => {
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'PRO' });
      prisma.payment.findFirst.mockResolvedValue({ expiresAt });
      prisma.organizationMember.findMany.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([
        { id: 'p1', amount: 30, status: 'approved', plan: 'PRO', paidAt: new Date(), expiresAt, createdAt: new Date() },
      ]);

      const result = await service.getBillingInfo('user-1');
      expect(result.plan).toBe('PRO');
      expect(result.daysRemaining).toBeGreaterThan(0);
      expect(result.daysRemaining).toBeLessThanOrEqual(15);
      expect(result.canRenew).toBe(true);
      expect(result.canUpgrade).toBe(true);
      expect(result.payments).toHaveLength(1);
    });

    it('should return canUpgrade false for BUSINESS user', async () => {
      const expiresAt = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000);
      prisma.user.findUnique.mockResolvedValue({ email: 'user@test.com', plan: 'BUSINESS' });
      prisma.payment.findFirst.mockResolvedValue({ expiresAt });
      prisma.organizationMember.findMany.mockResolvedValue([]);
      prisma.payment.findMany.mockResolvedValue([]);

      const result = await service.getBillingInfo('user-1');
      expect(result.plan).toBe('BUSINESS');
      expect(result.canUpgrade).toBe(false);
    });
  });
});
