import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { updateProfileSchema } from './dto/update-profile.dto';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

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
  async createCard(@CurrentUser() user: JwtPayload, @Body('label') label: string) {
    return this.profilesService.createCard(user.sub, label || 'Novo Cartao');
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
  async getPublicProfile(@Param('slug') slug: string) {
    return this.profilesService.getBySlug(slug);
  }
}
