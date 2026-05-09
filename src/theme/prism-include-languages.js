import siteConfig from '@generated/docusaurus.config';

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: { prism },
  } = siteConfig;
  const { additionalLanguages } = prism;

  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;

  additionalLanguages.forEach((lang) => {
    if (lang === 'php') {
      // eslint-disable-next-line global-require
      require('prismjs/components/prism-markup-templating.js');
    }
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`prismjs/components/prism-${lang}`);
  });

  delete globalThis.Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismObject;
  }

  // bash-profiling: plain-text profiling report output
  PrismObject.languages['bash-profiling'] = {};

  // zisk-bash: bash + cargo zisk command/subcommand highlighting
  PrismObject.languages['zisk-bash'] = PrismObject.languages.extend('bash', {});
  PrismObject.languages.insertBefore('zisk-bash', 'comment', {
    'zisk-call': {
      pattern: /\bcargo-zisk(?:\s+(?:new|build|setup|run|execute|prove|verify))?\b/,
      inside: {
        'zisk-subcommand': {
          pattern: /\b(?:new|build|setup|run|execute|prove|verify)\b/,
          alias: 'function',
        },
        'zisk-command': {
          pattern: /cargo-zisk/,
          alias: 'keyword',
        },
      },
    },
  });
}
