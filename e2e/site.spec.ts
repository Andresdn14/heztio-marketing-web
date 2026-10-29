import { test, expect } from '@playwright/test';

test('no dead "#" links and all anchors resolve', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.$$eval('a', (as) =>
    as.filter((a) => !a.closest('.legal')).map((a) => a.getAttribute('href') || ''));
  expect(hrefs.filter((h) => h === '#' || h === '')).toEqual([]);
  for (const h of hrefs.filter((h) => h.startsWith('#'))) {
    expect(await page.locator(h).count(), h).toBeGreaterThan(0);
  }
});

test('external and asset links respond', async ({ page, request }) => {
  await page.goto('/');
  const urls = await page.$$eval('a[href^="http"], img[src], link[href]:not([rel=preconnect])', (els) =>
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

for (const slug of ['terminos', 'privacidad', 'tratamiento-de-datos']) {
  test(`legal page /${slug}: 200 (clean + .html), footer links, 375px`, async ({ page, request }) => {
    expect((await request.get(`/${slug}`)).status()).toBe(200);
    expect((await request.get(`/${slug}.html`)).status()).toBeLessThan(400);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/${slug}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Vigente desde: 28 de octubre de 2026')).toBeVisible();
    for (const h of ['/terminos', '/privacidad', '/tratamiento-de-datos']) {
      await expect(page.locator(`.legal a[href="${h}"]`)).toHaveCount(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

test('home footer legal links point at the legal pages', async ({ page }) => {
  await page.goto('/');
  for (const h of ['/terminos', '/privacidad', '/tratamiento-de-datos']) {
    await expect(page.locator(`.legal a[href="${h}"]`)).toHaveCount(1);
  }
});
