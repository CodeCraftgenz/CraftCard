import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should redirect unauthenticated user from /editor to login', async ({ page }) => {
    await page.goto('/editor');
    // Should redirect to login or show login page
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
    const url = page.url();
    expect(url.includes('/editor')).toBe(false);
  });

  test('should render login page elements', async ({ page }) => {
    await page.goto('/login');
    // The login page should render (Google SDK button or fallback "Continuar com Google")
    // Check for the page container rather than specific Google SDK elements
    await page.waitForLoadState('networkidle');
    const loginContent = page.locator('text=/Continuar|Google|Login|Entrar/i');
    await expect(loginContent.first()).toBeVisible({ timeout: 15_000 });
  });

  test('should redirect unauthenticated user from /billing to login', async ({ page }) => {
    await page.goto('/billing');
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
    const url = page.url();
    expect(url.includes('/billing')).toBe(false);
  });
});
