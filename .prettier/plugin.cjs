// .prettier/plugin.cjs
'use strict'

const typescript = require('prettier/plugins/typescript')
const babel = require('prettier/plugins/babel')
const estree = require('prettier/plugins/estree')

const PLACEHOLDER_LITERAL = 'IGNRMRKR'
const MARKER_REGEX = /\/\/(?:>|<)/g

// This plugin uses a stateless, block-comment-based approach with Hex
// encoding. This is the most robust pattern, as it avoids special characters
// and is tolerant of Prettier's whitespace formatting.

function preprocess(text, _options) {
	return text.replace(MARKER_REGEX, (match) => {
		// Encode the original marker string into a safe Hex format.
		const encoded = Buffer.from(match).toString('hex')

		// Use a BLOCK comment placeholder.
		return `/*${PLACEHOLDER_LITERAL}_${encoded}*/`
	})
}

function postprocess(text, _options) {
	// This regex finds our block comment placeholders and captures the Hex data.
	// It is tolerant of whitespace Prettier might add inside the comment.
	const searchRegex = new RegExp(
		`\\/\\*\\s*${PLACEHOLDER_LITERAL}_([a-f0-9]+)\\s*\\*\\/`,
		'g',
	)

	return text.replace(searchRegex, (fullMatch, encoded) => {
		try {
			// For each match, decode the captured Hex string back to the original.
			return Buffer.from(encoded, 'hex').toString('utf8')
		}
		catch (_e) {
			// If decoding fails, return the placeholder to avoid crashing.
			return fullMatch
		}
	})
}

// Boilerplate below is unchanged
const parsers = {
	'typescript': { ...typescript.parsers.typescript, preprocess },
	'babel': { ...babel.parsers.babel, preprocess },
	'babel-ts': { ...babel.parsers['babel-ts'], preprocess },
}

const printers = {
	estree: { ...estree.printers.estree, postprocess },
}

module.exports = {
	parsers,
	printers,
}
