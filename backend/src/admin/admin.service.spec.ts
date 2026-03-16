import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

function makePrisma() {
  return {
    user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
    profile: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    organization: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    organizationMember: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    payment: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findFirst: jest.fn() },
    profileView: { findMany: jest.fn(), aggregate: jest.fn() },
    contactMessage: { count: jest.fn() },
    booking: { count: jest.fn(), findMany: jest.fn() },
    connection: { count: jest.fn() },
    systemSetting: { findUnique: jest.fn(), upsert: jest.fn() },
    viewEvent: { groupBy: jest.fn(), count: jest.fn() },
  };
}

describe('AdminService', () => {
  let service: AdminService;
  let prisma: ReturnType<typeof makePrisma>;
  let mailMock: { sendEnterpriseWelcome: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    mailMock = { sendEnterpriseWelcome: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailMock },
      ],
    }).compile();

    service = module.get(AdminService);
  });

  // ──────────────────────────────────────────────────────────────
  // calculateEnterprisePrice
  // ──────────────────────────────────────────────────────────────

  describe('calculateEnterprisePrice', () => {
    it('applies tier 1 price for 101-250 seats (R$19.90)', () => {
      const result = service.calculateEnterprisePrice(150, 'MONTHLY');
      expect(result.pricePerSeat).toBe(19.9);
      expect(result.monthlyTotal).toBeCloseTo(150 * 19.9);
    });

    it('applies tier 2 price for 251-500 seats (R$14.90)', () => {
      const result = service.calculateEnterprisePrice(300, 'MONTHLY');
      expect(result.pricePerSeat).toBe(14.9);
    });

    it('applies tier 3 price for 501-1000 seats (R$9.90)', () => {
      const result = service.calculateEnterprisePrice(600, 'MONTHLY');
      expect(result.pricePerSeat).toBe(9.9);
    });

    it('applies tier 4 price for 1000+ seats (R$7.90)', () => {
      const result = service.calculateEnterprisePrice(1001, 'MONTHLY');
      expect(result.pricePerSeat).toBe(7.9);
    });

    it('applies 20% discount for yearly billing', () => {
      const monthly = service.calculateEnterprisePrice(200, 'MONTHLY');
      const yearly = service.calculateEnterprisePrice(200, 'YEARLY');
      expect(yearly.monthlyTotal).toBeCloseTo(monthly.monthlyTotal * 0.8, 1);
    });

    it('calculates yearly total correctly', () => {
      const result = service.calculateEnterprisePrice(101, 'YEARLY');
      expect(result.yearlyTotal).toBeCloseTo(result.monthlyTotal * 12, 1);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // activateEnterprise — new user
  // ──────────────────────────────────────────────────────────────

  describe('activateEnterprise (new user)', () => {
    const DATA = { email: 'empresa@example.com', companyName: 'Tech Corp', seats: 150, billingCycle: 'MONTHLY' as const };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(null); // new user
      prisma.user.create.mockResolvedValue({ id: 'user-new', email: DATA.email, name: DATA.companyName, plan: 'ENTERPRISE' });
      prisma.profile.create.mockResolvedValue({ id: 'profile-1' });
      prisma.organization.findFirst.mockResolvedValue(null); // no existing org
      prisma.organization.create.mockResolvedValue({ id: 'org-1', name: DATA.companyName, maxMembers: DATA.seats });
      prisma.organizationMember.create.mockResolvedValue({});
      prisma.payment.create.mockResolvedValue({});
    });

    it('creates a new user with ENTERPRISE plan', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ plan: 'ENTERPRISE', email: DATA.email }) })
      );
    });

    it('creates a default profile for the new user', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.profile.create).toHaveBeenCalledTimes(1);
    });

    it('creates an organization with correct seat count', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ maxMembers: DATA.seats }) })
      );
    });

    it('creates owner membership', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.organizationMember.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'OWNER' }) })
      );
    });

    it('sends welcome email to new user', async () => {
      await service.activateEnterprise(DATA);
      expect(mailMock.sendEnterpriseWelcome).toHaveBeenCalledWith(DATA.email, expect.any(Object));
    });

    it('creates a payment record for audit', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'approved', plan: 'ENTERPRISE' }) })
      );
    });

    it('returns isNewUser: true', async () => {
      const result = await service.activateEnterprise(DATA);
      expect(result.isNewUser).toBe(true);
      expect(result.success).toBe(true);
    });

    it('returns emailSent: true for new users', async () => {
      const result = await service.activateEnterprise(DATA);
      expect(result.emailSent).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // activateEnterprise — existing user
  // ──────────────────────────────────────────────────────────────

  describe('activateEnterprise (existing user)', () => {
    const DATA = { email: 'existing@example.com', companyName: 'Old Corp', seats: 200, billingCycle: 'YEARLY' as const };
    const EXISTING_USER = { id: 'user-existing', email: DATA.email, name: 'Old Corp', plan: 'PRO' };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(EXISTING_USER);
      prisma.user.update.mockResolvedValue({ ...EXISTING_USER, plan: 'ENTERPRISE' });
      prisma.organization.findFirst.mockResolvedValue({ id: 'org-existing', name: DATA.companyName, maxMembers: 50 });
      prisma.organization.update.mockResolvedValue({});
      prisma.payment.create.mockResolvedValue({});
    });

    it('upgrades existing user plan to ENTERPRISE', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: 'ENTERPRISE' } })
      );
    });

    it('does NOT create a new user', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('does NOT send welcome email to existing user', async () => {
      await service.activateEnterprise(DATA);
      expect(mailMock.sendEnterpriseWelcome).not.toHaveBeenCalled();
    });

    it('updates existing org maxMembers', async () => {
      await service.activateEnterprise(DATA);
      expect(prisma.organization.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ maxMembers: DATA.seats }) })
      );
    });

    it('returns isNewUser: false and emailSent: false', async () => {
      const result = await service.activateEnterprise(DATA);
      expect(result.isNewUser).toBe(false);
      expect(result.emailSent).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────
  // updateUser
  // ──────────────────────────────────────────────────────────────

  describe('updateUser', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'u@example.com', plan: 'FREE', role: 'USER' });
      prisma.user.update.mockResolvedValue({ id: 'user-1', plan: 'PRO', role: 'USER' });
    });

    it('updates user plan', async () => {
      const result = await service.updateUser('user-1', { plan: 'PRO' });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ plan: 'PRO' }) })
      );
      expect(result).toBeDefined();
    });

    it('throws 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.updateUser('ghost', { plan: 'PRO' })).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // deleteUser
  // ──────────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    it('deletes user by id', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'u@example.com' });
      prisma.user.delete.mockResolvedValue({ id: 'user-1' });
      const result = await service.deleteUser('user-1');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toEqual({ deleted: true });
    });

    it('throws 404 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.deleteUser('ghost')).rejects.toThrow();
    });
  });

  // ──────────────────────────────────────────────────────────────
  // updateOrg (extra seats)
  // ──────────────────────────────────────────────────────────────

  describe('updateOrg', () => {
    it('updates org extraSeats', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 'org-1', name: 'Corp', maxMembers: 100 });
      prisma.organization.update.mockResolvedValue({ id: 'org-1', maxMembers: 100, extraSeats: 50 });
      const result = await service.updateOrg('org-1', { extraSeats: 50 });
      expect(prisma.organization.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws 404 when org not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);
      await expect(service.updateOrg('ghost', { extraSeats: 10 })).rejects.toThrow();
    });
  });
});
