import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaidUserGuard } from './guards/paid-user.guard';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PaidUserGuard],
  exports: [PaymentsService, PaidUserGuard],
})
export class PaymentsModule {}
