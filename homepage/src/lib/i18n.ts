export const locales = ['zh-Hant', 'en'] as const;

export const defaultLocale = 'zh-Hant';

export type Locale = (typeof locales)[number];
