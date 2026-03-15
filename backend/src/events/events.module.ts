import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [PaymentsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
