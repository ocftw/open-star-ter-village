import Footer from '../footer/footer';
import type { ReactNode } from 'react';
import Header from '../header/header';
import type { Layout, SiteData } from '../../types/content';

type SiteLayoutProps = Partial<Layout> & {
  children: ReactNode;
  siteData: SiteData;
};

const SiteLayout = ({
  children,
  siteData,
  header,
  footer,
}: SiteLayoutProps) => (
  <>
    <Header siteData={siteData} {...header} />
    <main>{children}</main>
    <Footer siteData={siteData} {...footer} />
  </>
);

export default SiteLayout;
