import { afterEach, describe, expect, test, vi } from 'vitest';
import Utils from '@/serivices/Utils';

describe('Utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('stripHTMLTags() in the browser', () => {
    test.each([
      ['<p>Hello <b>world</b></p>', 'Hello world'],
      ['  <p> padded </p>  ', 'padded'],
      ['a &amp; b', 'a & b'],
      ['plain', 'plain'],
      ['', '']
    ])('%j becomes %j', (input, expected) => {
      expect(Utils.stripHTMLTags(input)).toBe(expected);
    });
  });

  describe('stripHTMLTags() on the server', () => {
    test('removes tags with a regular expression', () => {
      vi.stubGlobal('window', undefined);
      expect(Utils.stripHTMLTags('<p>Hello <b>world</b></p>')).toBe(
        'Hello world'
      );
    });

    test('does not trim or decode entities, unlike the browser path', () => {
      vi.stubGlobal('window', undefined);
      expect(Utils.stripHTMLTags('  <p>a &amp; b</p>  ')).toBe('  a &amp; b  ');
    });
  });

  test('getCurrentUrl() returns the page address', () => {
    expect(Utils.getCurrentUrl()).toBe(window.location.href);
  });
});
