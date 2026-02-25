import { Controller, Post, Delete, Get, Put, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { InAppNotificationsService } from './in-app-notifications.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly inAppService: InAppNotificationsService,
  ) {}

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

  // --- In-app notifications ---

  @Get()
  async getNotifications(@CurrentUser() user: JwtPayload) {
    return this.inAppService.getForUser(user.sub);
  }

  @Put('read-all')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    await this.inAppService.markAllAsRead(user.sub);
    return { ok: true };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.inAppService.markAsRead(id, user.sub);
    return { ok: true };
  }
}
