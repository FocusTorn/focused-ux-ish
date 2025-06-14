// const ansii = { // > coloration codes
//     resetStyle: '\x1B[0m',
//     bold: '\x1B[1m',

//     base: '\x1B[38;5;250m',
//     blue: '\x1B[38;5;39m',
//     blueLight: '\x1B[38;5;153m',
//     cyan: '\x1B[38;5;159m',
//     gold: '\x1B[38;5;214m',
//     green: '\x1B[38;5;35m',
//     greenBright: '\x1B[38;5;76m',
//     purple: '\x1B[38;5;171m',
//     red: '\x1B[38;5;9m',
//     white: '\x1B[38;5;15m',
//     yellow: '\x1B[38;5;226m',
// }

// // <
// function getCurrentTimeWithMilliseconds() { // >
//     const now = new Date()
//     const hours = now.getHours().toString().padStart(2, '0')
//     const minutes = now.getMinutes().toString().padStart(2, '0')
//     const seconds = now.getSeconds().toString().padStart(2, '0')
//     // const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

//     // return `${hours}:${minutes}:${seconds}.${milliseconds}`;
//     return `${hours}:${minutes}:${seconds}`
// }

// // <

const esbuildProblemMatcher = {
	name: 'esbuildProblemMatcher',
	setup(build) {
		build.onStart(() => {
            
			// const currTime = getCurrentTimeWithMilliseconds()
			// const coloredTime = `${ansii.gold}${currTime}${ansii.resetStyle}`
			// console.log(`[${coloredTime}] Build started`)
            
		})
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`)
				if (location && location.file) { // Check if location and location.file are not null/undefined
					console.error(
						`    ${location.file}:${location.line}:${location.column}:`,
					)
				} else if (location) {
					// Handle cases where location might exist but not file (less common for typical errors)
					console.error(
						`    (Location info incomplete: line ${location.line}, column ${location.column})`,
					)
				} else {
					console.error(
						`    (No location information available for this error)`,
					)
				}
			})

			// const currTime = getCurrentTimeWithMilliseconds()
			// const coloredTime = `${ansii.gold}${currTime}${ansii.resetStyle}`

			// console.log(`[${coloredTime}] Build finished`)

            // The redundant loop for errors was removed as it's identical to the one above.
		})
	},
}

export default esbuildProblemMatcher