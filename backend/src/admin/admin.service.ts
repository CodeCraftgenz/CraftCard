import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --- Dashboard ---

  async getDashboardStats() {
    const [totalUsers, totalProfiles, totalOrgs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.profile.count(),
      this.prisma.organization.count(),
    ]);

    // Users by plan
    const planCounts = await this.prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });
    const usersByPlan: Record<string, number> = { FREE: 0, PRO: 0, BUSINESS: 0, ENTERPRISE: 0 };
    for (const row of planCounts) {
      usersByPlan[row.plan] = row._count;
    }

    // New users last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentUsers = await this.prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, number>();
    for (const u of recentUsers) {
      const key = u.createdAt.toISOString().split('T')[0];
      dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
    const newUsersLast30Days = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

    // Revenue
    const revenueAgg = await this.prisma.payment.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
    });
    const revenueLastMonth = await this.prisma.payment.aggregate({
      where: { status: 'approved', paidAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });

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
