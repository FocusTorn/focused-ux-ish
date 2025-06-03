/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
	semi: false,
	trailingComma: 'es5',
	useTabs: false,
	printWidth: 100,
    
	experimentalTernaries: true,
	// requireConfig: true,
	tabWidth: 2,
	singleQuote: true,
    
	proseWrap: 'preserve', // Options: "always", "never", "preserve"
}
  
export default config
