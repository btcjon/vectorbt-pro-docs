// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'VectorBT PRO Documentation',
  tagline: 'Comprehensive documentation and tutorials for VectorBT PRO',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://vectorbt-pro-docs.netlify.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'btcjon', // Usually your GitHub org/user name.
  projectName: 'vectorbt-pro-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/', // Serve the docs at the site's root
          editUrl:
            'https://github.com/btcjon/vectorbt-pro-docs/tree/main/',
        },
        blog: false, // Disable the blog feature
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        pages: false, // Disable the pages plugin since we're using docs as root
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'VectorBT PRO',
        logo: {
          alt: 'VectorBT PRO Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'documentationSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            type: 'docSidebar',
            sidebarId: 'tutorialsSidebar',
            position: 'left',
            label: 'Tutorials',
          },
          {
            href: 'https://github.com/btcjon/vectorbt-pro-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Documentation',
                to: '/',
              },
              {
                label: 'Tutorials',
                to: '/tutorials/installation',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/btcjon/vectorbt-pro-docs',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} VectorBT PRO Documentation. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config; 