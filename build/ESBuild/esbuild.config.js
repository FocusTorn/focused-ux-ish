// /* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable style/no-multiple-empty-lines */
 
 
//> Plugin wishlist

// @ztrehagem/svg-bundler

// //- Esbuild plugin to copy and watch for files  ------------------>>
// esbuild-plugin-copy-watch

// import copy from 'esbuild-plugin-copy-watch'

// await esbuild.build({
//   entryPoints: ['src/index.js'],
//   bundle: true,
//   outfile: 'dest/build.js',
//   write: false,
//   plugins: [
//     copy({
//       paths: [
//         { from: 'static/**', to: 'static' }, // will copy into dest/static
//         { from: ['config/*.js', '!config/private.js'], to: 'config' } // will copy config files into dest/config and ignore the private.js
//       ],
//       forceCopyOnRebuild: false // force to copy the files in every rebuild
//     })
//   ]
// })
// //----------------------------------------------------------------<<
// //- Plugin which uses tsc to compile typescript files ------------>>

// esbuild-tsc typescript

// import esbuildPluginTsc from 'esbuild-tsc';

// plugins: [
//     esbuildPluginTsc(options),
//   ],

// _tsconfigPath [string] _: Path of the tsconfig json file. filter [RegExp | Function]: A RegExp or function to filter files.

// //<

//- ESLINT  --->>
 


//---------------------------------------------------------------<<
//- IMPORTS  -->>


import { writeFile } from 'fs'
import { rm } from 'fs/promises'
import process from 'process'
import path from 'path'
import { fileURLToPath } from 'url'
import { context } from 'esbuild'

//---------------------------------------------------------------<<

const production = process.argv.includes('--production')
const meta = process.argv.includes('--meta')
const watch = process.argv.includes('--watch')
// const test = process.argv.includes('--test')


const pluginsToInclude = [ //>
	'./plugins/esbuildProblemMatcher.js',
	// './plugins/createTsPathsPlugin.js',

	// _fixPnpSourcemapPaths,
	// esbuildProblemMatcher
	// _logPathResolution,
] //<

async function loadPlugins() { // >
	const loadedPlugins = await Promise.all(
		pluginsToInclude.map(async (pluginEntry) => {
			try {
				if (typeof pluginEntry === 'string') {
					// External plugin (path provided)
					const pluginPath = new URL(pluginEntry, import.meta.url)
					const pluginModule = await import(pluginPath)

					pluginModule.default.name = path.basename(fileURLToPath(pluginPath), '.js')
					return pluginModule.default
				}
				else if (typeof pluginEntry === 'object' && pluginEntry.name) {
					// Plugin constant (assume it has a 'name' property)
					return pluginEntry
				}
				else {
					console.error(`Invalid plugin entry: ${pluginEntry}`)
					return null
				}
			}
			catch (err) {
				console.error(`Error loading plugin: ${pluginEntry}`, err)
				return null
			}
		}),
	)

	return loadedPlugins.filter(Boolean)
}

// <


const buildOptions = (async () => {
	const plugins = await loadPlugins()
	return {
		bundle: true,
		plugins,
        
		sourcemap: !production,
		minify: production,
        
        
		metafile: meta,
        
        
		sourcesContent: false,
		resolveExtensions: ['.js', '.ts'],
		format: 'cjs',
		platform: 'node',
		logLevel: 'info',
        
        
        

		external: ['vscode', 'typescript'],
		entryPoints: ['src/extension.ts'],
		outfile: 'dist/extension.cjs',
    
		logOverride: {
			'require-resolve-not-external': 'silent',
		},
    
	}
})()



async function main() {
	try {
		await rm('./dist', { recursive: true, force: true })
		await rm('./out', { recursive: true, force: true })
	}
	catch (err) {
		if (err.code !== 'ENOENT') { console.error('Error removing directory:', err) }
	}

	// if (test) { // Build *only* tests if --test is present
	//     const testCtx = await context(testOptions)
	//     await testCtx.rebuild()
	//     testCtx.dispose()
	// }
	// else { // Build main code and declaration files
    
    
	const options = await buildOptions
    
	const ctx = await context(options)

	if (watch) {
		await ctx.watch()
	}
	else {
		const result = await ctx.rebuild()
        
		if (options.metafile) {
			writeFile('dist/metafile.json', JSON.stringify(result.metafile, null, 2), (err) => {
				if (err)
					console.error('Error writing metafile:', err)
				else console.log('Metafile written to dist/metafile.json') // Add this for confirmation
			})
		}
        
		await ctx.dispose()
        
		// const html = getEsbuildAnalyzerHtml(result.metafile);
		// await fs.writeFile('EsbuildAnalyzer.html', html)
	}
	// }
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})












//> REMOVED







// const baseBuildOptions = {
//     plugins: [...(await loadPlugins())],
//     minify: production,
//     bundle: true,
//     metafile: meta,
//     sourcesContent: false,
//     resolveExtensions: ['.js', '.ts'],
//     format: 'cjs',
//     platform: 'node',
//     logLevel: 'info',
//     sourcemap: !production,
// }

// const buildConfigurations = [
//     {
//         ...baseBuildOptions,
//         outfile: 'dist/extension.cjs',
//         format: 'cjs',
//         entryPoints: ['./src/extension.ts'],
//     },

//     {
//         ...baseBuildOptions,
//         outdir: 'test', // Separate directory for tests
//         format: 'cjs', // CommonJS for tests
//         entryPoints: ['./src/test/**/*.ts'],
//         outExtension: { '.js': '.cjs' },

//     },
// ]

// async function buildAndWatch(isWatch) {
//     try {
//         await rm('./dist', { recursive: true, force: true })
//         await rm('./out', { recursive: true, force: true })
//         await rm('./test', { recursive: true, force: true })
//     }
//     catch (err) { if (err.code !== 'ENOENT') { console.error('Error removing directory:', err) } }

    
//     try {
//         if (isWatch) {
//             const ctx = await context({
//                 entryPoints: ['./src/extension.ts', './src/test/**/*.ts'],
//                 outdir: 'dist',
//                 outExtension: { '.js': '.cjs' },
//                 platform: 'node', // Essential for VS Code extensions
//                 format: 'cjs', // Assuming CommonJS for tests
//             })
//             await ctx.rebuild()
//             ctx.watch()
//         }
//         else {
//             await Promise.all(buildConfigurations.map(async (config, i) => {
//                 console.log(`building ${i}...`)
//                 return await build(config)
//             }))
//         }
            
        
        
        
//         // if (isWatch) {
            
//         // const ctx = await context(buildConfigurations) // Pass the array directly

//         // await ctx.rebuild() // Initial build
//         // ctx.watch() // Start the watch mode
//         // console.log('Watching for changes...')
//         // }
//         // else {
//         // const _results = await Promise.all(buildConfigurations.map(config => build(config)))
//         // }
//     }
//     catch (e) {
//         console.error('build failed', e)
//     }
// }

// buildAndWatch(process.argv.includes('--watch'))






// //> Check unused dependencies

// Unused({
//     include: [/\.([cm]?[jt]sx?|vue)$/],
//     exclude: [/node_modules/],
//     level: 'warning', // or 'error'
//     ignore: { peerDependencies: ['vue'] }, // Ignore some dependencies.
//     // ignore: ['vue'], // Or ignore all kinds of dependencies.
//     depKinds: ['dependencies', 'peerDependencies'], // Dependency kinds to check.
// })




// // Check unused dependencies



// //<

// function stripJsonComments(data) { //>
//     return data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? "" : m));
// }

// function createTsPathsPlugin(relativeTsconfigPath = "./tsconfig.json") {
//     const absTsconfigPath = path.resolve(process.cwd(), relativeTsconfigPath);
//     let tsconfigData = fs.readFileSync(absTsconfigPath, "utf8");
//     tsconfigData = stripJsonComments(tsconfigData);
//     const { compilerOptions } = JSON.parse(tsconfigData);

//     const pathKeys = Object.keys(compilerOptions.paths);
//     const re = new RegExp(`^(${pathKeys.join("|")})`);
//     return {
//         name: "esbuild-ts-paths",
//         setup(build) {
//             build.onResolve({ filter: re }, (args) => {
//                 const pathKey = pathKeys.find((pkey) => new RegExp(`^${pkey}`).test(args.path));
//                 const [pathDir] = pathKey.split("*");
//                 let file = args.path.replace(pathDir, "");
//                 if (file === args.path) {
//                     // if importing from root of alias
//                     file = "";
//                 }

//                 for (const dir of compilerOptions.paths[pathKey]) {
//                     const fileDir = fileURLToPath(new URL(dir.replace("*", file), `file://${process.cwd()}/`));

//                     let [matchedFile] = globSync(`${fileDir}.*`);
//                     if (!matchedFile) {
//                         const [matchIndexFile] = globSync(`${fileDir}/index.*`);
//                         matchedFile = matchIndexFile;
//                     }
//                     if (matchedFile) {
//                         // Return an absolute path:
//                         return { path: path.resolve(matchedFile) };
//                     }
//                 }

//                 return { path: args.path };
//             });
//         },
//     };
// } //<




//<
