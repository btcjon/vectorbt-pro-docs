// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  documentationSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'General Design',
    },
    {
      type: 'doc',
      id: 'building_blocks',
      label: 'Building Blocks',
    },
    {
      type: 'category',
      label: 'Data',
      items: [
        'data/overview',
        'data/local',
        'data/remote',
        'data/synthetic',
        'data/scheduling',
      ],
    },
    {
      type: 'category',
      label: 'Indicators',
      items: [
        'indicators/overview',
        'indicators/development',
        'indicators/analysis',
        'indicators/parsers',
      ],
    },
    {
      type: 'category',
      label: 'Portfolio',
      items: [
        'portfolio/overview',
        'portfolio/from-orders',
        'portfolio/from-signals',
      ],
    },
  ],
  tutorialsSidebar: [
    {
      type: 'doc',
      id: 'tutorials/installation',
      label: 'Installation',
    },
    {
      type: 'doc',
      id: 'tutorials/Basic-RSI-Strategy',
      label: 'Basic RSI Strategy',
    },
    {
      type: 'doc',
      id: 'tutorials/SuperFast-SuperTrend',
      label: 'SuperFast SuperTrend',
    },
    {
      type: 'doc',
      id: 'tutorials/Signal-Dev',
      label: 'Signal Development',
    },
    {
      type: 'doc',
      id: 'tutorials/Stop-Signals',
      label: 'Stop Signals',
    },
    {
      type: 'doc',
      id: 'tutorials/MTF-Analysis',
      label: 'MTF Analysis',
    },
    {
      type: 'doc',
      id: 'tutorials/Portfolio-Optimization',
      label: 'Portfolio Optimization',
    },
    {
      type: 'doc',
      id: 'tutorials/Pairs-Trading',
      label: 'Pairs Trading',
    },
    {
      type: 'doc',
      id: 'tutorials/Patterns',
      label: 'Patterns',
    },
    {
      type: 'doc',
      id: 'tutorials/Cross-Validation',
      label: 'Cross Validation',
    },
  ],
};

module.exports = sidebars; 