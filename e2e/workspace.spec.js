import { test, expect } from '@playwright/test';

test('gallery loads a scenario and restores playback on dismissal', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore scenarios' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => window.__cosmicSandbox.ui.isPaused)).toBe(true);
  await page.locator('[data-scenario="binaryStars"]').click();
  await expect(page.locator('#preset-select')).toHaveValue('binaryStars');
  expect(await page.evaluate(() => window.__cosmicSandbox.ui.isPaused)).toBe(false);
  await page.getByRole('button', { name: 'Explore scenarios' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('body editor accepts precise values without triggering flight shortcuts', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const { ui, engine } = window.__cosmicSandbox;
    ui.selectBody(engine.getBodies()[0]);
  });
  await page.locator('#edit-name').fill('A new sun');
  await page.locator('#edit-name').press('Space');
  expect(await page.evaluate(() => window.__cosmicSandbox.ui.isPaused)).toBe(false);
  await page.locator('#edit-mass').fill('8500');
  await page.getByRole('button', { name: 'Apply changes' }).click();
  await expect(page.locator('#edit-status')).toHaveText('Changes applied');
  expect(await page.evaluate(() => window.__cosmicSandbox.ui.selectedBody.mass)).toBe(8500);
});

test('circular placement creates a tangent orbit and reverses its direction', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const { ui, engine } = window.__cosmicSandbox;
    ui.isPaused = true;
    engine.clear();
    engine.addBody({ name: 'Primary', mass: 8000, radius: 15, position: { x: 0, y: 0 }, velocity: { x: 2, y: 3 } });
  });
  await page.locator('#placement-mode').selectOption('circular');
  const result = await page.evaluate(() => {
    const { ui, engine } = window.__cosmicSandbox;
    const primary = engine.getBodies()[0];
    ui.isDragging = true;
    ui.dragStartWorld = primary.position.clone();
    ui.currentWorldPos = primary.position.clone();
    ui.currentWorldPos.x = 200;
    const forward = ui.computeLaunchState().velocity;
    document.getElementById('orbit-retrograde').checked = true;
    const reverse = ui.computeLaunchState().velocity;
    ui.handleMouseUp({});
    return { forward, reverse, count: engine.getBodies().length, created: engine.getBodies()[1].velocity };
  });
  expect(result.forward.x).toBeCloseTo(2);
  expect(result.forward.y - 3).toBeCloseTo(Math.sqrt(80));
  expect(result.reverse.y - 3).toBeCloseTo(-Math.sqrt(80));
  expect(result.count).toBe(2);
  expect(result.created.y).toBeCloseTo(result.reverse.y);
});

test('mobile gallery fits the viewport and creation tools collapse', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#btn-tools').click();
  await expect(page.locator('#creation-tools')).not.toBeVisible();
  await page.locator('#btn-explore').click();
  const bounds = await page.getByRole('dialog').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.locator('[data-scenario="solarSystem"]').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('shortcuts keep working after clicking a toolbar button', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-tools').click();
  await page.keyboard.press('Digit4');
  expect(await page.evaluate(() => window.__cosmicSandbox.renderer.camera.mode)).toBe('barycenter');
});
