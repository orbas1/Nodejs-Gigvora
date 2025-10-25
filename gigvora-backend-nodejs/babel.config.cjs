module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        bugfixes: true,
        modules: false,
        useBuiltIns: false,
      },
    ],
  ],
  sourceType: 'module',
  comments: false,
  ignore: ['**/node_modules/**'],
  overrides: [
    {
      test: ['./../shared-contracts/**/*.js'],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'commonjs',
          },
        ],
      ],
    },
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: false,
          },
        ],
      ],
    },
  },
};
