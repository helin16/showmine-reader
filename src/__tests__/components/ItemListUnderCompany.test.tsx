import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ItemListUnderCompany from '@/components/Item/ItemListUnderCompany';
import ItemService from '@/serivices/ItemService';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/router', () => ({ useRouter: () => ({ replace }) }));

const deferred = () => {
  let resolve: (value: any) => void = () => undefined;
  const promise = new Promise<any>(r => {
    resolve = r;
  });
  return { promise, resolve };
};

// No offset, so moment reads and prints it the same in every time zone.
const item = {
  id: 'i1',
  title: 'First',
  excerpt: '<p>Short <b>text</b></p>',
  publishedAt: '2024-03-05T09:30:00',
  CoverAsset: { url: 'https://c.example/image/upload/a.png' }
};

describe('ItemListUnderCompany', () => {
  let getAll: ReturnType<typeof vi.fn>;

  const loaded = async (...items: any[]) => {
    getAll.mockResolvedValue({ data: items, currentPage: 1, pages: 1 });
    const view = render(<ItemListUnderCompany companyId={'c1'} />);
    await screen.findByText(items[0].title);
    return view;
  };

  beforeEach(() => {
    getAll = vi.spyOn(ItemService, 'getAllItemsUnderCompany') as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test.each([[undefined], [''], ['   ']])(
    'does not load anything for company id %j',
    companyId => {
      const { container } = render(
        <ItemListUnderCompany companyId={companyId} />
      );
      expect(getAll).not.toHaveBeenCalled();
      expect(container.querySelector('.item')).toBeNull();
      expect(container.querySelector('.spinner')).toBeNull();
    }
  );

  test('asks for the five newest published items of the company', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-06-01T00:00:00.000Z'));
    getAll.mockResolvedValue({ data: [] });
    render(<ItemListUnderCompany companyId={' c1 '} />);
    await act(async () => undefined);

    expect(getAll).toHaveBeenCalledTimes(1);
    const [companyId, params] = getAll.mock.calls[0];
    const { where, ...rest } = params;
    expect(companyId).toBe('c1');
    expect(rest).toStrictEqual({
      perPage: 5,
      currentPage: 1,
      include: 'CoverAsset',
      sort: 'publishedAt:DESC'
    });
    expect(JSON.parse(where)).toStrictEqual({
      isActive: true,
      publishedAt: { OP_LT: '2024-06-01T00:00:00.000Z' }
    });
  });

  test('shows a spinner until the items arrive', async () => {
    const request = deferred();
    getAll.mockReturnValue(request.promise);
    const { container } = render(<ItemListUnderCompany companyId={'c1'} />);
    expect(container.querySelector('.spinner')).not.toBeNull();

    await act(async () => request.resolve({ data: [item] }));
    expect(container.querySelector('.spinner')).toBeNull();
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  test('shows each item', async () => {
    const { container } = await loaded(item);
    expect(screen.getByText('2024-03-05 09:30')).toBeInTheDocument();
    expect(screen.getByText('Short text')).toBeInTheDocument();
    expect(
      container.querySelector<HTMLElement>('.cover-img')!.style.backgroundImage
    ).toContain('https://c.example/image/upload/w_300/a.png');
  });

  test('leaves the date blank for an unpublished item', async () => {
    const { container } = await loaded({ ...item, publishedAt: null });
    expect(container.querySelector('.date')).toBeEmptyDOMElement();
  });

  test('copes with an item without an excerpt', async () => {
    const { container } = await loaded({ ...item, excerpt: null });
    expect(container.querySelector('.excerpt')).toBeEmptyDOMElement();
  });

  test('shows no spinner once the last page has arrived', async () => {
    const { container } = await loaded(item);
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelectorAll('.item')).toHaveLength(1);
  });

  test('opens an item from its cover or title', async () => {
    const { container } = await loaded(item);
    fireEvent.click(container.querySelector('.cover-img')!);
    expect(replace).toHaveBeenLastCalledWith('/item/i1');
    replace.mockClear();
    fireEvent.click(screen.getByText('First'));
    expect(replace).toHaveBeenCalledWith('/item/i1');
  });

  test('shows an empty list when there are no items', async () => {
    getAll.mockResolvedValue({ data: [] });
    const { container } = render(<ItemListUnderCompany companyId={'c1'} />);
    await act(async () => undefined);
    expect(container.querySelector('.item-list')).toBeEmptyDOMElement();
  });

  test('logs a failure and clears the spinner', async () => {
    const error = new Error('down');
    getAll.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { container } = render(<ItemListUnderCompany companyId={'c1'} />);
    await act(async () => undefined);
    expect(consoleError).toHaveBeenCalledWith(error);
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelector('.item')).toBeNull();
  });

  test('replaces the list when the company changes', async () => {
    const { rerender } = await loaded(item);
    getAll.mockResolvedValue({ data: [{ ...item, id: 'i2', title: 'Other' }] });
    rerender(<ItemListUnderCompany companyId={'c2'} />);
    await screen.findByText('Other');
    expect(getAll.mock.calls[1][0]).toBe('c2');
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  test('ignores a stale response that arrives after a newer one', async () => {
    const slow = deferred();
    const fast = deferred();
    getAll.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
    const { rerender } = render(<ItemListUnderCompany companyId={'c1'} />);
    rerender(<ItemListUnderCompany companyId={'c2'} />);

    await act(async () =>
      fast.resolve({ data: [{ ...item, id: 'new', title: 'New' }] })
    );
    expect(screen.getByText('New')).toBeInTheDocument();

    await act(async () =>
      slow.resolve({ data: [{ ...item, id: 'old', title: 'Old' }] })
    );
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByText('Old')).not.toBeInTheDocument();
  });

  test('keeps the spinner when a stale response arrives first', async () => {
    const slow = deferred();
    const fast = deferred();
    getAll.mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
    const { container, rerender } = render(
      <ItemListUnderCompany companyId={'c1'} />
    );
    rerender(<ItemListUnderCompany companyId={'c2'} />);

    await act(async () =>
      slow.resolve({ data: [{ ...item, id: 'old', title: 'Old' }] })
    );
    expect(container.querySelector('.spinner')).not.toBeNull();
    expect(screen.queryByText('Old')).not.toBeInTheDocument();

    await act(async () =>
      fast.resolve({ data: [{ ...item, id: 'new', title: 'New' }] })
    );
    expect(container.querySelector('.spinner')).toBeNull();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  test('clears the spinner when the company goes during a request', async () => {
    const request = deferred();
    getAll.mockReturnValue(request.promise);
    const { container, rerender } = render(
      <ItemListUnderCompany companyId={'c1'} />
    );
    rerender(<ItemListUnderCompany />);
    await act(async () => request.resolve({ data: [item] }));
    expect(container.querySelector('.spinner')).toBeNull();
    expect(screen.queryByText('First')).not.toBeInTheDocument();
  });

  test('unmounting during a request is harmless', async () => {
    const request = deferred();
    getAll.mockReturnValue(request.promise);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { unmount } = render(<ItemListUnderCompany companyId={'c1'} />);
    unmount();
    await act(async () => request.resolve({ data: [item] }));
    expect(consoleError).not.toHaveBeenCalled();
  });
});
