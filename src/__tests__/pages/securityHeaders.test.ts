import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

const nextConfig = createRequire(import.meta.url)('../../../next.config.js');

const getHeaders = async () => {
  const [{ source, headers }] = await nextConfig.headers();
  return { source, headers: new Map(headers.map((h: any) => [h.key, h.value])) };
};
const getDirective = async (name: string) => {
  const { headers } = await getHeaders();
  return `${headers.get('Content-Security-Policy')}`
    .split('; ')
    .find(part => part.startsWith(`${name} `));
};

describe('security headers', () => {
  test('cover every page', async () => {
    expect((await getHeaders()).source).toBe('/:path*');
  });

  test('the content policy is enforced', async () => {
    const { headers } = await getHeaders();
    expect(headers.has('Content-Security-Policy')).toBe(true);
    expect(headers.has('Content-Security-Policy-Report-Only')).toBe(false);
  });

  test('allows WeChat and the translator', async () => {
    const scripts = await getDirective('script-src');
    expect(scripts).toContain('https://res.wx.qq.com');
    expect(scripts).toContain('https://translate-pa.googleapis.com');
    expect(scripts).toContain('https://translate.google.com');
    expect(scripts).toContain('https://translate.googleapis.com');
  });

  test('allows what articles embed', async () => {
    expect(await getDirective('img-src')).toContain('data:');
    expect(await getDirective('frame-src')).toContain('https:');
    expect(await getDirective('media-src')).toContain('blob:');
  });

  test('stops stored article code from running', async () => {
    const scripts = await getDirective('script-src');
    expect(scripts).not.toContain('unsafe-inline');
    expect(scripts).not.toContain('unsafe-eval');
    expect(await getDirective('object-src')).toBe("object-src 'none'");
    expect(await getDirective('base-uri')).toBe("base-uri 'self'");
  });

  test('sends the other protective headers', async () => {
    const { headers } = await getHeaders();
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
  });
});
