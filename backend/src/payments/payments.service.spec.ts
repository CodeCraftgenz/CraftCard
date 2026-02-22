import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: { findFirst: jest.Mock; create: jest.Mock; update: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('getActiveSubscription', () => {
    it('should return active if user has approved payment', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: '1', status: 'approved', expiresAt: null });
      const result = await service.getActiveSubscription('user-1');
      expect(result.active).toBe(true);
    });

    it('should return not active if no approved payment exists', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      const result = await service.getActiveSubscription('user-1');
      expect(result.active).toBe(false);
    });
  });

  describe('createCheckoutPreference', () => {
    it('should throw conflict if user has active subscription', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: '1', status: 'approved', expiresAt: null });
      await expect(
        service.createCheckoutPreference('user-1', 'test@test.com'),
      ).rejects.toThrow('Voce ja possui uma assinatura ativa');
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
  });
});
