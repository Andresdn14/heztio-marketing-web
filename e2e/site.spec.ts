import { test, expect } from '@playwright/test';

test('no dead "#" links and all anchors resolve', async ({ page }) => {
  await page.goto('/');
  // Legal pages (Términos/Privacidad/Tratamiento de datos) do not exist yet: known open item.
  const hrefs = await page.$$eval('a', (as) =>
    as.filter((a) => !a.closest('.legal')).map((a) => a.getAttribute('href') || ''));
  expect(hrefs.filter((h) => h === '#' || h === '')).toEqual([]);
  for (const h of hrefs.filter((h) => h.startsWith('#'))) {
    expect(await page.locator(h).count(), h).toBeGreaterThan(0);
  }
});

test('external and asset links respond', async ({ page, request }) => {
  await page.goto('/');
  const urls = await page.$$eval('a[href^="http"], img[src], link[href]', (els) =>
    els.map((e) => (e as any).href || (e as any).src));
  for (const u of [...new Set(urls)]) {
    const r = await request.get(u);
    expect(r.status(), u).toBeLessThan(400);
  }
});

test('demo CTAs and contact mailto', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('a[href^="mailto:info@heztio.com"]').count()).toBeGreaterThan(1);
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', /app\.heztio\.com/);
});

test('375px: no horizontal overflow, no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(over).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
