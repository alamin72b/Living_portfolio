import { expect, test } from '@playwright/test';
test('honest sample exploration, index, expansion and stage transitions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Nothing starts/ })).toBeVisible();
  await page.getByRole('button', { name: 'Explore an example', exact: true }).click();
  await expect(page.getByText(/SAMPLE WORKSPACE/)).toBeVisible();
  await page.getByRole('button', { name: 'Index', exact: true }).click();
  await page.getByLabel('Search creations').fill('Something greater');
  await page.getByRole('button', { name: /Something greater project/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByText('Illustrative example. This is not an achievement of the owner.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Reveal the constituent pieces' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Reassemble Something greater' })).toBeVisible();
  await page.getByRole('button', { name: 'Reassemble Something greater' }).click();
  await page.getByRole('button', { name: 'Try blueprint → reality' }).click();
  await expect(page.locator('.stage-blueprint.piece-node')).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore actual sample stages' }).click();
  await expect(page.locator('.stage-blueprint.piece-node')).toHaveCount(1);
  await page.getByRole('button', { name: 'Back to my workspace' }).click();
  await expect(page.getByText(/SAMPLE WORKSPACE/)).not.toBeVisible();
  expect(errors).toEqual([]);
});
test('zoom, pan, fit, recenter, accessible search, and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore an example', exact: true }).click();
  const zoom = page.getByLabel('Zoom level');
  const before = await zoom.textContent();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(zoom).not.toHaveText(before!);
  const viewport = page.locator('.react-flow__viewport');
  const transform = await viewport.getAttribute('style');
  await page.locator('.canvas-surface').focus();
  await page.keyboard.press('ArrowRight');
  await expect(viewport).not.toHaveAttribute('style', transform!);
  await page.getByRole('button', { name: 'Fit all content', exact: true }).click();
  await page.getByRole('button', { name: 'Return to origin', exact: true }).click();
  await page.keyboard.press('/');
  await expect(page.getByRole('dialog', { name: 'The index' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('owner can draft, preview, approve and publish in a disposable test database', async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_OWNER_TOKEN,
    'Provide E2E_OWNER_TOKEN for a disposable local test instance.',
  );
  await page.goto('/#manage');
  await page.getByLabel('Owner or agent access token').fill(process.env.E2E_OWNER_TOKEN!);
  await page.getByRole('button', { name: 'Open studio' }).click();
  const title = `E2E neutral sample ${Date.now()}`;
  await page.getByLabel('Creation title').fill(title);
  await page.getByLabel('A short description').fill('A neutral browser test fixture.');
  await page.getByLabel('Claim supported').fill('Created by an automated browser test.');
  await page.getByText('Media, notes, position & attribution').click();
  await page.getByLabel('Who made this work?').selectOption('neutral-demo');
  await page.getByRole('button', { name: 'Save private draft' }).click();
  await page.getByRole('button', { name: 'Validate & prepare preview' }).click();
  await page.getByRole('button', { name: 'Open spatial preview' }).click();
  await expect(page.getByText(/PRIVATE PREVIEW/)).toBeVisible();
  await page.getByRole('button', { name: 'Back to review' }).click();
  await page
    .getByLabel('I checked every claim, link, attribution, and permission to share.')
    .check();
  await page.getByRole('button', { name: 'Approve this exact revision' }).click();
  await page.getByRole('button', { name: 'Publish approved revision' }).click();
  await expect(page.getByText(/The public workspace now contains/)).toBeVisible();
  await page.getByRole('button', { name: 'Workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Index', exact: true }).click();
  await page.getByLabel('Search creations').fill(title);
  await expect(page.getByRole('button', { name: new RegExp(title) })).toBeVisible();
});
