import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.webhooksService.list(user.sub);
  }

  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { url: string; events: string[] },
  ) {
    return this.webhooksService.create(user.sub, body as any);
  }

  @Put(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { url?: string; events?: string[]; isActive?: boolean },
  ) {
    return this.webhooksService.update(user.sub, id, body as any);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.webhooksService.remove(user.sub, id);
  }

  @Post(':id/test')
  async test(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.webhooksService.test(user.sub, id);
  }
}
