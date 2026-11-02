import { afterEach, describe, expect, test, vi } from 'vitest';
import Utils from '@/serivices/Utils';

describe('Utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('stripHTMLTags()', () => {
    test.each([
      ['<p>Hello <b>world</b></p>', 'Hello world'],
      ['  <p> padded </p>  ', 'padded'],
      ['a &amp; b', 'a & b'],
      ['&nbsp;<p>spaced&nbsp;out</p>&nbsp;', 'spaced\u00a0out'],
      ['&ldquo;quoted&rdquo; &mdash; done&hellip;', '\u201cquoted\u201d \u2014 done\u2026'],
      ['&#39;a&#x27; &#x4E2D;', "'a' \u4e2d"],
      ['&amp;lt;', '&lt;'],
      ['&lt;b&gt;not a tag&lt;/b&gt;', '<b>not a tag</b>'],
      ['&unknown; &#99999999;', '&unknown; &#99999999;'],
      ['plain', 'plain'],
      ['', '']
    ])('%j becomes %j', (input, expected) => {
      expect(Utils.stripHTMLTags(input)).toBe(expected);
    });

    test('gives the same text on the server, so pages hydrate', () => {
      const input = '  <p>a &amp; b&nbsp;</p>  ';
      const inBrowser = Utils.stripHTMLTags(input);
      vi.stubGlobal('window', undefined);
      expect(Utils.stripHTMLTags(input)).toBe(inBrowser);
    });
  });

  test('getCurrentUrl() returns the page address', () => {
    expect(Utils.getCurrentUrl()).toBe(window.location.href);
  });
});
