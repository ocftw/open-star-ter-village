import Footer from '../footer/footer';
import React, { type ReactNode } from 'react';
import Header from '../header/header';
import type { Layout, SiteData } from '../../types/content';

type SiteLayoutProps = Partial<Layout> & {
  children: ReactNode;
  siteData: SiteData;
};

const SiteLayout: React.FC<SiteLayoutProps> = ({
  children,
  siteData,
  header,
  footer,
}) => (
  <>
    <Header siteData={siteData} {...header} />
    <main>{children}</main>
    <Footer siteData={siteData} {...footer} />
  </>
);

export default SiteLayout;
