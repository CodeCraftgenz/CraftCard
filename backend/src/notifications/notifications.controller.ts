import { Controller, Post, Delete, Get, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /** Get public VAPID key (public, needed before auth) */
  @Public()
  @Get('vapid-key')
  getVapidKey() {
    return { publicKey: this.notificationsService.getPublicKey() };
  }

  /** Subscribe to push notifications */
  @Post('subscribe')
  async subscribe(
    @CurrentUser() user: JwtPayload,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.notificationsService.subscribe(user.sub, body);
  }

  /** Unsubscribe from push notifications */
  @Delete('subscribe')
  async unsubscribe(
    @CurrentUser() user: JwtPayload,
    @Body() body: { endpoint: string },
  ) {
    return this.notificationsService.unsubscribe(user.sub, body.endpoint);
  }
}
