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

test('demo CTAs open the request modal; contact mailto + login stay', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('a[href^="mailto:info@heztio.com"]').count()).toBeGreaterThan(1);
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', /app\.heztio\.com\/login/);
  expect(await page.locator('a[href^="mailto:"][href*="demo"]').count()).toBe(0);
  for (const id of ['funciones', 'plataformas', 'reportes', 'ecosistema', 'faq', 'contacto']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  const cta = page.locator('.hero-actions [data-demo]');
  await cta.click();
  const dialog = page.getByRole('dialog', { name: 'Solicita tu demo' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#d-name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(cta).toBeFocused();
});

async function openAndFill(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('.hero-actions [data-demo]').click();
  await page.fill('#d-name', 'Andrea Salazar');
  await page.fill('#d-email', 'andrea@example.com');
  await page.fill('#d-units', '120');
  await page.selectOption('#d-role', 'administrador');
}

test('demo form: client validation blocks an empty submit', async ({ page }) => {
  let calls = 0;
  await page.route('https://api.heztio.com/demo-requests', (r) => { calls++; return r.fulfill({ status: 201, body: '{"ok":true}' }); });
  await page.goto('/');
  await page.locator('.hero-actions [data-demo]').click();
  await page.locator('.demo-submit').click();
  await expect(page.locator('#d-name-err')).toHaveText('Escribe tu nombre.');
  await expect(page.locator('#d-email')).toHaveAttribute('aria-invalid', 'true');
  expect(calls).toBe(0);
});

test('demo form: 201 sends the contract payload and shows success', async ({ page }) => {
  let body: any;
  await page.route('https://api.heztio.com/demo-requests', async (r) => {
    body = r.request().postDataJSON();
    await new Promise((res) => setTimeout(res, 300));
    return r.fulfill({ status: 201, contentType: 'application/json', body: '{"ok":true}' });
  });
  await openAndFill(page);
  await page.locator('.demo-submit').click();
  await expect(page.locator('.demo-submit')).toBeDisabled();
  await expect(page.getByText('¡Gracias! Recibimos tu solicitud.')).toBeVisible();
  expect(body).toEqual({ name: 'Andrea Salazar', email: 'andrea@example.com', company_website: '', role: 'administrador', units: 120 });
});

for (const [status, text] of [[400, 'Revisa los datos'], [429, 'Intenta de nuevo en unos minutos'], [500, 'No pudimos enviar']] as const) {
  test(`demo form: ${status} shows a friendly error`, async ({ page }) => {
    await page.route('https://api.heztio.com/demo-requests', (r) => r.fulfill({ status, body: '{}' }));
    await openAndFill(page);
    await page.locator('.demo-submit').click();
    await expect(page.locator('.form-alert')).toContainText(text);
    await expect(page.locator('.demo-submit')).toBeEnabled();
  });
}

test('demo form: network error offers WhatsApp and email fallbacks', async ({ page }) => {
  await page.route('https://api.heztio.com/demo-requests', (r) => r.abort('failed'));
  await openAndFill(page);
  await page.locator('.demo-submit').click();
  const alert = page.locator('.form-alert');
  await expect(alert).toContainText('No pudimos enviar');
  await expect(alert.locator('a[href^="https://wa.me/"]')).toHaveCount(1);
  await expect(alert.locator('a[href^="mailto:info@heztio.com"]')).toHaveCount(1);
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
