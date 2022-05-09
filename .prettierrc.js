// .prettierrc.js

module.exports = {
  arrowParens: 'avoid',
  singleQuote: false,
  printWidth: 160,
  plugins: ['prettier-plugin-svelte'],
  semi: true,
  svelteSortOrder: 'options-styles-scripts-markup',
  svelteStrictMode: false,
  svelteBracketNewLine: true,
  svelteIndentScriptAndStyle: true,
  trailingComma: 'none'
}