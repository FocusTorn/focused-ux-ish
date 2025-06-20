import baseConfigPromise from '@focused-ux/config-eslint'

async function generateFullConfig() {
	const resolvedBaseConfig = await baseConfigPromise // Await the promise here

	return [
		
		...resolvedBaseConfig,
        
		// {
		//   files: ["*.js"], // Example: only for JS files in the root
		//   rules: { /* ... */ }
		// }
    
	]
}

/** @type {import('eslint').Linter.FlatConfig[]} */

export default generateFullConfig()
