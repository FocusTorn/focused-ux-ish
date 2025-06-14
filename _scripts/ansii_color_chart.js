/* eslint-disable node/prefer-global/process */
/* eslint-disable style/padded-blocks */
 
/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable style/no-multi-spaces */

// Color Name shit -------------------------------------------->>

// import { colornames } from 'color-name-list'
// import nearestColor from 'nearest-color'

// import { ntc } from 'color-namer'
// const { ntc } = require('color-namer');
// import pkg from 'color-namer'
// const { ntc } = pkg
// import { createRequire } from 'node:module'
// // Bring in createRequire
// const require = createRequire(import.meta.url) // Construct the require function
// const { ntc } = require('color-namer')    // Now use require as usual.

// import { createRequire } from 'node:module'

// (async () => {  // IIFE to ensure synchronous execution
//     const require = createRequire(import.meta.url)
//     const { ntc } = require('color-namer')

//     // // Now, ntc is available before ansiColorConverter is called:
//     // function ansiColorConverter(code) {
//     //     // ... your existing ansiColorConverter logic ...

//     //     const sRGB = `${r},${g},${b}`
//     //     const aRGB = { r, g, b }
//     //     const hex = rgbToHex(aRGB)
//     //     const colorName = ntc.name(hex) // ntc is now defined
//     //     const simpleName = colorName[1]

//     //     return { ec: code, r, g, b, sRGB, aRGB, hex, simpleName, ratio }
//     // }

//     // const colorCode = 39
//     // const color = ansiColorConverter(colorCode)
//     // console.log(color)

//     console.log(ntc.name('#ff0000'))

//     // ... rest of your code using ntc ...
// })()

//-------------------------------------------------------------------------------<<

function calculateContrastRatio(foregroundHex, backgroundHex) { //>
	const l1 = relativeLuminance(hexToRgb(foregroundHex))
	const l2 = relativeLuminance(hexToRgb(backgroundHex))

	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
} //<

function rgbToHex(rgb) { //>
	const r = rgb.r
	const g = rgb.g
	const b = rgb.b

	// Ensure values are within 0-255 range
	const safeR = Math.max(0, Math.min(255, r))
	const safeG = Math.max(0, Math.min(255, g))
	const safeB = Math.max(0, Math.min(255, b))

	const hexR = safeR.toString(16).padStart(2, '0')
	const hexG = safeG.toString(16).padStart(2, '0')
	const hexB = safeB.toString(16).padStart(2, '0')

	return `#${hexR}${hexG}${hexB}`
} //<

function hexToRgb(hex) { //>
	// Remove # if present
	hex = hex.replace('#', '')

	// Parse hex values
	const r = Number.parseInt(hex.substring(0, 2), 16)
	const g = Number.parseInt(hex.substring(2, 4), 16)
	const b = Number.parseInt(hex.substring(4, 6), 16)

	return { r, g, b }

} //<

function relativeLuminance(rgb) { //>

	// Normalize RGB values (0-255 to 0-1)
	const normalizedR = rgb.r / 255
	const normalizedG = rgb.g / 255
	const normalizedB = rgb.b / 255

	const R = normalizedR <= 0.03928
		? normalizedR / 12.92
		: ((normalizedR + 0.055) / 1.055) ** 2.4
	const G = normalizedG <= 0.03928
		? normalizedG / 12.92
		: ((normalizedG + 0.055) / 1.055) ** 2.4
	const B = normalizedB <= 0.03928
		? normalizedB / 12.92
		: ((normalizedB + 0.055) / 1.055) ** 2.4

	return 0.2126 * R + 0.7152 * G + 0.0722 * B
} //<

function showColorChart() { //>
	const reset = '\u001B[0m'
	const colorGroups = [
		{ start: 0, end: 7 },
		{ start: 8, end: 15 },
		{ start: 16, end: 231 },
		{ start: 232, end: 255 },
	]

	for (const group of colorGroups) {
		let outputLine = ''

		for (let i = group.start; i <= group.end; i++) {
			const colorCode = `\u001B[38;5;${i}m`
			let padding = ''

			if (i < 10) {
				padding = '  '
			} else if (i < 100) {
				padding = ' '
			}

			const output = `${colorCode} ${i}${padding}`

			outputLine += output

			if ((i - group.start + 1) % 36 === 0) {
				process.stdout.write(`${outputLine}${reset}\n`)
				outputLine = ''
			}
		}

		if (outputLine.length > 0) {
			process.stdout.write(`${outputLine}${reset}\n`)
		}

		if (group.end === 15 || group.end === 231) {
			process.stdout.write('\n')
		}
	}

} //<

function showNonColorCodes() { //>

	const resetString = '\\u001B[0m or \\x1B[0m or \\033[0m'
	const boldOn = 'ON: \\u001B[1m or \\x1B[1m or \\033[1m'
	const boldOff = 'OFF: \\u001B[22m or \\x1B[22m or \\033[22m'

	console.log(`\x1B[1m\u001B[38;5;179m➡ RESET:\u001B[0m\n    • ${resetString}`)
	console.log(`\x1B[1m\u001B[38;5;179m➡ BOLD:\u001B[0m\n    • ${boldOn}\n    • ${boldOff}`)
	console.log(`\x1B[51m➡ RESET:\u001B[0m`)
	console.log(`\x1B[1m\u001B[38;5;179m➡ BOLD:\u001B[0m\n    • ${boldOn}\n    • ${boldOff}`)

	// console.log(`\x1B[51m➡ RESET:\u001B[0m`)
	console.log(`\x1B[38;2;255;0;0m➡ RESET:\u001B[0m`)

	console.log('')

}

//<

function ansiColorConverter(code) { //>
	// Immediately execute the conversion logic; no inner function needed
	let r, g, b

	if (code >= 0 && code <= 15) {
		const colorValues = [
			[0, 0, 0],       // Black
			[128, 0, 0],     // Red
			[0, 128, 0],     // Green
			[128, 128, 0],   // Yellow
			[0, 0, 128],     // Blue
			[128, 0, 128],   // Magenta
			[0, 128, 128],   // Cyan
			[192, 192, 192], // White
			[128, 128, 128], // Bright Black (Gray)
			[255, 0, 0],     // Bright Red
			[0, 255, 0],     // Bright Green
			[255, 255, 0],   // Bright Yellow
			[0, 0, 255],     // Bright Blue
			[255, 0, 255],   // Bright Magenta
			[0, 255, 255],   // Bright Cyan
			[255, 255, 255],  // Bright White
		];

		[r, g, b] = colorValues[code] || [null, null, null] // Handle potential undefined
	} else if (code >= 16 && code <= 231) {

		// r = Math.floor(((39 - 16) / 36) % 6) * 51
		// g = Math.floor(((code - 16) / 6) % 6) * 51
		// b = Math.floor((code - 16) % 6) * 51

		r = Math.floor(((code - 16) / 36)) * 51
		g = Math.floor(((code - 16) / 6) % 6) * 51
		b = Math.floor((code - 16) % 6) * 51

	} else if (code >= 232 && code <= 255) {
		const grayLevel = 8 + 10 * (code - 232)

		r = g = b = grayLevel
	} else {
		return null // Or throw an error
	}

	const sRGB = `${r},${g},${b}`
	const aRGB = { r, g, b }
	const hex = rgbToHex(aRGB)

	const ratio = calculateContrastRatio(hex, '#101010')

	return { ec: code, r, g, b, sRGB, aRGB, hex, ratio }
} //<

function showColorCompare(hexCode, escapeCode) { //>
	const convertedColor = ansiColorConverter(escapeCode)

	const escapeR = convertedColor.r
	const escapeG = convertedColor.g
	const escapeB = convertedColor.b

	const rgb = hexToRgb(hexCode)
	const rgbArray = [rgb.r, rgb.g, rgb.b]

	console.log(`EscapeCode (${escapeCode}):   \x1B[38;5;${escapeCode}m██████\x1B[0m  (Calc. Hex: ${convertedColor.hex})`)
	console.log(`HexCode:(${hexCode}): \x1B[38;2;${rgbArray.join(';')}m██████\u001B[0m`)
} //<

function showColorCodes() { //>

	const colors = [ // ┤ ┘ ┐ ─ ██████████

		{ ascii: 51, name: ' cyan:    ', hex: '#00ffff', marker: '' },
		{ ascii: 196, name: 'red:     ', hex: '#ff0000', marker: '' },
		{ ascii: 197, name: 'red2:    ', hex: '#ff0000', marker: '' },
		{ ascii: 160, name: 'dRed:    ', hex: '#d70000', marker: '' },
		{ ascii: 179, name: 'gold:    ', hex: '#d7af5f', marker: '' },
		{ ascii: 35, name: ' green:   ', hex: '#00af5f', marker: '' },
		{ ascii: 82, name: ' bGreen:  ', hex: '#5fd700', marker: '' },

		{ ascii: 226, name: 'yellow:  ', hex: '#ffff00', marker: '' },
		{ ascii: 141, name: 'lPurple: ', hex: '#af87ff', marker: '' },
		{ ascii: 171, name: 'purple:  ', hex: '#d75fff', marker: '' },
		{ ascii: 165, name: 'purple:  ', hex: '#------', marker: '' },
		{ ascii: 153, name: 'lBlue:   ', hex: '#afd7ff', marker: '' },
		{ ascii: 39, name: ' blue:    ', hex: '#00afff', marker: '' },
		{ ascii: 33, name: ' dBlue:   ', hex: '#0087ff', marker: '' },

	]

	//  \u001B \033 \x1B

	for (const color of colors) {
		console.log(`\x1B[38;5;${color.ascii}m[${color.ascii}]  ${color.name}  ${color.hex}   \\x1B[38;5;${color.ascii}m \x1B[0m ${color.marker}`) //    \033  ||  \u001B
	}
	console.log('')
} //<

// const name_to_hex = colornames.find(color => color.hex === '#f1c1d1')
// console.log(name_to_hex.name)
// const hex_to_name = colornames.find(color => color.name === 'Eigengrau')
// console.log(hex_to_name.hex)

// const colors = colornames.reduce((o, { name, hex }) => Object.assign(o, { [name]: hex }), {})
// const nearest = nearestColor.from(colors)
// console.log(nearest('#0099ff'))

console.log(`\n\n\n\n\n\n`)
console.log(` ┌────────────────────────────────────────────────────────────────────────────┐`)
console.log(` │                              Non Color Codes                               │`)
console.log(` └────────────────────────────────────────────────────────────────────────────┘`)
showNonColorCodes()

console.log(` ┌────────────────────────────────────────────────────────────────────────────┐`)
console.log(` │                                Color Codes                                 │`)
console.log(` └────────────────────────────────────────────────────────────────────────────┘`)
showColorCodes()

console.log(` ┌────────────────────────────────────────────────────────────────────────────┐`)
console.log(` │                                Color Chart                                 │`)
console.log(` └────────────────────────────────────────────────────────────────────────────┘`)
showColorChart()

//= Trial ======================================================================= 

function doIconColorCheck(onCode, offCode, iconArray) {
        
	const on = `\x1B[38;5;${onCode}m`
	const off = `\x1B[38;5;${offCode}m`
	const reset = `\x1B[0m`
        
	process.stdout.write('\n【')
        
	for (const [icon, bool] of iconArray) {
		const color = bool ? on : off

		process.stdout.write(`${color}${icon}${reset}`)
	}
        
	process.stdout.write('】')
        
}
        
const iconArray = [['⇆ ', 1], ['⮻ ', 1], ['📋︎', 0], ['✂ ', 0]]
  
doIconColorCheck(82, 196, iconArray)
        
// 【⮻ 📋︎✂ 】P
    
// let checkMark
// if (doBold) {
//     checkMark = `\x1B[38;5;${code}m✓\x1B[0m`
// }
// else {
//     checkMark = `\x1B[38;5;${code}m✓\x1B[0m`
// }
    
// console.log(`\nFS Node Path [${checkMark}]:`)

console.log('\n')

// doCheckMark(82)
// doCheckMark(82, true)

// doCheckMark(35)
// doCheckMark(35, true)

console.log('\n\n')

////////////////////////////////////////////
//  Comparing \x1B[38;5;39m
// console.log('')
// showColorCompare('#00afff', 39) // RGB(0, 175, 255)

// console.log('')
// showColorCompare('#FF6B6B', 9) //0099ff
// console.log('')

// Returns 39 0,153,255 0099ff
// const colorCode = 39
// const color = ansiColorConverter(colorCode)
// console.log(color.ec, color.sRGB, color.hex)

// console.log(Math.floor(((194 - 16) / 36) % 6) * 51, Math.floor(((194 - 16) / 36)) * 51)

// Returns 39 0,153,255 0099ff const colorCode = 39 const color = ansiColorConverter(colorCode) console.log(color.ec, color.sRGB, color.hex)

// Why aren't the two colors the same, the escape code color is lighter. showColorCompare('#0099ff', 39)
