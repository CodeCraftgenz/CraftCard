import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async create(userId: string, data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
    isPublic?: boolean;
  }) {
    const { planLimits } = await this.paymentsService.getUserPlanInfo(userId);
    const maxEvents = planLimits.maxEvents ?? 0;
    if (maxEvents <= 0) throw AppException.forbidden('Upgrade seu plano para criar eventos');

    const currentCount = await this.prisma.event.count({ where: { creatorId: userId } });
    if (currentCount >= maxEvents) {
      throw AppException.badRequest(`Limite de ${maxEvents} eventos atingido`);
    }

    const slug = `event-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    return this.prisma.event.create({
      data: {
        creatorId: userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        startDate: data.startDate,
        endDate: data.endDate || null,
        location: data.location?.trim() || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        slug,
        isPublic: data.isPublic ?? true,
      },
    });
  }

  async getMyEvents(userId: string) {
    const events = await this.prisma.event.findMany({
      where: { creatorId: userId },
      include: { _count: { select: { connections: true } } },
      orderBy: { startDate: 'desc' },
    });

    return events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      coverUrl: e.coverUrl,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      slug: e.slug,
      isPublic: e.isPublic,
      connectionCount: e._count.connections,
      createdAt: e.createdAt,
    }));
  }

  async getById(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, creatorId: userId },
      include: {
        connections: {
          where: { status: 'ACCEPTED' },
          include: {
            requester: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
            addressee: { select: { id: true, displayName: true, photoUrl: true, slug: true } },
          },
          orderBy: { acceptedAt: 'desc' },
          take: 50,
        },
        _count: { select: { connections: true } },
      },
    });
    if (!event) throw AppException.notFound('Evento');

    return {
      ...event,
      connectionCount: event._count.connections,
    };
  }

  async update(userId: string, eventId: string, data: {
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    coverUrl?: string | null;
    isPublic?: boolean;
  }) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, creatorId: userId } });
    if (!event) throw AppException.notFound('Evento');

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate || null }),
        ...(data.location !== undefined && { location: data.location?.trim() || null }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });
  }

  async delete(userId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({ where: { id: eventId, creatorId: userId } });
    if (!event) throw AppException.notFound('Evento');

    // Unlink connections from event (don't delete them)
    await this.prisma.connection.updateMany({
      where: { eventId },
      data: { eventId: null },
    });

    await this.prisma.event.delete({ where: { id: eventId } });
    return { deleted: true };
  }

  async getPublicEvent(slug: string) {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: { _count: { select: { connections: true } } },
    });
    if (!event || !event.isPublic) throw AppException.notFound('Evento');

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      coverUrl: event.coverUrl,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      slug: event.slug,
      connectionCount: event._count.connections,
    };
  }
}
