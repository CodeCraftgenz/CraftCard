import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Dashboard ---

  async getDashboardStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      totalUsers,
      totalProfiles,
      totalOrgs,
      planCounts,
      recentUsers,
      revenueAgg,
      revenueLastMonth,
      // New queries
      totalViewsAgg,
      totalMessages,
      expiringSubscriptions,
      recentPayments,
      topProfiles,
      publishedCount,
      leadCaptureCount,
      bookingEnabledCount,
      deviceCounts,
      recentLeads,
      recentNewUsers,
      recentApprovedPayments,
      recentContactMessages,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.profile.count(),
      this.prisma.organization.count(),
      this.prisma.user.groupBy({ by: ['plan'], _count: true }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.payment.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({ where: { status: 'approved', paidAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
      // Total views
      this.prisma.profile.aggregate({ _sum: { viewCount: true } }),
      // Total messages
      this.prisma.contactMessage.count(),
      // Expiring subscriptions (next 7 days)
      this.prisma.payment.count({
        where: { status: 'approved', expiresAt: { gte: new Date(), lte: sevenDaysFromNow } },
      }),
      // Recent payments for daily revenue chart
      this.prisma.payment.findMany({
        where: { status: 'approved', paidAt: { gte: thirtyDaysAgo } },
        select: { amount: true, paidAt: true },
        orderBy: { paidAt: 'asc' },
      }),
      // Top 5 most viewed profiles
      this.prisma.profile.findMany({
        where: { isPublished: true },
        select: { displayName: true, slug: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
      // Feature adoption counts
      this.prisma.profile.count({ where: { isPublished: true } }),
      this.prisma.profile.count({ where: { leadCaptureEnabled: true } }),
      this.prisma.profile.count({ where: { bookingEnabled: true } }),
      // Device distribution
      this.prisma.viewEvent.groupBy({ by: ['device'], _count: true, where: { device: { not: null } } }),
      // 5 most recent unread leads
      this.prisma.contactMessage.findMany({
        where: { isRead: false },
        select: {
          id: true, senderName: true, senderEmail: true, createdAt: true,
          profile: { select: { displayName: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Recent activity data
      this.prisma.user.findMany({
        select: { name: true, email: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.payment.findMany({
        where: { status: 'approved' },
        select: { amount: true, plan: true, paidAt: true, user: { select: { name: true } } },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      this.prisma.contactMessage.findMany({
        select: { senderName: true, createdAt: true, profile: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Users by plan
    const usersByPlan: Record<string, number> = { FREE: 0, PRO: 0, BUSINESS: 0, ENTERPRISE: 0 };
    for (const row of planCounts) {
      usersByPlan[row.plan] = row._count;
    }

    // New users last 30 days
    const dailyMap = new Map<string, number>();
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
    const newUsersLast30Days = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    // Conversion rate
    const conversionRate = totalProfiles > 0 ? (publishedCount / totalProfiles) * 100 : 0;

    // Revenue daily chart
    const revenueDailyMap = new Map<string, number>();
    for (const p of recentPayments) {
      if (p.paidAt) {
        const key = p.paidAt.toISOString().split('T')[0];
        revenueDailyMap.set(key, (revenueDailyMap.get(key) || 0) + Number(p.amount));
      }
    }
    const revenueLast30Days = Array.from(revenueDailyMap.entries()).map(([date, amount]) => ({ date, amount }));

    // Feature adoption
    const featureAdoption = {
      published: { count: publishedCount, pct: totalProfiles > 0 ? Math.round((publishedCount / totalProfiles) * 100) : 0 },
      leadCapture: { count: leadCaptureCount, pct: totalProfiles > 0 ? Math.round((leadCaptureCount / totalProfiles) * 100) : 0 },
      booking: { count: bookingEnabledCount, pct: totalProfiles > 0 ? Math.round((bookingEnabledCount / totalProfiles) * 100) : 0 },
    };

    // Device distribution
    const deviceDistribution = deviceCounts.map((d) => ({
      device: d.device || 'unknown',
      count: d._count,
    }));

    // Activity feed (merge + sort by date, take 10)
    const recentActivity = [
      ...recentNewUsers.map((u) => ({ type: 'signup' as const, label: u.name || u.email, date: u.createdAt })),
      ...recentApprovedPayments
        .filter((p) => p.paidAt)
        .map((p) => ({
          type: 'payment' as const,
          label: `${p.user.name || 'Usuario'} — R$${Number(p.amount).toFixed(2)} (${p.plan})`,
          date: p.paidAt!,
        })),
      ...recentContactMessages.map((m) => ({
        type: 'message' as const,
        label: `${m.senderName} → ${m.profile.displayName}`,
        date: m.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalUsers,
      totalProfiles,
      totalOrgs,
      usersByPlan,
      newUsersLast30Days,
      revenue: {
        total: Number(revenueAgg._sum.amount || 0),
        last30Days: Number(revenueLastMonth._sum.amount || 0),
      },
      totalViews: Number(totalViewsAgg._sum.viewCount || 0),
      totalMessages,
      conversionRate: Math.round(conversionRate * 10) / 10,
      expiringSubscriptions,
      revenueLast30Days,
      topProfiles,
      featureAdoption,
      deviceDistribution,
      recentLeads,
      recentActivity,
    };
  }

  // --- Users ---

  async listUsers(opts: { search?: string; plan?: string; role?: string; page?: number; limit?: number } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search } },
        { email: { contains: opts.search } },
      ];
    }
    if (opts.plan) where.plan = opts.plan;
    if (opts.role) where.role = opts.role;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          plan: true,
          role: true,
          createdAt: true,
          _count: { select: { profiles: true, orgMemberships: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: {
          select: { id: true, displayName: true, slug: true, isPrimary: true, viewCount: true },
          orderBy: { createdAt: 'asc' },
        },
        payments: {
          select: { id: true, amount: true, status: true, plan: true, paidAt: true, expiresAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        orgMemberships: {
          include: { org: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!user) throw AppException.notFound('Usuario');
    return user;
  }

  async updateUser(userId: string, data: { role?: string; plan?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppException.notFound('Usuario');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.plan !== undefined && { plan: data.plan }),
      },
      select: { id: true, email: true, role: true, plan: true },
    });

    this.logger.log(`Admin updated user ${userId}: ${JSON.stringify(data)}`);
    return updated;
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppException.notFound('Usuario');

    await this.prisma.user.delete({ where: { id: userId } });
    this.logger.log(`Admin deleted user ${userId} (${user.email})`);
    return { deleted: true };
  }

  // --- Payments ---

  async listPayments(opts: { status?: string; plan?: string; page?: number; limit?: number } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (opts.status) where.status = opts.status;
    if (opts.plan) where.plan = opts.plan;

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          amount: true,
          status: true,
          plan: true,
          payerEmail: true,
          paidAt: true,
          expiresAt: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Organizations ---

  async listOrganizations(opts: { search?: string; page?: number; limit?: number } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (opts.search) {
      where.OR = [
        { name: { contains: opts.search } },
        { slug: { contains: opts.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          maxMembers: true,
          extraSeats: true,
          createdAt: true,
          _count: { select: { members: true, profiles: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrgDetail(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        maxMembers: true,
        extraSeats: true,
        brandingActive: true,
        createdAt: true,
        _count: { select: { members: true, profiles: true } },
        members: {
          select: { user: { select: { id: true, name: true, email: true } }, role: true },
          take: 50,
        },
      },
    });
    if (!org) throw AppException.notFound('Organizacao');
    return org;
  }

  async updateOrg(orgId: string, data: { extraSeats?: number }) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw AppException.notFound('Organizacao');

    return this.prisma.organization.update({
      where: { id: orgId },
      data: { ...(data.extraSeats !== undefined && { extraSeats: data.extraSeats }) },
      select: { id: true, name: true, extraSeats: true, maxMembers: true },
    });
  }
}
