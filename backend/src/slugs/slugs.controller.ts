import { Controller, Get, Param } from '@nestjs/common';
import { SlugsService } from './slugs.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('slug')
export class SlugsController {
  constructor(private readonly slugsService: SlugsService) {}

  @Get('check/:slug')
  async check(@Param('slug') slug: string, @CurrentUser() user: JwtPayload) {
    const available = await this.slugsService.isAvailable(slug, user.sub);
    return { slug, available };
  }

  @Get('suggestions/:base')
  async suggestions(@Param('base') base: string, @CurrentUser() user: JwtPayload) {
    const suggestions = await this.slugsService.getSuggestions(base, user.sub);
    return { suggestions };
  }
}
