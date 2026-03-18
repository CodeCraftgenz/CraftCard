import { Controller, Get, Delete, Body } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { AppException } from '../common/exceptions/app.exception';

/**
 * Controller de sessão do usuário autenticado.
 *
 * GET /api/me — retorna todos os dados necessários para o frontend hidratar
 * a interface após login (perfil, plano, limites, orgs, etc.).
 * O frontend usa `hasPaid` para liberar/bloquear features pagas.
 *
 * DELETE /api/me — exclusão de conta com confirmação explícita (LGPD).
 */
@Controller('me')
export class MeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Retorna os dados completos do usuário autenticado.
   * Inclui: dados do user, perfil primário, lista de cartões,
   * status do plano, limites, organizações e flag de hackathon.
   *
   * Esse é o principal endpoint consumido pelo frontend após login
   * e em cada refresh de sessão.
   */
  @Get()
  async getMe(@CurrentUser() user: JwtPayload) {
    // Busca o usuário com todos os perfis e links sociais ordenados
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

    // Consulta plano ativo (considera whitelist admin, herança B2B e expiração)
    const planInfo = await this.paymentsService.getUserPlanInfo(user.sub);

    // Perfil primário é exibido por padrão no editor/visualização
    const primaryProfile = userData.profiles.find((p) => p.isPrimary) || userData.profiles[0] || null;

    // Detecta participação no hackathon pela presença de link tipo 'hackathon_meta'
    // Usado no frontend para exibir badges/funcionalidades especiais
    const isHackathonParticipant = userData.profiles.some((p) =>
      p.socialLinks.some((l) => l.linkType === 'hackathon_meta'),
    );

    // Busca organizações do usuário para exibir no menu lateral
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
      hasPaid: planInfo.plan !== 'FREE', // Frontend usa isso para liberar features pagas
      paidUntil: planInfo.expiresAt?.toISOString() ?? null,
      plan: planInfo.plan,
      planLimits: planInfo.planLimits,
      organizations: orgMemberships.map((m) => ({ ...m.org, role: m.role })),
      isHackathonParticipant,
    };
  }

  /**
   * Exclusão de conta do usuário (LGPD / direito ao esquecimento).
   * Exige envio do texto exato "DELETAR MINHA CONTA" no body para
   * prevenir exclusão acidental ou via CSRF.
   * O cascade do Prisma remove perfis, links e dados associados.
   */
  @Delete()
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body('confirm') confirm: string,
  ) {
    if (confirm !== 'DELETAR MINHA CONTA') {
      throw AppException.badRequest('Confirmacao invalida. Envie confirm: "DELETAR MINHA CONTA"');
    }
    await this.prisma.user.delete({ where: { id: user.sub } });
    return { message: 'Conta excluida com sucesso' };
  }
}
