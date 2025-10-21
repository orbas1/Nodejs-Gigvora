module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended', 'plugin:import/recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      impliedStrict: true,
    },
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.mjs'],
      },
    },
  },
  reportUnusedDisableDirectives: true,
  rules: {
    'import/order': [
      'warn',
      {
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-default-export': 'warn',
    'import/newline-after-import': ['warn', { count: 1 }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': ['error', { destructuring: 'all' }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^ignored' }],
  },
  overrides: [
    {
      files: ['tests/**/*.js'],
      env: {
        jest: true,
      },
      rules: {
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'coverage/', 'tmp/'],
};
