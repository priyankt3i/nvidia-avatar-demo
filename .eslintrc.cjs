module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
      rules: {
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'prettier/prettier': ['error'],
      },
      settings: {
        react: { version: 'detect' },
      },
    },
  ],
};