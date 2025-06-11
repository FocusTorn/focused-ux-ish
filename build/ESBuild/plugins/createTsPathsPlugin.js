import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'process'

// import * as fs from 'fs';

function stripJsonComments(data) {
	return data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m))
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const absTsconfigPath = resolve(__dirname, './../../../tsconfig.json')
let tsconfigData = readFileSync(absTsconfigPath, 'utf8')

tsconfigData = stripJsonComments(tsconfigData)

const { compilerOptions } = JSON.parse(tsconfigData)
const pathKeys = Object.keys(compilerOptions.paths)

const re = new RegExp(`^(${pathKeys.join('|')})`)

const createTsPathsPlugin = {
	name: 'esbuild-ts-paths',
	setup(build) {
		// Filter ensures the plugin only acts on paths matching your aliases and not on 'node_modules. 
		// This will cause node_modules to default to the build.onResolve method
		build.onResolve({ filter: re /*, namespace: 'file' */ }, (args) => { // build.onResolve({ filter: /^@/ }, (args) => {
			const pathKey = pathKeys.find(pkey => new RegExp(`^${pkey}/`).test(args.path))

			if (!pathKey) {
				return {
					path: args.path,
				}
			}

			const pathAlias = pathKey.split('*')
			const file = args.path.replace(pathAlias[0], '')

			for (const dir of compilerOptions.paths[pathKey]) {
				const filePath = resolve(process.cwd(), dir.replace('*', file))

				if (filePath) {
					return { path: filePath }
				}
			}
		})
	},
}

export default createTsPathsPlugin
