import {
  act,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import Site from '@/components/Website/Site';
import WebsiteService from '@/serivices/WebsiteService';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';

// The message form block (showmine-admin specs/006-website-message-form).
const form = (extra = {}): iWebsiteSection => ({
  id: 'f',
  type: 'form',
  heading: 'Drop us a note',
  intro: 'Any time',
  ...extra
});
const site = (
  sections: iWebsiteSection[],
  extra: Partial<iWebsite> = {}
): iWebsite => ({
  version: 1,
  slug: 'shop',
  companyId: 'c',
  company: { name: 'Shop' },
  pages: [{ slug: 'contact-us', title: 'Contact', sections }],
  ...extra
});
const show = (
  sections = [form()],
  extra: Partial<iWebsite> = {},
  preview?: string
) => {
  const website = site(sections, extra);
  return render(
    <Site
      website={website}
      page={website.pages[0]}
      articles={{}}
      preview={preview}
    />
  );
};
const fill = (values: { [label: string]: string } = {}) => {
  const all = {
    'First name 名': 'Ann',
    'Last name 姓': 'Lee',
    'Email 邮箱': 'ann@example.com',
    'Message 留言': 'Hello',
    ...values
  };
  Object.entries(all).forEach(([label, value]) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  );
};
const send = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
const failWith = (status: number, data: object = {}) =>
  vi
    .spyOn(WebsiteService, 'sendMessage')
    .mockRejectedValue({ response: { status, data } });

afterEach(() => vi.restoreAllMocks());

describe('message form', () => {
  test('shows the heading, intro and four required fields with their limits', () => {
    const { container } = show();
    expect(
      screen.getByRole('heading', { name: 'Drop us a note' })
    ).toBeInTheDocument();
    expect(screen.getByText('Any time')).toHaveClass('site-cards-intro');
    const limits = [
      ['First name 名', '80', 'INPUT'],
      ['Last name 姓', '80', 'INPUT'],
      ['Email 邮箱', '254', 'INPUT'],
      ['Message 留言', '5000', 'TEXTAREA']
    ];
    limits.forEach(([label, max, tag]) => {
      const field = screen.getByLabelText(label);
      expect(field.tagName).toBe(tag);
      expect(field).toHaveAttribute('maxlength', max);
      expect(field).toBeRequired();
    });
    expect(screen.getByLabelText('Email 邮箱')).toHaveAttribute(
      'type',
      'email'
    );
    expect(container.querySelector('section')).toHaveClass('site-form');
  });

  test('sends the fields with the page, and shows the thank-you note', async () => {
    const sendMessage = vi
      .spyOn(WebsiteService, 'sendMessage')
      .mockResolvedValue({} as never);
    show([form({ thanks: 'Thanks, Ann!' })]);
    fill();
    send();

    expect(await screen.findByRole('status')).toHaveTextContent('Thanks, Ann!');
    expect(sendMessage).toHaveBeenCalledWith('shop', {
      firstName: 'Ann',
      lastName: 'Lee',
      email: 'ann@example.com',
      message: 'Hello',
      pageSlug: 'contact-us',
      website: ''
    });
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });

  test('the default button and thank-you note', async () => {
    vi.spyOn(WebsiteService, 'sendMessage').mockResolvedValue({} as never);
    show([form({ buttonText: undefined })]);
    fill();
    send();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Thank you, we will get back to you soon.'
    );
  });

  test('the button text of the block, disabled while sending', async () => {
    let finish: (value: unknown) => void = () => {};
    vi.spyOn(WebsiteService, 'sendMessage').mockReturnValue(
      new Promise(resolve => {
        finish = resolve;
      }) as never
    );
    show([form({ buttonText: 'Post it' })]);
    fill();
    fireEvent.click(screen.getByRole('button', { name: 'Post it' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Post it' })).toBeDisabled()
    );
    await act(async () => finish({}));
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  test('shows the problems the API names at their fields, and keeps what was typed', async () => {
    failWith(400, {
      errors: [
        { path: 'email', message: 'An email address.' },
        { path: 'message', message: 'Required.' }
      ]
    });
    show();
    // The browser takes ann@home; the API wants a dot in the domain.
    fill({ 'Email 邮箱': 'ann@home' });
    send();

    expect(await screen.findByText('An email address.')).toHaveAttribute(
      'role',
      'alert'
    );
    expect(screen.getByLabelText('Email 邮箱')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('Message 留言')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByLabelText('First name 名')).not.toHaveAttribute(
      'aria-invalid'
    );
    expect(screen.getByLabelText('Email 邮箱')).toHaveValue('ann@home');
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  test.each([
    [
      429,
      'Too many messages. Please try again later. 留言太频繁，请稍后再试。'
    ],
    [
      500,
      'Your message could not be sent. Please try again. 发送失败，请重试。'
    ],
    [
      400,
      'Your message could not be sent. Please try again. 发送失败，请重试。'
    ]
  ])('says what went wrong on a %s', async (status, notice) => {
    failWith(status);
    show();
    fill();
    send();
    expect(await screen.findByText(notice)).toHaveAttribute('role', 'alert');
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('a problem from an earlier try is cleared by the next one', async () => {
    failWith(429);
    show();
    fill();
    send();
    await screen.findByText(/Too many messages/);
    failWith(400, {
      errors: [{ path: 'email', message: 'An email address.' }]
    });
    send();
    await screen.findByText('An email address.');
    expect(screen.queryByText(/Too many messages/)).toBeNull();
  });

  test.each([
    ['a preview', {}, 'token'],
    ['a template', { isPreview: true }, undefined]
  ])(
    'in %s, says it sends once published, and sends nothing',
    async (_name, extra, preview) => {
      const sendMessage = vi.spyOn(WebsiteService, 'sendMessage');
      show([form()], extra, preview);
      fill();
      send();
      expect(
        await screen.findByText(
          'Messages can be sent once the website is published. 网站发布后才能发送留言。'
        )
      ).toBeInTheDocument();
      expect(sendMessage).not.toHaveBeenCalled();
    }
  );

  test("the browser's own checks stop an empty or malformed form before it is sent", async () => {
    const sendMessage = vi.spyOn(WebsiteService, 'sendMessage');
    show();
    fill({ 'Email 邮箱': 'ann at home' });
    send();
    fill({ 'Email 邮箱': 'ann@example.com', 'Message 留言': '' });
    send();
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  test('has a hidden field for bots, out of sight and out of the tab order, and sends what a bot puts there', async () => {
    const sendMessage = vi
      .spyOn(WebsiteService, 'sendMessage')
      .mockResolvedValue({} as never);
    const { container } = show();
    const trap = container.querySelector(
      'input[name="website"]'
    ) as HTMLInputElement;
    expect(trap).toHaveAttribute('tabindex', '-1');
    expect(trap.closest('.site-form-trap')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
    fireEvent.change(trap, { target: { value: 'https://spam.example' } });
    fill();
    send();
    await screen.findByRole('status');
    expect(sendMessage.mock.calls[0][1]).toMatchObject({
      website: 'https://spam.example'
    });
  });
});
