import { test, expect } from '@playwright/test';

/**
 * All ProtectedRoute-wrapped pages should redirect unauthenticated users
 * to login. AdminRoute (which wraps /admin) is tested separately.
 */

const protectedPaths = [
  '/editor',
  '/billing',
  '/billing/success',
  '/tutorial',
  '/webhooks',
  '/org/some-fake-org-id',
  '/org/join/some-fake-token',
];

test.describe('Protected Routes — redirect to login', () => {
  for (const path of protectedPaths) {
    test(`${path} should redirect to login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/(login|$)/, { timeout: 15_000 });
      const url = page.url();
      expect(url.includes(path)).toBe(false);
    });
  }
});
