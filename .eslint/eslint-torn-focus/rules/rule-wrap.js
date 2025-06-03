/* eslint-disable unused-imports/no-unused-vars */
'use strict'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const rule = {

	meta: {
		type: 'problem', // `problem`, `suggestion`, or `layout`
		docs: { //>
			description: 'Wrap a set of rules',
			recommended: false,
			// url: null, // URL to the documentation page for this rule
		}, //<
		fixable: null, // Or `code` or `whitespace`
        
		schema: [ //>
			// Add a schema if the rule has options
			{
				type: 'object',
				properties: {
					groups: {
						type: 'object',
						additionalProperties: {
							type: 'object',
							properties: {
								rules: {
									type: 'object',
									additionalProperties: {
										type: ['string', 'array'],
									},
								},
							},
							required: ['rules'],
						},
					},
				},
				required: ['groups'],
			},
		], //<
    
	},

	create(context) {
		const groups = context.options[0]?.groups || {}
		const ruleStates = {}
		const enabledRules = {}

		/**
		 * Parses a rule-wrap comment to extract the group names.
		 * @param {string} commentText The text of the comment.
		 * @returns {string[]} An array of group names.
		 */
		function parseRuleWrapComment(commentText) { //>
			const match = commentText.match(/rule-wrap\[(.*?)\]/)
			if (!match) {
				return []
			}
			const groupNames = match[1]
				.split(',')
				.map(groupName => groupName.trim().replace(/['"]/g, ''))
			return groupNames
		} //<
    
		/**
		 * Enables or disables the rules in the specified group.
		 * @param {string} groupName The name of the group.
		 * @param {boolean} enable Whether to enable or disable the rules.
		 * @param {object} comment The comment node.
		 */
		function handleGroup(groupName, enable, comment) { //>
			const group = groups[groupName]
    
			if (!group) { //>
				context.report({
					node: comment,
					message: `Group '${groupName}' not found in rule-wrap configuration.`,
				})
				return
			} //<
    
			for (const ruleName in group.rules) { //>
				const fullRuleName = `torn/${ruleName}`
				ruleStates[fullRuleName] = enable
				const ruleConfig = group.rules[ruleName]
				if (enable) {
					context.report({
						node: comment,
						message: `Enabling rule '${fullRuleName}' from group '${groupName}'.`,
					})
					// context.settings = context.settings || {}
					// context.settings.rules = context.settings.rules || {}
					// context.settings.rules[fullRuleName] = ruleConfig
					enabledRules[fullRuleName] = ruleConfig
				}
				else {
					context.report({
						node: comment,
						message: `Disabling rule '${fullRuleName}' from group '${groupName}'.`,
					})
					delete enabledRules[fullRuleName]
				}
			} //<
		} //<
        
		return {
            
			Program(node) { //>
				const comments = context.sourceCode.getAllComments()
    
				for (const comment of comments) {
					const commentText = comment.value.trim()
					if (commentText.startsWith('eslint-enable rule-wrap')) {
						const groupNames = parseRuleWrapComment(commentText)
						for (const groupName of groupNames) {
							handleGroup(groupName, true, comment)
						}
					}
					else if (commentText.startsWith('eslint-disable rule-wrap')) {
						const groupNames = parseRuleWrapComment(commentText)
						for (const groupName of groupNames) {
							handleGroup(groupName, false, comment)
						}
					}
				}
			}, //<
            
			'Program:exit': function (node) { //>
				for (const ruleName in ruleStates) {
					const ruleState = ruleStates[ruleName]
					if (ruleState) {
						context.report({
							node,
							message: `Rule '${ruleName}' is enabled.`,
							// severity: context.settings.rules[ruleName]
						})
					}
					else {
						context.report({
							node,
							message: `Rule '${ruleName}' is disabled.`,
						})
					}
				}
				for (const ruleName in enabledRules) {
					const ruleConfig = enabledRules[ruleName]
					context.report({
						node,
						message: `Rule '${ruleName}' is enabled with config: ${JSON.stringify(ruleConfig)}`,
					})
				}
			}, //<

		}
	},
    
}

export default rule
