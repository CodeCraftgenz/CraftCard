import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AchievementsService } from './achievements.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    PaymentsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AchievementsService],
  exports: [AnalyticsService, AchievementsService],
})
export class AnalyticsModule {}
