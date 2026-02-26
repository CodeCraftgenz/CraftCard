import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [PaymentsModule, NotificationsModule, WebhooksModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
