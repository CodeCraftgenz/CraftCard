import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, WebhooksModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
