import FooterLinks from '../../../layouts/footer/footerLinks';

const FooterPreview = ({ entry }) => {
  const footer = entry.getIn(['data', 'footer']);
  const links = footer
    ?.get('links')
    .map((link) => {
      return {
        displayText: link.get('display_text')?.toString(),
        url: link.get('url')?.toString(),
      };
    })
    .toArray();
  return <FooterLinks links={links} />;
};

export default FooterPreview;
