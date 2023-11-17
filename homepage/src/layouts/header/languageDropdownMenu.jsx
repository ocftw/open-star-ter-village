import { useRouter } from 'next/router';
import Link from 'next/link';

const languageLabelDictionary = {
  en: 'English',
  'zh-Hant': '中文',
};

const LanguageDropdownMenu = () => {
  const router = useRouter();
  const { asPath, locales } = router;
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
