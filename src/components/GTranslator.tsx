import { useEffect } from 'react';

const LANGUAGE_ENGLISH = 'en';
const LANGUAGE_CHINESE = 'zh-CN';

const HTML_ID_FOR_JS = 'app-gTranslator-js';
const HTML_ID_FOR_SELECTOR = 'app-gTranslator';
const GTranslator = () => {
  useEffect(() => {
    if (!document.getElementById(HTML_ID_FOR_JS)) {
      const addScript = document.createElement('script');
      addScript.setAttribute('id', HTML_ID_FOR_JS);
      addScript.setAttribute(
        'src',
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      );

      document.body.appendChild(addScript);
      // @ts-ignore
      window.googleTranslateElementInit = () => {
        // @ts-ignore
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'auto',
            autoDisplay: false,
            includedLanguages: [LANGUAGE_ENGLISH, LANGUAGE_CHINESE].join(',')
            // @ts-ignore
            // layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          HTML_ID_FOR_SELECTOR
        );
      };
    }
  }, []);

  const langChange = (langCode: string) => {
    const div = document.getElementById(HTML_ID_FOR_SELECTOR);
    if (div) {
      const options = div.getElementsByTagName('option');
      const select = div.getElementsByTagName('select')[0];
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        if (option.value === langCode) {
          if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
          }
        }
      }
    }
  };

  return (
    <div className={'g-translator'}>
      <div id={HTML_ID_FOR_SELECTOR} style={{ visibility: 'hidden' }} />
      <div className={'icons'}>
        <img
          src={'https://cdn.gtranslate.net/flags/24/zh-CN.png'}
          alt={'Simplified Chinese'}
          title={'中文(Simplified Chinese)'}
          onClick={() => langChange(LANGUAGE_CHINESE)}
        />{' '}
        <img
          src={'/images/aus.png'}
          alt={'English'}
          title={'English(英文)'}
          onClick={() => langChange(LANGUAGE_ENGLISH)}
        />
      </div>
    </div>
  );
};

export default GTranslator;
