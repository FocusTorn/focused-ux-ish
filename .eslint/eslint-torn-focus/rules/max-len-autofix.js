// max-len-autofix.js
/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce a maximum line length, with option to auto-fix',
			category: 'Stylistic Issues',
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					code: {
						type: 'number',
						default: 100,
					},
				},
				additionalProperties: false,
			},
		],
	},
	create(context) {
		const options = context.options[0] || {}
		const maxLen = options.code || 100
		const sourceCode = context.getSourceCode()

		return {
			Program(node) {
				const lines = sourceCode.lines
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i]
					if (line.length > maxLen) {
						context.report({
							node,
							loc: {
								start: { line: i + 1, column: 0 },
								end: { line: i + 1, column: line.length },
							},
							message: `Line is too long (${line.length}). Maximum allowed is ${maxLen}.`,
							fix(fixer) {
								const range = [
									sourceCode.getIndexFromLoc({ line: i + 1, column: 0 }),
									sourceCode.getIndexFromLoc({ line: i + 1, column: line.length }),
								]
								const fixedLines = splitLine(line, maxLen)
								return fixer.replaceTextRange(range, fixedLines.join('\n'))
							},
						})
					}
				}
			},
		}
	},
}

export default rule

function splitLine(line, maxLen) { //>
	const words = line.trim().split(/\s+/)
	const newLines = []
	let currentLine = ''

	for (const word of words) {
		if (currentLine.length === 0) {
			currentLine = word
		}
		else if (currentLine.length + word.length + 1 <= maxLen) {
			currentLine += ` ${word}`
		}
		else {
			newLines.push(currentLine)
			currentLine = word
		}
	}

	newLines.push(currentLine)
	return newLines
} //<
