import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Res, UseGuards,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import * as sharp from 'sharp';
import type { Response } from 'express';
import { OrganizationsService } from './organizations.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { RequiresOrgRole } from '../common/decorators/org-role.decorator';
import { Public } from '../common/decorators/public.decorator';
import { OrgRoleGuard } from '../common/guards/org-role.guard';
import { createOrgSchema } from './dto/create-org.dto';
import { updateOrgSchema } from './dto/update-org.dto';
import { inviteSchema } from './dto/invite.dto';
import { updateMemberRoleSchema } from './dto/update-member-role.dto';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly orgService: OrganizationsService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Public()
  @Get('invite/:token')
  async previewInvite(@Param('token') token: string) {
    return this.orgService.previewInvite(token);
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

  // --- Bulk apply branding ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Post(':orgId/bulk-apply')
  async bulkApplyBranding(@Param('orgId') orgId: string) {
    return this.orgService.bulkApplyBranding(orgId);
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
  async getLeads(
    @Param('orgId') orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.orgService.getConsolidatedLeads(orgId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search: search || undefined,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Put(':orgId/leads/mark-all-read')
  async markAllLeadsRead(@Param('orgId') orgId: string) {
    return this.orgService.markAllLeadsRead(orgId);
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Put(':orgId/leads/:leadId/read')
  async markLeadRead(
    @Param('orgId') orgId: string,
    @Param('leadId') leadId: string,
    @Body() body: { isRead: boolean },
  ) {
    return this.orgService.markLeadRead(orgId, leadId, body.isRead);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('ADMIN')
  @Get(':orgId/leads/export')
  async exportLeads(@Param('orgId') orgId: string, @Res() res: Response) {
    const csv = await this.orgService.exportLeadsCsv(orgId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  }

  // --- Org image uploads (OWNER only) ---

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('OWNER')
  @Post(':orgId/cover-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @Param('orgId') orgId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, coverUrl: true },
    });
    if (!org) return { url: null };

    const processed = await sharp(file.buffer)
      .resize(1200, 400, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    if (org.coverUrl?.startsWith('http')) {
      this.storageService.deleteFile(org.coverUrl).catch(() => {});
    }

    const coverUrl = await this.storageService.uploadFile(processed, 'org-covers', orgId, 'webp');

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { coverUrl },
    });

    return { url: coverUrl };
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('OWNER')
  @Delete(':orgId/cover')
  async deleteCover(@Param('orgId') orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, coverUrl: true },
    });
    if (org?.coverUrl?.startsWith('http')) {
      this.storageService.deleteFile(org.coverUrl).catch(() => {});
    }
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { coverUrl: null },
    });
    return { deleted: true };
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('OWNER')
  @Post(':orgId/background-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBackground(
    @Param('orgId') orgId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 8 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, backgroundImageUrl: true },
    });
    if (!org) return { url: null };

    const processed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    if (org.backgroundImageUrl?.startsWith('http')) {
      this.storageService.deleteFile(org.backgroundImageUrl).catch(() => {});
    }

    const backgroundImageUrl = await this.storageService.uploadFile(processed, 'org-backgrounds', orgId, 'webp');

    await this.prisma.organization.update({
      where: { id: orgId },
      data: { backgroundImageUrl, backgroundType: 'image' },
    });

    return { url: backgroundImageUrl };
  }

  @UseGuards(OrgRoleGuard)
  @RequiresOrgRole('OWNER')
  @Delete(':orgId/background')
  async deleteBackground(@Param('orgId') orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, backgroundImageUrl: true },
    });
    if (org?.backgroundImageUrl?.startsWith('http')) {
      this.storageService.deleteFile(org.backgroundImageUrl).catch(() => {});
    }
    await this.prisma.organization.update({
      where: { id: orgId },
      data: { backgroundImageUrl: null, backgroundType: 'theme' },
    });
    return { deleted: true };
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
