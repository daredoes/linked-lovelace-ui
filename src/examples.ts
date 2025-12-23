export const EXAMPLES = {
  views: [
    {
      title: 'Linked Lovelace Examples',
      cards: [
        {
          type: 'markdown',
          content: '# Linked Lovelace Examples',
        },
      ],
    },
    {
      title: 'Templates',
      cards: [
        {
          ll_key: 'simple-template',
          type: 'markdown',
          content: 'This is a simple template.',
        },
        {
          ll_key: 'context-template',
          type: 'markdown',
          content: 'Hello, <%= context.name %>!',
        },
        {
          ll_key: 'nested-template',
          type: 'custom:linked-lovelace-template',
          ll_template: 'context-template',
          ll_context: {
            name: 'Nested Template',
          },
        },
      ],
    },
    {
      title: 'Usage',
      cards: [
        {
          type: 'custom:linked-lovelace-template',
          ll_template: 'simple-template',
        },
        {
          type: 'custom:linked-lovelace-template',
          ll_template: 'context-template',
          ll_context: {
            name: 'World',
          },
        },
        {
          type: 'custom:linked-lovelace-template',
          ll_template: 'nested-template',
        },
      ],
    },
  ],
};
