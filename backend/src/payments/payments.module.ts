import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaidUserGuard } from './guards/paid-user.guard';
import { PlanGuard } from './guards/plan.guard';
import { PaymentsCron } from './payments.cron';
import { PAYMENT_GATEWAY } from './gateway/payment-gateway.interface';
import { MercadoPagoProvider } from './gateway/mercadopago.provider';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaidUserGuard,
    PlanGuard,
    PaymentsCron,
    { provide: PAYMENT_GATEWAY, useClass: MercadoPagoProvider },
  ],
  exports: [PaymentsService, PaidUserGuard, PlanGuard, PAYMENT_GATEWAY],
})
export class PaymentsModule {}
