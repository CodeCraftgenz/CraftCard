import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { OgController } from './og.controller';
import { SlugsController } from '../slugs/slugs.controller';
import { SlugsService } from '../slugs/slugs.service';

@Module({
  controllers: [ProfilesController, SlugsController, OgController],
  providers: [ProfilesService, SlugsService],
  exports: [ProfilesService, SlugsService],
})
export class ProfilesModule {}
