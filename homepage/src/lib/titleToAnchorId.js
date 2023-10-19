const cleanTitle = (title) => {
  // This regex keeps alphanumeric characters of many languages, but removes special characters.
  // The ranges include Latin, Greek, Cyrillic, Armenian, Hebrew, Arabic, Devanagari, Bengali, and more.
  return title
    .replace(/[^\w\s\u00A0-\u1FFF\u2C00-\uFBFF\uFE70-\uFEFF]/g, '')
    .trim();
};

export const titleToAnchorId = (title = '') => {
  let anchorId = title.toLowerCase(); // lowercase
  anchorId = cleanTitle(anchorId); // remove special characters
  anchorId = anchorId.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove accents
  anchorId = anchorId.replace(/\s+/g, '-'); // replace spaces with dashes

  return anchorId;
};
