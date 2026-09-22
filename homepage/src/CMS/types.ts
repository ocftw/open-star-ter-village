import type { ComponentProps } from 'react';
import type { AssetsByLocale } from '../types/content';

type Cms = (typeof import('decap-cms-app'))['default'];

export type CmsConfig = NonNullable<Parameters<Cms['init']>[0]>['config'];

export type DecapPreviewProps = ComponentProps<
  Parameters<Cms['registerPreviewTemplate']>[1]
>;

export type DecapEntry = DecapPreviewProps['entry'];

// Decap passes the active i18n locale at runtime but omits it from its types.
export type PreviewTemplateProps = DecapPreviewProps & {
  locale: string;
  assetsByLocale: AssetsByLocale;
};
