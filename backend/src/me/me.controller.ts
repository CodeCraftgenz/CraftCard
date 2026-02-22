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
        profile: {
          include: { socialLinks: { orderBy: { order: 'asc' } } },
        },
      },
    });

    if (!userData) throw AppException.notFound('Usuario');

    const subscription = await this.paymentsService.getActiveSubscription(user.sub);

    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatarUrl,
      },
      profile: userData.profile,
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
