import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Cosmic Sandbox E2E Browser Suite', () => {
  test('1. Verifies HTML canvas renders without console errors and saves screenshot', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('/');

    // Verify canvas is present and rendered
    const canvas = page.locator('#sandbox-canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(100);
    expect(box.height).toBeGreaterThan(100);

    // Wait for initial simulation loop to populate telemetry
    const bodyCount = page.locator('#body-count');
    await expect(bodyCount).not.toHaveText('0', { timeout: 8000 });

    // Ensure screenshot directory exists and take initial render screenshot
    const screenshotDir = path.resolve('e2e/screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    const screenshotPath = path.join(screenshotDir, 'app.png');
    await page.screenshot({ path: screenshotPath });
    expect(fs.existsSync(screenshotPath)).toBe(true);

    // Verify no unhandled exceptions or console errors occurred during render
    expect(consoleErrors).toEqual([]);
  });

  test('2. Clicks the Time Scrubber and verifies time values update dynamically', async ({ page }) => {
    await page.goto('/');

    const scrubber = page.locator('#slider-scrub');
    const scrubVal = page.locator('#scrub-val');
    await expect(scrubber).toBeVisible();
    await expect(scrubVal).toBeVisible();

    // Wait for history frames to record
    await page.waitForFunction(() => {
      const el = document.getElementById('slider-scrub');
      return el && parseInt(el.max, 10) >= 5;
    }, { timeout: 8000 });

    const maxVal = await scrubber.getAttribute('max');
    const maxNum = parseInt(maxVal, 10);
    expect(maxNum).toBeGreaterThanOrEqual(5);

    // Move scrubber to midpoint and dispatch input event
    const targetIdx = Math.floor(maxNum / 2);
    await scrubber.evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, String(targetIdx));

    // Verify scrub-val readout reflects updated index dynamically
    await expect(scrubVal).toContainText(`${targetIdx + 1}/`);

    // Verify engine paused during scrubbing
    const isPaused = await page.evaluate(() => window.__cosmicSandbox.ui.isPaused);
    expect(isPaused).toBe(true);

    // Release scrubbing via change event
    await scrubber.evaluate((el) => {
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const isScrubbing = await page.evaluate(() => window.__cosmicSandbox.ui.isScrubbing);
    expect(isScrubbing).toBe(false);
  });

  test('3. Tests hotkey interactions (Spacebar play/pause and camera modes 1-4)', async ({ page }) => {
    await page.goto('/');

    const playBtn = page.locator('#btn-play');
    const cameraSelect = page.locator('#camera-select');

    // Check initial state is playing
    await expect(playBtn).toContainText('Pause');

    // Focus viewport
    await page.click('#sandbox-canvas');

    // Press Spacebar to pause
    await page.keyboard.press('Space');
    await expect(playBtn).toContainText('Play');
    let isPaused = await page.evaluate(() => window.__cosmicSandbox.ui.isPaused);
    expect(isPaused).toBe(true);

    // Press Spacebar to resume
    await page.keyboard.press('Space');
    await expect(playBtn).toContainText('Pause');
    isPaused = await page.evaluate(() => window.__cosmicSandbox.ui.isPaused);
    expect(isPaused).toBe(false);

    // Test camera mode hotkeys (1: Free, 2: Locked, 3: Chase, 4: Barycenter)
    await page.keyboard.press('Digit2');
    await expect(cameraSelect).toHaveValue('locked');

    await page.keyboard.press('Digit3');
    await expect(cameraSelect).toHaveValue('chase');

    await page.keyboard.press('Digit4');
    await expect(cameraSelect).toHaveValue('barycenter');

    await page.keyboard.press('Digit1');
    await expect(cameraSelect).toHaveValue('free');
  });

  test('4. Toggles audio and verifies Web Audio context state', async ({ page }) => {
    await page.goto('/');

    const soundBtn = page.locator('#btn-sound');
    await expect(soundBtn).toBeVisible();

    // Initially audio is ready/uninitialized prior to user gesture
    await expect(soundBtn).toContainText('Audio On');

    // Click sound button to toggle/initialize audio
    await soundBtn.click();

    // Verify audio context is instantiated and state is valid
    const audioStatus = await page.evaluate(() => {
      const audio = window.__cosmicSandbox.audio;
      return {
        initialized: audio.initialized,
        hasContext: Boolean(audio.ctx),
        state: audio.ctx ? audio.ctx.state : null,
        isMuted: audio.isMuted,
      };
    });

    expect(audioStatus.initialized).toBe(true);
    expect(audioStatus.hasContext).toBe(true);
    expect(['running', 'suspended']).toContain(audioStatus.state);

    // Toggle mute state again
    await soundBtn.click();
    await expect(soundBtn).toContainText('Audio On');

    const updatedMuted = await page.evaluate(() => window.__cosmicSandbox.audio.isMuted);
    expect(updatedMuted).toBe(false);
  });
});
