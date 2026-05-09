// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  introSidebar: [
    {
      type: 'category',
      label: 'Introduction',
      link: { type: 'doc', id: 'introduction/overview' },
      items: [
        { type: 'doc', id: 'introduction/overview' },
        { type: 'doc', id: 'introduction/background' },
        { type: 'doc', id: 'introduction/why-zisk' },
      ],
    },
    {
      type: 'category',
      label: 'How ZisK works',
      link: { type: 'doc', id: 'how-zisk-works/overview' },
      items: [
        { type: 'doc', id: 'how-zisk-works/pipeline' },
        { type: 'doc', id: 'how-zisk-works/host-and-guest' },
        { type: 'doc', id: 'how-zisk-works/components' },
        { type: 'doc', id: 'how-zisk-works/scaling' },
        { type: 'doc', id: 'how-zisk-works/proof-lifecycle' },
      ],
    },
    {
      type: 'category',
      label: 'Deep understanding',
      link: { type: 'doc', id: 'deep/isa' },
      items: [
        { type: 'doc', id: 'deep/processor' },
        { type: 'doc', id: 'deep/arithmetization' },
        { type: 'doc', id: 'deep/chips' },
        { type: 'doc', id: 'deep/continuations' },
        { type: 'doc', id: 'deep/recursion' },
        { type: 'doc', id: 'deep/pipeline' },
        { type: 'doc', id: 'deep/proving-backends' },
        { type: 'doc', id: 'deep/limits' },
      ],
    },
  ],
};

export default sidebars;
