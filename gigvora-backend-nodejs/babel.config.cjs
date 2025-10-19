module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        bugfixes: true,
        modules: false,
      },
    ],
  ],
  sourceType: 'module',
};
