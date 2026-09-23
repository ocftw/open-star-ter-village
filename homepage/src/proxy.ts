import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from './lib/i18n';

const LOCALE_COOKIE = 'NEXT_LOCALE';

const isLocale = (value: string | undefined): value is Locale =>
  locales.includes(value as Locale);

// Accept-Language tags each locale answers to. Mirrors the prefix matching
// Next.js uses for `/` (a locale also matches its shorter prefixes, but a
// header tag like `en-US` does not match `en`), so deep links and the root
// agree on every header.
const localeTags = new Map<string, Locale>(
  locales.flatMap((locale) => {
    const parts = locale.toLowerCase().split('-');
    return parts.map(
      (_, end) => [parts.slice(0, end + 1).join('-'), locale] as const,
    );
  }),
);

// The supported locale the visitor ranks highest, if any.
export const preferredLocale = (header: string | null): Locale | undefined => {
  if (!header) return undefined;

  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='));
      return { tag, q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter(({ tag, q }) => tag && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of ranked) {
    const locale = localeTags.get(tag);
    if (locale) return locale;
  }
  return undefined;
};

// Next.js only detects the visitor's locale on `/`. Deep links without a
// locale prefix (e.g. `/cards/` from the webapp) would otherwise always
// render the default locale.
//
// Next.js strips the default locale prefix before the proxy runs, so
// `/zh-Hant/cards/` and `/cards/` are indistinguishable here. An explicit
// zh-Hant choice is instead remembered by the NEXT_LOCALE cookie that the
// language switcher sets.
export const proxy = (request: NextRequest) => {
  if (request.nextUrl.locale !== defaultLocale) return NextResponse.next();

  if (isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const locale = preferredLocale(request.headers.get('accept-language'));
  if (!locale || locale === defaultLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.locale = locale;
  return NextResponse.redirect(url);
};

export const config = {
  // `/` is left to Next.js' built-in detection. Also skip Next.js internals,
  // Netlify functions, the Decap CMS shell, and files.
  matcher: ['/((?!_next/|\\.netlify/|admin(?:/|$)|.*\\.[^/]+$).+)'],
};
