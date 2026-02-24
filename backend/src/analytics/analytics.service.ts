import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { randomUUID } from 'crypto';

/** Simple user-agent parser — no external dependency */
function parseUserAgent(ua: string | undefined): { device: string; browser: string } {
  if (!ua) return { device: 'unknown', browser: 'unknown' };
  const lower = ua.toLowerCase();

  let device = 'desktop';
  if (/mobile|android|iphone|ipod/.test(lower)) device = 'mobile';
  else if (/tablet|ipad/.test(lower)) device = 'tablet';

  let browser = 'other';
  if (lower.includes('chrome') && !lower.includes('edg')) browser = 'chrome';
  else if (lower.includes('safari') && !lower.includes('chrome')) browser = 'safari';
  else if (lower.includes('firefox')) browser = 'firefox';
  else if (lower.includes('edg')) browser = 'edge';

  return { device, browser };
}

/** Categorize referrer into a friendly source name */
function categorizeReferrer(ref: string | undefined): string {
  if (!ref) return 'direct';
  const lower = ref.toLowerCase();
  if (lower.includes('whatsapp') || lower.includes('wa.me')) return 'whatsapp';
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('facebook') || lower.includes('fb.')) return 'facebook';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('google')) return 'google';
  if (lower.includes('t.me') || lower.includes('telegram')) return 'telegram';
  return 'other';
}

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

  /** Track a granular view event with device/referrer info */
  async trackViewEvent(profileId: string, meta: {
    userAgent?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }) {
    try {
      const { device, browser } = parseUserAgent(meta.userAgent);
      const referrer = meta.utmSource || categorizeReferrer(meta.referrer);

      await this.prisma.viewEvent.create({
        data: {
          profileId,
          device,
          browser,
          referrer,
          utmSource: meta.utmSource || null,
          utmMedium: meta.utmMedium || null,
          utmCampaign: meta.utmCampaign || null,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to track view event: ${err}`);
    }
  }

  /** Upsert daily click count for a social link (fire-and-forget) */
  async trackClick(socialLinkId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
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
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true, viewCount: true },
    });
    if (!profile) return { totalViews: 0, dailyViews: [], linkClicks: [], deviceBreakdown: {}, referrerBreakdown: [], conversionFunnel: { views: 0, clicks: 0, messages: 0, bookings: 0 } };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Daily views (existing)
    const dailyViews = await this.prisma.profileView.findMany({
      where: { profileId: profile.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'asc' },
      select: { date: true, count: true },
    });

    // Link clicks (existing)
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

    // Advanced: device breakdown and referrer from ViewEvent
    const viewEvents = await this.prisma.viewEvent.findMany({
      where: { profileId: profile.id, timestamp: { gte: thirtyDaysAgo } },
      select: { device: true, browser: true, referrer: true },
    });

    const deviceBreakdown: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    const referrerMap = new Map<string, number>();

    for (const ev of viewEvents) {
      if (ev.device && deviceBreakdown[ev.device] !== undefined) {
        deviceBreakdown[ev.device]++;
      }
      if (ev.referrer) {
        referrerMap.set(ev.referrer, (referrerMap.get(ev.referrer) || 0) + 1);
      }
    }

    const referrerBreakdown = Array.from(referrerMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Conversion funnel
    const totalClicks = Array.from(clicksByLink.values()).reduce((s, c) => s + c.totalClicks, 0);
    const totalMessages = await this.prisma.contactMessage.count({
      where: { profileId: profile.id, createdAt: { gte: thirtyDaysAgo } },
    });
    const totalBookings = await this.prisma.booking.count({
      where: { profileId: profile.id, createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      totalViews: profile.viewCount,
      dailyViews: dailyViews.map((v) => ({
        date: v.date.toISOString().split('T')[0],
        count: v.count,
      })),
      linkClicks: Array.from(clicksByLink.values()).sort((a, b) => b.totalClicks - a.totalClicks),
      deviceBreakdown,
      referrerBreakdown,
      conversionFunnel: {
        views: profile.viewCount,
        clicks: totalClicks,
        messages: totalMessages,
        bookings: totalBookings,
      },
    };
  }
}
