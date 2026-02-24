import { Controller, Get, Post, Put, Delete, Body, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { RequiresOrgRole } from '../common/decorators/org-role.decorator';
import { OrgRoleGuard } from '../common/guards/org-role.guard';
import { createOrgSchema } from './dto/create-org.dto';
import { updateOrgSchema } from './dto/update-org.dto';
import { inviteSchema } from './dto/invite.dto';
import { updateMemberRoleSchema } from './dto/update-member-role.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createOrgSchema.parse(body);
    return this.orgService.create(user.sub, data);
  }

  @Get('me')
  async getMyOrgs(@CurrentUser() user: JwtPayload) {
    return this.orgService.getMyOrganizations(user.sub);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('MEMBER')
  @Get(':orgId')
  async getOrg(@Param('orgId') orgId: string) {
    return this.orgService.getById(orgId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Put(':orgId')
  async updateOrg(
    @Param('orgId') orgId: string,
    @Body() body: unknown,
  ) {
    const data = updateOrgSchema.parse(body);
    return this.orgService.update(orgId, data);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('OWNER')
  @Delete(':orgId')
  async deleteOrg(@Param('orgId') orgId: string) {
    return this.orgService.delete(orgId);
  }

  // --- Members ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('MEMBER')
  @Get(':orgId/members')
  async getMembers(@Param('orgId') orgId: string) {
    return this.orgService.getMembers(orgId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Put(':orgId/members/:memberId')
  async updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() body: unknown,
  ) {
    const data = updateMemberRoleSchema.parse(body);
    return this.orgService.updateMemberRole(orgId, memberId, user.sub, data.role);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Delete(':orgId/members/:memberId')
  async removeMember(@Param('orgId') orgId: string, @Param('memberId') memberId: string) {
    return this.orgService.removeMember(orgId, memberId);
  }

  // --- Invites ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Post(':orgId/invite')
  async createInvite(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() body: unknown,
  ) {
    const data = inviteSchema.parse(body);
    return this.orgService.createInvite(orgId, user.sub, data);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Get(':orgId/invites')
  async getPendingInvites(@Param('orgId') orgId: string) {
    return this.orgService.getPendingInvites(orgId);
  }

  @Post('join/:token')
  async acceptInvite(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
    return this.orgService.acceptInvite(token, user.sub);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Delete(':orgId/invites/:inviteId')
  async revokeInvite(@Param('orgId') orgId: string, @Param('inviteId') inviteId: string) {
    return this.orgService.revokeInvite(orgId, inviteId);
  }

  // --- Analytics & Leads ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Get(':orgId/analytics')
  async getAnalytics(@Param('orgId') orgId: string) {
    return this.orgService.getConsolidatedAnalytics(orgId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Get(':orgId/leads')
  async getLeads(@Param('orgId') orgId: string) {
    return this.orgService.getConsolidatedLeads(orgId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Get(':orgId/leads/export')
  async exportLeads(@Param('orgId') orgId: string, @Res() res: Response) {
    const csv = await this.orgService.exportLeadsCsv(orgId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  }

  // --- Profile linking ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Post(':orgId/profiles/:profileId')
  async linkProfile(@Param('orgId') orgId: string, @Param('profileId') profileId: string) {
    return this.orgService.linkProfile(orgId, profileId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Delete(':orgId/profiles/:profileId')
  async unlinkProfile(@Param('orgId') orgId: string, @Param('profileId') profileId: string) {
    return this.orgService.unlinkProfile(orgId, profileId);
  }
}
