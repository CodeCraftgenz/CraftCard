import { Controller, Get, Delete, Body } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { AppException } from '../common/exceptions/app.exception';

@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  async getMe(@CurrentUser() user: JwtPayload) {
    const userData = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        profiles: {
          include: { socialLinks: { orderBy: { order: 'asc' } } },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!userData) throw AppException.notFound('Usuário');

    const planInfo = await this.paymentsService.getUserPlanInfo(user.sub);
    const primaryProfile = userData.profiles.find((p) => p.isPrimary) || userData.profiles[0] || null;

    // Detect hackathon participation from hackathon_meta social link
    const isHackathonParticipant = userData.profiles.some((p) =>
      p.socialLinks.some((l) => l.linkType === 'hackathon_meta'),
    );

    // Get user's org memberships
    const orgMemberships = await this.prisma.organizationMember.findMany({
      where: { userId: user.sub },
      include: { org: { select: { id: true, name: true, slug: true, brandingActive: true, coverUrl: true, backgroundImageUrl: true } } },
    });

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
        role: userData.role,
      },
      profile: primaryProfile,
      cards: userData.profiles.map((p) => ({ id: p.id, label: p.label, slug: p.slug, isPrimary: p.isPrimary, displayName: p.displayName })),
      twoFactorEnabled: userData.totpEnabled,
      hasPaid: planInfo.plan !== 'FREE',
      paidUntil: planInfo.expiresAt?.toISOString() ?? null,
      plan: planInfo.plan,
      planLimits: planInfo.planLimits,
      organizations: orgMemberships.map((m) => ({ ...m.org, role: m.role })),
      isHackathonParticipant,
    };
  }

  @Delete()
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body('confirm') confirm: string,
  ) {
    // Require explicit confirmation string to prevent accidental or CSRF-triggered deletion
    if (confirm !== 'DELETAR MINHA CONTA') {
      throw AppException.badRequest('Confirmacao invalida. Envie confirm: "DELETAR MINHA CONTA"');
    }
    await this.prisma.user.delete({ where: { id: user.sub } });
    return { message: 'Conta excluida com sucesso' };
  }
}
