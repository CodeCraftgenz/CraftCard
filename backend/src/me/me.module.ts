import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [MeController],
})
export class MeModule {}
