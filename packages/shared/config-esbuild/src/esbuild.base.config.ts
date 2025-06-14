// ESLint & Imports -->>

import type { BuildOptions } from 'esbuild';
import path from 'node:path';
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
    pluginFileNames: string[] = ['esbuildProblemMatcher.js']
): Promise<Partial<BuildOptions>> {
    const plugins = await loadPlugins(pluginFileNames);
    const nodeGlobalsShimPath = resolveSrcAssetPath('node-globals.js'); 

    return {
        bundle: true,
        plugins,
        sourcemap: !isProduction,
        minify: isProduction,
        metafile: enableMetafile,
        sourcesContent: false,
        resolveExtensions: ['.js'],
        format: 'esm',
        platform: 'node',
        logLevel: 'info',
        inject: [nodeGlobalsShimPath], 
        define: { 
            'global': 'globalThis',
        },
        external: [
            'vscode',
            'typescript',
            'tsyringe',
            'reflect-metadata',
        ],
        logOverride: {
            'require-resolve-not-external': 'silent',
        },
    };
} //</