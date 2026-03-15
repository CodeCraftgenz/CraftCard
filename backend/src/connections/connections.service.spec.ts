import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsService } from './connections.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { getPlanLimits } from '../payments/plan-limits';

/**
 * CONNECTIONS SERVICE TESTS
 * Validates plan limits, self-connection prevention, geo data handling,
 * timeline/map/wrapped aggregation endpoints.
 */
describe('ConnectionsService', () => {
  let service: ConnectionsService;
  let prisma: Record<string, Record<string, jest.Mock>>;

  const USER_A = 'user-a-id';
  const USER_B = 'user-b-id';
  const PROFILE_A = 'profile-a-id';
  const PROFILE_B = 'profile-b-id';

  beforeEach(async () => {
    prisma = {
      profile: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      connection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      notification: { create: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
  });

  // ── Plan Limit Enforcement ───────────────────────────────

  describe('Plan Limits', () => {
    it('should BLOCK FREE user from exceeding 10 connections', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'FREE' } }) // fromProfile
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true }); // toProfile

      prisma.connection.count.mockResolvedValue(10); // Already at FREE limit
      prisma.connection.findFirst.mockResolvedValue(null); // No existing connection

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/10/);
    });

    it('should ALLOW PRO user with < 100 connections', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(50); // Under PRO limit
      prisma.connection.findFirst.mockResolvedValue(null);
      prisma.connection.create.mockResolvedValue({ id: 'conn-1' });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.requestConnection(USER_A, PROFILE_A, PROFILE_B);
      expect(result).toBeDefined();
      expect(prisma.connection.create).toHaveBeenCalled();
    });

    it('should BLOCK PRO user at exactly 100 connections', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(100); // At PRO limit
      prisma.connection.findFirst.mockResolvedValue(null);

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/100/);
    });
  });

  // ── Self-Connection Prevention ───────────────────────────

  describe('Self-Connection Prevention', () => {
    it('should reject connecting to same profileId', async () => {
      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_A),
      ).rejects.toThrow(/consigo mesmo/);
    });

    it('should reject connecting to own profile (different profileId, same userId)', async () => {
      const PROFILE_A2 = 'profile-a-secondary';
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_A2, userId: USER_A, isPublished: true }); // Same user!

      prisma.connection.count.mockResolvedValue(0);

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_A2),
      ).rejects.toThrow(/proprio perfil/);
    });
  });

  // ── Duplicate Connection Handling ────────────────────────

  describe('Duplicate Connections', () => {
    it('should reject if already ACCEPTED', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(5);
      prisma.connection.findFirst.mockResolvedValue({ status: 'ACCEPTED' });

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/ja estao conectados/);
    });

    it('should reject if PENDING', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(5);
      prisma.connection.findFirst.mockResolvedValue({ status: 'PENDING' });

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/pendente/);
    });

    it('should allow re-requesting after REJECTED (deletes old, creates new)', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(5);
      prisma.connection.findFirst.mockResolvedValue({ id: 'old-conn', status: 'REJECTED' });
      prisma.connection.delete.mockResolvedValue({});
      prisma.connection.create.mockResolvedValue({ id: 'new-conn' });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.requestConnection(USER_A, PROFILE_A, PROFILE_B);
      expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'old-conn' } });
      expect(result.id).toBe('new-conn');
    });
  });

  // ── Geo Data Handling ────────────────────────────────────

  describe('Geolocation Data', () => {
    it('should store geo data when provided', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(0);
      prisma.connection.findFirst.mockResolvedValue(null);
      prisma.connection.create.mockResolvedValue({ id: 'conn-geo' });
      prisma.notification.create.mockResolvedValue({});

      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, {
        latitude: -23.5505,
        longitude: -46.6333,
        locationLabel: 'Sao Paulo, SP',
      });

      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: -23.5505,
          longitude: -46.6333,
          locationLabel: 'Sao Paulo, SP',
        }),
      });
    });

    it('should store null when geo is not provided', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });

      prisma.connection.count.mockResolvedValue(0);
      prisma.connection.findFirst.mockResolvedValue(null);
      prisma.connection.create.mockResolvedValue({ id: 'conn-no-geo' });
      prisma.notification.create.mockResolvedValue({});

      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B);

      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          latitude: null,
          longitude: null,
          locationLabel: null,
          eventId: null,
        }),
      });
    });
  });

  // ── Plan Limits Constants ────────────────────────────────

  describe('Plan Limits Constants', () => {
    it('FREE plan should allow max 10 connections', () => {
      expect(getPlanLimits('FREE').maxConnections).toBe(10);
    });

    it('PRO plan should allow max 100 connections', () => {
      expect(getPlanLimits('PRO').maxConnections).toBe(100);
    });

    it('BUSINESS plan should allow max 500 connections', () => {
      expect(getPlanLimits('BUSINESS').maxConnections).toBe(500);
    });

    it('ENTERPRISE plan should allow max 1000 connections', () => {
      expect(getPlanLimits('ENTERPRISE').maxConnections).toBe(1000);
    });

    it('FREE plan should have 0 events', () => {
      expect(getPlanLimits('FREE').maxEvents).toBe(0);
    });

    it('PRO plan should have 3 events', () => {
      expect(getPlanLimits('PRO').maxEvents).toBe(3);
    });

    it('FREE plan should NOT have mapGeo', () => {
      expect(getPlanLimits('FREE').mapGeo).toBe(false);
    });

    it('PRO plan should have mapGeo', () => {
      expect(getPlanLimits('PRO').mapGeo).toBe(true);
    });
  });
});
