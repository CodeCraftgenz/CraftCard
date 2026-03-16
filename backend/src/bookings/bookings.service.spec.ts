import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InAppNotificationsService } from '../notifications/in-app-notifications.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { GoogleCalendarService } from './google-calendar.service';

const PROFILE_ID = 'profile-1';
const USER_ID = 'user-1';
const BOOKING_ID = 'booking-1';

function makePrisma() {
  return {
    profile: { findFirst: jest.fn() },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    availableSlot: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(async (ops: unknown[]) => Promise.all((ops as Promise<unknown>[])))
  };
}

function makeProfile(overrides = {}) {
  return {
    id: PROFILE_ID,
    userId: USER_ID,
    isPublished: true,
    displayName: 'Joao Silva',
    bookingEnabled: true,
    user: { email: 'owner@example.com' },
    availableSlots: [],
    ...overrides,
  };
}

function makeBooking(overrides = {}) {
  return {
    id: BOOKING_ID,
    profileId: PROFILE_ID,
    name: 'Maria Guest',
    email: 'guest@example.com',
    phone: null,
    date: new Date('2026-03-20'),
    time: '14:00',
    status: 'pending',
    notes: null,
    googleEventId: null,
    reminderSentAt: null,
    ...overrides,
  };
}

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: ReturnType<typeof makePrisma>;
  let mailMock: jest.Mocked<Pick<MailService, 'sendBookingNotification' | 'sendBookingConfirmationToGuest' | 'sendBookingReminder'>>;
  let notifMock: { sendToUser: jest.Mock };
  let inAppMock: { create: jest.Mock };
  let webhookMock: { dispatch: jest.Mock };
  let calendarMock: { createBookingEvent: jest.Mock; deleteBookingEvent: jest.Mock };

  beforeEach(async () => {
    prisma = makePrisma();
    mailMock = {
      sendBookingNotification: jest.fn().mockResolvedValue(undefined),
      sendBookingConfirmationToGuest: jest.fn().mockResolvedValue(undefined),
      sendBookingReminder: jest.fn().mockResolvedValue(undefined),
    };
    notifMock = { sendToUser: jest.fn().mockResolvedValue(undefined) };
    inAppMock = { create: jest.fn().mockResolvedValue(undefined) };
    webhookMock = { dispatch: jest.fn().mockResolvedValue(undefined) };
    calendarMock = {
      createBookingEvent: jest.fn().mockResolvedValue('gcal-event-id'),
      deleteBookingEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mailMock },
        { provide: NotificationsService, useValue: notifMock },
        { provide: InAppNotificationsService, useValue: inAppMock },
        { provide: WebhooksService, useValue: webhookMock },
        { provide: GoogleCalendarService, useValue: calendarMock },
      ],
    }).compile();

    service = module.get(BookingsService);
  });

  // ────────────────────────────────────────────────────────────────
  // getSlots
  // ────────────────────────────────────────────────────────────────

  describe('getSlots', () => {
    it('returns slots for a published profile with booking enabled', async () => {
      const slots = [{ id: 's1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', duration: 30 }];
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ availableSlots: slots }));
      const result = await service.getSlots('joao-silva');
      expect(result).toEqual(slots);
    });

    it('returns empty array when profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      expect(await service.getSlots('unknown')).toEqual([]);
    });

    it('returns empty array when profile is not published', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ isPublished: false }));
      expect(await service.getSlots('joao')).toEqual([]);
    });

    it('returns empty array when booking is disabled', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ bookingEnabled: false }));
      expect(await service.getSlots('joao')).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // createBooking
  // ────────────────────────────────────────────────────────────────

  describe('createBooking', () => {
    const INPUT = { name: 'Maria Guest', email: 'guest@example.com', date: '2026-03-20', time: '14:00' };

    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.booking.findFirst.mockResolvedValue(null); // no conflict
      prisma.booking.create.mockResolvedValue(makeBooking({ id: 'new-booking' }));
    });

    it('creates a booking and returns it', async () => {
      const result = await service.createBooking('joao-silva', INPUT);
      expect(prisma.booking.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('new-booking');
    });

    it('throws 404 when profile does not exist', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.createBooking('ghost', INPUT)).rejects.toThrow();
    });

    it('throws 404 when profile is not published', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ isPublished: false }));
      await expect(service.createBooking('joao', INPUT)).rejects.toThrow();
    });

    it('throws conflict when slot is already taken', async () => {
      prisma.booking.findFirst.mockResolvedValue(makeBooking());
      await expect(service.createBooking('joao', INPUT)).rejects.toThrow();
    });

    it('sends email to owner', async () => {
      await service.createBooking('joao-silva', INPUT);
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendBookingNotification).toHaveBeenCalledWith(
        'owner@example.com', 'Maria Guest', expect.any(String), '14:00'
      );
    });

    it('sends confirmation email to guest', async () => {
      await service.createBooking('joao-silva', INPUT);
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendBookingConfirmationToGuest).toHaveBeenCalledWith(
        expect.objectContaining({ guestEmail: 'guest@example.com', guestName: 'Maria Guest' })
      );
    });

    it('sends push notification to owner', async () => {
      await service.createBooking('joao-silva', INPUT);
      await new Promise(r => setTimeout(r, 10));
      expect(notifMock.sendToUser).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ title: 'Novo agendamento!' }));
    });

    it('dispatches webhook event', async () => {
      await service.createBooking('joao-silva', INPUT);
      await new Promise(r => setTimeout(r, 10));
      expect(webhookMock.dispatch).toHaveBeenCalledWith(USER_ID, 'new_booking', expect.any(Object));
    });

    it('includes phone and notes when provided', async () => {
      const input = { ...INPUT, phone: '35999358856', notes: 'Consulta inicial' };
      await service.createBooking('joao-silva', input);
      expect(prisma.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ phone: '35999358856', notes: 'Consulta inicial' }),
        })
      );
    });

    it('does NOT send email to owner when profile has no user email', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ user: null }));
      await service.createBooking('joao-silva', INPUT);
      await new Promise(r => setTimeout(r, 10));
      expect(mailMock.sendBookingNotification).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // getMyBookings
  // ────────────────────────────────────────────────────────────────

  describe('getMyBookings', () => {
    it('returns bookings for primary profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.booking.findMany.mockResolvedValue([makeBooking()]);
      const result = await service.getMyBookings(USER_ID);
      expect(result).toHaveLength(1);
    });

    it('throws 404 when primary profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.getMyBookings(USER_ID)).rejects.toThrow();
    });

    it('returns empty array when no bookings exist', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.booking.findMany.mockResolvedValue([]);
      expect(await service.getMyBookings(USER_ID)).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // updateBookingStatus
  // ────────────────────────────────────────────────────────────────

  describe('updateBookingStatus', () => {
    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.booking.findUnique.mockResolvedValue(makeBooking());
      prisma.booking.update.mockResolvedValue(makeBooking({ status: 'confirmed' }));
    });

    it('updates status to confirmed', async () => {
      const result = await service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed');
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'confirmed' } })
      );
      expect(result.status).toBe('confirmed');
    });

    it('syncs to Google Calendar when status is confirmed', async () => {
      await service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed');
      await new Promise(r => setTimeout(r, 10));
      expect(calendarMock.createBookingEvent).toHaveBeenCalled();
    });

    it('saves googleEventId after calendar sync', async () => {
      await service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed');
      await new Promise(r => setTimeout(r, 50));
      expect(prisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { googleEventId: 'gcal-event-id' } })
      );
    });

    it('does NOT sync to Google Calendar when status is cancelled', async () => {
      await service.updateBookingStatus(USER_ID, BOOKING_ID, 'cancelled');
      await new Promise(r => setTimeout(r, 10));
      expect(calendarMock.createBookingEvent).not.toHaveBeenCalled();
    });

    it('throws 404 when booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed')).rejects.toThrow();
    });

    it('throws 404 when booking belongs to another profile', async () => {
      prisma.booking.findUnique.mockResolvedValue(makeBooking({ profileId: 'other-profile' }));
      await expect(service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed')).rejects.toThrow();
    });

    it('throws 404 when user has no primary profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.updateBookingStatus(USER_ID, BOOKING_ID, 'confirmed')).rejects.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // deleteBooking
  // ────────────────────────────────────────────────────────────────

  describe('deleteBooking', () => {
    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.booking.findUnique.mockResolvedValue(makeBooking());
      prisma.booking.delete.mockResolvedValue(undefined);
    });

    it('deletes the booking successfully', async () => {
      const result = await service.deleteBooking(USER_ID, BOOKING_ID);
      expect(prisma.booking.delete).toHaveBeenCalledWith({ where: { id: BOOKING_ID } });
      expect(result).toEqual({ deleted: true });
    });

    it('deletes Google Calendar event when googleEventId exists', async () => {
      prisma.booking.findUnique.mockResolvedValue(makeBooking({ googleEventId: 'gcal-123' }));
      await service.deleteBooking(USER_ID, BOOKING_ID);
      await new Promise(r => setTimeout(r, 10));
      expect(calendarMock.deleteBookingEvent).toHaveBeenCalledWith(USER_ID, 'gcal-123');
    });

    it('does NOT call deleteBookingEvent when no googleEventId', async () => {
      await service.deleteBooking(USER_ID, BOOKING_ID);
      await new Promise(r => setTimeout(r, 10));
      expect(calendarMock.deleteBookingEvent).not.toHaveBeenCalled();
    });

    it('throws 404 when booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.deleteBooking(USER_ID, BOOKING_ID)).rejects.toThrow();
    });

    it('throws 404 when booking belongs to different profile', async () => {
      prisma.booking.findUnique.mockResolvedValue(makeBooking({ profileId: 'wrong-profile' }));
      await expect(service.deleteBooking(USER_ID, BOOKING_ID)).rejects.toThrow();
    });

    it('throws 404 when user has no primary profile', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.deleteBooking(USER_ID, BOOKING_ID)).rejects.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // saveSlots
  // ────────────────────────────────────────────────────────────────

  describe('saveSlots', () => {
    const SLOTS = [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', duration: 30 },
      { dayOfWeek: 3, startTime: '10:00', endTime: '16:00', duration: 60 },
    ];

    beforeEach(() => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile());
      prisma.availableSlot.deleteMany.mockResolvedValue({ count: 0 });
      prisma.availableSlot.create.mockResolvedValue({});
      prisma.$transaction.mockResolvedValue([]);
    });

    it('saves slots and returns success', async () => {
      const result = await service.saveSlots(USER_ID, SLOTS);
      expect(result).toEqual({ saved: true });
    });

    it('calls transaction with delete + creates', async () => {
      await service.saveSlots(USER_ID, SLOTS);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('throws 404 when primary profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.saveSlots(USER_ID, SLOTS)).rejects.toThrow();
    });

    it('accepts empty slot array (clears all slots)', async () => {
      const result = await service.saveSlots(USER_ID, []);
      expect(result).toEqual({ saved: true });
    });
  });

  // ────────────────────────────────────────────────────────────────
  // getAvailableTimes
  // ────────────────────────────────────────────────────────────────

  describe('getAvailableTimes', () => {
    // Use a fixed test date and compute dayOfWeek the same way the service does
    // (new Date(dateStr).getDay() uses local timezone — this keeps tests tz-agnostic)
    const TEST_DATE = '2026-03-19';
    const TEST_DAY_OF_WEEK = new Date(TEST_DATE).getDay();

    it('returns available times excluding already booked', async () => {
      const slot = { dayOfWeek: TEST_DAY_OF_WEEK, startTime: '09:00', endTime: '10:00', duration: 30 };
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ availableSlots: [slot] }));
      prisma.booking.findMany.mockResolvedValue([{ time: '09:00' }]); // 09:00 is booked
      const result = await service.getAvailableTimes('joao', TEST_DATE);
      expect(result).toContain('09:30');
      expect(result).not.toContain('09:00');
    });

    it('returns empty array when no slot configured for that day', async () => {
      // Use a different day so it won't match
      const differentDay = (TEST_DAY_OF_WEEK + 1) % 7;
      const slot = { dayOfWeek: differentDay, startTime: '09:00', endTime: '10:00', duration: 30 };
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ availableSlots: [slot] }));
      prisma.booking.findMany.mockResolvedValue([]);
      const result = await service.getAvailableTimes('joao', TEST_DATE);
      expect(result).toEqual([]);
    });

    it('throws 404 when profile not found', async () => {
      prisma.profile.findFirst.mockResolvedValue(null);
      await expect(service.getAvailableTimes('ghost', TEST_DATE)).rejects.toThrow();
    });

    it('throws 404 when profile is not published', async () => {
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ isPublished: false }));
      await expect(service.getAvailableTimes('joao', TEST_DATE)).rejects.toThrow();
    });

    it('returns all times when nothing is booked yet', async () => {
      const slot = { dayOfWeek: TEST_DAY_OF_WEEK, startTime: '09:00', endTime: '10:30', duration: 30 };
      prisma.profile.findFirst.mockResolvedValue(makeProfile({ availableSlots: [slot] }));
      prisma.booking.findMany.mockResolvedValue([]);
      const result = await service.getAvailableTimes('joao', TEST_DATE);
      expect(result).toEqual(['09:00', '09:30', '10:00']);
    });
  });
});
