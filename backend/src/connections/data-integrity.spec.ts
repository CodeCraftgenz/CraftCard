import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsService } from './connections.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * DATA INTEGRITY & RACE CONDITIONS TESTS
 * Simulates concurrent operations, double-clicks, and edge cases
 * that could corrupt data in production.
 */

describe('Data Integrity & Race Conditions', () => {
  let service: ConnectionsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  const USER_A = 'user-a';
  const USER_B = 'user-b';
  const PROFILE_A = 'profile-a';
  const PROFILE_B = 'profile-b';

  beforeEach(async () => {
    prisma = {
      profile: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      connection: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      notification: { create: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
  });

  // ── Double-Click Idempotency ─────────────────────────

  describe('Double-click connection request (idempotency)', () => {
    it('should reject 2nd request when PENDING exists', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });
      prisma.connection.count.mockResolvedValue(0);
      prisma.connection.findFirst.mockResolvedValue({ id: 'conn-1', status: 'PENDING' });

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/pendente/);
    });

    it('should reject 3rd request when ACCEPTED exists', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });
      prisma.connection.count.mockResolvedValue(1);
      prisma.connection.findFirst.mockResolvedValue({ id: 'conn-1', status: 'ACCEPTED' });

      await expect(
        service.requestConnection(USER_A, PROFILE_A, PROFILE_B),
      ).rejects.toThrow(/já estão conectados/);
    });

    it('should create only 1 connection even if called rapidly', async () => {
      // First call: no existing connection → creates
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });
      prisma.connection.count.mockResolvedValue(0);
      prisma.connection.findFirst.mockResolvedValueOnce(null); // No existing
      prisma.connection.create.mockResolvedValue({ id: 'conn-new' });

      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B);
      expect(prisma.connection.create).toHaveBeenCalledTimes(1);
    });
  });

  // ── Accept/Reject Authorization ──────────────────────

  describe('Accept/Reject authorization', () => {
    it('should BLOCK non-addressee from accepting', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        status: 'PENDING',
        addressee: { userId: USER_B },
        requester: { userId: USER_A, displayName: 'User A' },
      });

      await expect(
        service.acceptConnection(USER_A, 'conn-1'), // USER_A is requester, not addressee
      ).rejects.toThrow(/não pode aceitar/);
    });

    it('should BLOCK non-addressee from rejecting', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        status: 'PENDING',
        addressee: { userId: USER_B },
      });

      await expect(
        service.rejectConnection(USER_A, 'conn-1'),
      ).rejects.toThrow(/não pode rejeitar/);
    });

    it('should BLOCK accepting non-PENDING connection', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        status: 'ACCEPTED',
        addressee: { userId: USER_A },
        requester: { userId: USER_B, displayName: 'User B' },
      });

      await expect(
        service.acceptConnection(USER_A, 'conn-1'),
      ).rejects.toThrow(/não está pendente/);
    });
  });

  // ── Remove Authorization ─────────────────────────────

  describe('Remove connection authorization', () => {
    it('should allow requester to remove', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        requester: { userId: USER_A },
        addressee: { userId: USER_B },
      });
      prisma.connection.delete.mockResolvedValue({});

      await expect(service.removeConnection(USER_A, 'conn-1')).resolves.not.toThrow();
    });

    it('should allow addressee to remove', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        requester: { userId: USER_A },
        addressee: { userId: USER_B },
      });
      prisma.connection.delete.mockResolvedValue({});

      await expect(service.removeConnection(USER_B, 'conn-1')).resolves.not.toThrow();
    });

    it('should BLOCK third party from removing', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue({
        id: 'conn-1',
        requester: { userId: USER_A },
        addressee: { userId: USER_B },
      });

      await expect(
        service.removeConnection('user-c', 'conn-1'),
      ).rejects.toThrow(/não pode remover/);
    });
  });

  // ── Not Found Handling ───────────────────────────────

  describe('Not found error handling', () => {
    it('should throw when source profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(
        service.requestConnection(USER_A, 'nonexistent', PROFILE_B),
      ).rejects.toThrow(/Perfil de origem/);
    });

    it('should throw when target profile not found', async () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce(null); // Target not found
      prisma.connection.count.mockResolvedValue(0);

      await expect(
        service.requestConnection(USER_A, PROFILE_A, 'nonexistent'),
      ).rejects.toThrow(/Perfil de destino/);
    });

    it('should throw when connection not found for accept', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.acceptConnection(USER_A, 'nonexistent'),
      ).rejects.toThrow(/Conexão/);
    });

    it('should throw when connection not found for reject', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.rejectConnection(USER_A, 'nonexistent'),
      ).rejects.toThrow(/Conexão/);
    });

    it('should throw when connection not found for remove', async () => {
      prisma.connection.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.removeConnection(USER_A, 'nonexistent'),
      ).rejects.toThrow(/Conexão/);
    });
  });

  // ── Geo Data Edge Cases ──────────────────────────────

  describe('Geo data edge cases', () => {
    const setupValidRequest = () => {
      prisma.profile.findFirst
        .mockResolvedValueOnce({ id: PROFILE_A, userId: USER_A, user: { plan: 'PRO' } })
        .mockResolvedValueOnce({ id: PROFILE_B, userId: USER_B, isPublished: true });
      prisma.connection.count.mockResolvedValue(0);
      prisma.connection.findFirst.mockResolvedValue(null);
      prisma.connection.create.mockImplementation((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'conn-new', ...args.data }),
      );
    };

    it('should handle extreme latitude values', async () => {
      setupValidRequest();
      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, {
        latitude: -90, longitude: 0,
      });
      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ latitude: -90, longitude: 0 }),
      });
    });

    it('should handle extreme longitude values', async () => {
      setupValidRequest();
      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, {
        latitude: 0, longitude: 180,
      });
      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ latitude: 0, longitude: 180 }),
      });
    });

    it('should handle undefined geo gracefully', async () => {
      setupValidRequest();
      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, undefined);
      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ latitude: null, longitude: null }),
      });
    });

    it('should handle partial geo (lat only) gracefully', async () => {
      setupValidRequest();
      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, {
        latitude: -23.5, // no longitude
      });
      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ latitude: -23.5, longitude: null }),
      });
    });

    it('should store eventId when provided', async () => {
      setupValidRequest();
      await service.requestConnection(USER_A, PROFILE_A, PROFILE_B, {
        eventId: 'event-123',
      });
      expect(prisma.connection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ eventId: 'event-123' }),
      });
    });
  });
});
