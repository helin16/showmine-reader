const stripHTMLTags = (htmlString: string): string => {
  if (typeof window === 'undefined') {
    return htmlString.replace(/(<([^>]+)>)/gi, '');
  }
  const div = document.createElement("div");
  div.innerHTML = htmlString;
  return div.textContent || div.innerText || '';
};

export default {
  stripHTMLTags,
};
