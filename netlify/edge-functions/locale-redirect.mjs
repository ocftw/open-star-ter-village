import { defaultLocale, locales } from '../../homepage/src/lib/i18n.ts';

const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * The supported locale the visitor ranks highest in Accept-Language, if any.
 * A tag matches by its primary subtag (`en-US` → `en`, `zh-TW` → `zh-Hant`),
 * the same way Netlify's Language condition redirects `/`.
 */
export const preferredLocale = (header) => {
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
    const primary = tag.split('-')[0];
    const locale = locales.find(
      (candidate) => candidate.toLowerCase().split('-')[0] === primary,
    );
    if (locale) return locale;
  }
  return undefined;
};

const hasLocaleCookie = (cookieHeader) =>
  (cookieHeader ?? '').split(';').some((cookie) => {
    const [name, value] = cookie.trim().split('=');
    return name === LOCALE_COOKIE && locales.includes(value);
  });

/**
 * Next.js only detects the visitor's locale on `/`, so deep links without a
 * locale prefix (e.g. `/cards/` from the webapp) always rendered zh-Hant.
 * This applies the same Accept-Language and NEXT_LOCALE rules to every other
 * page. It runs as a Netlify Edge Function rather than Next.js middleware:
 * middleware makes the Pages Router refetch page data on every hydration.
 */
export default async (request) => {
  const { pathname, search } = new URL(request.url);

  // Files (favicon.ico, sitemap.xml, ...) are never localized.
  if (pathname.split('/').pop().includes('.')) return undefined;
  if (hasLocaleCookie(request.headers.get('cookie'))) return undefined;

  const locale = preferredLocale(request.headers.get('accept-language'));
  if (!locale || locale === defaultLocale) return undefined;

  return new Response(null, {
    status: 307,
    headers: {
      location: `/${locale}${pathname}${search}`,
      'cache-control': 'private, no-store',
      vary: 'Accept-Language, Cookie',
    },
  });
};

export const config = {
  path: '/*',
  // `/` is left to the Next.js runtime's own locale redirect.
  excludedPath: [
    '/',
    '/_next/*',
    '/.netlify/*',
    '/admin',
    '/admin/*',
    ...locales.flatMap((locale) => [`/${locale}`, `/${locale}/*`]),
  ],
};
