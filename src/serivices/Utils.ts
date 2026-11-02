// The named entities articles use. Numeric ones are handled below, and anything else stays as it is.
const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  emsp: '\u2003',
  zwnj: '\u200c',
  ldquo: '\u201c',
  rdquo: '\u201d',
  lsquo: '\u2018',
  rsquo: '\u2019',
  mdash: '\u2014',
  ndash: '\u2013',
  hellip: '\u2026',
  middot: '\u00b7',
  bull: '\u2022',
  Oslash: '\u00d8',
  egrave: '\u00e8'
};

const decodeEntity = (entity: string, name: string) => {
  if (!name.startsWith('#')) {
    return HTML_ENTITIES[name] ?? entity;
  }
  const isHex = name[1].toLowerCase() === 'x';
  const code = parseInt(name.slice(isHex ? 2 : 1), isHex ? 16 : 10);
  return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
};

// The same on the server and in the browser, or a page's text differs between them and React can't hydrate it.
const stripHTMLTags = (htmlString: string): string =>
  htmlString
    .replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, decodeEntity)
    .trim();

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
