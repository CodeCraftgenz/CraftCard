import { getPlanLimits, hasFeature, FREE_THEMES } from './plan-limits';

describe('plan-limits', () => {
  describe('getPlanLimits', () => {
    it('should return FREE limits for FREE plan', () => {
      const limits = getPlanLimits('FREE');
      expect(limits.maxCards).toBe(1);
      expect(limits.maxLinks).toBe(5);
      expect(limits.maxThemes).toBe(3);
      expect(limits.analytics).toBe(false);
      expect(limits.watermark).toBe(true);
    });

    it('should return PRO limits for PRO plan', () => {
      const limits = getPlanLimits('PRO');
      expect(limits.maxCards).toBe(3);
      expect(limits.maxLinks).toBe(20);
      expect(limits.maxThemes).toBe('all');
      expect(limits.analytics).toBe(true);
      expect(limits.watermark).toBe(false);
      expect(limits.gallery).toBe(true);
      expect(limits.bookings).toBe(true);
    });

    it('should return BUSINESS limits for BUSINESS plan', () => {
      const limits = getPlanLimits('BUSINESS');
      expect(limits.maxCards).toBe(1);
      expect(limits.maxLinks).toBe(50);
      expect(limits.orgDashboard).toBe(true);
      expect(limits.branding).toBe(true);
      expect(limits.webhooks).toBe(true);
    });

    it('should return ENTERPRISE limits with customDomain', () => {
      const limits = getPlanLimits('ENTERPRISE');
      expect(limits.customDomain).toBe(true);
      expect(limits.webhooks).toBe(true);
      expect(limits.orgDashboard).toBe(true);
    });

    it('should fallback to FREE for unknown plan', () => {
      const limits = getPlanLimits('UNKNOWN');
      expect(limits.maxCards).toBe(1);
      expect(limits.maxLinks).toBe(5);
      expect(limits.analytics).toBe(false);
    });

    it('should fallback to FREE for empty string', () => {
      const limits = getPlanLimits('');
      expect(limits.maxCards).toBe(1);
    });
  });

  describe('hasFeature', () => {
    it('should return false for analytics on FREE', () => {
      expect(hasFeature('FREE', 'analytics')).toBe(false);
    });

    it('should return true for analytics on PRO', () => {
      expect(hasFeature('PRO', 'analytics')).toBe(true);
    });

    it('should return true for numeric/string limits (maxCards)', () => {
      expect(hasFeature('FREE', 'maxCards')).toBe(true);
    });

    it('should return false for orgDashboard on PRO', () => {
      expect(hasFeature('PRO', 'orgDashboard')).toBe(false);
    });

    it('should return true for orgDashboard on BUSINESS', () => {
      expect(hasFeature('BUSINESS', 'orgDashboard')).toBe(true);
    });
  });

  describe('FREE_THEMES', () => {
    it('should include default, gradient, minimal', () => {
      expect(FREE_THEMES).toContain('default');
      expect(FREE_THEMES).toContain('gradient');
      expect(FREE_THEMES).toContain('minimal');
    });

    it('should not include premium themes', () => {
      expect(FREE_THEMES).not.toContain('glass');
      expect(FREE_THEMES).not.toContain('neon');
    });

    it('should have exactly 3 free themes', () => {
      expect(FREE_THEMES).toHaveLength(3);
    });
  });
});
