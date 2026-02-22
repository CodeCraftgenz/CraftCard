import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlots(slug: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { slug },
      select: { id: true, isPublished: true, bookingEnabled: true, availableSlots: { orderBy: { dayOfWeek: 'asc' } } },
    });
    if (!profile || !profile.isPublished || !profile.bookingEnabled) {
      return [];
    }
    return profile.availableSlots;
  }

  async getAvailableTimes(slug: string, dateStr: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { slug },
      select: { id: true, isPublished: true, availableSlots: true },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    const slot = profile.availableSlots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!slot) return [];

    // Get existing bookings for this date
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        profileId: profile.id,
        date,
        status: { not: 'cancelled' },
      },
      select: { time: true },
    });
    const bookedTimes = new Set(existingBookings.map((b) => b.time));

    // Generate available time slots
    const times: string[] = [];
    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + slot.duration <= endMinutes; m += slot.duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      if (!bookedTimes.has(timeStr)) {
        times.push(timeStr);
      }
    }

    return times;
  }

  async createBooking(slug: string, data: { name: string; email: string; phone?: string; date: string; time: string; notes?: string }) {
    const profile = await this.prisma.profile.findFirst({
      where: { slug },
      select: { id: true, isPublished: true },
    });
    if (!profile || !profile.isPublished) {
      throw AppException.notFound('Perfil');
    }

    // Verify time is still available
    const date = new Date(data.date);
    const existing = await this.prisma.booking.findFirst({
      where: {
        profileId: profile.id,
        date,
        time: data.time,
        status: { not: 'cancelled' },
      },
    });
    if (existing) {
      throw AppException.conflict('Horario ja foi reservado');
    }

    return this.prisma.booking.create({
      data: {
        profileId: profile.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        date,
        time: data.time,
        notes: data.notes || null,
      },
      select: { id: true, date: true, time: true, status: true },
    });
  }

  async getMyBookings(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    return this.prisma.booking.findMany({
      where: { profileId: profile.id },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  async getMySlots(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true, availableSlots: { orderBy: { dayOfWeek: 'asc' } } },
    });
    if (!profile) throw AppException.notFound('Perfil');
    return profile.availableSlots;
  }

  async saveSlots(userId: string, slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; duration: number }>) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    // Delete all existing slots and recreate
    await this.prisma.$transaction([
      this.prisma.availableSlot.deleteMany({ where: { profileId: profile.id } }),
      ...slots.map((s) =>
        this.prisma.availableSlot.create({
          data: {
            profileId: profile.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration,
          },
        }),
      ),
    ]);

    return { saved: true };
  }

  async updateBookingStatus(userId: string, bookingId: string, status: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking || booking.profileId !== profile.id) {
      throw AppException.notFound('Agendamento');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}
