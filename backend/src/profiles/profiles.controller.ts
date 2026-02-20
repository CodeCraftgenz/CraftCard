import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { updateProfileSchema } from './dto/update-profile.dto';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me/profile')
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getByUserId(user.sub);
  }

  @Put('me/profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = updateProfileSchema.parse(body);
    return this.profilesService.update(user.sub, data);
  }

  @Public()
  @Get('profile/:slug')
  async getPublicProfile(@Param('slug') slug: string) {
    return this.profilesService.getBySlug(slug);
  }
}
