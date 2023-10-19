import { titleToAnchorId } from "./titleToAnchorId";

export function processCardData(data) {
  let image = data.image;
  const defaultImage = '/images/uploads/初階專案卡封面-01.png';
  image = image ? image.replace('/homepage/public', '') : defaultImage;

  // Workaround for image prefix path. Will be removed after image path is fixed in all cards.
  image = !image.startsWith('/') ? `/${image}` : image;

  return {
    ...data,
    image,
    id: data.id || titleToAnchorId(data.title),
  }
}
