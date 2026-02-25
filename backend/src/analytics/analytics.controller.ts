import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { AnalyticsService } from './analytics.service';
import { AchievementsService } from './achievements.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaidUserGuard } from '../payments/guards/paid-user.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly achievementsService: AchievementsService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(PaidUserGuard)
  @Get('me')
  async getMyAnalytics(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAnalytics(user.sub);
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('click')
  async trackClick(@Body() body: { socialLinkId: string }) {
    if (body.socialLinkId) {
      this.analyticsService.trackClick(body.socialLinkId).catch(() => {});
    }
    return { tracked: true };
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('view')
  async trackView(@Body() body: { profileId: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }, @Req() req: Request) {
    if (body.profileId) {
      // Skip if viewer is the profile owner
      try {
        const token =
          (req as any).cookies?.accessToken ||
          req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const payload = this.jwtService.verify<{ sub: string }>(token);
          const profile = await this.analyticsService.getProfileOwner(body.profileId);
          if (profile && profile.userId === payload.sub) {
            return { tracked: false, reason: 'owner' };
          }
        }
      } catch { /* ignore — track the view if token is invalid */ }

      this.analyticsService.trackViewEvent(body.profileId, {
        userAgent: req.headers['user-agent'],
        referrer: req.headers['referer'],
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
      }).catch(() => {});
    }
    return { tracked: true };
  }

  @Get('achievements')
  async getAchievements(@CurrentUser() user: JwtPayload) {
    return this.achievementsService.getAchievements(user.sub);
  }

  @Post('achievements/check')
  async checkAchievements(@CurrentUser() user: JwtPayload) {
    const newAchievements = await this.achievementsService.checkAndAward(user.sub);
    return { newAchievements };
  }
}
