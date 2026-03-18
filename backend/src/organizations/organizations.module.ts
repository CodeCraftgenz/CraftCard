import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { GuardsModule } from '../common/guards/guards.module';
import { StorageModule } from '../storage/storage.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  imports: [GuardsModule, StorageModule, MulterModule.register({ storage: undefined })],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
