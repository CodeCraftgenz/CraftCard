import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: { findFirst: jest.Mock; create: jest.Mock; updateMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const configMock = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_fake',
          STRIPE_WEBHOOK_SECRET: 'whsec_fake',
          FRONTEND_URL: 'http://localhost:5173',
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

  describe('hasUserPaid', () => {
    it('should return true if user has paid payment', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: '1', status: 'paid' });
      expect(await service.hasUserPaid('user-1')).toBe(true);
    });

    it('should return false if no paid payment exists', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);
      expect(await service.hasUserPaid('user-1')).toBe(false);
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw conflict if user already paid', async () => {
      prisma.payment.findFirst.mockResolvedValue({ id: '1', status: 'paid' });
      await expect(service.createCheckoutSession('user-1', 'test@test.com')).rejects.toThrow(
        'Pagamento ja realizado',
      );
    });
  });
});
