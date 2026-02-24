import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { SectionsService } from './sections.service';
import { OgController } from './og.controller';
import { OgImageService } from './og-image.service';
import { SlugsController } from '../slugs/slugs.controller';
import { SlugsService } from '../slugs/slugs.service';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PaymentsModule, AuthModule],
  controllers: [ProfilesController, SlugsController, OgController],
  providers: [ProfilesService, SectionsService, SlugsService, OgImageService],
  exports: [ProfilesService, SlugsService],
})
export class ProfilesModule {}
