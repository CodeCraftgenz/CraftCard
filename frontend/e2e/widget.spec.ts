import { test, expect } from '@playwright/test';

test.describe('Widget Page', () => {
  test('should load widget page for nonexistent slug without crashing', async ({ page }) => {
    const response = await page.goto('/widget/nonexistent-slug-widget-test', { timeout: 60_000 });
    // Page should load (200 from SPA) even if the profile doesn't exist
    expect(response?.status()).toBe(200);
  });

  test('should show empty or error state for nonexistent widget slug', async ({ page }) => {
    await page.goto('/widget/nonexistent-slug-widget-test2', { timeout: 60_000 });
    await page.waitForLoadState('networkidle');
    // Should not show an unhandled error — page should render gracefully
    const errorOverlay = page.locator('text=/Unhandled|Runtime Error/i');
    await expect(errorOverlay).not.toBeVisible({ timeout: 5_000 });
  });
});
