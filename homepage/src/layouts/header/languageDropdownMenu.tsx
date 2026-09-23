import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Locale } from '../../lib/i18n';

const languageLabelDictionary: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '中文',
};

const LanguageDropdownMenu: React.FC = () => {
  const router = useRouter();
  const { asPath } = router;
  const locales = (router.locales ?? []) as Locale[];
  return (
    <div className="dropdown-menu dropdown-menu-right">
      {locales.map((locale) => (
        <Link
          key={languageLabelDictionary[locale]}
          className="dropdown-item"
          href={`/${locale}${asPath}`}
          locale={false}
          onClick={() => {
            // Remember the explicit choice so the locale-redirect edge
            // function stops redirecting away from it.
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
          }}
        >
          {languageLabelDictionary[locale]}
        </Link>
      ))}
    </div>
  );
};

export default LanguageDropdownMenu;
