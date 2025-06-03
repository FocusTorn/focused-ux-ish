const rule = {
    
	meta: {
		type: 'problem', // Or 'layout' if it's a layout issue
		docs: {
			description: 'Disable specific rules within "const scenarios = []" arrays.',
			category: 'Stylistic Issues',
			recommended: false,
		},
		fixable: null,
		schema: [{
			type: 'array',
			items: { type: 'string' }, // Rules to disable
		}],
	},

	create(context) {
		const rulesToDisable = context.options[0] || [] // Get rules to disable from options
		let isInScenariosArray = false

		return {
			ArrayExpression(node) {
				// Check if this is a const scenarios = [] declaration
				const parent = node.parent
				if (parent && parent.type === 'VariableDeclarator'
				  && parent.id.type === 'Identifier' && parent.id.name === 'scenarios'
				  && parent.init === node && parent.parent && parent.parent.type === 'VariableDeclaration'
				  && parent.parent.kind === 'const') {
					isInScenariosArray = true
				}
			},

			'ArrayExpression:exit': function (node) {
				// Exit the scenarios array scope
				const parent = node.parent
				if (parent && parent.type === 'VariableDeclarator'
				  && parent.id.type === 'Identifier' && parent.id.name === 'scenarios'
				  && parent.init === node) {
					isInScenariosArray = false
				}
			},

			// Check for rule violations only if NOT in scenarios array
			':not(ArrayExpression) > *': function (node) {
				if (!isInScenariosArray) {
					rulesToDisable.forEach((rule) => {
						// Check if the current node violates the rule
						if (context.getSourceCode().getFirstToken(node).value.includes(rule)) {
							context.report({
								node,
								message: `Rule '${rule}' violation outside 'scenarios' array.`,
							})
						}
					})
				}
			},
		}
	},
    
}

export default rule
