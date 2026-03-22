import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../common/prisma/prisma.service';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsService } from '../payments/payments.service';
import { AppException } from '../common/exceptions/app.exception';
import { FREE_THEMES } from '../payments/plan-limits';
import { randomUUID } from 'crypto';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { EnvConfig } from '../common/config/env.config';

/** URLs legadas do Hostinger — arquivos antigos ainda servidos de la, novos uploads vao para R2 */
const OLD_UPLOAD_HOST = 'https://azure-eagle-617866.hostingersite.com/uploads';
const HOSTINGER_UPLOADS_URL = 'https://craftcardgenz.com/uploads';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);
  private readonly backendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly slugsService: SlugsService,
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService<EnvConfig>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    this.backendUrl = this.configService.get('BACKEND_URL', { infer: true }) || '';
  }

  /** Reescreve URLs que ainda referenciam o subdominio antigo do Hostinger */
  private migrateUrl(url: string | null): string | null {
    if (!url) return url;
    if (url.startsWith(OLD_UPLOAD_HOST)) {
      return url.replace(OLD_UPLOAD_HOST, HOSTINGER_UPLOADS_URL);
    }
    return url;
  }

  /** Converte caminhos relativos da API em URLs absolutas usando BACKEND_URL */
  private resolveApiUrl(url: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return this.backendUrl + url;
  }

  /** Busca perfil do usuario por ID (ou perfil primario se profileId nao fornecido) */
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

  /** Lista todos os perfis (cartoes) do usuario */
  async getAllByUserId(userId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { id: true, displayName: true, slug: true, label: true, isPrimary: true, isPublished: true, photoUrl: true },
    });
    return profiles;
  }

  /** Cria novo cartao respeitando limites do plano (B2C) ou assentos da org (B2B) */
  async createCard(userId: string, label: string, orgId?: string) {
    const { plan: effectivePlan, planLimits: limits } = await this.paymentsService.getUserPlanInfo(userId);

    if (orgId) {
      // B2B: valida pertencimento a org e limite de assentos
      const org = await this.prisma.organization.findUnique({
        where: { id: orgId },
        select: { maxMembers: true, extraSeats: true },
      });
      if (!org) throw AppException.notFound('Organização');

      const member = await this.prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId } },
      });
      if (!member) throw AppException.forbidden('Vocenão e membro desta organização');

      const totalSeats = org.maxMembers + org.extraSeats;
      const orgProfileCount = await this.prisma.profile.count({ where: { orgId } });
      if (orgProfileCount >= totalSeats) {
        throw AppException.badRequest(`Limite de ${totalSeats} ${totalSeats === 1 ? 'assento' : 'assentos'} na organização atingido`);
      }
    } else {
      // B2C: valida limite de cartoes pessoais
      const personalCount = await this.prisma.profile.count({
        where: { userId, orgId: null },
      });
      if (personalCount >= limits.maxCards) {
        throw AppException.badRequest(`Máximo de ${limits.maxCards} ${limits.maxCards === 1 ? 'cartão pessoal' : 'cartões pessoais'} no plano ${effectivePlan}`);
      }
    }

    const slug = `card-${Date.now().toString(36)}`;
    return this.prisma.profile.create({
      data: {
        userId,
        displayName: 'Novo Cartão',
        label,
        slug,
        isPrimary: false,
        ...(orgId ? { orgId } : {}),
      },
      select: { id: true, displayName: true, slug: true, label: true, isPrimary: true },
    });
  }

  /** Exclui cartao (nao permite excluir o primario) */
  async deleteCard(userId: string, profileId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) throw AppException.notFound('Perfil');
    if (profile.isPrimary) {
      throw AppException.badRequest('Não é possível excluir o cartão principal');
    }
    await this.prisma.profile.delete({ where: { id: profileId } });
    return { deleted: true };
  }

  /** Define um cartao como primario (desmarca todos os outros via transacao) */
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

  /** Busca perfil publico pelo slug (com cache de 10s para absorver picos de acesso) */
  async getBySlug(slug: string, viewerUserId?: string) {
    const cacheKey = `profile:${slug}`;
    const cached = await this.cache.get(cacheKey);
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
        organization: { select: { id: true, name: true, logoUrl: true, primaryColor: true, secondaryColor: true, fontFamily: true, brandingActive: true, cardTheme: true, linkStyle: true, linkAnimation: true, linkLayout: true, iconStyle: true, backgroundType: true, backgroundGradient: true } },
      },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    // Contagem de views e feita via POST /analytics/view (nao aqui)
    // para evitar race conditions com inicializacao de auth em paginas publicas

    // Filtra links por agendamento (exibe apenas os ativos na pagina publica)
    const now = new Date();
    const activeLinks = profile.socialLinks.filter((link) => {
      if (link.startsAt && link.startsAt > now) return false;
      if (link.endsAt && link.endsAt < now) return false;
      return true;
    });

    // Verifica se o usuario tem plano pago (selo verificado)
    const subscription = await this.paymentsService.getActiveSubscription(profile.userId);

    const { photoData: _, coverPhotoData: _c, resumeData: _r, ...rest } = profile;

    // Aplica sobrescrita de branding da organizacao se ativo
    const orgBranding = profile.organization?.brandingActive ? {
      orgName: profile.organization.name,
      orgLogoUrl: profile.organization.logoUrl,
      orgPrimaryColor: profile.organization.primaryColor,
      orgSecondaryColor: profile.organization.secondaryColor,
      orgFontFamily: profile.organization.fontFamily,
      orgCardTheme: profile.organization.cardTheme,
      orgLinkStyle: profile.organization.linkStyle,
      orgLinkAnimation: profile.organization.linkAnimation,
      orgLinkLayout: profile.organization.linkLayout,
      orgIconStyle: profile.organization.iconStyle,
      orgBackgroundType: profile.organization.backgroundType,
      orgBackgroundGradient: profile.organization.backgroundGradient,
    } : null;

    // Busca conexoes se habilitado no perfil
    let connections: Array<{ id: string; displayName: string; photoUrl: string | null; slug: string; tagline: string | null }> = [];
    if (profile.connectionsEnabled) {
      const rawConnections = await this.prisma.connection.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: profile.id },
            { addresseeId: profile.id },
          ],
        },
        include: {
          requester: { select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true, isPublished: true } },
          addressee: { select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true, isPublished: true } },
        },
        orderBy: { acceptedAt: 'desc' },
        take: 20,
      });
      connections = rawConnections
        .map((c) => {
          const other = c.requesterId === profile.id ? c.addressee : c.requester;
          if (!other.isPublished) return null;
          return { id: other.id, displayName: other.displayName, photoUrl: other.photoUrl, slug: other.slug, tagline: other.tagline };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
    }

    const result = {
      ...rest,
      resumeUrl: profile.resumeEnabled ? this.resolveApiUrl(this.migrateUrl(rest.resumeUrl)) : null,
      socialLinks: activeLinks,
      testimonials: profile.testimonialsEnabled ? rest.testimonials : [],
      galleryImages: profile.galleryEnabled ? rest.galleryImages : [],
      services: profile.servicesEnabled ? rest.services : [],
      faqItems: profile.faqEnabled ? rest.faqItems : [],
      contactFormEnabled: profile.contactFormEnabled,
      connectionsEnabled: profile.connectionsEnabled,
      connections,
      isVerified: subscription.active,
      plan: profile.user?.plan || 'FREE',
      orgBranding,
    };

    await this.cache.set(cacheKey, result, 10000); // TTL 10s — curto para absorver picos, atualiza rapido apos edicoes
    return result;
  }

  /** Atualiza perfil com validacao de limites do plano, slug e branding da org */
  async update(userId: string, data: UpdateProfileDto, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId }, include: { organization: { select: { brandingActive: true } } } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true }, include: { organization: { select: { brandingActive: true } } } });
    if (!profile) throw AppException.notFound('Perfil');

    // Aplica limites do plano (usa PaymentsService para respeitar whitelist + heranca de org)
    const { plan: effectivePlan, planLimits: limits } = await this.paymentsService.getUserPlanInfo(userId);

    // Valida limite maximo de links
    if (data.socialLinks && data.socialLinks.length > limits.maxLinks) {
      throw AppException.badRequest(`Máximo de ${limits.maxLinks} links no plano ${effectivePlan}`);
    }

    // Valida tema para plano gratuito
    if (data.cardTheme && limits.maxThemes !== 'all') {
      if (!FREE_THEMES.includes(data.cardTheme)) {
        throw AppException.badRequest(`Tema "${data.cardTheme}"não disponivel no plano gratuito`);
      }
    }

    // Se branding da org esta ativo, remove campos de customizacao visual (Brand Lock)
    if (profile.organization?.brandingActive) {
      delete data.buttonColor;
      delete data.cardTheme;
      delete data.fontFamily;
      delete data.fontSizeScale;
      delete data.backgroundType;
      delete data.backgroundGradient;
      delete data.backgroundImageUrl;
      delete data.backgroundOverlay;
      delete data.backgroundPattern;
      delete data.linkStyle;
      delete data.linkAnimation;
      delete data.linkLayout;
      delete data.iconStyle;
    }

    // Valida unicidade do slug
    if (data.slug && data.slug !== profile.slug) {
      const available = await this.slugsService.isAvailable(data.slug, userId);
      if (!available) {
        throw AppException.conflict('Slug já está em uso');
      }
    }

    const { socialLinks, ...profileData } = data;

    const result = await this.prisma.$transaction(async (tx) => {
      // Atualiza campos do perfil
      const updated = await tx.profile.update({
        where: { id: profile.id },
        data: profileData,
      });

      // Substitui links sociais se fornecidos (delete + recreate)
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

    // Invalida cache da pagina publica apos atualizacao
    await this.cache.del(`profile:${profile.slug}`);
    // Tambem invalida entradas de cache HTTP (chaves do CacheInterceptor)
    await this.cache.del(`/api/profile/${profile.slug}`);
    await this.cache.del(`/api/profile/${profile.slug}/form-fields`);

    return result;
  }

  /** Configura dominio customizado para o perfil */
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

  /** Verifica dominio customizado via registro DNS TXT */
  async verifyCustomDomain(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) throw AppException.notFound('Perfil');

    const customDomain = await this.prisma.customDomain.findUnique({
      where: { profileId: profile.id },
    });
    if (!customDomain) throw AppException.notFound('Domínio');

    // Tenta verificacao via registro DNS TXT
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

  /** Retorna dados do dominio customizado do perfil */
  async getCustomDomain(userId: string, profileId?: string) {
    const profile = profileId
      ? await this.prisma.profile.findFirst({ where: { id: profileId, userId } })
      : await this.prisma.profile.findFirst({ where: { userId, isPrimary: true } });
    if (!profile) return null;

    return this.prisma.customDomain.findUnique({
      where: { profileId: profile.id },
    });
  }

  /** Remove dominio customizado do perfil */
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

  /**
   * Upsert de perfil hackathon — cria um perfil SEPARADO (nunca altera o cartao primario/pago).
   * O perfil hackathon tem label "Hackathon Senac" e isPrimary: false.
   */
  async upsertHackathonMeta(
    userId: string,
    hackathonData: { hackathonArea?: string; hackathonSkills?: string[] },
    defaults?: { displayName?: string; bio?: string; buttonColor?: string },
  ) {
    const metadata = JSON.stringify(hackathonData);

    // Busca ou cria perfil dedicado para hackathon (NUNCA o primario)
    let hackProfile = await this.prisma.profile.findFirst({
      where: { userId, label: 'Hackathon Senac' },
      include: { socialLinks: { where: { linkType: 'hackathon_meta' } } },
    });

    if (!hackProfile) {
      // Cria novo perfil separado para hackathon
      const slug = `hack-${Date.now().toString(36)}`;
      hackProfile = await this.prisma.profile.create({
        data: {
          userId,
          displayName: defaults?.displayName || 'Participante',
          label: 'Hackathon Senac',
          slug,
          isPrimary: false,
          isPublished: true,
          bio: defaults?.bio || null,
          buttonColor: defaults?.buttonColor || '#004B87',
        },
        include: { socialLinks: { where: { linkType: 'hackathon_meta' } } },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Remove links hackathon_meta antigos
      await tx.socialLink.deleteMany({
        where: { profileId: hackProfile!.id, linkType: 'hackathon_meta' },
      });

      // 2. Cria o link hackathon_meta no perfil de hackathon
      await tx.socialLink.create({
        data: {
          profileId: hackProfile!.id,
          platform: 'custom',
          label: 'hackathon_meta',
          url: '#',
          order: 999,
          linkType: 'hackathon_meta',
          metadata,
        },
      });

      // 3. Atualiza campos do perfil hackathon (seguro — NAO e o cartao primario)
      await tx.profile.update({
        where: { id: hackProfile!.id },
        data: {
          isPublished: true,
          ...(defaults?.displayName && { displayName: defaults.displayName }),
          ...(defaults?.bio && { bio: defaults.bio }),
          ...(defaults?.buttonColor && { buttonColor: defaults.buttonColor }),
        },
      });
    });

    // Invalida cache do perfil hackathon
    await this.cache.del(`profile:${hackProfile.slug}`);
    await this.cache.del(`/api/profile/${hackProfile.slug}`);

    return { success: true, profileId: hackProfile.id, slug: hackProfile.slug };
  }

  /** Registra visualizacao diaria do perfil (upsert por profileId + data) */
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
