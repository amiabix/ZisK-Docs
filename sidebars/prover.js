// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  proverSidebar: [
    { type: 'doc', id: 'intro' },
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'getting-started/getting-started' },
      items: [
        { type: 'doc', id: 'getting-started/understanding-distributed-proving' },
        { type: 'doc', id: 'getting-started/architecture' },
        { type: 'doc', id: 'getting-started/quickstart' },
      ],
    },
    {
      type: 'category',
      label: 'Deploying your prover',
      link: { type: 'doc', id: 'deploying/deploying' },
      items: [
        { type: 'doc', id: 'deploying/linux-server' },
        { type: 'doc', id: 'deploying/docker-compose' },
        { type: 'doc', id: 'deploying/testing' },
      ],
    },
    {
      type: 'category',
      label: 'Monitoring',
      link: { type: 'doc', id: 'monitoring/monitoring' },
      items: [
        { type: 'doc', id: 'monitoring/metrics-and-alerts' },
        { type: 'doc', id: 'monitoring/logs' },
        { type: 'doc', id: 'monitoring/scaling-and-restarts' },
        { type: 'doc', id: 'monitoring/troubleshooting' },
      ],
    },
  ],
};

export default sidebars;
