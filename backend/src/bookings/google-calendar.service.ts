import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = this.configService.get('GOOGLE_CLIENT_ID') || '';
    this.clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET') || '';
    const backendUrl = this.configService.get('BACKEND_URL') || '';
    this.redirectUri = `${backendUrl}/api/bookings/google/callback`;
  }

  private getOAuth2Client() {
    return new google.auth.OAuth2(this.clientId, this.clientSecret, this.redirectUri);
  }

  /**
   * Generate OAuth consent URL for Google Calendar access
   */
  getAuthUrl(userId: string): string {
    const oauth2 = this.getOAuth2Client();
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
      state: userId, // Pass userId to identify user in callback
    });
  }

  /**
   * Exchange OAuth code for tokens and save to user
   */
  async handleCallback(code: string, userId: string) {
    const oauth2 = this.getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);

    await this.prisma.user.update({
      where: { id: userId },
      data: { googleCalendarToken: JSON.stringify(tokens) },
    });

    this.logger.log(`Google Calendar connected for user ${userId}`);
    return { connected: true };
  }

  /**
   * Disconnect Google Calendar (revoke token)
   */
  async disconnect(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { googleCalendarToken: null },
    });
    this.logger.log(`Google Calendar disconnected for user ${userId}`);
    return { disconnected: true };
  }

  /**
   * Check if user has Google Calendar connected
   */
  async isConnected(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleCalendarToken: true },
    });
    return !!user?.googleCalendarToken;
  }

  /**
   * Create a calendar event for a booking (fire-and-forget)
   */
  async createBookingEvent(userId: string, booking: {
    name: string;
    email: string;
    phone?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    notes?: string;
    duration?: number; // minutes
  }) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { googleCalendarToken: true },
      });

      if (!user?.googleCalendarToken) return; // Not connected

      const tokens = JSON.parse(user.googleCalendarToken);
      const oauth2 = this.getOAuth2Client();
      oauth2.setCredentials(tokens);

      // Refresh token if needed
      if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        const { credentials } = await oauth2.refreshAccessToken();
        oauth2.setCredentials(credentials);
        await this.prisma.user.update({
          where: { id: userId },
          data: { googleCalendarToken: JSON.stringify(credentials) },
        });
      }

      const calendar = google.calendar({ version: 'v3', auth: oauth2 });
      const durationMinutes = booking.duration || 30;

      // Build start/end datetime
      const startDateTime = new Date(`${booking.date}T${booking.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

      const description = [
        `📧 ${booking.email}`,
        booking.phone ? `📱 ${booking.phone}` : '',
        booking.notes ? `\n📝 ${booking.notes}` : '',
        '\n—\nAgendado via CraftCard',
      ].filter(Boolean).join('\n');

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Agendamento CraftCard — ${booking.name}`,
          description,
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'America/Sao_Paulo',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'email', minutes: 30 },
            ],
          },
          colorId: '9', // Blueberry
        },
      });

      this.logger.log(`Google Calendar event created for booking: ${booking.name} on ${booking.date} ${booking.time}`);
    } catch (err) {
      this.logger.warn(`Failed to create Google Calendar event: ${err}`);
      // Non-critical — don't fail the booking
    }
  }
}
