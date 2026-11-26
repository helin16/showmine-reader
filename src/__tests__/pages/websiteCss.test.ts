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
  'site-image',
  'site-gallery',
  'site-contact',
  'site-map',
  'site-articles'
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

  test('is cached for five minutes, and the admin may read it', async () => {
    const rules = await nextConfig.headers();
    const rule = rules.find((r: any) => r.source === '/website.css');
    expect(rule.headers).toEqual([
      { key: 'Cache-Control', value: 'public, max-age=300' },
      { key: 'Access-Control-Allow-Origin', value: '*' }
    ]);
  });
});
