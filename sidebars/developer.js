// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  developerSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      link: { type: 'doc', id: 'getting-started/getting-started' },
      items: [
        { type: 'doc', id: 'getting-started/install-linux' },
        { type: 'doc', id: 'getting-started/install-macos' },
        { type: 'doc', id: 'getting-started/quickstart' },
      ],
    },
    {
      type: 'category',
      label: 'Writing Programs',
      link: { type: 'doc', id: 'writing-programs/writing-programs' },
      items: [
        { type: 'doc', id: 'writing-programs/first-guest' },
        { type: 'doc', id: 'writing-programs/inputs' },
        { type: 'doc', id: 'writing-programs/outputs' },
        { type: 'doc', id: 'writing-programs/profiling' },
        { type: 'doc', id: 'writing-programs/libraries' },
      ],
    },
    {
      type: 'category',
      label: 'Proving Programs',
      link: { type: 'doc', id: 'proving-programs/proving-programs' },
      items: [
        { type: 'doc', id: 'proving-programs/first-proof' },
        { type: 'doc', id: 'proving-programs/prover-client' },
        { type: 'doc', id: 'proving-programs/proof-format' },
        { type: 'doc', id: 'proving-programs/io' },
        { type: 'doc', id: 'proving-programs/io-advanced' },
        { type: 'doc', id: 'proving-programs/verify-proof' },
      ],
    },
  ],
};

export default sidebars;