import { expect, Page, test } from '@playwright/test';

const { E2E_ARTICLE_ID } = process.env;
const ARTICLE_URL = `/item/${E2E_ARTICLE_ID}`;
const NEEDS_ARTICLE =
  'Needs E2E_ARTICLE_ID, a published article with a video: the home page lists none';
const HTTPS_ADDRESS = /^https:\/\/\S+$/;

const meta = (page: Page, property: string) =>
  page.locator(`head meta[property="${property}"]`);

test.describe('without scripts, as a crawler sees it', () => {
  test.use({ javaScriptEnabled: false });

  test('the home page shares the logo', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page.locator('.page404')).toBeVisible();
    await expect(meta(page, 'og:title')).toHaveAttribute('content', /\S/);
    await expect(meta(page, 'og:image')).toHaveAttribute(
      'content',
      /^https:\/\/\S+\/logo\.png$/
    );
  });

  test('an article shares its title, text and cover, and keeps a native video', async ({
    page
  }) => {
    test.skip(!E2E_ARTICLE_ID, NEEDS_ARTICLE);
    const response = await page.goto(ARTICLE_URL);
    expect(response?.status()).toBe(200);
    const title = await page
      .locator('.article-details-wrapper .header .title')
      .textContent();
    await expect(meta(page, 'og:title')).toHaveAttribute(
      'content',
      title as string
    );
    await expect(meta(page, 'og:description')).toHaveAttribute('content', /\S/);
    await expect(meta(page, 'og:image')).toHaveAttribute(
      'content',
      HTTPS_ADDRESS
    );
    await expect(meta(page, 'og:url')).toHaveAttribute(
      'content',
      new RegExp(`^https://\\S+${ARTICLE_URL}$`)
    );
    await expect(
      page.locator('.content video[playsinline][preload="none"]').first()
    ).toBeAttached();
    await expect(page.locator('.content video[autoplay]')).toHaveCount(0);
  });

  test('opening an article does not count a visit', async ({ page }) => {
    test.skip(!E2E_ARTICLE_ID, NEEDS_ARTICLE);
    const visits = page.locator('.article-details-wrapper .right');
    await page.goto(ARTICLE_URL);
    const before = await visits.textContent();
    await page.reload();
    await expect(visits).toHaveText(before as string);
  });
});

test('a video waits behind a play button', async ({ page }) => {
  test.skip(!E2E_ARTICLE_ID, NEEDS_ARTICLE);
  await page.goto(ARTICLE_URL);
  await expect(
    page.getByRole('button', { name: 'Play video 播放视频' }).first()
  ).toBeVisible();
  await expect(page.locator('.video-cover video').first()).toHaveJSProperty(
    'paused',
    true
  );
});
