import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsService } from '../payments/payments.service';
import { AppException } from '../common/exceptions/app.exception';
import { MemoryCache } from '../common/cache/memory-cache';
import { getPlanLimits, FREE_THEMES } from '../payments/plan-limits';
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
  private readonly slugCache = new MemoryCache<unknown>(5 * 60 * 1000); // 5min TTL

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
    const include = {
      socialLinks: { orderBy: { order: 'asc' } as const, select: { id: true, platform: true, label: true, url: true, order: true, startsAt: true, endsAt: true, linkType: true, metadata: true } },
      services: { orderBy: { order: 'asc' } as const, select: { id: true, title: true, description: true, price: true, order: true } },
      faqItems: { orderBy: { order: 'asc' } as const, select: { id: true, question: true, answer: true, order: true } },
      testimonials: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } as const, take: 10, select: { id: true, authorName: true, authorRole: true, text: true, createdAt: true } },
      galleryImages: { orderBy: { order: 'asc' } as const, select: { id: true, imageUrl: true, imageData: true, caption: true, order: true } },
    };
    const profile = profileId
      ? await this.prisma.profile.findFirst({
          where: { id: profileId, userId },
          include,
        })
      : await this.prisma.profile.findFirst({
          where: { userId, isPrimary: true },
          include,
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

  async createCard(userId: string, label: string, orgId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const limits = getPlanLimits(user?.plan || 'FREE');

    if (orgId) {
      // B2B: validate org membership and seat limit
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { maxMembers: true },
      });
      if (!org) throw AppException.notFound('Organizacao');

      const member = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId } },
      });
      if (!member) throw AppException.forbidden('Voce nao e membro desta organizacao');

      const orgProfileCount = await this.prisma.profile.count({ where: { orgId } });
      if (orgProfileCount >= org.maxMembers) {
        throw AppException.badRequest(`Limite de ${org.maxMembers} ${org.maxMembers === 1 ? 'assento' : 'assentos'} na organizacao atingido`);
      }
    } else {
      // B2C: validate personal card limit
      const personalCount = await this.prisma.profile.count({
        where: { userId, orgId: null },
      });
      if (personalCount >= limits.maxCards) {
        throw AppException.badRequest(`Maximo de ${limits.maxCards} ${limits.maxCards === 1 ? 'cartao pessoal' : 'cartoes pessoais'} no plano ${user?.plan || 'FREE'}`);
      }
    }

    const slug = `card-${Date.now().toString(36)}`;
    return this.prisma.profile.create({
      data: {
        userId,
        displayName: 'Novo Cartao',
        label,
        slug,
        isPrimary: false,
        ...(orgId ? { orgId } : {}),
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

  async getBySlug(slug: string, viewerUserId?: string) {
    const cached = this.slugCache.get(slug);
    if (cached) return cached;

    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: {
        socialLinks: { orderBy: { order: 'asc' }, select: { id: true, platform: true, label: true, url: true, order: true, startsAt: true, endsAt: true, linkType: true, metadata: true } },
        testimonials: { where: { isApproved: true }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, authorName: true, authorRole: true, text: true, createdAt: true } },
        galleryImages: { orderBy: { order: 'asc' }, select: { id: true, imageUrl: true, imageData: true, caption: true, order: true } },
        services: { orderBy: { order: 'asc' }, select: { id: true, title: true, description: true, price: true, order: true } },
        faqItems: { orderBy: { order: 'asc' }, select: { id: true, question: true, answer: true, order: true } },
        user: { select: { name: true, email: true, plan: true } },
        organization: { select: { id: true, name: true, logoUrl: true, primaryColor: true, secondaryColor: true, fontFamily: true, brandingActive: true, cardTheme: true, linkStyle: true, linkAnimation: true, backgroundType: true, backgroundGradient: true } },
      },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    // View counting is handled by POST /analytics/view (not here)
    // to avoid race conditions with auth initialization on public pages

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
      orgCardTheme: profile.organization.cardTheme,
      orgLinkStyle: profile.organization.linkStyle,
      orgLinkAnimation: profile.organization.linkAnimation,
      orgBackgroundType: profile.organization.backgroundType,
      orgBackgroundGradient: profile.organization.backgroundGradient,
    } : null;

    const result = {
      ...rest,
      resumeUrl: this.resolveApiUrl(this.migrateUrl(rest.resumeUrl)),
      socialLinks: activeLinks,
      isVerified: subscription.active,
      plan: profile.user?.plan || 'FREE',
      orgBranding,
    };

    this.slugCache.set(slug, result);
    return result;
  }

  async update(userId: string, data: UpdateProfileDto, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId }, include: { organization: { select: { brandingActive: true } } } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true }, include: { organization: { select: { brandingActive: true } } } });
    if (!profile) throw AppException.notFound('Perfil');

    // Enforce plan limits
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
    const limits = getPlanLimits(user?.plan || 'FREE');

    // Validate maxLinks
    if (data.socialLinks && data.socialLinks.length > limits.maxLinks) {
      throw AppException.badRequest(`Maximo de ${limits.maxLinks} links no plano ${user?.plan || 'FREE'}`);
    }

    // Validate theme for free tier
    if (data.cardTheme && limits.maxThemes !== 'all') {
      if (!FREE_THEMES.includes(data.cardTheme)) {
        throw AppException.badRequest(`Tema "${data.cardTheme}" nao disponivel no plano gratuito`);
      }
    }

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

    const result = await this.prisma.$transaction(async (tx) => {
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

    // Invalidate public page cache after update
    this.slugCache.invalidate(profile.slug);

    return result;
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
