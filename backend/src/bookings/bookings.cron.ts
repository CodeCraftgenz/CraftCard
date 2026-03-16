import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';

/**
 * Checks every 5 minutes for confirmed bookings happening ~30 min from now
 * and sends reminder emails to both the owner and the guest.
 *
 * Timezone: app targets Brazil (America/Sao_Paulo = UTC-3).
 * Bookings are stored as:
 *   - date: DATE column → Prisma returns midnight UTC of that day
 *   - time: VARCHAR "HH:MM" → local Brazil time
 *
 * So meeting UTC = date(midnight UTC) + timeHours + 3h (UTC offset)
 */
@Injectable()
export class BookingsCron {
  private readonly logger = new Logger(BookingsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron('*/5 * * * *')
  async sendBookingReminders() {
    const now = Date.now();
    // Window: bookings starting between 25 and 35 minutes from now
    const windowStart = now + 25 * 60 * 1000;
    const windowEnd = now + 35 * 60 * 1000;

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'confirmed',
        reminderSentAt: null,
      },
      include: {
        profile: {
          select: {
            user: { select: { email: true } },
          },
        },
      },
    });

    let sent = 0;
    for (const booking of bookings) {
      // Construct meeting datetime in UTC, accounting for Brazil UTC-3
      const dateMs = booking.date.getTime(); // midnight UTC of booking date
      const [h, m] = booking.time.split(':').map(Number);
      const meetingUtcMs = dateMs + (h + 3) * 60 * 60 * 1000 + m * 60 * 1000;

      if (meetingUtcMs >= windowStart && meetingUtcMs <= windowEnd) {
        const ownerEmail = booking.profile?.user?.email;
        if (!ownerEmail) continue;

        const dateStr = booking.date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        await this.mailService.sendBookingReminder({
          ownerEmail,
          guestEmail: booking.email,
          guestName: booking.name,
          date: dateStr,
          time: booking.time,
        }).catch(() => {});

        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        });

        sent++;
        this.logger.log(`Reminder sent: booking ${booking.id} (${booking.name} at ${booking.time})`);
      }
    }

    if (sent > 0) {
      this.logger.log(`Booking reminders: ${sent} sent`);
    }
  }
}
