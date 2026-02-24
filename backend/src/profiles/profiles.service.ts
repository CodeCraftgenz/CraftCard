import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsService } from '../payments/payments.service';
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
  private readonly backendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly slugsService: SlugsService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.uploadsPublicUrl = this.configService.get('UPLOADS_PUBLIC_URL', { infer: true }) || '';
    this.backendUrl = this.configService.get('BACKEND_URL', { infer: true }) || '';
  }

  /** Rewrite URLs that still reference the old Hostinger subdomain */
  private migrateUrl(url: string | null): string | null {
    if (!url || !this.uploadsPublicUrl) return url;
    if (url.startsWith(OLD_UPLOAD_HOST)) {
      return url.replace(OLD_UPLOAD_HOST, this.uploadsPublicUrl);
    }
    return url;
  }

  /** Convert relative API paths to absolute URLs using BACKEND_URL */
  private resolveApiUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return this.backendUrl + url;
  }

  async getByUserId(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({
          where: { id: profileId, userId },
          include: { socialLinks: { orderBy: { order: 'asc' } } },
        })
      : await this.prisma.profile.findFirst({
          where: { userId, isPrimary: true },
          include: { socialLinks: { orderBy: { order: 'asc' } } },
        });
    if (!profile) throw AppException.notFound('Perfil');
    const { photoData: _, coverPhotoData: _c, resumeData: _r, ...rest } = profile;
    return { ...rest, resumeUrl: this.resolveApiUrl(this.migrateUrl(rest.resumeUrl)) };
  }

  async getAllByUserId(userId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, displayName: true, slug: true, label: true, isPrimary: true, isPublished: true, photoUrl: true },
    });
    return profiles;
  }

  async createCard(userId: string, label: string) {
    const count = await this.prisma.profile.count({ where: { userId } });
    if (count >= 5) {
      throw AppException.badRequest('Maximo de 5 cartoes atingido');
    }

    const slug = `card-${Date.now().toString(36)}`;
    return this.prisma.profile.create({
      data: {
        userId,
        displayName: 'Novo Cartao',
        label,
        slug,
        isPrimary: false,
      },
      select: { id: true, displayName: true, slug: true, label: true, isPrimary: true },
    });
  }

  async deleteCard(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) throw AppException.notFound('Perfil');
    if (profile.isPrimary) {
      throw AppException.badRequest('Nao e possivel excluir o cartao principal');
    }
    await this.prisma.profile.delete({ where: { id: profileId } });
    return { deleted: true };
  }

  async setPrimary(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) throw AppException.notFound('Perfil');

    await this.prisma.$transaction([
      this.prisma.profile.updateMany({ where: { userId }, data: { isPrimary: false } }),
      this.prisma.profile.update({ where: { id: profileId }, data: { isPrimary: true } }),
    ]);
    return { primary: true };
  }

  async getBySlug(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        socialLinks: { orderBy: { order: 'asc' } },
        testimonials: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        galleryImages: { orderBy: { order: 'asc' }, select: { id: true, imageUrl: true, imageData: true, caption: true, order: true } },
        services: { orderBy: { order: 'asc' }, select: { id: true, title: true, description: true, price: true, order: true } },
        faqItems: { orderBy: { order: 'asc' }, select: { id: true, question: true, answer: true, order: true } },
        user: { select: { name: true, email: true, plan: true } },
        organization: { select: { id: true, name: true, logoUrl: true, primaryColor: true, secondaryColor: true, fontFamily: true, brandingActive: true } },
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

    // Check if user has paid (verified badge)
    const subscription = await this.paymentsService.getActiveSubscription(profile.userId);

    const { photoData: _, coverPhotoData: _c, resumeData: _r, ...rest } = profile;

    // Apply org branding overrides if active
    const orgBranding = profile.organization?.brandingActive ? {
      orgName: profile.organization.name,
      orgLogoUrl: profile.organization.logoUrl,
      orgPrimaryColor: profile.organization.primaryColor,
      orgSecondaryColor: profile.organization.secondaryColor,
      orgFontFamily: profile.organization.fontFamily,
    } : null;

    return {
      ...rest,
      resumeUrl: this.resolveApiUrl(this.migrateUrl(rest.resumeUrl)),
      socialLinks: activeLinks,
      isVerified: subscription.active,
      plan: profile.user?.plan || 'FREE',
      orgBranding,
    };
  }

  async update(userId: string, data: UpdateProfileDto, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId }, include: { organization: { select: { brandingActive: true } } } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true }, include: { organization: { select: { brandingActive: true } } } });
    if (!profile) throw AppException.notFound('Perfil');

    // If org branding is active, strip visual customization fields
    if (profile.organization?.brandingActive) {
      delete data.buttonColor;
      delete data.cardTheme;
      delete data.fontFamily;
      delete data.fontSizeScale;
      delete data.backgroundType;
      delete data.backgroundGradient;
      delete data.backgroundPattern;
      delete data.linkStyle;
      delete data.linkAnimation;
    }

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
        where: { id: profile.id },
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
              url: link.url || '',
              order: link.order,
              startsAt: link.startsAt ?? null,
              endsAt: link.endsAt ?? null,
              linkType: link.linkType ?? 'link',
              metadata: link.metadata ?? null,
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

  /** Custom domain management */
  async setCustomDomain(userId: string, domain: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) throw AppException.notFound('Perfil');

    const cleanDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const verifyToken = `craftcard-verify-${randomUUID().slice(0, 12)}`;

    const existing = await this.prisma.customDomain.findUnique({
      where: { profileId: profile.id },
    });

    if (existing) {
      return this.prisma.customDomain.update({
        where: { id: existing.id },
        data: { domain: cleanDomain, verifyToken, verified: false },
      });
    }

    return this.prisma.customDomain.create({
      data: { profileId: profile.id, domain: cleanDomain, verifyToken },
    });
  }

  async verifyCustomDomain(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) throw AppException.notFound('Perfil');

    const customDomain = await this.prisma.customDomain.findUnique({
      where: { profileId: profile.id },
    });
    if (!customDomain) throw AppException.notFound('Dominio');

    // Try DNS TXT record verification
    try {
      const dns = await import('dns');
      const records = await new Promise<string[][]>((resolve, reject) => {
        dns.resolveTxt(customDomain.domain, (err, records) => {
          if (err) reject(err);
          else resolve(records);
        });
      });

      const flatRecords = records.flat();
      const verified = flatRecords.some((r) => r.includes(customDomain.verifyToken));

      if (verified) {
        await this.prisma.customDomain.update({
          where: { id: customDomain.id },
          data: { verified: true },
        });
        return { verified: true, domain: customDomain.domain };
      }

      return { verified: false, domain: customDomain.domain, token: customDomain.verifyToken };
    } catch {
      return { verified: false, domain: customDomain.domain, token: customDomain.verifyToken };
    }
  }

  async getCustomDomain(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) return null;

    return this.prisma.customDomain.findUnique({
      where: { profileId: profile.id },
    });
  }

  async removeCustomDomain(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) throw AppException.notFound('Perfil');

    await this.prisma.customDomain.deleteMany({
      where: { profileId: profile.id },
    });
    return { deleted: true };
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
