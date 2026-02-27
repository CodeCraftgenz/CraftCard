import { test, expect } from '@playwright/test';

test.describe('Admin Page', () => {
  test('should redirect unauthenticated user from /admin to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/(login|$)/, { timeout: 15_000 });
    const url = page.url();
    expect(url.includes('/admin')).toBe(false);
  });

  test('should show login page content after admin redirect', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/\/(login|$)/, { timeout: 15_000 });
    await page.waitForLoadState('networkidle');
    const loginContent = page.locator('text=/Continuar|Google|Login|Entrar/i');
    await expect(loginContent.first()).toBeVisible({ timeout: 15_000 });
  });
});
