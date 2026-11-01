const stripHTMLTags = (htmlString: string): string => {
  if (typeof window === 'undefined') {
    return htmlString.replace(/(<([^>]+)>)/gi, '');
  }
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  return `${div.textContent || div.innerText || ''}`.trim();
};

const getCurrentUrl = () => {
  return window.location.href;
};

// A full load, leaving no history entry.
const goTo = (url: string) => {
  window.location.replace(url);
};

const Utils = {
  stripHTMLTags,
  getCurrentUrl,
  goTo
};

export default Utils;
