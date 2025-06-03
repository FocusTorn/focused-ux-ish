module.exports = function (results) {
	let output = ''
  
	results.forEach((result) => {
		result.messages.forEach((message) => {
			console.warn(`message.ruleId: ${message.ruleId}`)

			if (message.ruleId === 'no-unused-vars') {
				output += `${result.filePath}:${message.line}:${message.column}: ${message.severity}: ${message.source} - Variable '${message.suggestions[0]?.desc.match(/'(.*?)'/)?.[1] || 'unknown'}' is unused. Please remove or utilize it.\n`
			}
			else {
				// Pass through other messages with default formatting or handle as needed
				output += `${result.filePath}:${message.line}:${message.column}: ${message.severity}: ${message.message} (${message.ruleId})\n`
			}
		})
	})
  
	return output
}
