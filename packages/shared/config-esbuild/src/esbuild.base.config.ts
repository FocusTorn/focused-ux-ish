// packages/shared/config-esbuild/src/esbuild.base.config.ts
// ESLint & Imports -->>

import type { BuildOptions } from 'esbuild';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url'; // Import pathToFileURL

//--------------------------------------------------------------------------------------------------------------<<

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolvePluginPath = (relativePath: string): string => { //>
    // Assuming plugins are in packages/shared/config-esbuild/plugins/
    return path.resolve(__dirname, '../plugins', relativePath);
}; //</

async function loadPlugins(pluginFileNames: string[]): Promise<any[]> { //>
    const loadedPlugins = await Promise.all(
        pluginFileNames.map(async (pluginFileName) => {
            try {
                const pluginPath = resolvePluginPath(pluginFileName);
                // console.log(`[config-esbuild] Attempting to load plugin from OS path: ${pluginPath}`);
                
                const pluginFileUrl = pathToFileURL(pluginPath).href; // Convert OS path to file URL
                // console.log(`[config-esbuild] Importing plugin from URL: ${pluginFileUrl}`);
                
                const pluginModule = await import(pluginFileUrl); // Use the file URL for import
                let plugin = pluginModule.default;

                if (plugin && typeof plugin === 'object' && !plugin.name) {
                    plugin.name = path.basename(pluginFileName, '.js');
                } else if (typeof plugin !== 'object' || !plugin.name) {
                    console.warn(`[config-esbuild] Plugin at ${pluginPath} is not a valid esbuild plugin object or missing a name.`);
                    return null;
                }
                // console.log(`[config-esbuild] Successfully loaded plugin: ${plugin.name}`);
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
    return {
        bundle: true,
        plugins,
        sourcemap: !isProduction,
        minify: isProduction,
        metafile: enableMetafile,
        sourcesContent: false,
        resolveExtensions: ['.js', '.ts'],
        format: 'esm',
        platform: 'node',
        logLevel: 'info',
        external: [
            'vscode',
            'typescript',
            'tsyringe',
            'reflect-metadata',
            '@focused-ux/shared-services',
            'node:*'
        ],
        logOverride: {
            'require-resolve-not-external': 'silent',
        },
    };
} //</