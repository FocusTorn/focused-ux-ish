// ESLint & Imports -->>

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path'; // dirname is not needed if using process.cwd() directly for tsconfig
// import { fileURLToPath } from 'node:url'; // Not needed if using process.cwd()
import process from 'process';
// import { globSync } from 'glob'; // globSync was commented out in your original plugin

//--------------------------------------------------------------------------------------------------------------<<

function stripJsonComments(data) { //>
	return data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m));
} //</

// Resolve tsconfig.json relative to the current working directory of the package being built
const absTsconfigPath = resolve(process.cwd(), 'tsconfig.json');
let tsconfigData = '';
let compilerOptions = { paths: {} };
let pathKeys = [];
let re = new RegExp('^()'); // Default to a regex that matches nothing

try {
	tsconfigData = readFileSync(absTsconfigPath, 'utf8');
	tsconfigData = stripJsonComments(tsconfigData);
	const parsedTsconfig = JSON.parse(tsconfigData);
	if (parsedTsconfig.compilerOptions && parsedTsconfig.compilerOptions.paths) {
		compilerOptions = parsedTsconfig.compilerOptions;
		pathKeys = Object.keys(compilerOptions.paths);
		if (pathKeys.length > 0) {
			re = new RegExp(`^(${pathKeys.join('|')})`);
		}
	} else {
		// console.warn(`[createTsPathsPlugin] No compilerOptions.paths found in ${absTsconfigPath}`);
	}
} catch (e) {
	console.error(`[createTsPathsPlugin] Error reading or parsing tsconfig.json at ${absTsconfigPath}:`, e);
	// Plugin will effectively do nothing if tsconfig can't be read or paths are missing
}

const createTsPathsPlugin = { //>
	name: 'esbuild-ts-paths',
	setup(build) {
		if (pathKeys.length === 0) {
			// console.log('[createTsPathsPlugin] No paths found in tsconfig, plugin will not modify resolutions.');
			return; // No paths to resolve, so plugin does nothing
		}

		build.onResolve({ filter: re }, (args) => { //>
			const pathKey = pathKeys.find(pkey => new RegExp(`^${pkey}`).test(args.path)); // Simpler test

			if (!pathKey) {
				return undefined; // Let esbuild handle it if no alias prefix matches
			}

			const aliasPatternParts = pathKey.split('*'); // e.g., ["@utils/*"] -> ["@utils/", ""]
			const aliasPrefix = aliasPatternParts[0];
			
			let remainingPathAfterAlias = args.path.substring(aliasPrefix.length);

			for (const potentialPath of compilerOptions.paths[pathKey]) { //>
				const resolvedPathTarget = potentialPath.replace('*', remainingPathAfterAlias);
				// Resolve this path relative to the directory of the tsconfig.json (which is process.cwd())
				const absoluteResolvedPath = resolve(process.cwd(), resolvedPathTarget); 

				// esbuild expects just the path, it will handle .ts, .js, /index.ts resolution itself
				// We don't need globSync here.
				// We should return an object with 'path' and potentially 'external: true' if it's a node_module
				// For local paths, just returning the path is usually enough.
				// console.log(`[createTsPathsPlugin] Path alias: ${args.path} -> ${absoluteResolvedPath}`);
				return { path: absoluteResolvedPath };
			} //</

			return undefined; // If no path in the alias array resolved
		}); //</
	},
}; //</

export default createTsPathsPlugin;