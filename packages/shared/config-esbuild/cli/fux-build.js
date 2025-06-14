#!/usr/bin/env node

// ESLint & Imports -->>

import { build, context as esbuildContext } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { getBaseEsbuildOptions } from '../dist/esbuild.base.config.js'; 

//--------------------------------------------------------------------------------------------------------------<<

async function main() { //>
    const args = process.argv.slice(2);

    const entryPointArg = args.find(arg => !arg.startsWith('--')) || './src/extension.ts';
    const entryPoint = path.resolve(process.cwd(), entryPointArg);

    const outfileArg = args.find(arg => arg.startsWith('--outfile='))?.split('=')[1] || './dist/extension.js';
    const outfile = path.resolve(process.cwd(), outfileArg);

    const isProduction = args.includes('--production');
    const enableMetafile = args.includes('--meta');
    const isWatchMode = args.includes('--watch');
    const targetFormatArg = args.find(arg => arg.startsWith('--format='))?.split('=')[1];
    const customExternalsArg = args.find(arg => arg.startsWith('--add-externals='))?.split('=')[1];
    const customPluginsArg = args.find(arg => arg.startsWith('--add-plugins='))?.split('=')[1];

    const defaultPluginFiles = ['esbuildProblemMatcher.js']; // Add more default plugin filenames if needed
    const additionalPluginFiles = customPluginsArg ? customPluginsArg.split(',') : [];
    const allPluginFiles = [...new Set([...defaultPluginFiles, ...additionalPluginFiles])];


    const baseOptions = await getBaseEsbuildOptions(
        isProduction,
        enableMetafile,
        allPluginFiles
    );

    const packageBuildOptions = {
        ...baseOptions,
        entryPoints: [entryPoint],
        outfile: outfile,
        format: targetFormatArg || baseOptions.format,
        allowOverwrite: true,
    };

    if (customExternalsArg) {
        packageBuildOptions.external = [
            ...(baseOptions.external || []),
            ...customExternalsArg.split(','),
        ];
    }

    try {
        if (isWatchMode) {
            const ctx = await esbuildContext(packageBuildOptions);
            await ctx.watch();
            console.log(`[fux-build] Watching ${entryPointArg} for changes... Output to ${outfileArg}`);
        } else {
            const result = await build(packageBuildOptions);
            console.log(`[fux-build] Build successful for ${entryPointArg} -> ${outfileArg}`);
            if (enableMetafile && result.metafile) {
                const metafilePath = path.join(path.dirname(outfile), 'metafile.json');
                await writeFile(metafilePath, JSON.stringify(result.metafile, null, 2));
                console.log(`[fux-build] Metafile written to ${metafilePath}`);
            }
        }
    } catch (e) {
        console.error('[fux-build] Build failed:', e);
        process.exit(1);
    }
} //</

main();