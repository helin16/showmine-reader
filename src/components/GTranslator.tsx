import { useEffect, useState } from 'react';
import { hasCookie, setCookie } from 'cookies-next';

const LANGUAGE_ENGLISH = '/auto/en';
const LANGUAGE_CHINESE = '/auto/zh-CN';

const HTML_ID_FOR_SELECTOR = 'app-gTranslator';
const GTranslator = () => {
  const [, setSelected] = useState(LANGUAGE_CHINESE);
  useEffect(() => {
    const addScript = document.createElement('script');
    addScript.setAttribute(
      'src',
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    );
    document.body.appendChild(addScript);
    // @ts-ignore
    window.googleTranslateElementInit = googleTranslateElementInit;

    if (hasCookie('googtrans')) {
      // @ts-ignore
      setSelected(getCookie('googtrans'));
    } else {
      // @ts-ignore
      setSelected(LANGUAGE_CHINESE);
    }
  }, []);

  const googleTranslateElementInit = () => {
    // @ts-ignore
    new window.google.translate.TranslateElement(
      {
        pageLanguage: 'auto',
        autoDisplay: false,
        includedLanguages: 'en,zh-CN'
      },
      HTML_ID_FOR_SELECTOR
    );
  };

  const langChange = (langCode: string) => {
    if (hasCookie('googtrans')) {
      setCookie('googtrans', decodeURI(langCode));
      setSelected(langCode);
    } else {
      setCookie('googtrans', langCode);
      setSelected(langCode);
    }
    window.location.reload();
  };

  return (
    <div className={'g-translator'}>
      <div id={HTML_ID_FOR_SELECTOR} style={{ display: 'none' }} />
      <div className={'icons'}>
        <img
          src={'https://cdn.gtranslate.net/flags/24/zh-CN.png'}
          alt={'Simplified Chinese'}
          title={'中文(Simplified Chinese)'}
          onClick={() => langChange(LANGUAGE_CHINESE)}
        />
        <img
          src={'https://cdn.gtranslate.net/flags/24/en.png'}
          alt={'English'}
          title={'English(英文)'}
          onClick={() => langChange(LANGUAGE_ENGLISH)}
        />
      </div>
    </div>
  );
};

export default GTranslator;
