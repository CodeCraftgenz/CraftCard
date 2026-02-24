import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';

const FREE_ACCESS_EMAILS = [
  'ricardocoradini97@gmail.com',
  'paulommc@gmail.com',
  'mfacine@gmail.com',
  'gabriel.gondrone@gmail.com',
];

@Injectable()
export class PaymentsCron {
  private readonly logger = new Logger(PaymentsCron.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredSubscriptions() {
    this.logger.log('Checking for expired subscriptions...');

    const paidUsers = await this.prisma.user.findMany({
      where: {
        plan: { not: 'FREE' },
        email: { notIn: FREE_ACCESS_EMAILS },
      },
      select: { id: true, email: true, plan: true },
    });

    let expiredCount = 0;

    for (const user of paidUsers) {
      const activePayment = await this.prisma.payment.findFirst({
        where: {
          userId: user.id,
          status: 'approved',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!activePayment) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { plan: 'FREE' },
        });
        this.logger.log(`Expired: ${user.email} (${user.plan} -> FREE)`);
        expiredCount++;
      }
    }

    this.logger.log(`Expiration check complete: ${expiredCount} users downgraded, ${paidUsers.length} checked`);
  }
}
