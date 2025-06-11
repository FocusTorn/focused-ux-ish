const logPathResolution = {
	name: 'logPathResolution',
	setup(build) {
		build.onResolve({ filter: /.*/ }, (args) => {
			console.log('Resolving:', args.path, 'from', args.importer)
		})
	},
}

export default logPathResolution

// const _logPathResolution = { //>
//     name: 'logPathResolution',
//     setup(build) {
//         build.onResolve({ filter: /.*/ }, (args) => {
//             console.log('Resolving:', args.path, 'from', args.importer);
//         });
//     },
// }

// //<
