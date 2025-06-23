/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
//  */
const config = {
	semi: false,
	trailingComma: 'es5',
	useTabs: false,
	printWidth: 100,
    
	experimentalTernaries: true,
	// requireConfig: true,
	tabWidth: 4,
	singleQuote: true,
    
	// plugins: ['./.prettier/plugin.cjs'],
    
	// proseWrap: 'preserve', // Options: "always", "never", "preserve"
}
  
// export default config
module.exports = config;