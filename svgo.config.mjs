export default {
	multipass: true,

	plugins: [
		// > Not applicable to this project

		// 'addAttributesToSVGElement',
		// 'addClassesToSVGElement',

		// 'removeAttributesBySelector',
		// 'removeAttrs',
		// 'removeElementsByAttr',
		// 'removeOffCanvasPaths',
		// 'removeRasterImages',
		// 'removeScriptElement',
		// 'removeStyleElement',
		// 'prefixIds',
		// 'removeXMLNS',
		// 'removeXlink',
		// 'reusePaths',

		// ----------------------------------------------------------------<<

		'cleanupListOfValues',
		'convertOneStopGradients',
		'convertStyleToAttrs',

		// - Default ------------------------------------------------------

		// 'collapseGroups', // Removes clipping masks
		'removeDoctype',
		'removeXMLProcInst',
		'removeComments',
		'removeMetadata',
		'removeEditorsNSData',
		'cleanupAttrs',
		'mergeStyles',
		'inlineStyles',
		'minifyStyles',
		'cleanupIds',
		'removeUselessDefs',
		'cleanupNumericValues',
		'convertColors',
		'removeUnknownsAndDefaults',
		'removeNonInheritableGroupAttrs',
		'removeUselessStrokeAndFill',
		'removeViewBox',
		'cleanupEnableBackground',
		'removeHiddenElems',
		'removeEmptyText',
		'convertShapeToPath',
		'convertEllipseToCircle',
		'moveElemsAttrsToGroup',
		'moveGroupAttrsToElems',
		'convertPathData',
		'convertTransform',
		'removeEmptyAttrs',
		'removeEmptyContainers',
		'removeUnusedNS',
		'mergePaths',
		'sortAttrs',
		'sortDefsChildren',
		'removeTitle',
		'removeDesc',
	],
}
