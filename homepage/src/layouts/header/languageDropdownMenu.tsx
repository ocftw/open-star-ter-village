import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Locale } from '../../lib/i18n';

const languageLabelDictionary: Record<Locale, string> = {
  en: 'English',
  'zh-Hant': '中文',
};

const LanguageDropdownMenu = () => {
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
        >
          {languageLabelDictionary[locale]}
        </Link>
      ))}
    </div>
  );
};

export default LanguageDropdownMenu;
