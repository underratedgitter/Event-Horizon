import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

async function main() {
  const assetsDir = path.resolve('docs/assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Crisp Retina 2x
  });

  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8080');
  await page.waitForSelector('#sandbox-canvas');
  await page.waitForTimeout(1500);

  console.log('📸 Capturing 1: Solar System Overview...');
  await page.screenshot({ path: path.join(assetsDir, 'preview-solar-system.png') });

  console.log('📸 Capturing 2: Black Hole & Doppler Accretion Disk...');
  await page.selectOption('#preset-select', 'blackHoleFeasting');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(assetsDir, 'preview-black-hole.png') });

  console.log('📸 Capturing 3: Binary Star Dance & Relativistic Orbitals...');
  await page.selectOption('#preset-select', 'binaryStars');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(assetsDir, 'preview-binary-stars.png') });

  console.log('📸 Capturing 4: Millisecond Pulsar Synchrotron Jets...');
  await page.selectOption('#preset-select', 'pulsarSystem');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(assetsDir, 'preview-pulsar-system.png') });

  console.log('📸 Capturing 5: Spacecraft Flight Simulator & Trajectory Slingshot...');
  await page.selectOption('#preset-select', 'solarSystem');
  await page.waitForTimeout(1200);
  const launchProbeBtn = page.locator('button:has-text("Launch Odyssey Probe"), #btn-spawn-spacecraft');
  if (await launchProbeBtn.count() > 0) {
    await launchProbeBtn.first().click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: path.join(assetsDir, 'preview-spacecraft-slingshot.png') });

  await browser.close();
  console.log('✅ All high-resolution showcase previews generated in docs/assets/!');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
