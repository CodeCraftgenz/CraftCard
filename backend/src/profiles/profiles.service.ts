import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { AppException } from '../common/exceptions/app.exception';
import type { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugsService: SlugsService,
  ) {}

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { socialLinks: { orderBy: { order: 'asc' } } },
    });
    if (!profile) throw AppException.notFound('Perfil');
    const { photoData: _, ...rest } = profile;
    return rest;
  }

  async getBySlug(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        socialLinks: { orderBy: { order: 'asc' } },
        user: { select: { name: true, email: true } },
      },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }
    const { photoData: _, ...rest } = profile;
    return rest;
  }

  async update(userId: string, data: UpdateProfileDto) {
    const profile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw AppException.notFound('Perfil');

    // Validate slug uniqueness
    if (data.slug && data.slug !== profile.slug) {
      const available = await this.slugsService.isAvailable(data.slug, userId);
      if (!available) {
        throw AppException.conflict('Slug ja esta em uso');
      }
    }

    const { socialLinks, ...profileData } = data;

    return this.prisma.$transaction(async (tx) => {
      // Update profile fields
      const updated = await tx.profile.update({
        where: { userId },
        data: profileData,
      });

      // Replace social links if provided
      if (socialLinks !== undefined) {
        await tx.socialLink.deleteMany({ where: { profileId: profile.id } });

        if (socialLinks.length > 0) {
          await tx.socialLink.createMany({
            data: socialLinks.map((link) => ({
              profileId: profile.id,
              platform: link.platform,
              label: link.label,
              url: link.url,
              order: link.order,
            })),
          });
        }
      }

      return tx.profile.findUnique({
        where: { id: updated.id },
        include: { socialLinks: { orderBy: { order: 'asc' } } },
      });
    });
  }
}
