import { Controller, Get, Post, Put, Delete, Body, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgService: OrganizationsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: { name: string; slug: string }) {
    return this.orgService.create(user.sub, body);
  }

  @Get('me')
  async getMyOrgs(@CurrentUser() user: JwtPayload) {
    return this.orgService.getMyOrganizations(user.sub);
  }

  @Get(':orgId')
  async getOrg(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.getById(orgId, user.sub);
  }

  @Put(':orgId')
  async updateOrg(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() body: {
      name?: string;
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      brandingActive?: boolean;
    },
  ) {
    return this.orgService.update(orgId, user.sub, body);
  }

  @Delete(':orgId')
  async deleteOrg(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.delete(orgId, user.sub);
  }

  // --- Members ---

  @Get(':orgId/members')
  async getMembers(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.getMembers(orgId, user.sub);
  }

  @Put(':orgId/members/:memberId')
  async updateMemberRole(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.orgService.updateMemberRole(orgId, memberId, user.sub, body.role);
  }

  @Delete(':orgId/members/:memberId')
  async removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.orgService.removeMember(orgId, memberId, user.sub);
  }

  // --- Invites ---

  @Post(':orgId/invite')
  async createInvite(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() body: { email: string; role?: string },
  ) {
    return this.orgService.createInvite(orgId, user.sub, body);
  }

  @Get(':orgId/invites')
  async getPendingInvites(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.getPendingInvites(orgId, user.sub);
  }

  @Post('join/:token')
  async acceptInvite(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
    return this.orgService.acceptInvite(token, user.sub);
  }

  @Delete(':orgId/invites/:inviteId')
  async revokeInvite(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.orgService.revokeInvite(orgId, inviteId, user.sub);
  }

  // --- Analytics & Leads ---

  @Get(':orgId/analytics')
  async getAnalytics(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.getConsolidatedAnalytics(orgId, user.sub);
  }

  @Get(':orgId/leads')
  async getLeads(@CurrentUser() user: JwtPayload, @Param('orgId') orgId: string) {
    return this.orgService.getConsolidatedLeads(orgId, user.sub);
  }

  @Get(':orgId/leads/export')
  async exportLeads(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Res() res: Response,
  ) {
    const csv = await this.orgService.exportLeadsCsv(orgId, user.sub);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  }

  // --- Profile linking ---

  @Post(':orgId/profiles/:profileId')
  async linkProfile(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.orgService.linkProfile(orgId, user.sub, profileId);
  }

  @Delete(':orgId/profiles/:profileId')
  async unlinkProfile(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.orgService.unlinkProfile(orgId, user.sub, profileId);
  }
}
