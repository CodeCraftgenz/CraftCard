import { Module } from '@nestjs/common';
import { OrgRoleGuard } from './org-role.guard';

@Module({
  providers: [OrgRoleGuard],
  exports: [OrgRoleGuard],
})
export class GuardsModule {}
