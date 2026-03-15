import { getPlanLimits, type PlanLimits, type PlanType } from './plan-limits';

/**
 * PLAN LIMITS MATRIX — Exhaustive Feature Gating Tests
 * Tests EVERY feature for EVERY plan to guarantee correct access control.
 * Total: ~80 tests across 4 plans × 20 features
 */

const PLANS: PlanType[] = ['FREE', 'PRO', 'BUSINESS', 'ENTERPRISE'];

describe('Plan Limits Matrix — Exhaustive Feature Gating', () => {

  // ── FREE Plan ──────────────────────────────────────────

  describe('FREE Plan', () => {
    let limits: PlanLimits;
    beforeAll(() => { limits = getPlanLimits('FREE'); });

    // Card limits
    it('should allow max 1 card', () => expect(limits.maxCards).toBe(1));
    it('should allow max 5 links', () => expect(limits.maxLinks).toBe(5));
    it('should allow max 3 themes', () => expect(limits.maxThemes).toBe(3));
    it('should allow publishing', () => expect(limits.canPublish).toBe(true));

    // Feature blocks
    it('should BLOCK analytics', () => expect(limits.analytics).toBe(false));
    it('should BLOCK gallery', () => expect(limits.gallery).toBe(false));
    it('should BLOCK bookings', () => expect(limits.bookings).toBe(false));
    it('should BLOCK testimonials', () => expect(limits.testimonials).toBe(false));
    it('should BLOCK contacts', () => expect(limits.contacts).toBe(false));
    it('should BLOCK services', () => expect(limits.services).toBe(false));
    it('should BLOCK faq', () => expect(limits.faq).toBe(false));
    it('should BLOCK resume', () => expect(limits.resume).toBe(false));
    it('should BLOCK video', () => expect(limits.video).toBe(false));
    it('should SHOW watermark', () => expect(limits.watermark).toBe(true));
    it('should BLOCK custom fonts', () => expect(limits.customFonts).toBe(false));
    it('should BLOCK custom backgrounds', () => expect(limits.customBg).toBe(false));
    it('should BLOCK leads export', () => expect(limits.leadsExport).toBe(false));
    it('should BLOCK org dashboard', () => expect(limits.orgDashboard).toBe(false));
    it('should BLOCK branding', () => expect(limits.branding).toBe(false));
    it('should BLOCK custom domain', () => expect(limits.customDomain).toBe(false));
    it('should BLOCK webhooks', () => expect(limits.webhooks).toBe(false));

    // Connections
    it('should ALLOW connections', () => expect(limits.connections).toBe(true));
    it('should limit to 10 connections', () => expect(limits.maxConnections).toBe(10));

    // Events
    it('should allow 0 events', () => expect(limits.maxEvents).toBe(0));
    it('should BLOCK map geo', () => expect(limits.mapGeo).toBe(false));
  });

  // ── PRO Plan ───────────────────────────────────────────

  describe('PRO Plan', () => {
    let limits: PlanLimits;
    beforeAll(() => { limits = getPlanLimits('PRO'); });

    it('should allow max 3 cards', () => expect(limits.maxCards).toBe(3));
    it('should allow max 20 links', () => expect(limits.maxLinks).toBe(20));
    it('should allow ALL themes', () => expect(limits.maxThemes).toBe('all'));
    it('should ALLOW analytics', () => expect(limits.analytics).toBe(true));
    it('should ALLOW gallery', () => expect(limits.gallery).toBe(true));
    it('should ALLOW bookings', () => expect(limits.bookings).toBe(true));
    it('should ALLOW testimonials', () => expect(limits.testimonials).toBe(true));
    it('should ALLOW contacts', () => expect(limits.contacts).toBe(true));
    it('should ALLOW services', () => expect(limits.services).toBe(true));
    it('should ALLOW faq', () => expect(limits.faq).toBe(true));
    it('should ALLOW resume', () => expect(limits.resume).toBe(true));
    it('should ALLOW video', () => expect(limits.video).toBe(true));
    it('should NOT show watermark', () => expect(limits.watermark).toBe(false));
    it('should ALLOW custom fonts', () => expect(limits.customFonts).toBe(true));
    it('should ALLOW custom backgrounds', () => expect(limits.customBg).toBe(true));
    it('should ALLOW leads export', () => expect(limits.leadsExport).toBe(true));
    it('should BLOCK org dashboard', () => expect(limits.orgDashboard).toBe(false));
    it('should BLOCK branding', () => expect(limits.branding).toBe(false));
    it('should BLOCK custom domain', () => expect(limits.customDomain).toBe(false));
    it('should BLOCK webhooks', () => expect(limits.webhooks).toBe(false));
    it('should limit to 100 connections', () => expect(limits.maxConnections).toBe(100));
    it('should allow 3 events', () => expect(limits.maxEvents).toBe(3));
    it('should ALLOW map geo', () => expect(limits.mapGeo).toBe(true));
  });

  // ── BUSINESS Plan ──────────────────────────────────────

  describe('BUSINESS Plan', () => {
    let limits: PlanLimits;
    beforeAll(() => { limits = getPlanLimits('BUSINESS'); });

    it('should allow max 3 cards', () => expect(limits.maxCards).toBe(3));
    it('should allow max 50 links', () => expect(limits.maxLinks).toBe(50));
    it('should allow ALL themes', () => expect(limits.maxThemes).toBe('all'));
    it('should ALLOW analytics', () => expect(limits.analytics).toBe(true));
    it('should ALLOW gallery', () => expect(limits.gallery).toBe(true));
    it('should ALLOW bookings', () => expect(limits.bookings).toBe(true));
    it('should ALLOW testimonials', () => expect(limits.testimonials).toBe(true));
    it('should ALLOW contacts', () => expect(limits.contacts).toBe(true));
    it('should ALLOW services', () => expect(limits.services).toBe(true));
    it('should ALLOW faq', () => expect(limits.faq).toBe(true));
    it('should ALLOW resume', () => expect(limits.resume).toBe(true));
    it('should ALLOW video', () => expect(limits.video).toBe(true));
    it('should NOT show watermark', () => expect(limits.watermark).toBe(false));
    it('should ALLOW custom fonts', () => expect(limits.customFonts).toBe(true));
    it('should ALLOW custom backgrounds', () => expect(limits.customBg).toBe(true));
    it('should ALLOW leads export', () => expect(limits.leadsExport).toBe(true));
    it('should ALLOW org dashboard', () => expect(limits.orgDashboard).toBe(true));
    it('should ALLOW branding', () => expect(limits.branding).toBe(true));
    it('should BLOCK custom domain', () => expect(limits.customDomain).toBe(false));
    it('should ALLOW webhooks', () => expect(limits.webhooks).toBe(true));
    it('should limit to 500 connections', () => expect(limits.maxConnections).toBe(500));
    it('should allow 10 events', () => expect(limits.maxEvents).toBe(10));
    it('should ALLOW map geo', () => expect(limits.mapGeo).toBe(true));
  });

  // ── ENTERPRISE Plan ────────────────────────────────────

  describe('ENTERPRISE Plan', () => {
    let limits: PlanLimits;
    beforeAll(() => { limits = getPlanLimits('ENTERPRISE'); });

    it('should allow max 3 cards', () => expect(limits.maxCards).toBe(3));
    it('should allow max 50 links', () => expect(limits.maxLinks).toBe(50));
    it('should allow ALL themes', () => expect(limits.maxThemes).toBe('all'));
    it('should ALLOW analytics', () => expect(limits.analytics).toBe(true));
    it('should ALLOW gallery', () => expect(limits.gallery).toBe(true));
    it('should ALLOW bookings', () => expect(limits.bookings).toBe(true));
    it('should ALLOW testimonials', () => expect(limits.testimonials).toBe(true));
    it('should ALLOW contacts', () => expect(limits.contacts).toBe(true));
    it('should ALLOW services', () => expect(limits.services).toBe(true));
    it('should ALLOW faq', () => expect(limits.faq).toBe(true));
    it('should ALLOW resume', () => expect(limits.resume).toBe(true));
    it('should ALLOW video', () => expect(limits.video).toBe(true));
    it('should NOT show watermark', () => expect(limits.watermark).toBe(false));
    it('should ALLOW custom fonts', () => expect(limits.customFonts).toBe(true));
    it('should ALLOW custom backgrounds', () => expect(limits.customBg).toBe(true));
    it('should ALLOW leads export', () => expect(limits.leadsExport).toBe(true));
    it('should ALLOW org dashboard', () => expect(limits.orgDashboard).toBe(true));
    it('should ALLOW branding', () => expect(limits.branding).toBe(true));
    it('should ALLOW custom domain', () => expect(limits.customDomain).toBe(true));
    it('should ALLOW webhooks', () => expect(limits.webhooks).toBe(true));
    it('should limit to 1000 connections', () => expect(limits.maxConnections).toBe(1000));
    it('should allow 9999 events', () => expect(limits.maxEvents).toBe(9999));
    it('should ALLOW map geo', () => expect(limits.mapGeo).toBe(true));
  });

  // ── Cross-Plan Escalation Tests ────────────────────────

  describe('Plan Escalation', () => {
    it('PRO should have MORE links than FREE', () => {
      expect(getPlanLimits('PRO').maxLinks).toBeGreaterThan(getPlanLimits('FREE').maxLinks);
    });

    it('BUSINESS should have MORE links than PRO', () => {
      expect(getPlanLimits('BUSINESS').maxLinks).toBeGreaterThan(getPlanLimits('PRO').maxLinks);
    });

    it('ENTERPRISE should have MORE connections than BUSINESS', () => {
      expect(getPlanLimits('ENTERPRISE').maxConnections).toBeGreaterThan(getPlanLimits('BUSINESS').maxConnections);
    });

    it('ENTERPRISE should have MORE events than BUSINESS', () => {
      expect(getPlanLimits('ENTERPRISE').maxEvents).toBeGreaterThan(getPlanLimits('BUSINESS').maxEvents);
    });

    it('only ENTERPRISE should have custom domain', () => {
      expect(getPlanLimits('FREE').customDomain).toBe(false);
      expect(getPlanLimits('PRO').customDomain).toBe(false);
      expect(getPlanLimits('BUSINESS').customDomain).toBe(false);
      expect(getPlanLimits('ENTERPRISE').customDomain).toBe(true);
    });

    it('only FREE should show watermark', () => {
      expect(getPlanLimits('FREE').watermark).toBe(true);
      expect(getPlanLimits('PRO').watermark).toBe(false);
      expect(getPlanLimits('BUSINESS').watermark).toBe(false);
      expect(getPlanLimits('ENTERPRISE').watermark).toBe(false);
    });

    it('BUSINESS and ENTERPRISE should have org dashboard', () => {
      expect(getPlanLimits('FREE').orgDashboard).toBe(false);
      expect(getPlanLimits('PRO').orgDashboard).toBe(false);
      expect(getPlanLimits('BUSINESS').orgDashboard).toBe(true);
      expect(getPlanLimits('ENTERPRISE').orgDashboard).toBe(true);
    });

    it('unknown plan should default to FREE', () => {
      const limits = getPlanLimits('INVALID_PLAN');
      expect(limits.maxCards).toBe(1);
      expect(limits.maxLinks).toBe(5);
      expect(limits.maxConnections).toBe(10);
    });
  });

  // ── Numeric Boundary Tests ─────────────────────────────

  describe('Boundary Values', () => {
    for (const plan of PLANS) {
      it(`${plan}: maxCards should be positive`, () => {
        expect(getPlanLimits(plan).maxCards).toBeGreaterThan(0);
      });

      it(`${plan}: maxLinks should be positive`, () => {
        expect(getPlanLimits(plan).maxLinks).toBeGreaterThan(0);
      });

      it(`${plan}: maxConnections should be positive`, () => {
        expect(getPlanLimits(plan).maxConnections).toBeGreaterThan(0);
      });

      it(`${plan}: maxEvents should be >= 0`, () => {
        expect(getPlanLimits(plan).maxEvents).toBeGreaterThanOrEqual(0);
      });
    }
  });
});
