import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Upsert daily view count for a profile (fire-and-forget) */
  async trackView(profileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const existing = await this.prisma.profileView.findUnique({
        where: { profileId_date: { profileId, date: today } },
      });

      if (existing) {
        await this.prisma.profileView.update({
          where: { id: existing.id },
          data: { count: { increment: 1 } },
        });
      } else {
        await this.prisma.profileView.create({
          data: { id: randomUUID(), profileId, date: today, count: 1 },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to track view for profile ${profileId}: ${err}`);
    }
  }

  /** Upsert daily click count for a social link (fire-and-forget) */
  async trackClick(socialLinkId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Verify the link exists
      const link = await this.prisma.socialLink.findUnique({
        where: { id: socialLinkId },
      });
      if (!link) return;

      const existing = await this.prisma.linkClick.findUnique({
        where: { socialLinkId_date: { socialLinkId, date: today } },
      });

      if (existing) {
        await this.prisma.linkClick.update({
          where: { id: existing.id },
          data: { count: { increment: 1 } },
        });
      } else {
        await this.prisma.linkClick.create({
          data: { id: randomUUID(), socialLinkId, date: today, count: 1 },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to track click for link ${socialLinkId}: ${err}`);
    }
  }

  /** Get analytics dashboard data for a user (last 30 days) */
  async getAnalytics(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { id: true, viewCount: true },
    });
    if (!profile) return { totalViews: 0, dailyViews: [], linkClicks: [] };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyViews = await this.prisma.profileView.findMany({
      where: { profileId: profile.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, count: true },
    });

    const linkClicks = await this.prisma.linkClick.findMany({
      where: {
        socialLink: { profileId: profile.id },
        date: { gte: thirtyDaysAgo },
      },
      include: {
        socialLink: { select: { label: true, platform: true, url: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Aggregate clicks per link
    const clicksByLink = new Map<string, { label: string; platform: string; totalClicks: number }>();
    for (const click of linkClicks) {
      const key = click.socialLinkId;
      const existing = clicksByLink.get(key);
      if (existing) {
        existing.totalClicks += click.count;
      } else {
        clicksByLink.set(key, {
          label: click.socialLink.label,
          platform: click.socialLink.platform,
          totalClicks: click.count,
        });
      }
    }

    return {
      totalViews: profile.viewCount,
      dailyViews: dailyViews.map((v) => ({
        date: v.date.toISOString().split('T')[0],
        count: v.count,
      })),
      linkClicks: Array.from(clicksByLink.values()).sort((a, b) => b.totalClicks - a.totalClicks),
    };
  }
}
