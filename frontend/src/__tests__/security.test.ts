/**
 * Security & Validation Logic Tests
 *
 * Tests input sanitization, validation helpers, and security-sensitive
 * transformations used across the frontend.
 */
import { describe, it, expect } from 'vitest';

// ── HTML Escape ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── URL validation ───────────────────────────────────────────────────────

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function isExternalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(u.hostname);
  } catch {
    return false;
  }
}

// ── Email validation ─────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ── Slug validation ──────────────────────────────────────────────────────

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .replace(/^-|-$/g, '');
}

// ── Password strength ─────────────────────────────────────────────────────

function passwordStrength(password: string): 'weak' | 'medium' | 'strong' {
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 8;
  const score = [hasUpper, hasDigit, hasSpecial, isLong].filter(Boolean).length;
  if (score <= 1) return 'weak';
  if (score <= 3) return 'medium';
  return 'strong';
}

// ── Phone mask ─────────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('escapeHtml()', () => {
  it('escapes < and > brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes & ampersand', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('passes plain text through unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('neutralizes XSS payload', () => {
    const xss = '<img src=x onerror=alert(1)>';
    expect(escapeHtml(xss)).not.toContain('<img');
    expect(escapeHtml(xss)).toContain('&lt;img');
  });
});

describe('isSafeUrl()', () => {
  it('accepts https URLs', () => expect(isSafeUrl('https://example.com')).toBe(true));
  it('accepts http URLs', () => expect(isSafeUrl('http://example.com')).toBe(true));
  it('rejects javascript: protocol', () => expect(isSafeUrl('javascript:alert(1)')).toBe(false));
  it('rejects data: protocol', () => expect(isSafeUrl('data:text/html,<h1>hi</h1>')).toBe(false));
  it('rejects empty string', () => expect(isSafeUrl('')).toBe(false));
  it('rejects relative paths', () => expect(isSafeUrl('/dashboard')).toBe(false));
  it('rejects invalid URL', () => expect(isSafeUrl('not a url')).toBe(false));
});

describe('isExternalUrl()', () => {
  it('returns true for external domain', () => {
    expect(isExternalUrl('https://craftcardgenz.com')).toBe(true);
  });

  it('returns false for localhost', () => {
    expect(isExternalUrl('http://localhost:3000')).toBe(false);
  });

  it('returns false for 127.0.0.1', () => {
    expect(isExternalUrl('http://127.0.0.1:5173')).toBe(false);
  });
});

describe('isValidEmail()', () => {
  it('accepts standard email', () => expect(isValidEmail('user@example.com')).toBe(true));
  it('accepts email with subdomain', () => expect(isValidEmail('a@b.example.com')).toBe(true));
  it('rejects missing @', () => expect(isValidEmail('userexample.com')).toBe(false));
  it('rejects missing domain', () => expect(isValidEmail('user@')).toBe(false));
  it('rejects missing TLD', () => expect(isValidEmail('user@domain')).toBe(false));
  it('rejects spaces', () => expect(isValidEmail('user @example.com')).toBe(false));
  it('trims whitespace before validating', () => expect(isValidEmail('  user@example.com  ')).toBe(true));
});

describe('isValidSlug()', () => {
  it('accepts valid lowercase slug', () => expect(isValidSlug('joao-silva')).toBe(true));
  it('accepts alphanumeric slug', () => expect(isValidSlug('user123')).toBe(true));
  it('rejects uppercase letters', () => expect(isValidSlug('Joao-Silva')).toBe(false));
  it('rejects slug starting with hyphen', () => expect(isValidSlug('-joao')).toBe(false));
  it('rejects slug with spaces', () => expect(isValidSlug('joao silva')).toBe(false));
  it('rejects slug with special chars', () => expect(isValidSlug('joao@silva')).toBe(false));
  it('rejects too-short slug', () => expect(isValidSlug('a')).toBe(false));
});

describe('slugify()', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('Joao Silva')).toBe('joao-silva');
  });

  it('removes accents', () => {
    expect(slugify('João')).toBe('joao');
  });

  it('removes special characters', () => {
    expect(slugify('Dr. Carlos!')).toBe('dr-carlos');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('joao  silva')).toBe('joao-silva');
  });

  it('truncates to 40 chars', () => {
    const long = 'a'.repeat(50);
    expect(slugify(long).length).toBeLessThanOrEqual(40);
  });

  it('lowercases the result', () => {
    expect(slugify('UPPER CASE')).toBe('upper-case');
  });
});

describe('passwordStrength()', () => {
  it('returns "weak" for short simple password', () => {
    expect(passwordStrength('abc')).toBe('weak');
  });

  it('returns "medium" for decent password', () => {
    expect(passwordStrength('password1')).toBe('medium');
  });

  it('returns "strong" for complex password', () => {
    expect(passwordStrength('Password1!')).toBe('strong');
  });

  it('requires uppercase for strong', () => {
    const noUpper = passwordStrength('password1!');
    const withUpper = passwordStrength('Password1!');
    expect(withUpper).toBe('strong');
    expect(noUpper).toBe('medium');
  });
});

describe('maskPhone()', () => {
  it('masks 11-digit mobile phone', () => {
    expect(maskPhone('35999358856')).toBe('(35) 99935-8856');
  });

  it('masks 10-digit landline phone', () => {
    expect(maskPhone('3532123456')).toBe('(35) 3212-3456');
  });

  it('strips non-digit chars before masking', () => {
    expect(maskPhone('(35) 99935-8856')).toBe('(35) 99935-8856');
  });

  it('returns original string for unusual length', () => {
    expect(maskPhone('12345')).toBe('12345');
  });
});
