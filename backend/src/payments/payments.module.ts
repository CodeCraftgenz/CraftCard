import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaidUserGuard } from './guards/paid-user.guard';
import { PlanGuard } from './guards/plan.guard';
import { PaymentsCron } from './payments.cron';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaidUserGuard, PlanGuard, PaymentsCron],
  exports: [PaymentsService, PaidUserGuard, PlanGuard],
})
export class PaymentsModule {}
