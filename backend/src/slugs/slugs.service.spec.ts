import { Test, TestingModule } from '@nestjs/testing';
import { SlugsService } from './slugs.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('SlugsService', () => {
  let service: SlugsService;
  let prisma: { profile: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      profile: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlugsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SlugsService>(SlugsService);
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(service.slugify('JOAO SILVA')).toBe('joao-silva');
    });

    it('should remove accents', () => {
      expect(service.slugify('Jose da Conceicao')).toBe('jose-da-conceicao');
    });

    it('should replace spaces with hyphens', () => {
      expect(service.slugify('maria silva')).toBe('maria-silva');
    });

    it('should remove special characters', () => {
      expect(service.slugify('joao@silva!')).toBe('joaosilva');
    });

    it('should collapse multiple hyphens', () => {
      expect(service.slugify('joao--silva')).toBe('joao-silva');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(service.slugify('-joao-')).toBe('joao');
    });

    it('should truncate to 40 chars', () => {
      const long = 'a'.repeat(50);
      expect(service.slugify(long).length).toBe(40);
    });
  });

  describe('isAvailable', () => {
    it('should return true if slug does not exist', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      expect(await service.isAvailable('test-slug')).toBe(true);
    });

    it('should return false if slug exists for another user', async () => {
      prisma.profile.findUnique.mockResolvedValue({ userId: 'other-user' });
      expect(await service.isAvailable('test-slug', 'my-user')).toBe(false);
    });

    it('should return true if slug belongs to the same user', async () => {
      prisma.profile.findUnique.mockResolvedValue({ userId: 'my-user' });
      expect(await service.isAvailable('test-slug', 'my-user')).toBe(true);
    });
  });

  describe('getSuggestions', () => {
    it('should return empty for slugs shorter than 3 chars', async () => {
      const suggestions = await service.getSuggestions('ab');
      expect(suggestions).toEqual([]);
    });

    it('should return available suggestions', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);
      const suggestions = await service.getSuggestions('joao-silva');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });
});
