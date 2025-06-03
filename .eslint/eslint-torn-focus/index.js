import paddingBetween from './rules/padding-between.js'
import maxLenAutofix from './rules/max-len-autofix.js'
import tsd from './rules/testing-scenario-disable.js'

const rules = {
	// 'padding-between': paddingBetween,
	// 'max-len-autofix': maxLenAutofix,
	tsd,

}

export default { rules }

// export default { //>
//     rules: {
//         'padding-between': paddingBetween,
//         'max-len-autofix': maxLenAutofix,
//     },
//     configs: {
//         recommended: {
//             plugins: ['eslint-torn-focus'],
//             rules: {
//                 'tornfocus/max-len-autofix': 'error',
//                 'padding-between': 'error',
//             },
//         },
//     },
// } //<
