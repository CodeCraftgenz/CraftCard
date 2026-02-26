import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should render hero section with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /criar/i })).toBeVisible();
  });

  test('should render pricing section', async ({ page }) => {
    await page.goto('/');
    const pricing = page.locator('text=Gratis para sempre');
    await expect(pricing).toBeVisible({ timeout: 10_000 });
  });

  test('should render FAQ section', async ({ page }) => {
    await page.goto('/');
    const faq = page.locator('text=Perguntas');
    await expect(faq).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
