import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AchievementsService } from './achievements.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AchievementsService],
  exports: [AnalyticsService, AchievementsService],
})
export class AnalyticsModule {}
