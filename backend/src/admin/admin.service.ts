import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppException } from '../common/exceptions/app.exception';

/** Enterprise tiered pricing — starts at 101+ seats (above Business max of 100) */
const ENTERPRISE_TIERS = [
  { min: 101, max: 250, price: 19.9 },
  { min: 251, max: 500, price: 14.9 },
  { min: 501, max: 1000, price: 9.9 },
  { min: 1001, max: 99999, price: 7.9 },
];

function getEnterprisePricePerSeat(seats: number): number {
  for (const tier of ENTERPRISE_TIERS) {
    if (seats >= tier.min && seats <= tier.max) return tier.price;
  }
  return ENTERPRISE_TIERS[ENTERPRISE_TIERS.length - 1].price;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // --- Enterprise Management ---

  calculateEnterprisePrice(seats: number, billingCycle: 'MONTHLY' | 'YEARLY') {
    const pricePerSeat = getEnterprisePricePerSeat(seats);
    const yearlyDiscount = billingCycle === 'YEARLY' ? 0.8 : 1;
    const effectivePrice = Math.round(pricePerSeat * yearlyDiscount * 100) / 100;
    const monthlyTotal = Math.round(effectivePrice * seats * 100) / 100;
    const yearlyTotal = Math.round(monthlyTotal * 12 * 100) / 100;
    const discount = Math.round((1 - effectivePrice / 9.9) * 100);

    return {
      seats,
      billingCycle,
      pricePerSeat: effectivePrice,
      monthlyTotal,
      yearlyTotal: billingCycle === 'YEARLY' ? yearlyTotal : monthlyTotal * 12,
      discount: Math.max(discount, 0),
      tiers: ENTERPRISE_TIERS,
    };
  }

  async activateEnterprise(data: {
    email: string;
    companyName: string;
    seats: number;
    billingCycle: 'MONTHLY' | 'YEARLY';
  }) {
    const { email, companyName, seats, billingCycle } = data;
    const pricing = this.calculateEnterprisePrice(seats, billingCycle);
    const frontendUrl = process.env.FRONTEND_URL || 'https://craftcardgenz.com';

    // 1. Find or create user
    let user = await this.prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (!user) {
      // Create user without password — they'll set it via the reset link
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      user = await this.prisma.user.create({
        data: {
          email,
          name: companyName,
          plan: 'ENTERPRISE',
          passwordResetToken: tokenHash,
          passwordResetExpiresAt: expiresAt,
        },
      });
      isNewUser = true;

      // Create default profile
      const slug = companyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 40) || `ent-${Date.now().toString(36)}`;
      await this.prisma.profile.create({
        data: {
          userId: user.id,
          displayName: companyName,
          slug,
          isPrimary: true,
          isPublished: false,
          label: 'Principal',
        },
      });

      // Send welcome email with password setup link
      const setupUrl = `${frontendUrl}/reset-password?token=${rawToken}`;
      await this.mailService.sendEnterpriseWelcome(email, {
        companyName,
        seats,
        monthlyTotal: pricing.monthlyTotal.toFixed(2).replace('.', ','),
        billingCycle: billingCycle === 'YEARLY' ? 'Anual' : 'Mensal',
        setupPasswordUrl: setupUrl,
      });

      this.logger.log(`Enterprise activated: NEW user ${email} for ${companyName} (${seats} seats)`);
    } else {
      // Existing user — just upgrade plan
      await this.prisma.user.update({
        where: { id: user.id },
        data: { plan: 'ENTERPRISE' },
      });
      isNewUser = false;
      this.logger.log(`Enterprise activated: EXISTING user ${email} upgraded to ENTERPRISE (${seats} seats)`);
    }

    // 2. Create or update organization
    let org = await this.prisma.organization.findFirst({
      where: { members: { some: { userId: user.id, role: 'OWNER' } } },
    });

    if (!org) {
      const orgSlug = `org-${Date.now().toString(36)}`;
      org = await this.prisma.organization.create({
        data: {
          name: companyName,
          slug: orgSlug,
          maxMembers: seats,
          brandingActive: false,
        },
      });
      await this.prisma.organizationMember.create({
        data: { orgId: org.id, userId: user.id, role: 'OWNER' },
      });
    } else {
      await this.prisma.organization.update({
        where: { id: org.id },
        data: { maxMembers: seats, name: companyName },
      });
    }

    // 3. Create payment record for audit
    const now = new Date();
    const subDays = billingCycle === 'YEARLY' ? 365 : 30;
    await this.prisma.payment.create({
      data: {
        userId: user.id,
        amount: pricing.monthlyTotal * (billingCycle === 'YEARLY' ? 12 : 1),
        currency: 'BRL',
        status: 'approved',
        plan: 'ENTERPRISE',
        billingCycle,
        seatsCount: seats,
        paidAt: now,
        expiresAt: new Date(now.getTime() + subDays * 24 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      isNewUser,
      userId: user.id,
      orgId: org.id,
      pricing,
      emailSent: isNewUser,
    };
  }

  async listEnterpriseClients() {
    const enterprises = await this.prisma.user.findMany({
      where: { plan: 'ENTERPRISE' },
      select: {
        id: true, email: true, name: true, createdAt: true,
        orgMemberships: {
          where: { role: 'OWNER' },
          include: { org: { select: { name: true, maxMembers: true, _count: { select: { members: true } } } } },
          take: 1,
        },
        payments: {
          where: { plan: 'ENTERPRISE', status: 'approved' },
          orderBy: { paidAt: 'desc' },
          take: 1,
          select: { amount: true, seatsCount: true, billingCycle: true, expiresAt: true, paidAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enterprises.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      createdAt: u.createdAt,
      org: u.orgMemberships[0]?.org ? {
        name: u.orgMemberships[0].org.name,
        maxSeats: u.orgMemberships[0].org.maxMembers,
        currentMembers: u.orgMemberships[0].org._count.members,
      } : null,
      lastPayment: u.payments[0] || null,
    }));
  }

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
          label: `${p.user.name || 'Usuário'} — R$${Number(p.amount).toFixed(2)} (${p.plan})`,
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

  // --- SaaS Analytics Overview (BI Dashboard) ---

  async getAnalyticsOverview(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);
    prevStartDate.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      usersInPeriod,
      usersInPrevPeriod,
      totalProfiles,
      totalViewsAgg,
      totalConnections,
      connectionsInPeriod,
      totalLeads,
      leadsInPeriod,
      planCounts,
      recentNewUsers,
      recentConnections,
      topProfiles,
      recentUpgrades,
      spikeProfiles,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.user.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),
      this.prisma.profile.count({ where: { isPublished: true } }),
      this.prisma.profile.aggregate({ _sum: { viewCount: true } }),
      this.prisma.connection.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.connection.count({ where: { status: 'ACCEPTED', acceptedAt: { gte: startDate } } }),
      this.prisma.contactMessage.count(),
      this.prisma.contactMessage.count({ where: { createdAt: { gte: startDate } } }),
      // Plan distribution
      this.prisma.user.groupBy({ by: ['plan'], _count: true }),
      // Daily new users for chart
      this.prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      // Daily connections for chart
      this.prisma.connection.findMany({
        where: { status: 'ACCEPTED', acceptedAt: { gte: startDate } },
        select: { acceptedAt: true },
        orderBy: { acceptedAt: 'asc' },
      }),
      // Top 5 most viewed profiles
      this.prisma.profile.findMany({
        where: { isPublished: true },
        select: { displayName: true, slug: true, photoUrl: true, viewCount: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
      }),
      // Recent upgrades (non-FREE payments)
      this.prisma.payment.findMany({
        where: { status: 'approved', paidAt: { gte: startDate } },
        select: { plan: true, amount: true, paidAt: true, user: { select: { name: true, email: true } } },
        orderBy: { paidAt: 'desc' },
        take: 10,
      }),
      // Spike profiles (high views in last 24h)
      this.prisma.profileView.findMany({
        where: { date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        select: { profileId: true, count: true, profile: { select: { displayName: true, slug: true, photoUrl: true } } },
        orderBy: { count: 'desc' },
        take: 10,
      }),
    ]);

    // KPI trends
    const userGrowth = usersInPrevPeriod > 0
      ? Math.round(((usersInPeriod - usersInPrevPeriod) / usersInPrevPeriod) * 100)
      : usersInPeriod > 0 ? 100 : 0;

    // Plan distribution
    const planDistribution = { FREE: 0, PRO: 0, BUSINESS: 0, ENTERPRISE: 0 };
    for (const row of planCounts) {
      planDistribution[row.plan as keyof typeof planDistribution] = row._count;
    }

    // Daily series: new users
    const userDailyMap = new Map<string, number>();
    for (const u of recentNewUsers) {
      const key = u.createdAt.toISOString().split('T')[0];
      userDailyMap.set(key, (userDailyMap.get(key) || 0) + 1);
    }

    // Daily series: connections
    const connDailyMap = new Map<string, number>();
    for (const c of recentConnections) {
      if (c.acceptedAt) {
        const key = c.acceptedAt.toISOString().split('T')[0];
        connDailyMap.set(key, (connDailyMap.get(key) || 0) + 1);
      }
    }

    // Merge into unified time series
    const allDates = new Set([...userDailyMap.keys(), ...connDailyMap.keys()]);
    const timeSeries = [...allDates].sort().map((date) => ({
      date,
      users: userDailyMap.get(date) || 0,
      connections: connDailyMap.get(date) || 0,
    }));

    return {
      kpis: {
        totalUsers,
        usersInPeriod,
        userGrowth,
        totalProfiles,
        totalViews: Number(totalViewsAgg._sum.viewCount || 0),
        totalConnections,
        connectionsInPeriod,
        totalLeads,
        leadsInPeriod,
      },
      planDistribution,
      timeSeries,
      topProfiles,
      recentUpgrades: recentUpgrades.map((p) => ({
        userName: p.user.name || p.user.email,
        plan: p.plan,
        amount: Number(p.amount),
        paidAt: p.paidAt,
      })),
      spikeProfiles: spikeProfiles.map((s) => ({
        displayName: s.profile.displayName,
        slug: s.profile.slug,
        photoUrl: s.profile.photoUrl,
        views24h: s.count,
      })),
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

    if (!user) throw AppException.notFound('Usuário');
    return user;
  }

  async updateUser(userId: string, data: { role?: string; plan?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppException.notFound('Usuário');

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
    if (!user) throw AppException.notFound('Usuário');

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
    if (!org) throw AppException.notFound('Organização');
    return org;
  }

  async updateOrg(orgId: string, data: { extraSeats?: number }) {
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw AppException.notFound('Organização');

    return this.prisma.organization.update({
      where: { id: orgId },
      data: { ...(data.extraSeats !== undefined && { extraSeats: data.extraSeats }) },
      select: { id: true, name: true, extraSeats: true, maxMembers: true },
    });
  }

  // ── Hackathon Dashboard ─────────────────────────────────

  /**
   * Participantes do hackathon sao identificados por possuir
   * um SocialLink com linkType = 'hackathon_meta'.
   */
  async getHackathonDashboard() {
    const hackathonStartDate = new Date('2026-04-05');

    const [
      totalParticipants,
      teamsFormed,
      totalTeamMembers,
      hackathonViews,
    ] = await Promise.all([
      // Perfis com link hackathon_meta
      this.prisma.profile.count({
        where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
      }),
      // Organizacoes criadas a partir da data do evento
      this.prisma.organization.count({
        where: { createdAt: { gte: hackathonStartDate } },
      }),
      // Total de membros em equipes do hackathon
      this.prisma.organizationMember.count({
        where: { org: { createdAt: { gte: hackathonStartDate } } },
      }),
      // Views nos perfis hackathon
      this.prisma.profile.aggregate({
        where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
        _sum: { viewCount: true },
      }),
    ]);

    const avgPerTeam = teamsFormed > 0
      ? Math.round((totalTeamMembers / teamsFormed) * 10) / 10
      : 0;

    // Distribuicao por area (extraido do metadata JSON do social link)
    const hackathonLinks = await this.prisma.socialLink.findMany({
      where: { linkType: 'hackathon_meta' },
      select: { metadata: true },
    });

    const areaCounts: Record<string, number> = {};
    for (const link of hackathonLinks) {
      if (!link.metadata) continue;
      try {
        const parsed = JSON.parse(link.metadata);
        const area = parsed.hackathonArea;
        if (area) areaCounts[area] = (areaCounts[area] || 0) + 1;
      } catch { /* ignore bad JSON */ }
    }

    return {
      totalParticipants,
      teamsFormed,
      avgPerTeam,
      totalViews: Number(hackathonViews._sum.viewCount || 0),
      areaDistribution: areaCounts,
    };
  }

  /**
   * Advanced analytics for executive BI dashboard (Senac ROI report)
   */
  async getHackathonAnalytics() {
    const hackathonStartDate = new Date('2026-04-05');

    const [
      totalParticipants,
      teamsFormed,
      totalTeamMembers,
      hackathonViews,
      totalConnections,
    ] = await Promise.all([
      this.prisma.profile.count({
        where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
      }),
      this.prisma.organization.count({
        where: { slug: { startsWith: 'hackathon-' } },
      }),
      this.prisma.organizationMember.count({
        where: { org: { slug: { startsWith: 'hackathon-' } } },
      }),
      this.prisma.profile.aggregate({
        where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
        _sum: { viewCount: true },
      }),
      // Connections between hackathon participants
      this.prisma.connection.count({
        where: {
          status: 'ACCEPTED',
          requester: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
          addressee: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
        },
      }),
    ]);

    const avgPerTeam = teamsFormed > 0 ? Math.round((totalTeamMembers / teamsFormed) * 10) / 10 : 0;
    const avgConnectionsPerParticipant = totalParticipants > 0
      ? Math.round((totalConnections * 2 / totalParticipants) * 10) / 10 // *2 because each connection involves 2 people
      : 0;
    const orphanCount = totalParticipants - totalTeamMembers;
    const teamCoverage = totalParticipants > 0
      ? Math.round((totalTeamMembers / totalParticipants) * 100)
      : 0;

    // Parse all hackathon metadata for area + skills aggregation
    const hackathonLinks = await this.prisma.socialLink.findMany({
      where: { linkType: 'hackathon_meta' },
      select: { metadata: true },
    });

    const areaCounts: Record<string, number> = {};
    const skillCounts: Record<string, number> = {};

    for (const link of hackathonLinks) {
      if (!link.metadata) continue;
      try {
        const parsed = JSON.parse(link.metadata);
        if (parsed.hackathonArea) {
          areaCounts[parsed.hackathonArea] = (areaCounts[parsed.hackathonArea] || 0) + 1;
        }
        if (Array.isArray(parsed.hackathonSkills)) {
          for (const skill of parsed.hackathonSkills) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        }
      } catch { /* ignore bad JSON */ }
    }

    // Top 5 areas sorted by count
    const topAreas = Object.entries(areaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([area, count]) => ({ area, count }));

    // Top skills sorted by count
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Top 10 most viewed participants
    const topParticipants = await this.prisma.profile.findMany({
      where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
      select: { displayName: true, slug: true, photoUrl: true, viewCount: true },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });

    return {
      kpis: {
        totalParticipants,
        totalViews: Number(hackathonViews._sum.viewCount || 0),
        totalConnections,
        teamsFormed,
        avgPerTeam,
        avgConnectionsPerParticipant,
        orphanCount,
        teamCoverage,
      },
      topAreas,
      topSkills,
      topParticipants,
      areaDistribution: areaCounts,
    };
  }

  /**
   * Export all hackathon participants as CSV for Senac directoria
   */
  async exportHackathonCsv(): Promise<string> {
    const profiles = await this.prisma.profile.findMany({
      where: { socialLinks: { some: { linkType: 'hackathon_meta' } } },
      select: {
        displayName: true,
        slug: true,
        viewCount: true,
        user: { select: { email: true } },
        socialLinks: {
          where: { linkType: 'hackathon_meta' },
          select: { metadata: true },
          take: 1,
        },
      },
      orderBy: { viewCount: 'desc' },
    });

    // Check team membership
    const userEmails = profiles.map((p) => p.user.email);
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        user: { email: { in: userEmails } },
        org: { slug: { startsWith: 'hackathon-' } },
      },
      include: {
        user: { select: { email: true } },
        org: { select: { name: true } },
      },
    });
    const teamMap = new Map(memberships.map((m) => [m.user.email, m.org.name]));

    const header = 'Nome,Email,Slug,Area,Skills,Equipe,Scans QR Code\n';
    const rows = profiles.map((p) => {
      let area = '';
      let skills = '';
      if (p.socialLinks[0]?.metadata) {
        try {
          const meta = JSON.parse(p.socialLinks[0].metadata);
          area = meta.hackathonArea || '';
          skills = Array.isArray(meta.hackathonSkills) ? meta.hackathonSkills.join('; ') : '';
        } catch { /* ignore */ }
      }
      const team = teamMap.get(p.user.email) || 'Sem equipe';
      return `${csvEsc(p.displayName)},${csvEsc(p.user.email)},${csvEsc(p.slug)},${csvEsc(area)},${csvEsc(skills)},${csvEsc(team)},${p.viewCount}`;
    }).join('\n');

    return header + rows;
  }

  async getHackathonParticipants(opts: { search?: string; area?: string; page?: number; limit?: number } = {}) {
    const page = opts.page ?? 1;
    const limit = Math.min(opts.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    // Buscar perfis com hackathon_meta
    const where: Record<string, unknown> = {
      socialLinks: { some: { linkType: 'hackathon_meta' } },
    };
    if (opts.search) {
      where.OR = [
        { displayName: { contains: opts.search } },
        { user: { email: { contains: opts.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
          slug: true,
          user: { select: { email: true } },
          socialLinks: {
            where: { linkType: 'hackathon_meta' },
            select: { metadata: true },
            take: 1,
          },
          _count: { select: { socialLinks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    // Enriquecer com dados do hackathon
    const participants = items.map((p) => {
      let hackathonArea: string | null = null;
      let hackathonSkills: string[] = [];
      const metaLink = p.socialLinks[0];
      if (metaLink?.metadata) {
        try {
          const parsed = JSON.parse(metaLink.metadata);
          hackathonArea = parsed.hackathonArea || null;
          hackathonSkills = parsed.hackathonSkills || [];
        } catch { /* ignore */ }
      }
      return {
        id: p.id,
        displayName: p.displayName,
        photoUrl: p.photoUrl,
        slug: p.slug,
        email: p.user.email,
        hackathonArea,
        hackathonSkills,
        // TODO: team info when org membership logic is tied to hackathon
        team: null as string | null,
      };
    });

    // Filtrar por area se especificado
    const filtered = opts.area
      ? participants.filter((p) => p.hackathonArea === opts.area)
      : participants;

    return {
      items: opts.area ? filtered.slice(skip, skip + limit) : filtered,
      total: opts.area ? filtered.length : total,
      page,
      limit,
      totalPages: Math.ceil((opts.area ? filtered.length : total) / limit),
    };
  }

  async getHackathonTeams() {
    const hackathonStartDate = new Date('2026-04-05');

    const teams = await this.prisma.organization.findMany({
      where: { createdAt: { gte: hackathonStartDate } },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        maxMembers: true,
        _count: { select: { members: true } },
        members: {
          where: { role: 'OWNER' },
          select: { user: { select: { name: true, email: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt,
      memberCount: t._count.members,
      maxMembers: t.maxMembers,
      leader: t.members[0]?.user || null,
    }));
  }

  async getHackathonTeamDetail(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        maxMembers: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            user: {
              select: {
                name: true,
                email: true,
                profiles: {
                  where: { isPrimary: true },
                  select: {
                    displayName: true,
                    photoUrl: true,
                    socialLinks: {
                      where: { linkType: 'hackathon_meta' },
                      select: { metadata: true },
                      take: 1,
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!org) throw AppException.notFound('Equipe');

    const members = org.members.map((m) => {
      const profile = m.user.profiles[0];
      let hackathonArea: string | null = null;
      let hackathonSkills: string[] = [];
      if (profile?.socialLinks[0]?.metadata) {
        try {
          const parsed = JSON.parse(profile.socialLinks[0].metadata);
          hackathonArea = parsed.hackathonArea || null;
          hackathonSkills = parsed.hackathonSkills || [];
        } catch { /* ignore */ }
      }
      return {
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        displayName: profile?.displayName || m.user.name,
        photoUrl: profile?.photoUrl || null,
        hackathonArea,
        hackathonSkills,
      };
    });

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      maxMembers: org.maxMembers,
      createdAt: org.createdAt,
      members,
    };
  }

  // ── System Settings ───────────────────────────────────────

  async getSetting(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    return { key, value: setting?.value ?? null };
  }

  async setSetting(key: string, value: string) {
    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    this.logger.log(`Setting updated: ${key} = ${value}`);
    return { key: setting.key, value: setting.value };
  }
}

function csvEsc(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
