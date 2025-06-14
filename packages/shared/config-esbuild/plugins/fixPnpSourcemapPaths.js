// import { Plugin } from 'esbuild';

const fixPnpSourcemapPaths = {
	name: 'fixPnpSourcemapPaths',
	setup(build) {
		build.onEnd(async (result) => {
			if (result.metafile) {
				for (const outputFile in result.metafile.outputs) {
					const output = result.metafile.outputs[outputFile]

					if (output.sourcemap) {
						output.sourcemap.sources = output.sourcemap.sources.map(
							source => source.replace(/^d:\/_dev\/torn-focus-ui\/dist\/pnp:/, ''),
						)
					}
				}
			}
		})
	},
}

export default fixPnpSourcemapPaths

// const _fixPnpSourcemapPaths = { //>
//     name: 'fixPnpSourcemapPaths',
//     setup(build) {
//         build.onEnd(async (result) => {
//             if (result.metafile) {
//                 console.log("fixPnpSourcemapPaths plugin executed"); // Log execution
//                 console.log('Log-Outputs: ', result.metafile.outputs);
//                 for (const outputFile in result.metafile.outputs) {
//                     const output = result.metafile.outputs[outputFile];
//                     console.log('Log-Output: ', output);
//                     if (output.sourcemap) {
//                         console.log("Output Source Map:", output.sourcemap); // Log raw source map data
//                         console.log("Source map found for:", outputFile); // Log source map presence
//                         console.log("Original sources:", output.sourcemap.sources); // Log original sources
//                         output.sourcemap.sources = output.sourcemap.sources.map(
//                             (source) => {
//                                 const modifiedSource = source.replace(/^d:\/_dev\/torn-focus-ui\/dist\/pnp:/, '');
//                                 console.log(`Modified source: ${source} -> ${modifiedSource}`); // Log each modification
//                                 return modifiedSource;
//                             }
//                         );
//                         console.log("Modified sources:", output.sourcemap.sources); // Log modified sources
//                     }
//                 }
//             }
//         });
//     },
// };

// //<
