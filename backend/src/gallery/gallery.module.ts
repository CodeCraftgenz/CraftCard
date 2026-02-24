import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { PaymentsModule } from '../payments/payments.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PaymentsModule, StorageModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
