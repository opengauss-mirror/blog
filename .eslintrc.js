module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      tsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-var': 'error',
    'no-unused-vars': 'error',
    'no-multiple-empty-lines': 'error',
    eqeqeq: 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'vue/no-v-model-argument': 'off',
  },
};
