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
  await page.fill('#d-name', 'Ana Pérez');
  await page.fill('#d-phone', '300 123 4567');
  await page.fill('#d-building', 'Conjunto Prueba');
  await page.selectOption('#d-city', 'Cartagena');
  await page.fill('#d-email', 'ana@example.com');
  await page.locator('.more summary').click();
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
  for (const id of ['d-phone', 'd-building', 'd-city', 'd-email']) {
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'true');
  }
  await expect(page.locator('#d-role')).not.toHaveAttribute('aria-invalid', 'true');
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
  await expect(page.getByText('Te escribimos por WhatsApp el mismo día hábil')).toBeVisible();
  expect(body).toEqual({
    name: 'Ana Pérez', email: 'ana@example.com', phone: '300 123 4567', building: 'Conjunto Prueba',
    company_website: '', role: 'administrador', units: 120,
    message: 'Ciudad: Cartagena\nOrigen: web-hero',
  });
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

test('no unverified social proof anywhere on the public pages', async ({ request }) => {
  const banned = /320\+|48k|8 min|Altavista|Mirador del Lago|Reserva 93|Parque Central|Torres del R[ií]o|Bosques de Salitre|Andrea Salazar|Jorge Restrepo|Liliana Mu[ñn]oz|testimonios|Heztio Lab|Demo Building/i;
  for (const path of ['/', '/cartagena', '/barranquilla', '/santa-marta', '/terminos', '/privacidad', '/tratamiento-de-datos']) {
    const html = await (await request.get(path)).text();
    expect(html.match(banned)?.[0] ?? null, path).toBeNull();
  }
});

test('WhatsApp is the hero primary CTA and every wa.me link carries a ref', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('.hero-actions a').first();
  await expect(first).toHaveText(/Escribir por WhatsApp/);
  await expect(first).toHaveAttribute('href', /^https:\/\/wa\.me\/573145951905\?text=.*ref%3A%20hero/);
  const was = await page.$$eval('a[href*="wa.me/"]', (as) => as.map((a) => a.getAttribute('href') || ''));
  for (const h of was) expect(h, h).toMatch(/ref%3A%20[\w-]+/);
});

test('375px: floating WhatsApp button shows; hidden on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await expect(page.locator('.wa-float')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('.wa-float')).toBeHidden();
});

test('one implementation wording: 7 días hábiles', async ({ request }) => {
  const html = await (await request.get('/')).text();
  expect(html).not.toMatch(/el día 8|en una semana|Implementación en 7 días</);
  expect(html).toMatch(/7 días hábiles/);
});

for (const slug of ['cartagena', 'barranquilla', 'santa-marta']) {
  test(`city page /${slug}: 200, WhatsApp CTA with ref, 375px`, async ({ page, request }) => {
    expect((await request.get(`/${slug}`)).status()).toBe(200);
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/${slug}`);
    await expect(page.locator('h1')).toContainText('Software para conjuntos residenciales en');
    await expect(page.locator(`.city-cta a[href*="ref%3A%20${slug}"]`).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}
