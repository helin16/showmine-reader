import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import GTranslator from '@/components/GTranslator';

const SCRIPT_ID = 'app-gTranslator-js';
const SELECTOR_ID = 'app-gTranslator';

const addWidget = (...languages: string[]) => {
  const select = document.createElement('select');
  languages.forEach(value => select.add(new Option(value, value)));
  document.getElementById(SELECTOR_ID)!.appendChild(select);
  const onChange = vi.fn();
  select.addEventListener('change', onChange);
  return { select, onChange };
};

describe('GTranslator', () => {
  afterEach(() => {
    document.getElementById(SCRIPT_ID)?.remove();
    delete (window as any).googleTranslateElementInit;
    delete (window as any).google;
  });

  test('adds the Google script once', () => {
    const { unmount } = render(<GTranslator />);
    const scripts = () => document.querySelectorAll(`#${SCRIPT_ID}`);
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].getAttribute('src')).toContain(
      'translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    );
    unmount();
    render(<GTranslator />);
    expect(scripts()).toHaveLength(1);
  });

  test('the Google callback builds the widget for English and Chinese', () => {
    const TranslateElement = vi.fn();
    (window as any).google = { translate: { TranslateElement } };
    render(<GTranslator />);
    (window as any).googleTranslateElementInit();
    expect(TranslateElement).toHaveBeenCalledWith(
      {
        pageLanguage: 'auto',
        autoDisplay: false,
        includedLanguages: 'en,zh-CN'
      },
      SELECTOR_ID
    );
  });

  test.each([
    ['English', 'en'],
    ['Simplified Chinese', 'zh-CN']
  ])('the %s flag selects %s in the widget', (alt, language) => {
    render(<GTranslator />);
    const { select, onChange } = addWidget('', 'en', 'zh-CN');
    fireEvent.click(screen.getByAltText(alt));
    expect(select.value).toBe(language);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('does nothing when the widget lacks the language', () => {
    render(<GTranslator />);
    const { select, onChange } = addWidget('', 'fr');
    fireEvent.click(screen.getByAltText('English'));
    expect(select.value).toBe('');
    expect(onChange).not.toHaveBeenCalled();
  });
});
