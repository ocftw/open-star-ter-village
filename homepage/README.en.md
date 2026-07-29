# Open StarTer Village Homepage

Chinese version: [README.md](./README.md)

See [`CHANGELOG.md`](./CHANGELOG.md) for release history.

The current template design is based on the [homepage wireframe](https://drive.google.com/file/d/1mHfiHLZPNvAGKtlY788Ojkmap9SXupH-/view?usp=sharing), styled with [Bootstrap v4.6.x](https://getbootstrap.com/docs/4.6/getting-started/introduction/) and [Font Awesome v5.15.4](https://fontawesome.com/v5/docs).

The project is deployed on Netlify, which provides a free [domain](https://openstartervillage.netlify.app/) and supports [automatic deployment](https://docs.netlify.com/site-deploys/overview/), keeping the deployment process simple.

The site also supports [multiple languages](https://nextjs.org/docs/advanced-features/i18n-routing) and uses [Decap CMS](https://decapcms.org/) as its content management tool.

## Project Setup

- Runtime: Node.js >= 24
- Package manager: pnpm 11.15.1 (repository root workspace)
- Framework: Next.js 16
- CMS: Decap CMS

Common commands:

```bash
pnpm homepage dev         # Start the dev server
pnpm homepage build       # Build the site
pnpm homepage start       # Start the production server
pnpm homepage lint        # Prettier check + ESLint
pnpm homepage lint:fix    # Auto-fix formatting and lint issues
pnpm homepage test:admin  # Verify the Decap CMS shell against a production build
pnpm homepage test:visual # Compare Playwright visual snapshots of public pages
```

## 💫 Deployment

Netlify must read `pnpm-lock.yaml` and `netlify.toml` from the repository root:

- Base directory stays blank (repository root).
- Package directory is set to `homepage`.
- Build command and Publish directory are managed by the root `netlify.toml`.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village)

### Live Demo

[![Netlify Status](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

## Domain Setup

Open StarTer Village has a subdomain under ocf.tw, at [https://openstartervillage.ocf.tw/](https://openstartervillage.ocf.tw/), which is currently pointed at Netlify.

## 🚀 Getting Started

### How to Collaborate / Contribute

Join our [Discord](https://discord.gg/JnTHGnxwYS) and share your thoughts in #村長辦公室 and #基礎建設部!

### Website Development

If you're interested in website development, the following resources may help.

- [Official website roadmap](https://github.com/ocftw/open-star-ter-village/wiki/Homepage-Roadmap)

#### Before You Start Developing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

#### Verifying CMS Admin Changes: Use the `cms-preview` Branch

**Deploy Previews (`deploy-preview-<PR number>--…`) cannot log in to `/admin`.** This is expected, not broken.

A GitHub OAuth App can only register **one** callback URL, and each PR's Deploy Preview has a different domain. GitHub also doesn't expose a REST API for updating an OAuth App's settings, so a callback can't be registered per PR automatically. The callback always points at the fixed domain below, so logging in from a Deploy Preview hits `redirect_uri_mismatch` after authorization.

Deploy Preview's **public pages work normally** — only the `/admin` login is unavailable.

To verify admin changes, use the dedicated `cms-preview` branch deployment instead:

<https://cms-preview--openstartervillage.netlify.app/admin/>

Ways to deploy (pick one):

- GitHub Actions → **Deploy CMS Preview** → Run workflow, entering the ref to deploy
- Push directly to the `cms-preview` branch

This branch is for development verification only. **General content editors should always use the production site's admin** — see "Editing Website Content" below.

`cms-preview`'s `backend.branch` still points at `main`, so edits made in this branch's admin still open Pull Requests against `main`. Remember to close those test PRs afterward.

### Editing Website Content

- [Website editing guide](https://github.com/ocftw/open-star-ter-village/wiki/%E7%B6%B2%E7%AB%99%E7%B7%A8%E8%BC%AF%E8%AA%AA%E6%98%8E-%E2%80%90-How-to-Edit-Homepage) (Chinese)

#### Finding the Admin Entry Point

The site footer has an "**Admin**" link that takes you to the content management admin.

![Admin link in the English footer](./docs/images/footer-admin-link-en.png)

The Chinese footer shows "**後台管理**" instead.

![Admin link in the Chinese footer](./docs/images/footer-admin-link-zh.png)

You can also open <https://openstartervillage.ocf.tw/admin/> directly.

#### Logging Into the Content Admin

Sign in with your **GitHub account**. The old shared Netlify Identity account has been retired — with GitHub sign-in, every content change is now recorded under your own name.

1. Once you're on the admin page, click "**Sign in with GitHub**"

   ![Decap CMS login screen](./docs/images/cms-login-production.png)

2. If you're not already signed in to GitHub, you'll see the GitHub sign-in screen titled **Sign in to GitHub to continue to Open StarTer Village CMS**. Enter your credentials and click **Sign in**

   ![GitHub sign-in screen](./docs/images/github-signin.png)

3. On first login, GitHub asks whether to authorize the app — click **Authorize**. You won't be asked again on later logins

   ![GitHub authorize screen](./docs/images/github-authorize.png)

4. After authorizing, you're returned to the admin, with the editable collections listed on the left (Pages / Cards / Settings / Footer)

   ![Collection list after login](./docs/images/cms-admin-loading.png)

The requested OAuth scope is `public_repo`, so it can only access public repositories — it never gains access to your other private projects.

#### What Permissions Do You Need?

**Anyone with a GitHub account can edit content directly — no need to request access beforehand.**

The system uses Decap CMS's open authoring mode, which routes you automatically based on your role in `ocftw/open-star-ter-village`:

| Your role                            | What happens on login                                            | Can publish directly                         |
| ------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------- |
| No repo access (general contributor) | The CMS forks the repo for you; edits are saved to your own fork | No — a maintainer reviews and merges your PR |
| Write role or above (maintainer)     | Edits go directly to a branch on the main repo                   | Yes                                          |

General contributors only see two workflow columns (Draft, Ready to Review); maintainers see all three.

#### Editing and Submitting for Review

1. In "Content," pick the collection you want to edit (Pages / Cards / Settings / Footer)
2. Edit the fields — a live preview appears on the right
3. After saving, move the item to "**Ready to Review**" under "Workflow"; this creates a Pull Request
4. Once a maintainer reviews and merges it, Netlify deploys automatically

Known limitation: image uploads by general contributors haven't been verified yet. If you need to add new image assets, ask a maintainer on Discord.

Decap CMS supports Markdown syntax. If you're not familiar with it, these two sites (Chinese) can help you learn, and the [markdown playground](https://hackmd.io/2OBWFw_FSiazt4JxoINNlQ?both) lets you practice.

- <https://markdown.tw/> (note: limited layout support on mobile/small screens)
- <https://www.casper.tw/development/2019/11/23/ten-mins-learn-markdown/>

#### Requesting Direct-Publish Access (Advanced)

Most people don't need this step — general contributors can complete edits through the fork + PR flow above.

If you need to skip review and publish directly, you need the **Write** role on `ocftw/open-star-ter-village`. This is a GitHub repo permission, not a CMS setting, so it can't be self-granted — an organization admin must grant it:

1. Ask in [Discord](https://discord.gg/JnTHGnxwYS) #基礎建設部, including your GitHub username
2. An org admin goes to **GitHub → ocftw/open-star-ter-village → Settings → Collaborators and teams** and invites you with the **Write** role
3. You'll receive an invite email; after accepting, sign back into the admin to see the full three-column workflow

Note that GitHub repo permissions apply to the whole repository — they can't be scoped to just the `homepage/` directory. If you only need to edit content, the general contributor flow above is enough; you don't need Write access.

### Adding / Renaming / Removing a Language

1. Add the language to the `i18n.locales` array in [`next.config.js`](./next.config.js). For language codes, see [BCP 47](https://www.w3.org/International/questions/qa-choosing-language-tags#question), [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes), [ISO 639-2](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes), [ISO 639-3](https://en.wikipedia.org/wiki/List_of_ISO_639-3_codes)

Currently supported languages: `zh-Hant`, `en`.

```js
// next.config.js
i18n: {
  locales: ['zh-Hant', 'en'],
  defaultLocale: 'zh-Hant',
},

// decap-cms.config.js
// decap cms i18n inherits from next.config.js
i18n: {
  structure: 'multiple_folders',
  locales: nextConfig.i18n.locales,
  default_locale: nextConfig.i18n.defaultLocale,
},
```

> Decap CMS's language array and default locale are inherited from `next.config.js`, so adding a language there automatically applies it in Decap CMS.
>
> The order of languages in the array determines the order shown when editing documents in Decap CMS.

2. Renaming a language code requires updating `i18n.locales` in `next.config.js` **and** renaming the matching locale folders under [`_cards`](./_cards/), [`_footer`](./_footer/), and [`_pages`](./_pages/).

For example: if you rename `zh-tw` to `zh-hant`, the `zh-tw` folders under `_cards`, `_footer`, and `_pages` must also be renamed to `zh-hant`.

> Decap CMS's language array and default locale are inherited from `next.config.js`, so changing a language there automatically applies the change in Decap CMS.
>
> The locale folder names must match the language codes in `next.config.js`'s `i18n.locales` array.
>
> If `defaultLocale` was `zh-tw` and you rename `zh-tw` to `zh-hant`, you must also update `defaultLocale` to `zh-hant`.
>
> Add a redirect rule in [`public/_redirects`](./public/_redirects) pointing the old language code to the new one. For example, if you change `zh-tw` to `zh-hant`, add `/zh-tw/* /zh-hant/:splat 301!` to `public/_redirects`.

## Other Links

- [Open StarTer Village ★ Onboarding Guide](https://hackmd.io/1B3eCm8sSbqDTdcMI7o85g) (Chinese)
- [Shared drive folder](https://drive.google.com/drive/folders/1d2rlxRLQ_iUVhq9-ZO7BGCjTl1ES2zf6)

## Inspiration

- [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git)
- [Creating a static website with ReactJS and renderToStaticMarkup()](https://www.codemzy.com/blog/static-website-react-rendertostaticmarkup)
- [Chinese Lorem Ipsum generator](http://www.richyli.com/tool/loremipsum/)
- [Static Site Generation with React and Webpack](https://sking7.github.io/articles/945674580.html)
- [Benchmarking esbuild, swc, tsc, and babel for React/JSX projects](https://datastation.multiprocess.io/blog/2021-11-13-benchmarking-esbuild-swc-typescript-babel.html)
- [Why you should use SWC (and not Babel)](https://blog.logrocket.com/why-you-should-use-swc/)
- [Migrating to SWC: A brief overview](https://blog.logrocket.com/migrating-swc-webpack-babel-overview/)
- [Why Next.js switched from Babel to SWC](https://nextjs.org/blog/next-11-1#adopting-rust-based-swc)
- [Next.js documents](https://nextjs.org/docs/getting-started)
- [Next.js blogging template for Netlify](https://github.com/wutali/nextjs-netlify-blog-template)
- [unified](https://github.com/unifiedjs/unified)
- [remark](https://github.com/remarkjs/remark)
- [rehype](https://github.com/rehypejs/rehype)
- [How to build a blog with Next.js](https://dev.to/sagar/building-a-blog-with-next-js-253)
- [How to Internationalize Sites with Country-Based Redirects](https://www.netlify.com/blog/2021/11/05/how-to-internationalize-sites-with-country-based-redirects/)

## Special Thanks

[@binaryluke](https://github.com/binaryluke) contributed the site architecture concept during the v2.0.0 phase.
