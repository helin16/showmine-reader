import { act } from '@testing-library/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ArticleDate from '@/components/Article/ArticleDate';

const VALUE = '2026-11-02T20:30:00.000Z';

describe('ArticleDate', () => {
  const originalTz = process.env.TZ;
  beforeEach(() => {
    process.env.TZ = 'Australia/Melbourne';
  });
  afterEach(() => {
    process.env.TZ = originalTz;
    vi.restoreAllMocks();
  });

  test('the server sends a time that does not depend on its timezone', () => {
    expect(renderToString(<ArticleDate value={VALUE} />)).toBe('2026-11-02 20:30');
  });

  test('hydrates without a mismatch, then shows the local time', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<ArticleDate value={VALUE} />);
    const onRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <ArticleDate value={VALUE} />, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe('2026-11-03 07:30');
  });

  test('follows a new value', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => root.render(<ArticleDate value={VALUE} />));
    await act(async () => root.render(<ArticleDate value={'2026-01-01T00:00:00.000Z'} />));
    expect(container.textContent).toBe('2026-01-01 11:00');
  });
});
