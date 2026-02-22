import { Controller, Get, Delete } from '@nestjs/common';
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

    if (!userData) throw AppException.notFound('Usuario');

    const subscription = await this.paymentsService.getActiveSubscription(user.sub);
    const primaryProfile = userData.profiles.find((p) => p.isPrimary) || userData.profiles[0] || null;

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
      },
      profile: primaryProfile,
      cards: userData.profiles.map((p) => ({ id: p.id, label: p.label, slug: p.slug, isPrimary: p.isPrimary, displayName: p.displayName })),
      hasPaid: subscription.active,
      paidUntil: subscription.expiresAt?.toISOString() ?? null,
    };
  }

  @Delete()
  async deleteAccount(@CurrentUser() user: JwtPayload) {
    await this.prisma.user.delete({ where: { id: user.sub } });
    return { message: 'Conta excluida com sucesso' };
  }
}
