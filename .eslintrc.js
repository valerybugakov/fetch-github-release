module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    sourceType: 'module',
  },
  env: {
    node: true,
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:import/recommended'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
      ],
      parser: '@typescript-eslint/parser',
      plugins: ['prettier', '@typescript-eslint'],
    },
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.d.ts', '.ts', '.tsx'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
    node: {
      tryExtensions: ['.js', '.ts', '.d.ts'],
    },
  },
}
