import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '68f'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'e55'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', 'ed5'),
            routes: [
              {
                path: '/building_blocks',
                component: ComponentCreator('/building_blocks', '400'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/data',
                component: ComponentCreator('/data', 'f68'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/data-local',
                component: ComponentCreator('/data-local', 'ce3'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/data-remote',
                component: ComponentCreator('/data-remote', '9b9'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/data-scheduling',
                component: ComponentCreator('/data-scheduling', '4d7'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/data-synthetic',
                component: ComponentCreator('/data-synthetic', 'ec6'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/indicator-analysis',
                component: ComponentCreator('/indicator-analysis', 'bba'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/indicator-development',
                component: ComponentCreator('/indicator-development', '4ad'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/indicator-parsers',
                component: ComponentCreator('/indicator-parsers', '03f'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/indicators',
                component: ComponentCreator('/indicators', 'd4b'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/intro',
                component: ComponentCreator('/intro', 'bd0'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/portfolio',
                component: ComponentCreator('/portfolio', '475'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/portfolio-from-orders',
                component: ComponentCreator('/portfolio-from-orders', '17a'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/portfolio-from-signals',
                component: ComponentCreator('/portfolio-from-signals', 'a32'),
                exact: true,
                sidebar: "documentationSidebar"
              },
              {
                path: '/tutorials/Basic-RSI-Strategy',
                component: ComponentCreator('/tutorials/Basic-RSI-Strategy', '695'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Cross-Validation',
                component: ComponentCreator('/tutorials/Cross-Validation', '646'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/installation',
                component: ComponentCreator('/tutorials/installation', '6f7'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/MTF-Analysis',
                component: ComponentCreator('/tutorials/MTF-Analysis', '26e'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Pairs-Trading',
                component: ComponentCreator('/tutorials/Pairs-Trading', 'af9'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Patterns',
                component: ComponentCreator('/tutorials/Patterns', '8c5'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Portfolio-Optimization',
                component: ComponentCreator('/tutorials/Portfolio-Optimization', '130'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Signal-Dev',
                component: ComponentCreator('/tutorials/Signal-Dev', '26d'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/Stop-Signals',
                component: ComponentCreator('/tutorials/Stop-Signals', 'e79'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/tutorials/SuperFast-SuperTrend',
                component: ComponentCreator('/tutorials/SuperFast-SuperTrend', 'f97'),
                exact: true,
                sidebar: "tutorialsSidebar"
              },
              {
                path: '/vectorBT-PRO-cookbook',
                component: ComponentCreator('/vectorBT-PRO-cookbook', '1c8'),
                exact: true
              },
              {
                path: '/',
                component: ComponentCreator('/', '48d'),
                exact: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
