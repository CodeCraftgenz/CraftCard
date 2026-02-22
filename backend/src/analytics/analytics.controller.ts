import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaidUserGuard } from '../payments/guards/paid-user.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(PaidUserGuard)
  @Get('me')
  async getMyAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAnalytics(user.sub);
  }

  @Public()
  @Post('click')
  async trackClick(@Body() body: { socialLinkId: string }) {
    if (body.socialLinkId) {
      // Fire-and-forget
      this.analyticsService.trackClick(body.socialLinkId).catch(() => {});
    }
    return { tracked: true };
  }
}
