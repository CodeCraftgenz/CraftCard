import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { AppException } from '../common/exceptions/app.exception';
import { randomUUID } from 'crypto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { EnvConfig } from '../common/config/env.config';

/** Old Hostinger subdomain — URLs stored before domain migration */
const OLD_UPLOAD_HOST = 'https://azure-eagle-617866.hostingersite.com/uploads';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);
  private readonly uploadsPublicUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly slugsService: SlugsService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.uploadsPublicUrl = this.configService.get('UPLOADS_PUBLIC_URL', { infer: true }) || '';
  }

  /** Rewrite URLs that still reference the old Hostinger subdomain */
  private migrateUrl(url: string | null): string | null {
    if (!url || !this.uploadsPublicUrl) return url;
    if (url.startsWith(OLD_UPLOAD_HOST)) {
      return url.replace(OLD_UPLOAD_HOST, this.uploadsPublicUrl);
    }
    return url;
  }

  async getByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: { socialLinks: { orderBy: { order: 'asc' } } },
    });
    if (!profile) throw AppException.notFound('Perfil');
    const { photoData: _, coverPhotoData: _c, ...rest } = profile;
    return { ...rest, resumeUrl: this.migrateUrl(rest.resumeUrl) };
  }

  async getBySlug(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        socialLinks: { orderBy: { order: 'asc' } },
        testimonials: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        user: { select: { name: true, email: true } },
      },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    // Increment view count (fire-and-forget)
    this.prisma.profile.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    }).catch(() => { /* ignore errors */ });

    // Track daily view (fire-and-forget)
    this.trackDailyView(profile.id).catch(() => {});

    // Filter links by schedule (only show currently active ones on public page)
    const now = new Date();
    const activeLinks = profile.socialLinks.filter((link) => {
      if (link.startsAt && link.startsAt > now) return false;
      if (link.endsAt && link.endsAt < now) return false;
      return true;
    });

    const { photoData: _, coverPhotoData: _c, ...rest } = profile;
    return { ...rest, resumeUrl: this.migrateUrl(rest.resumeUrl), socialLinks: activeLinks };
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
              startsAt: link.startsAt ?? null,
              endsAt: link.endsAt ?? null,
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

  private async trackDailyView(profileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existing = await this.prisma.profileView.findUnique({
        where: { profileId_date: { profileId, date: today } },
      });
      if (existing) {
        await this.prisma.profileView.update({
          where: { id: existing.id },
          data: { count: { increment: 1 } },
        });
      } else {
        await this.prisma.profileView.create({
          data: { id: randomUUID(), profileId, date: today, count: 1 },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to track daily view: ${err}`);
    }
  }
}
