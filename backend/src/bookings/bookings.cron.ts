import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

/**
 * Sends reminder emails ~30 min before confirmed bookings, to both owner and guest.
 *
 * Timezone: Brazil is fixed UTC-3 (DST abolished in 2019).
 * Bookings stored as:
 *   - date: DATE column → Prisma returns midnight UTC of that day
 *   - time: VARCHAR "HH:MM" → local Brazil time
 *
 * Meeting UTC = date(midnight UTC) + timeHours*3600s + timeMins*60s + 3*3600s
 *
 * Render free-tier resilience: window is 5-40 min from now (instead of 25-35).
 * If server was cold-starting ≤35 min late, it catches up on restart via
 * OnApplicationBootstrap. reminderSentAt prevents double sends.
 */
@Injectable()
export class BookingsCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /** Fire once on startup — catches missed reminders from server being down */
  async onApplicationBootstrap() {
    await this.sendBookingReminders();
  }

  @Cron('*/5 * * * *')
  async sendBookingReminders() {
    const now = Date.now();

    // Window: 5 to 40 min from now.
    //   - Lower 5 min: prevents spurious reminders for meetings already starting.
    //   - Upper 40 min: normal ~30 min + 10 min slack for cold-starts.
    const windowStart = now + 5 * 60 * 1000;
    const windowEnd = now + 40 * 60 * 1000;

    // Only scan today and tomorrow (Brazil time) — avoids full table scan
    const nowBR = new Date(now - 3 * 3600 * 1000);
    const todayBR = new Date(nowBR.toISOString().split('T')[0] + 'T00:00:00Z');
    const tomorrowBR = new Date(todayBR.getTime() + 48 * 3600 * 1000);

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminderSentAt: null,
        date: { gte: todayBR, lte: tomorrowBR },
      },
      select: {
        id: true,
        name: true,
        email: true,
        date: true,
        time: true,
        profile: {
          select: {
            displayName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    let sent = 0;
    for (const booking of bookings) {
      const dateMs = booking.date.getTime();
      const [h, m] = booking.time.split(':').map(Number);
      const meetingUtcMs = dateMs + (h + 3) * 3600 * 1000 + m * 60 * 1000;

      if (meetingUtcMs < windowStart || meetingUtcMs > windowEnd) continue;

      const ownerEmail = booking.profile?.user?.email;
      if (!ownerEmail) continue;

      const dateStr = booking.date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const ownerName = booking.profile?.displayName ?? 'Proprietario';

      try {
        await this.mailService.sendBookingReminder({
          ownerEmail,
          guestEmail: booking.email,
          guestName: booking.name,
          ownerName,
          date: dateStr,
          time: booking.time,
        });

        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        });

        sent++;
        this.logger.log(`Reminder sent: booking ${booking.id} (${booking.name} @ ${booking.time})`);
      } catch (err) {
        this.logger.error(`Reminder failed for booking ${booking.id}: ${(err as Error).message}`);
      }
    }

    if (sent > 0) {
      this.logger.log(`Booking reminders: ${sent} sent`);
    }
  }
}
