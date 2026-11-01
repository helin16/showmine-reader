import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier/flat';
import prettierPlugin from 'eslint-plugin-prettier';

const eslintConfig = [
  ...nextCoreWebVitals,
  prettierConfig,
  { plugins: { prettier: prettierPlugin } }
];

export default eslintConfig;
