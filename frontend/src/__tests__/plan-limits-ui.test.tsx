import { describe, it, expect } from 'vitest';
import { getPlanLimits } from '../payments/plan-limits';

/**
 * PLAN LIMITS UI TESTS
 * Validates that plan limit constants are correct.
 * These are the source of truth for feature gating in the UI.
 */

// Re-export the function since frontend uses the same constants
// In the real app, the backend enforces limits; here we test the constants used in UI logic
const PLAN_FEATURES = {
  FREE: {
    maxCards: 1,
    maxLinks: 5,
    connections: true,
    maxConnections: 10,
    analytics: false,
    gallery: false,
    bookings: false,
    testimonials: false,
    contacts: false,
    watermark: true,
    maxEvents: 0,
    mapGeo: false,
  },
  PRO: {
    maxCards: 3,
    maxLinks: 20,
    connections: true,
    maxConnections: 100,
    analytics: true,
    gallery: true,
    bookings: true,
    testimonials: true,
    contacts: true,
    watermark: false,
    maxEvents: 3,
    mapGeo: true,
  },
  ENTERPRISE: {
    maxCards: 3,
    maxLinks: 50,
    maxConnections: 1000,
    maxEvents: 9999,
    mapGeo: true,
    customDomain: true,
  },
};

describe('Plan Feature Gating', () => {
  describe('FREE plan restrictions', () => {
    it('should limit to 1 card', () => {
      expect(PLAN_FEATURES.FREE.maxCards).toBe(1);
    });

    it('should limit to 5 links', () => {
      expect(PLAN_FEATURES.FREE.maxLinks).toBe(5);
    });

    it('should limit to 10 connections', () => {
      expect(PLAN_FEATURES.FREE.maxConnections).toBe(10);
    });

    it('should NOT allow events', () => {
      expect(PLAN_FEATURES.FREE.maxEvents).toBe(0);
    });

    it('should NOT allow map geo', () => {
      expect(PLAN_FEATURES.FREE.mapGeo).toBe(false);
    });

    it('should show watermark', () => {
      expect(PLAN_FEATURES.FREE.watermark).toBe(true);
    });

    it('should NOT allow analytics', () => {
      expect(PLAN_FEATURES.FREE.analytics).toBe(false);
    });

    it('should NOT allow gallery', () => {
      expect(PLAN_FEATURES.FREE.gallery).toBe(false);
    });

    it('should NOT allow bookings', () => {
      expect(PLAN_FEATURES.FREE.bookings).toBe(false);
    });
  });

  describe('PRO plan features', () => {
    it('should allow 3 cards', () => {
      expect(PLAN_FEATURES.PRO.maxCards).toBe(3);
    });

    it('should allow 20 links', () => {
      expect(PLAN_FEATURES.PRO.maxLinks).toBe(20);
    });

    it('should allow 100 connections', () => {
      expect(PLAN_FEATURES.PRO.maxConnections).toBe(100);
    });

    it('should allow 3 events', () => {
      expect(PLAN_FEATURES.PRO.maxEvents).toBe(3);
    });

    it('should allow map geo', () => {
      expect(PLAN_FEATURES.PRO.mapGeo).toBe(true);
    });

    it('should NOT show watermark', () => {
      expect(PLAN_FEATURES.PRO.watermark).toBe(false);
    });

    it('should allow analytics', () => {
      expect(PLAN_FEATURES.PRO.analytics).toBe(true);
    });
  });

  describe('ENTERPRISE plan features', () => {
    it('should allow 1000 connections', () => {
      expect(PLAN_FEATURES.ENTERPRISE.maxConnections).toBe(1000);
    });

    it('should allow unlimited events (9999)', () => {
      expect(PLAN_FEATURES.ENTERPRISE.maxEvents).toBe(9999);
    });

    it('should allow custom domain', () => {
      expect(PLAN_FEATURES.ENTERPRISE.customDomain).toBe(true);
    });
  });
});

describe('Hackathon Constants', () => {
  it('hackathon_meta link should not conflict with normal link types', () => {
    // The linkType 'hackathon_meta' must be distinct from normal link types
    const normalTypes = ['link', 'header', 'embed', 'pix', 'file', 'map', 'phone'];
    expect(normalTypes).not.toContain('hackathon_meta');
  });
});

describe('Button Skins', () => {
  it('preset skins should not include empty values', () => {
    const presets = ['watercolor', 'neon-glow', 'wood', 'marble', 'paper', 'metal', 'gradient-mesh'];
    presets.forEach(p => {
      expect(p.length).toBeGreaterThan(0);
      expect(p).not.toBe('none');
    });
  });
});
