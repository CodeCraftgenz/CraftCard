import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MulterModule.register({
      storage: undefined, // memory storage (buffer)
    }),
    PaymentsModule,
  ],
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
