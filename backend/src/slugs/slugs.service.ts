import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class SlugsService {
  constructor(private readonly prisma: PrismaService) {}

  slugify(input: string): string {
    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
  }

  async isAvailable(slug: string, excludeUserId?: string): Promise<boolean> {
    const existing = await this.prisma.profile.findUnique({
      where: { slug },
      select: { userId: true },
    });
    if (!existing) return true;
    if (excludeUserId && existing.userId === excludeUserId) return true;
    return false;
  }

  async getSuggestions(base: string, excludeUserId?: string): Promise<string[]> {
    const slug = this.slugify(base);
    if (slug.length < 3) return [];

    const suggestions: string[] = [];
    const candidates = [
      slug,
      `${slug}-2`,
      `${slug}-3`,
      `${slug}-pro`,
      `${slug}-card`,
      `${slug}-${Math.floor(Math.random() * 99) + 1}`,
    ];

    for (const candidate of candidates) {
      if (suggestions.length >= 5) break;
      const available = await this.isAvailable(candidate, excludeUserId);
      if (available) {
        suggestions.push(candidate);
      }
    }

    return suggestions;
  }
}
