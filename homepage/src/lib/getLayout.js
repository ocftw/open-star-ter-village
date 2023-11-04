import { getNavigationList } from './getNavigationList';
import { fetchFooter } from './fetchFooter';

export const getLayout = async (locale) => {
  const navigation = await getNavigationList(locale);
  const header = {
    navigation,
  };
  const footer = fetchFooter(locale);
  const layout = {
    header,
    footer,
  };

  return layout;
};
