import { FormEvent, useState } from 'react';
import WebsiteService from '@/serivices/WebsiteService';
import { iWebsite, iWebsiteSection } from '@/types/iWebsite';

// The message form block (showmine-admin specs/006-website-message-form). The visitor's browser posts the message to
// the API after hydration, as article comments do. Previews and templates show the form without sending.
type iMessageForm = {
  section: iWebsiteSection;
  website: iWebsite;
  preview?: string;
  pageSlug?: string;
};

const FIELDS = [
  {
    name: 'firstName',
    label: 'First name 名',
    max: 80,
    type: 'text',
    autoComplete: 'given-name'
  },
  {
    name: 'lastName',
    label: 'Last name 姓',
    max: 80,
    type: 'text',
    autoComplete: 'family-name'
  },
  {
    name: 'email',
    label: 'Email 邮箱',
    max: 254,
    type: 'email',
    autoComplete: 'email'
  },
  {
    name: 'message',
    label: 'Message 留言',
    max: 5000,
    type: 'textarea',
    autoComplete: 'off'
  }
] as const;
type iField = (typeof FIELDS)[number]['name'];
type iValues = { [field in iField]: string };

const EMPTY: iValues = { firstName: '', lastName: '', email: '', message: '' };
const FAILED =
  'Your message could not be sent. Please try again. 发送失败，请重试。';
const TOO_MANY =
  'Too many messages. Please try again later. 留言太频繁，请稍后再试。';
const NOT_LIVE =
  'Messages can be sent once the website is published. 网站发布后才能发送留言。';

const MessageForm = ({ section, website, preview, pageSlug }: iMessageForm) => {
  const [values, setValues] = useState<iValues>(EMPTY);
  // The hidden field people never see; a bot that fills it is answered as sent.
  const [trap, setTrap] = useState('');
  const [errors, setErrors] = useState<{ [field: string]: string }>({});
  const [notice, setNotice] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const isLive = !preview && !website.isPreview && !!pageSlug;
  const id = (field: string) => `${section.id}-${field}`;

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!isLive) {
      setNotice(NOT_LIVE);
      return;
    }
    setIsSending(true);
    setNotice('');
    setErrors({});
    try {
      await WebsiteService.sendMessage(website.slug, {
        ...values,
        pageSlug,
        website: trap
      });
      setIsSent(true);
    } catch (err: any) {
      const status = err?.response?.status;
      const fieldErrors: { path: string; message: string }[] =
        err?.response?.data?.errors || [];
      if (status === 400 && fieldErrors.length > 0) {
        setErrors(
          Object.fromEntries(
            fieldErrors.map(({ path, message }) => [path, message])
          )
        );
      } else {
        setNotice(status === 429 ? TOO_MANY : FAILED);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className={'site-form'}>
      {section.heading ? <h2>{section.heading}</h2> : null}
      {section.intro ? (
        <p className={'site-cards-intro'}>{section.intro}</p>
      ) : null}
      {isSent ? (
        <p className={'site-form-thanks'} role={'status'}>
          {section.thanks || 'Thank you, we will get back to you soon.'}
        </p>
      ) : (
        <form onSubmit={send} noValidate={false}>
          {FIELDS.map(({ name, label, max, type, autoComplete }) => (
            <div key={name} className={`site-form-field ${name}`}>
              <label htmlFor={id(name)}>{label}</label>
              {type === 'textarea' ? (
                <textarea
                  id={id(name)}
                  name={name}
                  required
                  maxLength={max}
                  rows={5}
                  value={values[name]}
                  aria-invalid={errors[name] ? true : undefined}
                  aria-describedby={
                    errors[name] ? id(`${name}-error`) : undefined
                  }
                  onChange={e =>
                    setValues({ ...values, [name]: e.target.value })
                  }
                />
              ) : (
                <input
                  id={id(name)}
                  name={name}
                  type={type}
                  required
                  maxLength={max}
                  autoComplete={autoComplete}
                  value={values[name]}
                  aria-invalid={errors[name] ? true : undefined}
                  aria-describedby={
                    errors[name] ? id(`${name}-error`) : undefined
                  }
                  onChange={e =>
                    setValues({ ...values, [name]: e.target.value })
                  }
                />
              )}
              {errors[name] ? (
                <small
                  id={id(`${name}-error`)}
                  className={'site-form-error'}
                  role={'alert'}
                >
                  {errors[name]}
                </small>
              ) : null}
            </div>
          ))}
          <div className={'site-form-trap'} aria-hidden={'true'}>
            <label htmlFor={id('website')}>Website</label>
            <input
              id={id('website')}
              name={'website'}
              type={'text'}
              tabIndex={-1}
              autoComplete={'off'}
              value={trap}
              onChange={e => setTrap(e.target.value)}
            />
          </div>
          {notice ? (
            <p className={'site-form-error'} role={'alert'}>
              {notice}
            </p>
          ) : null}
          <button
            className={'site-button'}
            type={'submit'}
            disabled={isSending}
          >
            {section.buttonText || 'Send'}
          </button>
        </form>
      )}
    </section>
  );
};

export default MessageForm;
