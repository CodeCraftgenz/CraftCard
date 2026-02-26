import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsService } from '../payments/payments.service';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: {
    profile: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      updateMany: jest.Mock;
    };
    user: { findUnique: jest.Mock };
    organization: { findUnique: jest.Mock };
    organizationMember: { findUnique: jest.Mock };
    socialLink: { deleteMany: jest.Mock; createMany: jest.Mock };
    profileView: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let slugsService: { isAvailable: jest.Mock; slugify: jest.Mock };
  let paymentsService: { getActiveSubscription: jest.Mock };

  beforeEach(async () => {
    prisma = {
      profile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
      user: { findUnique: jest.fn() },
      organization: { findUnique: jest.fn() },
      organizationMember: { findUnique: jest.fn() },
      socialLink: { deleteMany: jest.fn(), createMany: jest.fn() },
      profileView: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };

    slugsService = { isAvailable: jest.fn(), slugify: jest.fn() };
    paymentsService = { getActiveSubscription: jest.fn() };

    const configMock = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          BACKEND_URL: 'https://craftcard.onrender.com',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: prisma },
        { provide: SlugsService, useValue: slugsService },
        { provide: PaymentsService, useValue: paymentsService },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  describe('createCard — personal (B2C)', () => {
    it('should create a personal card when under plan limit', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'PRO' });
      prisma.profile.count.mockResolvedValue(2);
      prisma.profile.create.mockResolvedValue({
        id: 'new-id',
        displayName: 'Novo Cartao',
        slug: 'card-test',
        label: 'Trabalho',
        isPrimary: false,
      });

      const result = await service.createCard('user-1', 'Trabalho');
      expect(result.displayName).toBe('Novo Cartao');
      expect(result.label).toBe('Trabalho');
      expect(prisma.profile.count).toHaveBeenCalledWith({ where: { userId: 'user-1', orgId: null } });
    });

    it('should throw when FREE user tries to create second personal card', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });
      prisma.profile.count.mockResolvedValue(1);

      await expect(service.createCard('user-1', 'Extra')).rejects.toThrow(
        'Maximo de 1 cartao pessoal no plano FREE',
      );
    });

    it('should throw when PRO user exceeds 3 personal cards', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'PRO' });
      prisma.profile.count.mockResolvedValue(3);

      await expect(service.createCard('user-1', 'Extra')).rejects.toThrow(
        'Maximo de 3 cartoes pessoais no plano PRO',
      );
    });

    it('should throw when BUSINESS user exceeds 3 personal cards', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'BUSINESS' });
      prisma.profile.count.mockResolvedValue(3);

      await expect(service.createCard('user-1', 'Extra')).rejects.toThrow(
        'Maximo de 3 cartoes pessoais no plano BUSINESS',
      );
    });
  });

  describe('createCard — org (B2B)', () => {
    it('should create an org card when under seat limit', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'BUSINESS' });
      prisma.organization.findUnique.mockResolvedValue({ maxMembers: 10 });
      prisma.organizationMember.findUnique.mockResolvedValue({ id: 'member-1', role: 'MEMBER' });
      prisma.profile.count.mockResolvedValue(5);
      prisma.profile.create.mockResolvedValue({
        id: 'new-id',
        displayName: 'Novo Cartao',
        slug: 'card-test',
        label: 'Corp',
        isPrimary: false,
      });

      const result = await service.createCard('user-1', 'Corp', 'org-1');
      expect(result.displayName).toBe('Novo Cartao');
      expect(prisma.profile.count).toHaveBeenCalledWith({ where: { orgId: 'org-1' } });
    });

    it('should throw when org not found', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'BUSINESS' });
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.createCard('user-1', 'Corp', 'org-invalid')).rejects.toThrow('Organizacao');
    });

    it('should throw when user is not org member', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'BUSINESS' });
      prisma.organization.findUnique.mockResolvedValue({ maxMembers: 10 });
      prisma.organizationMember.findUnique.mockResolvedValue(null);

      await expect(service.createCard('user-1', 'Corp', 'org-1')).rejects.toThrow(
        'Voce nao e membro desta organizacao',
      );
    });

    it('should throw when org seat limit reached', async () => {
      prisma.user.findUnique.mockResolvedValue({ plan: 'BUSINESS' });
      prisma.organization.findUnique.mockResolvedValue({ maxMembers: 5 });
      prisma.organizationMember.findUnique.mockResolvedValue({ id: 'member-1', role: 'MEMBER' });
      prisma.profile.count.mockResolvedValue(5);

      await expect(service.createCard('user-1', 'Corp', 'org-1')).rejects.toThrow(
        'Limite de 5 assentos na organizacao atingido',
      );
    });
  });

  describe('deleteCard', () => {
    it('should delete a non-primary card', async () => {
      prisma.profile.findFirst.mockResolvedValue({ id: 'card-2', isPrimary: false });
      prisma.profile.delete.mockResolvedValue({});

      const result = await service.deleteCard('user-1', 'card-2');
      expect(result.deleted).toBe(true);
    });

    it('should throw when deleting primary card', async () => {
      prisma.profile.findFirst.mockResolvedValue({ id: 'card-1', isPrimary: true });

      await expect(service.deleteCard('user-1', 'card-1')).rejects.toThrow(
        'Nao e possivel excluir o cartao principal',
      );
    });

    it('should throw when card not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);

      await expect(service.deleteCard('user-1', 'nonexistent')).rejects.toThrow('Perfil');
    });
  });

  describe('getBySlug', () => {
    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      slug: 'joao-silva',
      displayName: 'Joao Silva',
      isPublished: true,
      photoData: null,
      coverPhotoData: null,
      resumeData: null,
      resumeUrl: null,
      socialLinks: [
        { id: 'link-1', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/joao', order: 0, startsAt: null, endsAt: null, linkType: 'link', metadata: null },
      ],
      testimonials: [],
      galleryImages: [],
      services: [],
      faqItems: [],
      user: { name: 'Joao', email: 'joao@test.com', plan: 'PRO' },
      organization: null,
    };

    it('should return profile and cache it', async () => {
      prisma.profile.findUnique.mockResolvedValue(mockProfile);
      paymentsService.getActiveSubscription.mockResolvedValue({ active: true, expiresAt: null });

      const result = await service.getBySlug('joao-silva') as any;
      expect(result.displayName).toBe('Joao Silva');
      expect(result.isVerified).toBe(true);

      // Second call should use cache (no new DB query)
      const result2 = await service.getBySlug('joao-silva') as any;
      expect(result2.displayName).toBe('Joao Silva');
      expect(prisma.profile.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw for unpublished profile', async () => {
      prisma.profile.findUnique.mockResolvedValue({ ...mockProfile, isPublished: false });

      await expect(service.getBySlug('hidden-profile')).rejects.toThrow('Perfil');
    });

    it('should throw for nonexistent slug', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug('does-not-exist')).rejects.toThrow('Perfil');
    });

    it('should filter expired scheduled links', async () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2099-01-01');

      prisma.profile.findUnique.mockResolvedValue({
        ...mockProfile,
        socialLinks: [
          { id: 'l1', platform: 'link', label: 'Active', url: 'https://a.com', order: 0, startsAt: null, endsAt: null, linkType: 'link', metadata: null },
          { id: 'l2', platform: 'link', label: 'Expired', url: 'https://b.com', order: 1, startsAt: null, endsAt: pastDate, linkType: 'link', metadata: null },
          { id: 'l3', platform: 'link', label: 'Future', url: 'https://c.com', order: 2, startsAt: futureDate, endsAt: null, linkType: 'link', metadata: null },
        ],
      });
      paymentsService.getActiveSubscription.mockResolvedValue({ active: false, expiresAt: null });

      const result = await service.getBySlug('joao-silva') as any;
      expect(result.socialLinks).toHaveLength(1);
      expect(result.socialLinks[0].label).toBe('Active');
    });
  });

  describe('update', () => {
    const mockProfile = {
      id: 'profile-1',
      userId: 'user-1',
      slug: 'joao-silva',
      isPrimary: true,
      organization: null,
    };

    it('should throw when link count exceeds plan limit', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });

      const links = Array.from({ length: 6 }, (_, i) => ({
        platform: 'link',
        label: `Link ${i}`,
        url: `https://example.com/${i}`,
        order: i,
      }));

      await expect(
        service.update('user-1', { socialLinks: links } as any),
      ).rejects.toThrow('Maximo de 5 links no plano FREE');
    });

    it('should throw when FREE user uses premium theme', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });

      await expect(
        service.update('user-1', { cardTheme: 'neon' } as any),
      ).rejects.toThrow('Tema "neon" nao disponivel no plano gratuito');
    });

    it('should allow FREE user to use default theme', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.user.findUnique.mockResolvedValue({ plan: 'FREE' });
      prisma.$transaction.mockResolvedValue({ id: 'profile-1', socialLinks: [] });

      await service.update('user-1', { cardTheme: 'default' } as any);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw conflict when slug is taken', async () => {
      prisma.profile.findFirst.mockResolvedValue(mockProfile);
      prisma.user.findUnique.mockResolvedValue({ plan: 'PRO' });
      slugsService.isAvailable.mockResolvedValue(false);

      await expect(
        service.update('user-1', { slug: 'taken-slug' } as any),
      ).rejects.toThrow('Slug ja esta em uso');
    });
  });
});
