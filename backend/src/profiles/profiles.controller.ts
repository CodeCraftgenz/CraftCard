import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ProfilesService } from './profiles.service';
import { SectionsService } from './sections.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { updateProfileSchema } from './dto/update-profile.dto';
import { PlanGuard, RequiresFeature } from '../payments/guards/plan.guard';

@Controller()
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly sectionsService: SectionsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me/profile')
  async getMyProfile(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.profilesService.getByUserId(user.sub, cardId);
  }

  @Put('me/profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: unknown, @Query('cardId') cardId?: string) {
    const data = updateProfileSchema.parse(body);
    return this.profilesService.update(user.sub, data, cardId);
  }

  @Get('me/cards')
  async getMyCards(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getAllByUserId(user.sub);
  }

  @Post('me/cards')
  async createCard(@CurrentUser() user: JwtPayload, @Body('label') label: string, @Body('orgId') orgId?: string) {
    return this.profilesService.createCard(user.sub, label || 'Novo Cartao', orgId);
  }

  @Delete('me/cards/:id')
  async deleteCard(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profilesService.deleteCard(user.sub, id);
  }

  @Put('me/cards/:id/primary')
  async setPrimary(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.profilesService.setPrimary(user.sub, id);
  }

  @Public()
  @Get('profile/:slug')
  async getPublicProfile(@Param('slug') slug: string, @Req() req: Request) {
    let viewerUserId: string | undefined;
    try {
      const token =
        (req as any).cookies?.accessToken ||
        req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = this.jwtService.verify<{ sub: string }>(token);
        viewerUserId = payload.sub;
      }
    } catch { /* ignore invalid/expired tokens */ }
    return this.profilesService.getBySlug(slug, viewerUserId);
  }

  // --- Services CRUD (PRO+) ---
  @UseGuards(PlanGuard)
  @RequiresFeature('services')
  @Get('me/services')
  async getServices(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.sectionsService.getServices(user.sub, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('services')
  @Post('me/services')
  async createService(@CurrentUser() user: JwtPayload, @Body() body: { title: string; description?: string; price?: string }, @Query('cardId') cardId?: string) {
    return this.sectionsService.createService(user.sub, body, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('services')
  @Put('me/services/:id')
  async updateService(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { title?: string; description?: string; price?: string }) {
    return this.sectionsService.updateService(user.sub, id, body);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('services')
  @Delete('me/services/:id')
  async deleteService(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sectionsService.deleteService(user.sub, id);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('services')
  @Put('me/services-order')
  async reorderServices(@CurrentUser() user: JwtPayload, @Body() body: { ids: string[] }) {
    return this.sectionsService.reorderServices(user.sub, body.ids);
  }

  // --- FAQ CRUD (PRO+) ---
  @UseGuards(PlanGuard)
  @RequiresFeature('faq')
  @Get('me/faq')
  async getFaq(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.sectionsService.getFaqItems(user.sub, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('faq')
  @Post('me/faq')
  async createFaq(@CurrentUser() user: JwtPayload, @Body() body: { question: string; answer: string }, @Query('cardId') cardId?: string) {
    return this.sectionsService.createFaqItem(user.sub, body, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('faq')
  @Put('me/faq/:id')
  async updateFaq(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { question?: string; answer?: string }) {
    return this.sectionsService.updateFaqItem(user.sub, id, body);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('faq')
  @Delete('me/faq/:id')
  async deleteFaq(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sectionsService.deleteFaqItem(user.sub, id);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('faq')
  @Put('me/faq-order')
  async reorderFaq(@CurrentUser() user: JwtPayload, @Body() body: { ids: string[] }) {
    return this.sectionsService.reorderFaqItems(user.sub, body.ids);
  }

  // --- Custom Domain (ENTERPRISE only) ---
  @UseGuards(PlanGuard)
  @RequiresFeature('customDomain')
  @Get('me/domain')
  async getCustomDomain(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.profilesService.getCustomDomain(user.sub, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('customDomain')
  @Post('me/domain')
  async setCustomDomain(@CurrentUser() user: JwtPayload, @Body() body: { domain: string }, @Query('cardId') cardId?: string) {
    return this.profilesService.setCustomDomain(user.sub, body.domain, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('customDomain')
  @Post('me/domain/verify')
  async verifyCustomDomain(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.profilesService.verifyCustomDomain(user.sub, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('customDomain')
  @Delete('me/domain')
  async removeCustomDomain(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.profilesService.removeCustomDomain(user.sub, cardId);
  }

  // --- Custom Form Fields (contacts feature — PRO+) ---
  @UseGuards(PlanGuard)
  @RequiresFeature('contacts')
  @Get('me/form-fields')
  async getFormFields(@CurrentUser() user: JwtPayload, @Query('cardId') cardId?: string) {
    return this.sectionsService.getFormFields(user.sub, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('contacts')
  @Post('me/form-fields')
  async createFormField(
    @CurrentUser() user: JwtPayload,
    @Body() body: { label: string; type: string; options?: string; required?: boolean },
    @Query('cardId') cardId?: string,
  ) {
    return this.sectionsService.createFormField(user.sub, body, cardId);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('contacts')
  @Put('me/form-fields/:id')
  async updateFormField(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { label?: string; type?: string; options?: string; required?: boolean },
  ) {
    return this.sectionsService.updateFormField(user.sub, id, body);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('contacts')
  @Delete('me/form-fields/:id')
  async deleteFormField(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.sectionsService.deleteFormField(user.sub, id);
  }

  @UseGuards(PlanGuard)
  @RequiresFeature('contacts')
  @Put('me/form-fields-order')
  async reorderFormFields(@CurrentUser() user: JwtPayload, @Body() body: { ids: string[] }) {
    return this.sectionsService.reorderFormFields(user.sub, body.ids);
  }

  @Public()
  @Get('profile/:slug/form-fields')
  async getPublicFormFields(@Param('slug') slug: string) {
    return this.sectionsService.getPublicFormFields(slug);
  }
}
