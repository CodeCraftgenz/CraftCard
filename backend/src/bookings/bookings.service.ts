import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { GoogleCalendarService } from './google-calendar.service';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly inAppService: InAppNotificationsService,
    private readonly webhooksService: WebhooksService,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

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
      select: { id: true, userId: true, isPublished: true, displayName: true, user: { select: { email: true } } },
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
      throw AppException.conflict('Horario já foi reservado');
    }

    const booking = await this.prisma.booking.create({
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

    // Format date for notifications
    const dateStr = date.toLocaleDateString('pt-BR');

    // Email to owner
    if (profile.user?.email) {
      this.mailService.sendBookingNotification(
        profile.user.email,
        data.name,
        dateStr,
        data.time,
      ).catch((err) => this.logger.error(`Owner booking email failed: ${err?.message}`));
    }

    // Confirmation email to guest
    this.mailService.sendBookingConfirmationToGuest({
      guestEmail: data.email,
      guestName: data.name,
      ownerName: profile.displayName,
      date: dateStr,
      time: data.time,
      notes: data.notes,
    }).catch((err) => this.logger.error(`Guest confirmation email failed: ${err?.message}`));

    // Push notification
    this.notificationsService.sendToUser(profile.userId, {
      title: 'Novo agendamento!',
      body: `${data.name} agendou para ${dateStr} as ${data.time}`,
      url: '/editor',
    }).catch((err) => this.logger.error(`Push notification failed: ${err?.message}`));

    // In-app notification
    this.inAppService.create(profile.userId, {
      type: 'new_booking',
      title: 'Novo agendamento!',
      message: `${data.name} agendou para ${dateStr} as ${data.time}`,
      metadata: { bookingId: booking.id, name: data.name, date: dateStr, time: data.time },
    }).catch((err) => this.logger.error(`In-app notification failed: ${err?.message}`));

    // Webhook dispatch for CRM integration
    this.webhooksService.dispatch(profile.userId, 'new_booking', {
      bookingId: booking.id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      date: dateStr,
      time: data.time,
      notes: data.notes || null,
    }).catch((err) => this.logger.error(`Webhook dispatch failed: ${err?.message}`));

    // Google Calendar: NOT here — syncs when owner confirms (updateBookingStatus)

    return booking;
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

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    // Sync to Google Calendar when CONFIRMED
    if (status === 'confirmed') {
      const dateStr = booking.date instanceof Date
        ? booking.date.toISOString().split('T')[0]
        : String(booking.date).split('T')[0];

      this.googleCalendar.createBookingEvent(userId, {
        name: booking.name,
        email: booking.email,
        phone: booking.phone || undefined,
        date: dateStr,
        time: booking.time,
        notes: booking.notes || undefined,
      }).then(async (googleEventId) => {
        if (googleEventId) {
          await this.prisma.booking.update({
            where: { id: bookingId },
            data: { googleEventId },
          });
        }
      }).catch((err) => this.logger.error(`Google Calendar sync failed for booking ${bookingId}: ${err?.message}`));
    }

    return updated;
  }

  async deleteBooking(userId: string, bookingId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isPrimary: true },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Perfil');

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.profileId !== profile.id) {
      throw AppException.notFound('Agendamento');
    }

    // Delete Google Calendar event if synced
    if (booking.googleEventId) {
      this.googleCalendar.deleteBookingEvent(userId, booking.googleEventId)
        .catch((err) => this.logger.error(`Google Calendar delete failed for booking ${bookingId}: ${err?.message}`));
    }

    await this.prisma.booking.delete({ where: { id: bookingId } });
    return { deleted: true };
  }
}
