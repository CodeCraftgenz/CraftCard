import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PublicApiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/v1/leads — all contact messages for the user's profiles
   */
  async getLeads(userId: string, opts: { page?: number; limit?: number; isRead?: boolean } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const where: Record<string, unknown> = { profileId: { in: profileIds } };
    if (opts.isRead !== undefined) where.isRead = opts.isRead;

    const [items, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        include: {
          profile: { select: { displayName: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      data: items.map((m) => ({
        id: m.id,
        senderName: m.senderName,
        senderEmail: m.senderEmail,
        message: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt,
        cardName: m.profile?.displayName || null,
        cardSlug: m.profile?.slug || null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * GET /api/v1/connections — all accepted connections
   */
  async getConnections(userId: string, opts: { page?: number; limit?: number } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const [items, total] = await Promise.all([
      this.prisma.connection.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: { in: profileIds } },
            { addresseeId: { in: profileIds } },
          ],
        },
        include: {
          requester: { select: { displayName: true, slug: true, photoUrl: true } },
          addressee: { select: { displayName: true, slug: true, photoUrl: true } },
        },
        orderBy: { acceptedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: { in: profileIds } },
            { addresseeId: { in: profileIds } },
          ],
        },
      }),
    ]);

    return {
      data: items.map((c) => {
        const isRequester = profileIds.includes(c.requesterId);
        const other = isRequester ? c.addressee : c.requester;
        return {
          id: c.id,
          connectedAt: c.acceptedAt,
          contact: {
            name: other.displayName,
            slug: other.slug,
            photoUrl: other.photoUrl,
          },
          location: c.locationLabel,
          latitude: c.latitude,
          longitude: c.longitude,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * GET /api/v1/profiles — user's published profiles with stats
   */
  async getProfiles(userId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId, isPublished: true },
      select: {
        id: true,
        displayName: true,
        slug: true,
        bio: true,
        photoUrl: true,
        viewCount: true,
        buttonColor: true,
        cardTheme: true,
        createdAt: true,
        _count: {
          select: {
            socialLinks: true,
            connectionsRequested: { where: { status: 'ACCEPTED' } },
            connectionsReceived: { where: { status: 'ACCEPTED' } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: profiles.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        slug: p.slug,
        bio: p.bio,
        photoUrl: p.photoUrl,
        viewCount: p.viewCount,
        linksCount: p._count.socialLinks,
        connectionsCount: p._count.connectionsRequested + p._count.connectionsReceived,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * GET /api/v1/analytics — aggregated stats
   */
  async getAnalytics(userId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true, viewCount: true, displayName: true, slug: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalLeads, totalConnections, recentViews] = await Promise.all([
      this.prisma.contactMessage.count({ where: { profileId: { in: profileIds } } }),
      this.prisma.connection.count({
        where: { status: 'ACCEPTED', OR: [{ requesterId: { in: profileIds } }, { addresseeId: { in: profileIds } }] },
      }),
      this.prisma.profileView.findMany({
        where: { profileId: { in: profileIds }, date: { gte: thirtyDaysAgo } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const totalViews = profiles.reduce((sum, p) => sum + p.viewCount, 0);

    const dailyViews: Record<string, number> = {};
    for (const v of recentViews) {
      const key = v.date.toISOString().split('T')[0];
      dailyViews[key] = (dailyViews[key] || 0) + v.count;
    }

    return {
      data: {
        totalViews,
        totalLeads,
        totalConnections,
        profileCount: profiles.length,
        dailyViews: Object.entries(dailyViews).map(([date, count]) => ({ date, count })),
        profiles: profiles.map((p) => ({ slug: p.slug, name: p.displayName, views: p.viewCount })),
      },
    };
  }
}
