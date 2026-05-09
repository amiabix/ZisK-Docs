// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'ZisK Docs',
  tagline: 'Zero-Knowledge Virtual Machine',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'zisk',
  projectName: 'zisk-docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: false, // Disabled — using multi-instance plugins below
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'intro',
        path: 'intro',
        routeBasePath: 'intro',
        sidebarPath: './sidebars/intro.js',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'developer',
        path: 'developer',
        routeBasePath: 'developer',
        sidebarPath: './sidebars/developer.js',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'prover',
        path: 'prover',
        routeBasePath: 'prover',
        sidebarPath: './sidebars/prover.js',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'references',
        path: 'references',
        routeBasePath: 'references',
        sidebarPath: './sidebars/references.js',
      },
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      mermaid: {
        theme: { light: 'default', dark: 'dark' },
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
      },
      navbar: {
        title: '',
        logo: {
          alt: 'ZisK',
          src: 'img/logo.svg',
          style: { height: '26px', width: 'auto' },
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'introSidebar',
            docsPluginId: 'intro',
            position: 'left',
            label: 'ZISKVM',
          },
          {
            to: '/developer/intro',
            position: 'left',
            label: 'Developers',
            activeBaseRegex: '/developer/',
          },
          {
            type: 'docSidebar',
            sidebarId: 'proverSidebar',
            docsPluginId: 'prover',
            position: 'left',
            label: 'Provers',
          },
          {
            to: '/references/intro',
            position: 'left',
            label: 'References',
            activeBaseRegex: '/references/',
          },
          {
            href: 'https://github.com/0xPolygonHermez/zisk',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {label: 'ZISKVM', to: '/intro/intro'},
              {label: 'Developers', to: '/developer/intro'},
              {label: 'Provers', to: '/prover/intro'},
              {label: 'References', to: '/references/intro'},
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/0xPolygonHermez/zisk',
              },
              {
                label: 'Zisk',
                href: 'https://zisk.technology',
              },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} ZisK — Zero-Knowledge Virtual Machine`,
      },
      prism: {
        theme: {
          plain: { color: '#CBD5E1', backgroundColor: '#1C1D2B' },
          styles: [
            ...prismThemes.vsDark.styles,
            // ZisK brand overrides
            { types: ['comment', 'prolog', 'doctype', 'cdata'],         style: { color: '#3D6B58', fontStyle: 'italic' } },
            { types: ['keyword', 'builtin', 'important'],               style: { color: '#00FF7C' } },
            { types: ['string', 'char', 'attr-value', 'regex'],         style: { color: '#A4F6D0' } },
            { types: ['function', 'method', 'attr-name'],               style: { color: '#0ABF83' } },
            { types: ['class-name', 'maybe-class-name', 'namespace'],   style: { color: '#A4F6D0' } },
            { types: ['number', 'boolean', 'constant'],                 style: { color: '#F4FF00' } },
            { types: ['operator', 'punctuation'],                       style: { color: '#8E8E8A' } },
            { types: ['variable'],                                       style: { color: '#0ABF83' } },
          ],
        },
        darkTheme: prismThemes.vsDark,
        additionalLanguages: ['rust', 'bash', 'toml', 'json', 'solidity'],
        magicComments: [
          {
            className: 'theme-code-block-highlighted-line',
            line: 'highlight-next-line',
            block: { start: 'highlight-start', end: 'highlight-end' },
          },
        ],
      },
    }),
};

export default config;
