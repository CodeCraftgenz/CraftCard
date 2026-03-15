import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsService } from '../payments/payments.service';
import { getPlanLimits } from '../payments/plan-limits';

/**
 * HACKATHON ISOLATION TESTS
 * Guarantees that hackathon operations NEVER corrupt PRO/Enterprise user data.
 * Critical after the incident where hackathon onboarding overwrote social links.
 */
describe('Hackathon Data Isolation', () => {
  let service: ProfilesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any;
  let paymentsService: Record<string, jest.Mock>;

  const USER_ID = 'user-pro-123';
  const PROFILE_ID = 'profile-main-456';

  const mockProProfile = {
    id: PROFILE_ID,
    userId: USER_ID,
    isPrimary: true,
    isPublished: true,
    displayName: 'Ricardo Coradini',
    bio: 'Senior Developer | Tech Lead',
    buttonColor: '#6C5CE7',
    slug: 'ricardo-coradini',
    photoUrl: '/uploads/ricardo.jpg',
    socialLinks: [
      { id: 'link-1', linkType: 'link', platform: 'github', label: 'GitHub', url: 'https://github.com/ricardo', order: 0 },
      { id: 'link-2', linkType: 'link', platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/ricardo', order: 1 },
      { id: 'link-3', linkType: 'link', platform: 'website', label: 'Portfolio', url: 'https://ricardo.dev', order: 2 },
    ],
    organization: null,
  };

  beforeEach(async () => {
    prisma = {
      profile: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue(mockProProfile),
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue(mockProProfile),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
      socialLink: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        findFirst: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      organization: { findUnique: jest.fn() },
      organizationMember: { findUnique: jest.fn() },
      profileView: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      customDomain: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), deleteMany: jest.fn() },
      connection: { findMany: jest.fn() },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    paymentsService = {
      getActiveSubscription: jest.fn().mockResolvedValue({ active: true, expiresAt: null }),
      getUserPlanInfo: jest.fn().mockResolvedValue({
        plan: 'ENTERPRISE',
        planLimits: getPlanLimits('ENTERPRISE'),
        expiresAt: null,
      }),
    };

    const cache = { get: jest.fn(), set: jest.fn(), del: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: SlugsService, useValue: { isAvailable: jest.fn(), slugify: jest.fn() } },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('https://api.test.com') } },
        { provide: CACHE_MANAGER, useValue: cache },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  // ── upsertHackathonMeta: Core Isolation Tests ────────────

  describe('upsertHackathonMeta()', () => {
    it('should ONLY delete hackathon_meta links, never touch other social links', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProProfile,
        socialLinks: [{ id: 'hack-old', linkType: 'hackathon_meta' }],
      });

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação'] },
      );

      // Must delete ONLY hackathon_meta links
      expect(prisma.socialLink.deleteMany).toHaveBeenCalledWith({
        where: { profileId: PROFILE_ID, linkType: 'hackathon_meta' },
      });

      // Must NOT delete all links (the old bug)
      expect(prisma.socialLink.deleteMany).not.toHaveBeenCalledWith({
        where: { profileId: PROFILE_ID },
      });
    });

    it('should NOT overwrite displayName if user already has a custom name', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProProfile,
        socialLinks: [],
      });

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação'] },
        { displayName: 'Hackathon User' },
      );

      // Should NOT update displayName because profile already has 'Ricardo Coradini'
      const updateCall = prisma.profile.update.mock.calls[0];
      if (updateCall) {
        expect(updateCall[0].data).not.toHaveProperty('displayName');
      }
    });

    it('should NOT overwrite bio if user already has one', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProProfile,
        socialLinks: [],
      });

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação'] },
        { bio: 'Eu sou prática, conectada e para todo mundo' },
      );

      // profile.bio = 'Senior Developer | Tech Lead' — must not be overwritten
      const updateCall = prisma.profile.update.mock.calls[0];
      if (updateCall) {
        expect(updateCall[0].data).not.toHaveProperty('bio');
      }
    });

    it('should NOT overwrite buttonColor if user has a custom color', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProProfile,
        socialLinks: [],
      });

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação'] },
        { buttonColor: '#3F51B5' },
      );

      // profile.buttonColor = '#6C5CE7' (custom) — must not be overwritten
      const updateCall = prisma.profile.update.mock.calls[0];
      if (updateCall) {
        expect(updateCall[0].data).not.toHaveProperty('buttonColor');
      }
    });

    it('should SET defaults for brand-new profiles (no custom data)', async () => {
      const newProfile = {
        ...mockProProfile,
        displayName: 'Novo Cartão',
        bio: null,
        buttonColor: '#00E4F2', // default color
        isPublished: false,
        socialLinks: [],
      };
      prisma.profile.findFirst.mockResolvedValue(newProfile);

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação'] },
        { displayName: 'Hackathon User', bio: 'Nova bio', buttonColor: '#3F51B5' },
      );

      // For new profiles, defaults SHOULD be applied
      expect(prisma.profile.update).toHaveBeenCalled();
      const updateData = prisma.profile.update.mock.calls[0][0].data;
      expect(updateData.isPublished).toBe(true);
      expect(updateData.displayName).toBe('Hackathon User');
      expect(updateData.bio).toBe('Nova bio');
      expect(updateData.buttonColor).toBe('#3F51B5');
    });

    it('should create hackathon_meta link with correct metadata JSON', async () => {
      prisma.profile.findFirst.mockResolvedValue({
        ...mockProProfile,
        socialLinks: [],
      });

      await service.upsertHackathonMeta(
        USER_ID,
        { hackathonArea: 'ti', hackathonSkills: ['comunicação', 'equipe', 'proatividade'] },
      );

      expect(prisma.socialLink.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          profileId: PROFILE_ID,
          platform: 'custom',
          label: 'hackathon_meta',
          linkType: 'hackathon_meta',
          order: 999,
          metadata: JSON.stringify({
            hackathonArea: 'ti',
            hackathonSkills: ['comunicação', 'equipe', 'proatividade'],
          }),
        }),
      });
    });
  });

  // ── ProfilesService.update(): Safe Patch Tests ───────────

  describe('update() — Safe Patch Behavior', () => {
    it('should replace ONLY socialLinks when socialLinks array is provided, not other fields', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProProfile);
      paymentsService.getUserPlanInfo.mockResolvedValue({
        plan: 'PRO',
        planLimits: getPlanLimits('PRO'),
        expiresAt: null,
      });

      const newLinks = [
        { platform: 'github' as const, label: 'GitHub', url: 'https://github.com/ricardo', order: 0 },
      ];

      await service.update(USER_ID, { socialLinks: newLinks as any });

      // socialLink.deleteMany should be called with profileId
      expect(prisma.socialLink.deleteMany).toHaveBeenCalledWith({
        where: { profileId: PROFILE_ID },
      });

      // socialLink.createMany should be called with the new links
      expect(prisma.socialLink.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            profileId: PROFILE_ID,
            platform: 'github',
            label: 'GitHub',
          }),
        ]),
      });
    });

    it('should NOT touch socialLinks when socialLinks is not in the update payload', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProProfile);
      paymentsService.getUserPlanInfo.mockResolvedValue({
        plan: 'PRO',
        planLimits: getPlanLimits('PRO'),
        expiresAt: null,
      });

      // Update only bio, not socialLinks
      await service.update(USER_ID, { bio: 'Updated bio only' });

      // socialLink methods should NOT be called
      expect(prisma.socialLink.deleteMany).not.toHaveBeenCalled();
      expect(prisma.socialLink.createMany).not.toHaveBeenCalled();

      // profile.update SHOULD be called with the bio
      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { id: PROFILE_ID },
        data: expect.objectContaining({ bio: 'Updated bio only' }),
      });
    });

    it('should enforce maxLinks limit per plan', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProProfile);
      paymentsService.getUserPlanInfo.mockResolvedValue({
        plan: 'FREE',
        planLimits: getPlanLimits('FREE'),
        expiresAt: null,
      });

      // FREE plan allows max 5 links — try to add 6
      const tooManyLinks = Array.from({ length: 6 }, (_, i) => ({
        platform: 'custom' as const,
        label: `Link ${i}`,
        url: `https://example.com/${i}`,
        order: i,
      }));

      await expect(
        service.update(USER_ID, { socialLinks: tooManyLinks as any }),
      ).rejects.toThrow(/5/); // Should mention the limit of 5
    });
  });
});
