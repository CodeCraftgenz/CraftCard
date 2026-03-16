/**
 * Booking Logic Tests
 *
 * Tests the pure booking business logic functions and data transformations.
 * No React components — pure functions only.
 */
import { describe, it, expect } from 'vitest';

// ── Booking status helpers ──────────────────────────────────────────────────

function isBookingPast(dateStr: string, time: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const bookingDate = new Date(y, m - 1, d, h, min);
  return bookingDate < new Date();
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'confirmed': return 'Confirmado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'green';
    case 'cancelled': return 'red';
    default: return 'yellow';
  }
}

// ── Time slot generation ──────────────────────────────────────────────────

function generateTimeSlots(startTime: string, endTime: string, duration: number): string[] {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const slots: string[] = [];
  for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

// ── Date formatting ──────────────────────────────────────────────────────

function formatBookingDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function sortBookingsByDate(bookings: Array<{ date: string; time: string }>): typeof bookings {
  return [...bookings].sort((a, b) => {
    const dateA = `${a.date}T${a.time}`;
    const dateB = `${b.date}T${b.time}`;
    return dateB.localeCompare(dateA); // newest first
  });
}

// ── Booking validation ─────────────────────────────────────────────────────

function validateBookingForm(data: { name: string; email: string; date: string; time: string }): string[] {
  const errors: string[] = [];
  if (!data.name || data.name.trim().length < 2) errors.push('name');
  if (!data.email || !data.email.includes('@')) errors.push('email');
  if (!data.date) errors.push('date');
  if (!data.time) errors.push('time');
  return errors;
}

// ── Day of week helpers ──────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
function getDayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? '?';
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('Booking Status', () => {
  it('returns "Pendente" for pending status', () => {
    expect(getStatusLabel('pending')).toBe('Pendente');
  });

  it('returns "Confirmado" for confirmed status', () => {
    expect(getStatusLabel('confirmed')).toBe('Confirmado');
  });

  it('returns "Cancelado" for cancelled status', () => {
    expect(getStatusLabel('cancelled')).toBe('Cancelado');
  });

  it('returns raw string for unknown status', () => {
    expect(getStatusLabel('unknown')).toBe('unknown');
  });

  it('returns green color for confirmed', () => {
    expect(getStatusColor('confirmed')).toBe('green');
  });

  it('returns red color for cancelled', () => {
    expect(getStatusColor('cancelled')).toBe('red');
  });

  it('returns yellow for pending', () => {
    expect(getStatusColor('pending')).toBe('yellow');
  });
});

describe('isBookingPast()', () => {
  it('returns true for a booking in the past', () => {
    expect(isBookingPast('2020-01-01', '09:00')).toBe(true);
  });

  it('returns false for a booking far in the future', () => {
    expect(isBookingPast('2099-12-31', '23:59')).toBe(false);
  });
});

describe('generateTimeSlots()', () => {
  it('generates slots from 09:00 to 10:00 with 30min duration', () => {
    const slots = generateTimeSlots('09:00', '10:00', 30);
    expect(slots).toEqual(['09:00', '09:30']);
  });

  it('generates single slot when duration equals window', () => {
    expect(generateTimeSlots('09:00', '09:30', 30)).toEqual(['09:00']);
  });

  it('returns empty array when window is smaller than duration', () => {
    expect(generateTimeSlots('09:00', '09:15', 30)).toEqual([]);
  });

  it('generates hourly slots for 09:00 to 12:00', () => {
    const slots = generateTimeSlots('09:00', '12:00', 60);
    expect(slots).toEqual(['09:00', '10:00', '11:00']);
  });

  it('generates 30min slots for full business day', () => {
    const slots = generateTimeSlots('09:00', '17:00', 30);
    expect(slots).toHaveLength(16); // 8 hours * 2
  });

  it('pads single-digit hours correctly', () => {
    const slots = generateTimeSlots('09:00', '10:00', 30);
    expect(slots[0]).toBe('09:00');
  });

  it('handles noon boundary correctly', () => {
    const slots = generateTimeSlots('11:30', '12:30', 30);
    expect(slots).toEqual(['11:30', '12:00']);
  });
});

describe('formatBookingDate()', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatBookingDate('2026-03-20')).toBe('20/03/2026');
  });

  it('handles ISO datetime string (truncates time)', () => {
    expect(formatBookingDate('2026-03-20T14:00:00.000Z')).toBe('20/03/2026');
  });
});

describe('sortBookingsByDate()', () => {
  it('sorts bookings newest first', () => {
    const bookings = [
      { date: '2026-01-01', time: '09:00' },
      { date: '2026-03-15', time: '14:00' },
      { date: '2026-02-10', time: '11:00' },
    ];
    const sorted = sortBookingsByDate(bookings);
    expect(sorted[0].date).toBe('2026-03-15');
    expect(sorted[2].date).toBe('2026-01-01');
  });

  it('does not mutate original array', () => {
    const original = [{ date: '2026-01-01', time: '09:00' }];
    sortBookingsByDate(original);
    expect(original).toHaveLength(1);
  });

  it('handles same date different times — later time first', () => {
    const bookings = [
      { date: '2026-03-20', time: '09:00' },
      { date: '2026-03-20', time: '14:00' },
    ];
    const sorted = sortBookingsByDate(bookings);
    expect(sorted[0].time).toBe('14:00');
  });
});

describe('validateBookingForm()', () => {
  const VALID = { name: 'Alice Santos', email: 'alice@example.com', date: '2026-03-20', time: '14:00' };

  it('returns empty array for valid data', () => {
    expect(validateBookingForm(VALID)).toHaveLength(0);
  });

  it('requires name with at least 2 chars', () => {
    expect(validateBookingForm({ ...VALID, name: 'A' })).toContain('name');
  });

  it('requires valid email with @', () => {
    expect(validateBookingForm({ ...VALID, email: 'invalidemail' })).toContain('email');
  });

  it('requires date', () => {
    expect(validateBookingForm({ ...VALID, date: '' })).toContain('date');
  });

  it('requires time', () => {
    expect(validateBookingForm({ ...VALID, time: '' })).toContain('time');
  });

  it('rejects empty name', () => {
    expect(validateBookingForm({ ...VALID, name: '' })).toContain('name');
  });

  it('accepts name with exactly 2 chars', () => {
    expect(validateBookingForm({ ...VALID, name: 'AB' })).not.toContain('name');
  });
});

describe('getDayLabel()', () => {
  it('returns Dom for 0', () => expect(getDayLabel(0)).toBe('Dom'));
  it('returns Seg for 1', () => expect(getDayLabel(1)).toBe('Seg'));
  it('returns Ter for 2', () => expect(getDayLabel(2)).toBe('Ter'));
  it('returns Qua for 3', () => expect(getDayLabel(3)).toBe('Qua'));
  it('returns Qui for 4', () => expect(getDayLabel(4)).toBe('Qui'));
  it('returns Sex for 5', () => expect(getDayLabel(5)).toBe('Sex'));
  it('returns Sab for 6', () => expect(getDayLabel(6)).toBe('Sab'));
  it('returns ? for unknown day', () => expect(getDayLabel(7)).toBe('?'));
});
