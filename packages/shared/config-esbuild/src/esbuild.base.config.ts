// ESLint & Imports -->>

import type { BuildOptions } from 'esbuild';
import path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

//--------------------------------------------------------------------------------------------------------------<<

const __dirname = path.dirname(fileURLToPath(import.meta.url)); 
const packageRoot = path.resolve(__dirname, '..'); 

const resolvePluginPath = (relativePath: string): string => { //>
    return path.resolve(packageRoot, 'plugins', relativePath);
}; //</

const resolveSrcAssetPath = (relativePath: string): string => { //>
    return path.resolve(packageRoot, 'src', relativePath);
} //</

async function loadPlugins(pluginFileNames: string[]): Promise<any[]> { //>
    const loadedPlugins = await Promise.all(
        pluginFileNames.map(async (pluginFileName) => {
            try {
                const pluginPath = resolvePluginPath(pluginFileName);
                const pluginFileUrl = pathToFileURL(pluginPath).href;
                const pluginModule = await import(pluginFileUrl);
                let plugin = pluginModule.default;

                if (plugin && typeof plugin === 'object' && !plugin.name) {
                    plugin.name = path.basename(pluginFileName, '.js');
                } else if (typeof plugin !== 'object' || !plugin.name) {
                    console.warn(`[config-esbuild] Plugin at ${pluginPath} is not a valid esbuild plugin object or missing a name.`);
                    return null;
                }
                return plugin;
            } catch (err) {
                console.error(`[config-esbuild] Error loading plugin: ${pluginFileName}`, err);
                return null;
            }
        })
    );
    return loadedPlugins.filter(Boolean);
} //</

export async function getBaseEsbuildOptions( //>
    isProduction: boolean,
    enableMetafile: boolean,
    pluginFileNames: string[] = ['esbuildProblemMatcher.js'],
    packageCwd: string,
    isLibraryBuild: boolean,
): Promise<Partial<BuildOptions>> {
    const plugins = await loadPlugins(pluginFileNames);

    const findRoot = (dir: string): string => {
        if (fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }
        const parentDir = path.dirname(dir);
        if (parentDir === dir) {
            throw new Error('Could not find project root containing pnpm-workspace.yaml');
        }
        return findRoot(parentDir);
    };

    const projectRoot = findRoot(packageCwd);

    const baseOptions: Partial<BuildOptions> = {
        bundle: true,
        plugins,
        sourcemap: !isProduction,
        minify: isProduction,
        metafile: enableMetafile,
        sourcesContent: false,
        format: 'cjs', // Keep CommonJS output
        platform: 'node',
        nodePaths: [path.join(projectRoot, 'node_modules')],
        logLevel: 'info',
        external: [
            'vscode',
            'typescript',
        ],
        logOverride: {
            'require-resolve-not-external': 'silent',
        },
    };

    if (isLibraryBuild) {
        const pkgJsonPath = path.join(packageCwd, 'package.json');
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const dependencies = Object.keys(pkgJson.dependencies || {});
        const peerDependencies = Object.keys(pkgJson.peerDependencies || {});
        baseOptions.external = [...(baseOptions.external || []), ...dependencies, ...peerDependencies];
    }

    return baseOptions;
} //</