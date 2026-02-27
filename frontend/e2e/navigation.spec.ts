import { test, expect } from '@playwright/test';

test.describe('Landing Page Navigation', () => {
  test('should have working CTA button that navigates to login', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /criar/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await page.waitForURL(/\/(login|editor)/, { timeout: 15_000 });
  });

  test('should have visible pricing section with plan cards', async ({ page }) => {
    await page.goto('/');
    const pricing = page.locator('text=Gratis para sempre');
    await expect(pricing).toBeVisible({ timeout: 10_000 });
    // PRO plan should also appear
    const proPlan = page.locator('text=/PRO/i').first();
    await expect(proPlan).toBeVisible();
  });

  test('should have footer with relevant links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10_000 });
  });

  test('should load landing page under 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5_000);
  });

  test('should render login page with Google auth option', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const googleBtn = page.locator('text=/Continuar|Google/i');
    await expect(googleBtn.first()).toBeVisible({ timeout: 15_000 });
  });
});
