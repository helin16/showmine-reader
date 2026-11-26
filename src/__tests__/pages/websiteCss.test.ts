import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

// Tests run from the repository root.
const css = readFileSync('public/website.css', 'utf8');
const nextConfig = createRequire(import.meta.url)('../../../next.config.js');

// The admin canvas (showmine-admin specs/004-website-visual-editor, R2) draws blocks with these classes.
const BLOCK_CLASSES = [
  'site',
  'site-font-modern',
  'site-font-classic',
  'site-font-friendly',
  'site-nav',
  'site-name',
  'site-menu-button',
  'is-open',
  'site-page',
  'site-hero',
  'with-image',
  'site-button',
  'site-buttons',
  'second',
  'site-note',
  'site-split',
  'image-right',
  'site-image',
  'site-gallery',
  'site-contact',
  'site-map',
  'site-articles',
  'site-footer',
  'site-footer-columns',
  'site-footer-contact',
  'site-footer-image',
  'site-copyright'
];

describe('/website.css', () => {
  test.each(BLOCK_CLASSES)('styles .%s', name => {
    expect(css).toMatch(new RegExp(`\\.${name}[\\s.,:{\\[]`));
  });

  test('is plain CSS the browser reads as is', () => {
    expect(css).not.toMatch(/&|^\s*\/\//m);
  });

  test('has no @media rule, so narrowing the canvas works', () => {
    expect(css).not.toContain('@media');
  });

  test('puts the image beside the text from 768 px of site width, on the side asked for (spec 005)', () => {
    const wide = css.slice(css.indexOf('@container (min-width: 768px) {'));
    expect(wide).toMatch(
      /^@container[^}]*\.site-split \{\s*grid-template-columns: 1fr 1fr;/
    );
    expect(wide).toMatch(/\.site-split\.image-right img \{\s*order: 2;/);
    // Narrower, the text keeps its line breaks under the image.
    expect(css).toMatch(/\.site-split p \{[^}]*white-space: pre-line;/);
  });

  test("draws the second button in the theme's second colour", () => {
    expect(css).toMatch(
      /\.site-button\.second \{[^}]*background: var\(--site-secondary, #6c757d\);/
    );
    // Dark text on light colours such as yellow (Site.tsx getTextColor).
    expect(css).toMatch(
      /\.site-button\.second \{[^}]*color: var\(--site-secondary-text, #fff\) !important;/
    );
  });

  test('folds the menu below 1024 px of site width, as showmine.com.au', () => {
    expect(css).toMatch(/\.site \{[^}]*container-type: inline-size;/);
    const fold = css.slice(css.indexOf('@container (max-width: 1023.98px) {'));
    expect(fold).toMatch(
      /^@container[^]*\.site-menu-button \{\s*display: flex;/
    );
    expect(fold).toMatch(/\.site-nav ul \{\s*display: none;/);
    expect(fold).toMatch(/\.site-nav\.is-open ul \{\s*display: flex;/);
    expect(css).toMatch(/^\.site-menu-button \{\s*display: none;/m);
  });

  test('reads the theme variables, falling back to the look before them', () => {
    expect(css).toMatch(
      /\.site \{[^}]*background: var\(--site-bg, transparent\);/
    );
    expect(css).toMatch(
      /\.site h1,\s*\.site h2,\s*\.site h3 \{\s*color: var\(--site-heading, inherit\);/
    );
    expect(css).toMatch(
      /\.site-page \{\s*max-width: var\(--site-width, 960px\);/
    );
    expect(css).toMatch(
      /\.site-footer-columns \{[^}]*max-width: var\(--site-width, 960px\);/
    );
    expect(css).toMatch(/\.site-hero\.with-image h1 \{\s*color: inherit;/);
    expect(css).toMatch(/\.site-footer p \{[^}]*white-space: pre-line;/);
    // The copyright line beats the footer's paragraph rule.
    expect(css).toMatch(/\.site-footer \.site-copyright \{\s*margin: 0;/);
  });

  test('is cached for five minutes, and the admin may read it', async () => {
    const rules = await nextConfig.headers();
    const rule = rules.find((r: any) => r.source === '/website.css');
    expect(rule.headers).toEqual([
      { key: 'Cache-Control', value: 'public, max-age=300' },
      { key: 'Access-Control-Allow-Origin', value: '*' }
    ]);
  });
});
