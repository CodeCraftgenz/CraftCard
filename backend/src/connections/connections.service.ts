import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';
import { getPlanLimits } from '../payments/plan-limits';

@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService) {}

  async requestConnection(
    userId: string,
    fromProfileId: string,
    toProfileId: string,
    geo?: { latitude?: number; longitude?: number; locationLabel?: string; eventId?: string },
  ) {
    if (fromProfileId === toProfileId) {
      throw AppException.badRequest('Nao e possivel conectar consigo mesmo');
    }

    // Validate fromProfile belongs to user
    const fromProfile = await this.prisma.profile.findFirst({
      where: { id: fromProfileId, userId },
      include: { user: { select: { plan: true } } },
    });
    if (!fromProfile) {
      throw AppException.notFound('Perfil de origem');
    }

    // Check plan limits
    const limits = getPlanLimits(fromProfile.user.plan);
    const currentCount = await this.prisma.connection.count({
      where: {
        OR: [
          { requesterId: fromProfileId, status: 'ACCEPTED' },
          { addresseeId: fromProfileId, status: 'ACCEPTED' },
        ],
      },
    });
    if (currentCount >= limits.maxConnections) {
      throw AppException.badRequest(`Limite de ${limits.maxConnections} conexoes atingido. Faca upgrade do plano para mais conexoes.`);
    }

    // Validate toProfile exists and is published
    const toProfile = await this.prisma.profile.findFirst({
      where: { id: toProfileId, isPublished: true },
    });
    if (!toProfile) {
      throw AppException.notFound('Perfil de destino');
    }

    // Check not connecting to own profile
    if (toProfile.userId === userId) {
      throw AppException.badRequest('Nao e possivel conectar com seu proprio perfil');
    }

    // Check for existing connection (either direction)
    const existing = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: fromProfileId, addresseeId: toProfileId },
          { requesterId: toProfileId, addresseeId: fromProfileId },
        ],
      },
    });
    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw AppException.conflict('Voces ja estao conectados');
      }
      if (existing.status === 'PENDING') {
        throw AppException.conflict('Ja existe um pedido de conexao pendente');
      }
      // If REJECTED, allow re-requesting by deleting old and creating new
      await this.prisma.connection.delete({ where: { id: existing.id } });
    }

    const connection = await this.prisma.connection.create({
      data: {
        requesterId: fromProfileId,
        addresseeId: toProfileId,
        latitude: geo?.latitude ?? null,
        longitude: geo?.longitude ?? null,
        locationLabel: geo?.locationLabel ?? null,
        eventId: geo?.eventId ?? null,
      },
    });

    // Send notification to addressee owner
    try {
      await this.prisma.notification.create({
        data: {
          userId: toProfile.userId,
          type: 'connection_request',
          title: 'Novo pedido de conexao',
          message: `${fromProfile.displayName} quer se conectar com voce`,
        },
      });
    } catch {
      // Non-critical: don't fail the connection request if notification fails
    }

    return connection;
  }

  async requestBySlug(userId: string, fromProfileId: string, slug: string) {
    const toProfile = await this.prisma.profile.findFirst({
      where: { slug, isPublished: true },
    });
    if (!toProfile) {
      throw AppException.notFound('Perfil');
    }
    return this.requestConnection(userId, fromProfileId, toProfile.id);
  }

  async acceptConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        addressee: { select: { userId: true } },
        requester: { select: { userId: true, displayName: true } },
      },
    });
    if (!connection) {
      throw AppException.notFound('Conexao');
    }
    if (connection.addressee.userId !== userId) {
      throw AppException.forbidden('Voce nao pode aceitar esta conexao');
    }
    if (connection.status !== 'PENDING') {
      throw AppException.badRequest('Esta conexao nao esta pendente');
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });

    // Notify requester
    try {
      await this.prisma.notification.create({
        data: {
          userId: connection.requester.userId,
          type: 'connection_accepted',
          title: 'Conexao aceita',
          message: `Sua conexao foi aceita!`,
        },
      });
    } catch {
      // Non-critical
    }

    return updated;
  }

  async rejectConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: { addressee: { select: { userId: true } } },
    });
    if (!connection) {
      throw AppException.notFound('Conexao');
    }
    if (connection.addressee.userId !== userId) {
      throw AppException.forbidden('Voce nao pode rejeitar esta conexao');
    }
    if (connection.status !== 'PENDING') {
      throw AppException.badRequest('Esta conexao nao esta pendente');
    }

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'REJECTED' },
    });
  }

  async removeConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        requester: { select: { userId: true } },
        addressee: { select: { userId: true } },
      },
    });
    if (!connection) {
      throw AppException.notFound('Conexao');
    }
    if (connection.requester.userId !== userId && connection.addressee.userId !== userId) {
      throw AppException.forbidden('Voce nao pode remover esta conexao');
    }

    return this.prisma.connection.delete({ where: { id: connectionId } });
  }

  async getPending(userId: string) {
    // Get all user's profile IDs
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    return this.prisma.connection.findMany({
      where: {
        addresseeId: { in: profileIds },
        status: 'PENDING',
      },
      include: {
        requester: {
          select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true },
        },
        addressee: {
          select: { id: true, displayName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyConnections(userId: string, profileId?: string) {
    let profileIds: string[];

    if (profileId) {
      // Validate profile belongs to user
      const profile = await this.prisma.profile.findFirst({
        where: { id: profileId, userId },
        select: { id: true },
      });
      if (!profile) throw AppException.notFound('Perfil');
      profileIds = [profileId];
    } else {
      const profiles = await this.prisma.profile.findMany({
        where: { userId },
        select: { id: true },
      });
      profileIds = profiles.map((p) => p.id);
    }

    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: { in: profileIds } },
          { addresseeId: { in: profileIds } },
        ],
      },
      include: {
        requester: {
          select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true },
        },
        addressee: {
          select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    // Map to show the "other" profile
    return connections.map((c) => {
      const isRequester = profileIds.includes(c.requesterId);
      const other = isRequester ? c.addressee : c.requester;
      return { id: c.id, connectedAt: c.acceptedAt, profile: other };
    });
  }

  async getPublicConnections(profileId: string) {
    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: profileId },
          { addresseeId: profileId },
        ],
      },
      include: {
        requester: {
          select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true, isPublished: true },
        },
        addressee: {
          select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true, isPublished: true },
        },
      },
      orderBy: { acceptedAt: 'desc' },
      take: 20,
    });

    return connections
      .map((c) => {
        const other = c.requesterId === profileId ? c.addressee : c.requester;
        if (!other.isPublished) return null;
        return { id: other.id, displayName: other.displayName, photoUrl: other.photoUrl, slug: other.slug, tagline: other.tagline };
      })
      .filter(Boolean);
  }

  async getConnectionStatus(userId: string, targetProfileId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const connection = await this.prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: { in: profileIds }, addresseeId: targetProfileId },
          { requesterId: targetProfileId, addresseeId: { in: profileIds } },
        ],
      },
    });

    if (!connection) return { status: 'NONE', connectionId: null };

    const isSender = profileIds.includes(connection.requesterId);
    return {
      status: connection.status,
      connectionId: connection.id,
      direction: isSender ? 'SENT' : 'RECEIVED',
    };
  }

  async discover(query?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { isPublished: true };

    if (query && query.trim()) {
      where.OR = [
        { displayName: { contains: query } },
        { tagline: { contains: query } },
        { location: { contains: query } },
      ];
    }

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where,
        select: {
          id: true,
          displayName: true,
          photoUrl: true,
          slug: true,
          tagline: true,
          location: true,
        },
        orderBy: { viewCount: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profile.count({ where }),
    ]);

    return { profiles, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Timeline ─────────────────────────────────────────

  async getTimeline(userId: string, page = 1, limit = 20, tagId?: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const where: Record<string, unknown> = {
      status: 'ACCEPTED',
      OR: [
        { requesterId: { in: profileIds } },
        { addresseeId: { in: profileIds } },
      ],
    };

    if (tagId) {
      where.tags = { some: { tagId } };
    }

    const skip = (page - 1) * limit;

    const [connections, total] = await Promise.all([
      this.prisma.connection.findMany({
        where,
        include: {
          requester: { select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true } },
          addressee: { select: { id: true, displayName: true, photoUrl: true, slug: true, tagline: true } },
          event: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        },
        orderBy: { acceptedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connection.count({ where }),
    ]);

    const items = connections.map((c) => {
      const isRequester = profileIds.includes(c.requesterId);
      const other = isRequester ? c.addressee : c.requester;
      return {
        id: c.id,
        connectedAt: c.acceptedAt,
        createdAt: c.createdAt,
        profile: other,
        latitude: c.latitude,
        longitude: c.longitude,
        locationLabel: c.locationLabel,
        event: c.event,
        tags: c.tags.map((ct) => ct.tag),
      };
    });

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Map Data ─────────────────────────────────────────

  async getMapData(userId: string) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        latitude: { not: null },
        longitude: { not: null },
        OR: [
          { requesterId: { in: profileIds } },
          { addresseeId: { in: profileIds } },
        ],
      },
      include: {
        requester: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
        addressee: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
      },
    });

    return connections.map((c) => {
      const isRequester = profileIds.includes(c.requesterId);
      const other = isRequester ? c.addressee : c.requester;
      return {
        id: c.id,
        profile: other,
        latitude: c.latitude!,
        longitude: c.longitude!,
        locationLabel: c.locationLabel,
        connectedAt: c.acceptedAt,
      };
    });
  }

  // ── Wrapped (Annual Stats) ───────────────────────────

  async getWrappedStats(userId: string, year: number) {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      select: { id: true },
    });
    const profileIds = profiles.map((p) => p.id);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    const connections = await this.prisma.connection.findMany({
      where: {
        status: 'ACCEPTED',
        acceptedAt: { gte: startOfYear, lt: endOfYear },
        OR: [
          { requesterId: { in: profileIds } },
          { addresseeId: { in: profileIds } },
        ],
      },
      include: {
        requester: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
        addressee: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: { acceptedAt: 'asc' },
    });

    const totalConnections = connections.length;

    // First connection of the year
    const firstConnection = connections[0]
      ? {
          profile: profileIds.includes(connections[0].requesterId) ? connections[0].addressee : connections[0].requester,
          date: connections[0].acceptedAt,
        }
      : null;

    // Top month
    const monthCounts = new Array(12).fill(0);
    for (const c of connections) {
      if (c.acceptedAt) monthCounts[c.acceptedAt.getMonth()]++;
    }
    const topMonthIndex = monthCounts.indexOf(Math.max(...monthCounts));
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Top location
    const locationCounts = new Map<string, number>();
    for (const c of connections) {
      if (c.locationLabel) locationCounts.set(c.locationLabel, (locationCounts.get(c.locationLabel) || 0) + 1);
    }
    const topLocation = [...locationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Top tag
    const tagCounts = new Map<string, number>();
    for (const c of connections) {
      for (const ct of c.tags) tagCounts.set(ct.tag.name, (tagCounts.get(ct.tag.name) || 0) + 1);
    }
    const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      year,
      totalConnections,
      firstConnection,
      topMonth: totalConnections > 0 ? { name: months[topMonthIndex], count: monthCounts[topMonthIndex] } : null,
      monthlyData: months.map((name, i) => ({ name, count: monthCounts[i] })),
      topLocation,
      topTag,
    };
  }
}
