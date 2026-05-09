// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  referencesSidebar: [
    {
      type: 'category',
      label: 'zisk-os',
      link: { type: 'doc', id: 'zisk-os/index' },
      items: [
        { type: 'doc', id: 'zisk-os/entrypoint' },
        { type: 'doc', id: 'zisk-os/io' },
        { type: 'doc', id: 'zisk-os/profiling' },
        {
          type: 'category',
          label: 'zisklib',
          link: { type: 'doc', id: 'zisk-os/zisklib/index' },
          items: [
            { type: 'doc', id: 'zisk-os/zisklib/hash-functions' },
            { type: 'doc', id: 'zisk-os/zisklib/secp256k1' },
            { type: 'doc', id: 'zisk-os/zisklib/secp256r1' },
            { type: 'doc', id: 'zisk-os/zisklib/bn254' },
            { type: 'doc', id: 'zisk-os/zisklib/bls12-381' },
          ],
        },
        {
          type: 'category',
          label: 'Precompiles',
          link: { type: 'doc', id: 'zisk-os/precompiles/index' },
          items: [
            { type: 'doc', id: 'zisk-os/precompiles/hash-functions' },
            { type: 'doc', id: 'zisk-os/precompiles/big-integer' },
            { type: 'doc', id: 'zisk-os/precompiles/secp256k1' },
            { type: 'doc', id: 'zisk-os/precompiles/secp256r1' },
            { type: 'doc', id: 'zisk-os/precompiles/bn254' },
            { type: 'doc', id: 'zisk-os/precompiles/bls12-381' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'zisk-sdk',
      link: { type: 'doc', id: 'zisk-sdk/index' },
      items: [
        { type: 'doc', id: 'zisk-sdk/guest-program' },
        { type: 'doc', id: 'zisk-sdk/stdin' },
        { type: 'doc', id: 'zisk-sdk/stream' },
        { type: 'doc', id: 'zisk-sdk/hints' },
        { type: 'doc', id: 'zisk-sdk/prover-client' },
        { type: 'doc', id: 'zisk-sdk/prover-client-builder' },
        { type: 'doc', id: 'zisk-sdk/proof' },
        { type: 'doc', id: 'zisk-sdk/proof-kinds' },
        { type: 'doc', id: 'zisk-sdk/pipeline-requests' },
        { type: 'doc', id: 'zisk-sdk/job-handle' },
        { type: 'doc', id: 'zisk-sdk/job-events' },
        { type: 'doc', id: 'zisk-sdk/cancellation' },
      ],
    },
    {
      type: 'category',
      label: 'cargo-zisk',
      link: { type: 'doc', id: 'cargo-zisk/index' },
      items: [
        { type: 'doc', id: 'cargo-zisk/new' },
        { type: 'doc', id: 'cargo-zisk/build' },
        { type: 'doc', id: 'cargo-zisk/run' },
        { type: 'doc', id: 'cargo-zisk/program-setup' },
        { type: 'doc', id: 'cargo-zisk/execute' },
        { type: 'doc', id: 'cargo-zisk/prove' },
        { type: 'doc', id: 'cargo-zisk/wrap-proof' },
        { type: 'doc', id: 'cargo-zisk/verify' },
        { type: 'doc', id: 'cargo-zisk/utils' },
      ],
    },
    {
      type: 'category',
      label: 'Coordinator API',
      link: { type: 'doc', id: 'api/index' },
      items: [
        { type: 'doc', id: 'api/overview' },
        { type: 'doc', id: 'api/register-guest-program' },
        { type: 'doc', id: 'api/job-request' },
        { type: 'doc', id: 'api/wait-job-result' },
        { type: 'doc', id: 'api/watch-job' },
        { type: 'doc', id: 'api/streaming-input' },
        { type: 'doc', id: 'api/cancel-job' },
        { type: 'doc', id: 'api/data-types' },
        { type: 'doc', id: 'api/errors' },
      ],
    },
  ],
};

export default sidebars;