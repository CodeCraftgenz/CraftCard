import { test, expect } from '@playwright/test';

/**
 * E2E tests for public card 404 behavior.
 * Note: Tests against known slugs are unreliable when backend
 * (Render free tier) is cold-starting, so we focus on 404 flow.
 */

test.describe('Public Card - 404 behavior', () => {
  test('should show 404 text for nonexistent slug', async ({ page }) => {
    await page.goto('/this-slug-definitely-does-not-exist-xyz123', { timeout: 60_000 });
    await expect(page.locator('text=404')).toBeVisible({ timeout: 60_000 });
  });

  test('should show CTA link to create card on 404 page', async ({ page }) => {
    await page.goto('/nonexistent-slug-abc', { timeout: 60_000 });
    await expect(page.getByText(/Crie o seu/i)).toBeVisible({ timeout: 60_000 });
  });

  test('should show explanation message on 404 page', async ({ page }) => {
    await page.goto('/nonexistent-slug-def', { timeout: 60_000 });
    await expect(page.getByText(/Este cart/i)).toBeVisible({ timeout: 60_000 });
  });

  test('should render 404 on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/nonexistent-slug-mobile', { timeout: 60_000 });
    await expect(page.locator('text=404')).toBeVisible({ timeout: 60_000 });
  });
});
