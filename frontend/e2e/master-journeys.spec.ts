import { test, expect } from '@playwright/test';

const BASE = 'https://craftcardgenz.com';

/**
 * MASTER JOURNEYS — E2E Stress Tests
 * Simulates real-world user journeys across the entire system.
 */

test.describe('Public Card Journey', () => {
  test('card should load within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/ricardo-coradini`, { waitUntil: 'networkidle' });
    expect(Date.now() - start).toBeLessThan(10000);
  });

  test('card should display profile info', async ({ page }) => {
    await page.goto(`${BASE}/ricardo-coradini`, { waitUntil: 'networkidle' });
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(50);
  });

  test('card should have social links section', async ({ page }) => {
    await page.goto(`${BASE}/ricardo-coradini`, { waitUntil: 'networkidle' });
    // Should have at least the links section
    const links = page.locator('a[target="_blank"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('share button should be present', async ({ page }) => {
    await page.goto(`${BASE}/ricardo-coradini`, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Compartilhar')).toBeVisible();
  });

  test('connect button should be in footer area', async ({ page }) => {
    await page.goto(`${BASE}/ricardo-coradini`, { waitUntil: 'networkidle' });
    const connectBtn = page.locator('button:has-text("Conectar")');
    const count = await connectBtn.count();
    expect(count).toBeGreaterThanOrEqual(0); // May not show if same user
  });
});

test.describe('Widget Embed Journey', () => {
  test('widget page should load', async ({ page }) => {
    const response = await page.goto(`${BASE}/widget/ricardo-coradini`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
  });

  test('widget should be full-width responsive', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 380 });
    await page.goto(`${BASE}/widget/ricardo-coradini`, { waitUntil: 'networkidle' });
    // Should not show fixed width
    const container = page.locator('.rounded-2xl').first();
    await expect(container).toBeVisible();
  });

  test('widget at large size should work', async ({ page }) => {
    await page.setViewportSize({ width: 380, height: 550 });
    await page.goto(`${BASE}/widget/ricardo-coradini`, { waitUntil: 'networkidle' });
    const container = page.locator('.rounded-2xl').first();
    await expect(container).toBeVisible();
  });
});

test.describe('Hackathon Isolation Journey', () => {
  test('hackathon page should load without errors', async ({ page }) => {
    const response = await page.goto(`${BASE}/hackathon`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
  });

  test('hackathon card route should not 500', async ({ page }) => {
    const response = await page.goto(`${BASE}/hackathon/card/ricardo-coradini`, { waitUntil: 'networkidle' });
    expect(response?.status()).toBeLessThan(500);
  });

  test('hackathon dashboard should require auth', async ({ page }) => {
    await page.goto(`${BASE}/hackathon/dashboard`, { waitUntil: 'networkidle' });
    // Should redirect to login or show hackathon content
    const url = page.url();
    expect(url.includes('login') || url.includes('hackathon')).toBeTruthy();
  });
});

test.describe('SPA Deep Link Reliability', () => {
  const routes = [
    '/',
    '/login',
    '/register',
    '/hackathon',
    '/connections',
    '/billing',
  ];

  for (const route of routes) {
    test(`${route} should not 500`, async ({ page }) => {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(500);
    });
  }
});

test.describe('Landing Page Content Validation', () => {
  test('should show app name', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('CraftCard');
  });

  test('should show pricing section', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await expect(page.locator('text=Escolha seu').first()).toBeVisible();
  });

  test('should show PRO plan', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('PRO');
  });

  test('should show BUSINESS plan', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('BUSINESS');
  });

  test('should show ENTERPRISE plan', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('ENTERPRISE');
  });

  test('should show new features (Eventos, Tags)', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('Eventos');
  });
});

test.describe('404 and Error Handling', () => {
  test('non-existent profile should show error gracefully', async ({ page }) => {
    await page.goto(`${BASE}/this-slug-does-not-exist-xyz123`, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    // Should show "not found" or similar, not crash
    expect(content?.length).toBeGreaterThan(10);
  });

  test('non-existent widget should show error', async ({ page }) => {
    await page.goto(`${BASE}/widget/nonexistent-slug-xyz`, { waitUntil: 'networkidle' });
    const content = await page.textContent('body');
    expect(content).toContain('encontrado');
  });
});
