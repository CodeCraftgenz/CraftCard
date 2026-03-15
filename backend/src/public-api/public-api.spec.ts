import { Test, TestingModule } from '@nestjs/testing';
import { PublicApiService } from './public-api.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * PUBLIC API TESTS
 * Tests the Enterprise API endpoints that use Bearer token auth.
 */
describe('PublicApiService', () => {
  let service: PublicApiService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;

  const USER_ID = 'user-enterprise-1';
  const PROFILE_ID = 'profile-1';

  beforeEach(async () => {
    prisma = {
      profile: {
        findMany: jest.fn().mockResolvedValue([{ id: PROFILE_ID, viewCount: 100, displayName: 'Test', slug: 'test' }]),
      },
      contactMessage: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      connection: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      profileView: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicApiService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PublicApiService>(PublicApiService);
  });

  describe('getLeads()', () => {
    it('should return paginated leads', async () => {
      prisma.contactMessage.findMany.mockResolvedValue([
        { id: 'msg-1', senderName: 'João', senderEmail: 'joao@test.com', message: 'Olá', isRead: false, createdAt: new Date(), profile: { displayName: 'Test', slug: 'test' } },
      ]);
      prisma.contactMessage.count.mockResolvedValue(1);

      const result = await service.getLeads(USER_ID);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].senderName).toBe('João');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should respect pagination params', async () => {
      prisma.contactMessage.findMany.mockResolvedValue([]);
      prisma.contactMessage.count.mockResolvedValue(50);

      const result = await service.getLeads(USER_ID, { page: 3, limit: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(5);
    });

    it('should limit to max 100 per page', async () => {
      prisma.contactMessage.findMany.mockResolvedValue([]);
      prisma.contactMessage.count.mockResolvedValue(0);

      const result = await service.getLeads(USER_ID, { limit: 500 });

      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('getConnections()', () => {
    it('should return paginated connections', async () => {
      const result = await service.getConnections(USER_ID);
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
    });
  });

  describe('getProfiles()', () => {
    it('should return user profiles with stats', async () => {
      prisma.profile.findMany.mockResolvedValue([
        {
          id: PROFILE_ID, displayName: 'Test', slug: 'test', bio: 'Bio',
          photoUrl: null, viewCount: 100, buttonColor: '#00E4F2',
          cardTheme: 'default', createdAt: new Date(),
          _count: { socialLinks: 5, connectionsRequested: 3, connectionsReceived: 2 },
        },
      ]);

      const result = await service.getProfiles(USER_ID);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].viewCount).toBe(100);
      expect(result.data[0].linksCount).toBe(5);
      expect(result.data[0].connectionsCount).toBe(5);
    });
  });

  describe('getAnalytics()', () => {
    it('should return aggregated stats', async () => {
      prisma.contactMessage.count.mockResolvedValue(10);
      prisma.connection.count.mockResolvedValue(5);
      prisma.profileView.findMany.mockResolvedValue([]);

      const result = await service.getAnalytics(USER_ID);

      expect(result.data.totalViews).toBe(100);
      expect(result.data.totalLeads).toBe(10);
      expect(result.data.totalConnections).toBe(5);
      expect(result.data.profileCount).toBe(1);
    });
  });
});
