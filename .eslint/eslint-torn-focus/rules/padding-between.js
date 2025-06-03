/* //>

import 'reflect-metadata'                               // ImportDeclaration
export class ConfigurationActionsService {}             // ExportNamedDeclaration
export default class ConfigurationActionsService {}     // ExportDefaultDeclaration
interface aPackageJsonProperties {}                     // TSInterfaceDeclaration

//< */

//- IMPORTS ----------->>

import { ESLintUtils } from '@typescript-eslint/utils'
import * as visitorKeys from '@typescript-eslint/visitor-keys'

const { getLeftSibling, traverseNodes } = visitorKeys

//-------------------<<
//- DICT -------------->>

const ASTUtils = { //>
	getLeftSibling,
	traverseNodes,
	isSemicolonToken: token => token.type === 'Punctuator' && token.value === ';',
	isClosingBraceToken: token => token.type === 'Punctuator' && token.value === '}',
	isNotSemicolonToken: token => !(token.type === 'Punctuator' && token.value === ';'),
} //<

const AST_NODE_TYPES = { //>
	AssignmentExpression: 'AssignmentExpression',
	BlockComment: 'BlockComment',
	BlockStatement: 'BlockStatement',
	CallExpression: 'CallExpression',
	ChainExpression: 'ChainExpression',
	DoWhileStatement: 'DoWhileStatement',
	ExpressionStatement: 'ExpressionStatement',
	Identifier: 'Identifier',
	IfStatement: 'IfStatement',
	Literal: 'Literal',
	MemberExpression: 'MemberExpression',
	Program: 'Program',
	SequenceExpression: 'SequenceExpression',
	SwitchStatement: 'SwitchStatement',
	TSInterfaceDeclaration: 'TSInterfaceDeclaration',
	UnaryExpression: 'UnaryExpression',
	VariableDeclaration: 'VariableDeclaration',
} //<

const NODE_TYPE_MAPPING = { //>
	'interface': 'TSInterfaceDeclaration',
	'import': 'ImportDeclaration',
	'export': 'ExportNamedDeclaration',
	'exportDefault': 'ExportDefaultDeclaration',

	'*': '*',
} //<

const StatementTypes = { //>
	'*': () => true,
	'block-like': isBlockLikeStatement,
	'exports': isCJSExport,
	'require': isCJSRequire,
	'directive': isDirectivePrologue,
	'expression': isExpression,
	'iife': isIIFEStatement,

	'JSDoc': node => node.type === AST_NODE_TYPES.BlockComment && /\*\r?\n\s*\*\s*/.test(node.value?.trim() ?? ''),
	'interface': node => node.type === 'TSInterfaceDeclaration',
	'import': node => node.type === 'ImportDeclaration',
	'exportDefault': node => node.type === 'ExportDefaultDeclaration',
	'export': node => node.type === 'ExportNamedDeclaration', // Add export named declaration
} //<

//-------------------<<

// FIX Next not being applied and rule is applied to the next node when not specified in the config

// ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │                                                    CREATE RULE                                                     │
// └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

const createRule = ESLintUtils.RuleCreator(name => `padding-line-between-statements/${name}`)

export default createRule({
	name: 'padding-between',
	defaultOptions: [],

	meta: { //>
		type: 'layout',
		fixable: 'whitespace',
		messages: { unexpectedBlankLine: 'Unexpected blank line before this statement.' },
		docs: { //>
			description: 'Enforce padding lines between statement types',
			category: 'Stylistic Issues',
			recommended: 'warn',
		}, //<
		schema: [ //>
			{
				type: 'object',
				additionalProperties: { // Allow any node type as a key
					type: 'object', // The value must be an object
					properties: {
						prev: {
							type: 'object', // "prev" should be an object
							additionalProperties: { // Allow node types or wildcard as keys
								type: 'integer', // The value (padding lines) must be an integer
							},
						},
						next: { // Same structure for "next"
							type: 'object',
							additionalProperties: {
								type: 'integer',
							},
						},
					},
					additionalProperties: false, // Don't allow other properties within node type objects
				},
			},
		], //<
	}, //<

	create(context) {
		const sourceCode = context.sourceCode

		function checkPadding(prevNode, nextNode) { //>
			if (!prevNode || !nextNode)
				return

			const options = context.options[0] || {}

			for (const currNodeType in options) {
				if (!Object.prototype.hasOwnProperty.call(options, currNodeType))
					continue

				const ruleConfig = options[currNodeType]
				if (!ruleConfig)
					continue

				// Normalize node types using NODE_TYPE_MAPPING
				const mappedCurrNodeType = NODE_TYPE_MAPPING[currNodeType] || currNodeType
				const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type
				const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type

				if (nextNodeType !== mappedCurrNodeType)
					continue // Only process if nextNode is the type being checked
        
				// Normalize rule keys to match NODE_TYPE_MAPPING
        
				const mappedPrevType = Object.keys(NODE_TYPE_MAPPING).find(
					key => NODE_TYPE_MAPPING[key] === prevNode.type,
				) || prevNode.type

				const mappedNextType = Object.keys(NODE_TYPE_MAPPING).find(
					key => NODE_TYPE_MAPPING[key] === nextNode.type,
				) || nextNode.type
        
				console.log(`Checking rules for: ${currNodeType} (Mapped: ${mappedCurrNodeType}) `)
				console.log(`  Prev Node Type: ${prevNodeType} (Mapped: ${mappedPrevType})`)
				console.log(`  Next Node Type: ${nextNodeType} (Mapped: ${mappedNextType})`)
				console.log(`  Rule Config:`, ruleConfig)

				// 🔥 Apply 'prev' rule, using mapped type
				if (ruleConfig.prev && Object.prototype.hasOwnProperty.call(ruleConfig.prev, mappedPrevType)) {
					verifyRule(context, options, prevNode, nextNode, mappedCurrNodeType, 'prev')
				}

				// 🔥 Apply 'next' rule, using mapped type
				if (ruleConfig.next && Object.prototype.hasOwnProperty.call(ruleConfig.next, mappedNextType)) {
					verifyRule(context, options, prevNode, nextNode, mappedCurrNodeType, 'next')
				}
			}
            
			//         if (!prevNode || !nextNode) return;

			// const options = context.options[0] || {};

			// for (const currNodeType in options) {
			//     if (!Object.prototype.hasOwnProperty.call(options, currNodeType)) continue;

			//     const ruleConfig = options[currNodeType]; // The rule config for ImportDeclaration, etc.
			//     if (!ruleConfig) continue;

			//     const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type;
			//     const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type;

			//     // 🔍 DEBUGGING LOG
			//     console.log(`Checking rules for: ${currNodeType}`);
			//     console.log(`  Prev Node Type: ${prevNodeType}`);
			//     console.log(`  Next Node Type: ${nextNodeType}`);
			//     console.log(`  Rule Config:`, ruleConfig);

			//     // 🔥 Apply 'prev' rule if it exists for this currNodeType
			//     if (ruleConfig.prev && Object.prototype.hasOwnProperty.call(ruleConfig.prev, prevNodeType)) {
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev');
			//     }

			//     // 🔥 Apply 'next' rule if it exists for this currNodeType
			//     if (ruleConfig.next && Object.prototype.hasOwnProperty.call(ruleConfig.next, nextNodeType)) {
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'next');
			//     }
			// }
            
			// if (!prevNode || !nextNode) return;

			// const options = context.options[0] || {};

			// for (const currNodeType in options) {
			//     if (!Object.prototype.hasOwnProperty.call(options, currNodeType)) continue;

			//     const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type;
			//     const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type;

			//     const ruleConfig = options[currNodeType];
                
			//     console.log(`Checking  curr: ${currNodeType} prev: ${prevNode.type}, next: ${nextNode.type}`);

			//     console.log(`ruleConfig.prev ${ruleConfig.prev}, ruleConfig.prev[prevNodeType] ${ruleConfig.prev[prevNodeType]}`)
                
			//     // 🔥 Apply 'prev' rule: If 'currNodeType' exists, check its 'prev' rules
			//     if (ruleConfig.prev && ruleConfig.prev[prevNodeType] !== undefined) {
                    
			//         console.log("1")
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev');
			//     }

			//     // 🔥 Apply 'next' rule: If 'currNodeType' exists, check its 'next' rules
			//     if (ruleConfig.next && ruleConfig.next[nextNodeType] !== undefined) {
			//         console.log("2")
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'next');
			//     }
			// }
            
			// //>
            
			// if (!prevNode || !nextNode) return;

			// const options = context.options[0] || {};

			// for (const currNodeType in options) {
			//     if (!Object.prototype.hasOwnProperty.call(options, currNodeType)) continue;

			//     const ruleForPrev = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'prev');
			//     const ruleForNext = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'next');

			//     const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type;
			//     const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type;

			//     // 🔥 Fix: Only apply 'prev' rule when the prev node type matches the rule definition
			//     if (ruleForPrev && options[currNodeType].prev[prevNodeType] !== undefined) {
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev');
			//     }

			//     if (ruleForNext && options[currNodeType].next[nextNodeType] !== undefined) {
			//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'next');
			//     }
			// }

			// //<
            
			// //>
            
			// if (!prevNode || !nextNode) { return }

			// const options = context.options[0] || {}
            
			// console.log(`Checking prev: ${prevNode.type}, next: ${nextNode.type}`);
            
			// for (const currNodeType in options) {
			//     if (Object.prototype.hasOwnProperty.call(options, currNodeType)) {
			//         const ruleForPrev = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'prev')
			//         const ruleForNext = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'next')

			//         // Improved duplicate check prevention: Check if both prev and next rules apply to the SAME node type
			//         if (ruleForPrev && ruleForNext) {
			//             const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type
			//             const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type

			//             if (ruleForPrev && options[currNodeType].prev[nextNodeType] !== undefined) { // Verify there exists a rule with the current node type matching, and the next node type matching
                            
			//                 console.log("1.1")
			//                 verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev')
			//             }
			//             if (ruleForNext && options[currNodeType].next[prevNodeType] !== undefined) { // Same check but in reverse (verify there is a rule with current node type matching, and the prev node type matching)
			//                 console.log("1.2")
			//                 verifyRule(context, options, prevNode, nextNode, currNodeType, 'next')
			//             }
			//             if (ruleForPrev) {
			//                 console.log("1.3")
			//                 verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev')
			//             }
			//             if (ruleForNext) {
			//                 console.log("1.4")
			//                 verifyRule(context, options, prevNode, nextNode, currNodeType, 'next')
			//             }
			//         }
			//         else if (ruleForPrev) { // Only 'prev' rule applies
			//             console.log("2.1")
			//             verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev')
			//         }
			//         else if (ruleForNext) { // Only 'next' rule applies
			//             console.log("3.1")
			//             verifyRule(context, options, prevNode, nextNode, currNodeType, 'next')
			//         }
			//     }
			// }
            
			// //<
		} //<
                
		// function isNonPaddingComment(node, sourceCode) { //>
		//     if (node.type !== 'Line' && node.type !== 'Block')
		//         return false

		//     const config = context.options[0]

		//     for (const key in config) {
		//         if (StatementTypes[key] && StatementTypes[key](node, sourceCode)) {
		//             return false // It's a padding comment according to the configuration
		//         }
		//     }
		//     return true // It's NOT a padding comment
		// } //<
        
		// function isCommentBetweenRuleNodes(commentNode, otherNode, currNodeType, options, target) { //>
		//     const otherNodeType = NODE_TYPE_MAPPING[otherNode.type] || otherNode.type

		//     //1. Check if the current node type config has explicit rules for both nodes surrounding the comment

		//     const currentRuleConfig = options[currNodeType] || {}
		//     const prevOrNextConfig = currentRuleConfig[target] || {}

		//     return prevOrNextConfig[otherNodeType] !== undefined
		// } //<

		function getRuleForNodes(options, prevNode, nextNode, currNodeType, target) { //>
			const ruleConfig = options[currNodeType] // Get the configuration for the current node type

			if (!ruleConfig) {
				return null // No configuration for this node type, so no rule applies
			}

			const linesConfig = ruleConfig[target] // Get the "prev" or "next" configuration

			if (!linesConfig || typeof linesConfig !== 'object') {
				return null // No "prev" or "next" config, so no rule applies
			}

			const nodeToCheck = target === 'prev' ? prevNode : nextNode
			const lineCount = extractLineCount(linesConfig, nodeToCheck)

			if (lineCount !== undefined) { // Only return a rule if a line count is explicitly defined for the node type
				return { lines: lineCount, target }
			}

			return null // No explicit rule for this node combination, so no rule applies
		} //<

		function extractLineCount(lineConfig, node) { //>
			// //>
            
			// if (!lineConfig || typeof lineConfig !== 'object') return undefined;

			// // 1. Direct node match
			// if (lineConfig[node.type] !== undefined) return lineConfig[node.type];

			// // 2. Mapped alias match
			// const mappedType = NODE_TYPE_MAPPING[node.type];
			// if (mappedType && lineConfig[mappedType] !== undefined) return lineConfig[mappedType];

			// // 3. Wildcard match as fallback
			// return lineConfig['*']; 

			// //<     
            
			//>
            
			if (lineConfig && typeof lineConfig === 'object') {
				// 1. Attempt direct node.type match (for precise configurations)
				if (Object.prototype.hasOwnProperty.call(lineConfig, node.type)) {
					return lineConfig[node.type]
				}
        
				// 2. Use mappedNodeType to check for aliases in the configuration
				const mappedNodeType = NODE_TYPE_MAPPING[node.type]
        
				if (mappedNodeType && Object.prototype.hasOwnProperty.call(lineConfig, mappedNodeType)) {
					return lineConfig[mappedNodeType] // Use the mapped type!
				}
        
				// 3.  Check StatementTypes as a fallback for custom/complex types
				for (const typeKey in lineConfig) {
					if (StatementTypes[typeKey] && StatementTypes[typeKey](node, context.sourceCode)) {
						return lineConfig[typeKey]
					}
				}
        
				// 4. (Optional) Wildcard handling if a general rule is desired
				if (Object.prototype.hasOwnProperty.call(lineConfig, '*')) {
					return lineConfig['*']
				}
			}
        
			return undefined
            
			//<            
		} //<

		function findPrevNode(node, sourceCode) { //>
			let prev = null

			if (node.parent && Array.isArray(node.parent.body)) {
				const index = node.parent.body.indexOf(node)
				if (index > 0) {
					prev = node.parent.body[index - 1]
				}
			}

			// Correctly handle interfaces potentially having a comment directly before them
			if (!prev && node.parent?.type === 'TSInterfaceDeclaration') {
				if (node.parent.parent && Array.isArray(node.parent.parent.body)) {
					const parentIndex = node.parent.parent.body.indexOf(node.parent)
					if (parentIndex > 0) {
						prev = node.parent.parent.body[parentIndex - 1]
					}
				}
			}

			// Check if prev is a comment. If so and it's NOT specified in the config, skip it.
			while (prev && (prev.type === 'Line' || prev.type === 'Block')) {
				if (!isPaddingComment(prev, sourceCode, context)) { // It's a non-padding comment
					break // Stop skipping
				}
				if (prev.parent && Array.isArray(prev.parent.body)) {
					const prevIndex = prev.parent.body.indexOf(prev)
					prev = prevIndex > 0 ? prev.parent.body[prevIndex - 1] : null
				}
				else {
					prev = null
				}
			}

			return prev
		} //<

		function findNextNode(node, sourceCode) { //>
			let next = null

			if (node.parent && Array.isArray(node.parent.body)) {
				const index = node.parent.body.indexOf(node)
				if (index >= 0 && index < node.parent.body.length - 1) {
					next = node.parent.body[index + 1]
				}
			}

			// Check if next is a comment. If so and it's NOT specified in the config, skip it.
			while (next && (next.type === 'Line' || next.type === 'Block')) {
				if (!isPaddingComment(next, sourceCode, context)) { // It's a non-padding comment
					break // Stop skipping
				}
				if (next.parent && Array.isArray(next.parent.body)) {
					const nextIndex = next.parent.body.indexOf(next)
					next = nextIndex >= 0 && nextIndex < next.parent.body.length - 1 ? next.parent.body[nextIndex + 1] : null
				}
				else {
					next = null
				}
			}

			return next
		} //<

		function isPaddingComment(node, sourceCode, context) { //>
			if (node.type !== 'Line' && node.type !== 'Block') {
				return false
			}

			const config = context.options[0]

			for (const key in config) {
				if (StatementTypes[key] && StatementTypes[key](node, sourceCode)) {
					return true // It's a padding comment according to configuration
				}
			}

			return false // It's NOT a padding comment
		} //<

		function verifyRule(context, options, prevNode, nextNode, currNodeType, target) { //>
			const rule = getRuleForNodes(options, prevNode, nextNode, currNodeType, target)

			if (rule) {
				verifySpacing(context, prevNode, nextNode, rule.lines, target)
				return true
			}

			return false
		} //<

		function verifySpacing(context, prevNode, nextNode, expectedLines, target) { //>
			const sourceCode = context.sourceCode

			const pt = getActualLastToken(prevNode, sourceCode)
			const ct = sourceCode.getFirstTokenBetween(prevNode, nextNode, { includeComments: true, filter: token => token.type !== 'JSDoc' }) || sourceCode.getFirstToken(nextNode)

			if (!pt || !ct) {
				return // Handle cases where tokens are null
			}

			const linesBetween = ct.loc.start.line - pt.loc.end.line - 1

			if (linesBetween !== expectedLines) {
				const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type
				const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type

				let message
				if (target === 'prev') {
					message = `${nextNodeType} (Previous Node Type: '${prevNodeType}') requires ${expectedLines} blank line(s) before, but found ${linesBetween}.`
				}
				else { // target === 'next'
					message = `${prevNodeType} (Next Node Type: '${nextNodeType}') requires ${expectedLines} blank line(s) after, but found ${linesBetween}.`
				}

				context.report({
					node: target === 'prev' ? nextNode : prevNode, // Report on the correct node based on the target
					message,
					fix: getFixerFunction(pt, ct, expectedLines, linesBetween),
				})
			}

			function getFixerFunction(pt, ct, expectedLines, linesBetween) {
				return function fix(fixer) { // Use a closure for access to variables from the outer scope
					if (!pt || !ct || !pt.range || !ct.range) {
						return null
					}

					const range = [pt.range[1], ct.range[0]]

					if (linesBetween < expectedLines) {
						return fixer.replaceTextRange(range, '\n'.repeat(expectedLines - linesBetween + 1))
					}
					else {
						return fixer.replaceTextRange(range, '\n'.repeat(expectedLines + 1))
					}
				}
			}
		} //<

		return { //>

			':statement': function (node) { // Correct placement of :statement handler
				const prev = findPrevNode(node, sourceCode)
				if (prev && !prev._checked) {
					checkPadding(prev, node)
					prev._checked = true // Mark as checked
				}
				const next = findNextNode(node, sourceCode)
				if (next && !next._checked) {
					checkPadding(node, next)
					next._checked = true
				}
			},

		} //<
	},
})

function getActualLastToken(node, sourceCode) { //>
	if (!node)
		return null // Immediately return null if node is null or undefined

	const semiToken = sourceCode.getLastToken(node)
	const prevToken = sourceCode?.getTokenBefore(semiToken)

	if (!prevToken || !semiToken) {
		return node // Return the *node* itself, not its range
	}

	const nextToken = sourceCode.getTokenAfter(semiToken)

	const isSemicolonLessStyle = prevToken
	  && nextToken
	  && prevToken.range[0] >= node.range[0]
	  && ASTUtils.isSemicolonToken(semiToken)
	  && semiToken.loc.start.line !== prevToken.loc.end.line
	  && semiToken.loc.end.line === nextToken.loc.start.line

	return isSemicolonLessStyle ? prevToken : semiToken
} //<

// // ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// // │                                                 Node Type Testers                                                  │
// // └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

/***
 * Creates tester which check if a node starts with specific keyword.
 */
class KeywordTester { //>

	constructor(keyword) {
		this.keyword = keyword // Store keyword
	}

	test(node, sourceCode) {
		const keywords = this.keyword.split(' ') // Split once in constructor
		return keywords.every((kw, i) => {
			const token = sourceCode.getFirstToken(node, i)
			return token?.value === kw
		})
	}

	static get(type) {
		let kt = KeywordTester.cache.get(type)
		if (!kt) {
			kt = new KeywordTester(type)
			KeywordTester.cache.set(type, kt)
		}
		return kt
	}

	static test(type, node, sourceCode) {
		return KeywordTester.get(type).test(node, sourceCode)
	}

} //<
KeywordTester.cache = new Map()

/***
 * Creates tester which check if a node is specific type.
 */
class NodeTypeTester { //>

	constructor(type) {
		this.type = type
	}

	test(node) {
		return node.type === this.type
	}

	static get(type) {
		let ntt = NodeTypeTester.cache.get(type)
		if (!ntt) {
			ntt = new NodeTypeTester(type)
			NodeTypeTester.cache.set(type, ntt)
		}
		return ntt
	}

	static test(type, node) {
		return NodeTypeTester.get(type).test(node)
	}

} //<
NodeTypeTester.cache = new Map()

/***
 * Checks whether the given token is a semicolon.
 * @param {Token} token - The token to check.
 * @returns {boolean} `true` if the token is a semicolon.
 */
function _isSemicolonToken(token) { //>
	return token.type === 'Punctuator' && token.value === ';'
} //<

function skipChainExpression(node) { //>
	return node?.type === AST_NODE_TYPES.ChainExpression ? node.expression : node
} //<

/***
 * Checks if the given node is an expression statement of IIFE.
 * @param {ASTNode} node - The node to check.
 * @returns {boolean} `true` if the node is an expression statement of IIFE.
 */
function isIIFEStatement(node) { //>
	if (node.type !== AST_NODE_TYPES.ExpressionStatement) {
		return false
	}

	let expression = skipChainExpression(node.expression)

	if (expression.type === AST_NODE_TYPES.UnaryExpression) {
		expression = skipChainExpression(expression.argument)
	}

	if (expression.type === AST_NODE_TYPES.CallExpression) {
		let callee = expression.callee
		while (callee.type === AST_NODE_TYPES.SequenceExpression) {
			callee = callee.expressions[callee.expressions.length - 1]
		}
		return ASTUtils.isFunction(callee)
	}

	return false
} //<

/***
 * Checks if the given node is a CommonJS require statement.
 * @param {ASTNode} node - The node to check.
 * @returns {boolean} `true` if the node is a CommonJS require statement.
 */
function isCJSRequire(node) { //>
	if (node.type !== AST_NODE_TYPES.VariableDeclaration) {
		return false
	}
	const declaration = node.declarations[0]
	if (!declaration?.init) {
		return false
	}

	let init = declaration.init
	while (init.type === AST_NODE_TYPES.MemberExpression) {
		init = init.object
	}

	if (init.type !== AST_NODE_TYPES.CallExpression || init.callee.type !== AST_NODE_TYPES.Identifier) {
		return false
	}

	return init.callee.name === 'require'
} //<

/***
 * Checks if the given node is a CommonJS export statement.
 * @param {ASTNode} node - The node to check.
 * @returns {boolean} `true` if the node is a CommonJS export statement.
 */
function isCJSExport(node) { //>
	if (node.type !== AST_NODE_TYPES.ExpressionStatement) {
		return false
	}

	const expression = node.expression
	if (expression.type !== AST_NODE_TYPES.AssignmentExpression) {
		return false
	}

	let left = expression.left
	if (left.type !== AST_NODE_TYPES.MemberExpression) {
		return false
	}

	while (left.object.type === AST_NODE_TYPES.MemberExpression) {
		left = left.object
	}

	if (left.object.type !== AST_NODE_TYPES.Identifier) {
		return false
	}

	const objectName = left.object.name
	if (objectName === 'exports') {
		return true
	}

	return objectName === 'module' && left.property.type === AST_NODE_TYPES.Identifier && left.property.name === 'exports'
} //<

/***
 * Checks whether the given node is a block-like statement.
 * @param {ASTNode} node - The node to check.
 * @param {SourceCode} sourceCode - The source code to get tokens.
 * @returns {boolean} `true` if the node is a block-like statement.
 */
function isBlockLikeStatement(node, sourceCode) { //>
	if (node.type === AST_NODE_TYPES.DoWhileStatement && node.body.type === AST_NODE_TYPES.BlockStatement) {
		return true
	}

	if (isIIFEStatement(node)) {
		return true
	}

	const lastToken = sourceCode.getLastToken(node, ASTUtils.isNotSemicolonToken)
	const belongingNode = lastToken && ASTUtils.isClosingBraceToken(lastToken)
		? sourceCode.getNodeByRangeIndex(lastToken.range[0])
		: null

	return !!belongingNode && (belongingNode.type === AST_NODE_TYPES.BlockStatement || belongingNode.type === AST_NODE_TYPES.SwitchStatement)
} //<

/***
 * Check whether the given node is a directive or not.
 * @param {ASTNode} node - The node to check.
 * @param {SourceCode} sourceCode - The source code object to get tokens.
 * @returns {boolean} `true` if the node is a directive.
 */
function isDirective(node, sourceCode) { //>
	return (
		node.type === AST_NODE_TYPES.ExpressionStatement
		&& (node.parent?.type === AST_NODE_TYPES.Program
		  || (node.parent?.type === AST_NODE_TYPES.BlockStatement && ASTUtils.isFunction(node.parent.parent)))
  && node.expression.type === AST_NODE_TYPES.Literal
  && typeof node.expression.value === 'string'
  && !ASTUtils.isParenthesized(node.expression, sourceCode)
	)
} //<

/***
 * Check whether the given node is a part of directive prologue or not.
 * @param {ASTNode} node - The node to check.
 * @param {SourceCode} sourceCode - The source code object to get tokens.
 * @returns {boolean} `true` if the node is a part of directive prologue.
 */
function isDirectivePrologue(node, sourceCode) { //>
	if (!isDirective(node, sourceCode) || !node.parent || !('body' in node.parent) || !Array.isArray(node.parent.body)) {
		return false
	}

	for (const sibling of node.parent.body) {
		if (sibling === node) {
			break
		}
		if (!isDirective(sibling, sourceCode)) {
			return false
		}
	}

	return true
} //<

/***
 * Check whether the given node is an expression
 * @param {ASTNode} node - The node to check.
 * @param {SourceCode} sourceCode - The source code object to get tokens.
 * @returns {boolean} `true` if the node is an expression
 */
function isExpression(node, sourceCode) { //>
	return node.type === AST_NODE_TYPES.ExpressionStatement && !isDirectivePrologue(node, sourceCode)
} //<

//===============================================================================================================

// const createRule = ESLintUtils.RuleCreator(name => `padding-line-between-statements/${name}`)

// export default createRule({
//     name: 'padding-between',
//     defaultOptions: [],
    
//     meta: { //>
//         type: 'layout',
//         fixable: 'whitespace',
//         messages: { unexpectedBlankLine: 'Unexpected blank line before this statement.' },
//         docs: {
//             description: 'Enforce padding lines between statement types',
//             category: 'Stylistic Issues',
//             recommended: 'warn',
//         },
//         schema: [
//             {
//                 type: 'object',
//                 additionalProperties: {
//                     type: 'object',
//                     properties: {
//                         prev: {
//                             type: 'object',
//                             additionalProperties: { type: 'integer' },
//                         },
//                         next: {
//                             type: 'object',
//                             additionalProperties: { type: 'integer' },
//                         },
//                     },
//                     additionalProperties: false,
//                 },
//             },
//         ],
//     }, //<
    
//     create(context) {
//         const sourceCode = context.sourceCode

//         return {
//             ':statement': function (node) { // Check padding *after* each relevant statement
//                 const options = context.options[0] || {}

//                 for (const currNodeType in options) {
//                     if (StatementTypes[currNodeType] && StatementTypes[currNodeType](node, sourceCode)) {
                        
//                         if (node.type !== 'Line' && node.type !== 'Block') { // Filter out comment nodes
//                             const prevNode = findPrevNode(node, sourceCode, options, currNodeType, context);
                            
//                             if (prevNode) {
//                                 checkPadding(prevNode, node, context, options, currNodeType, sourceCode);
//                             }

//                         }
    
//                         break // Only process the node once (for the first matching type)
//                     }
//                 }
                
//             },
//         }
//     },
// })

// function checkPadding(prevNode, nextNode, context, options, currNodeType, sourceCode) { //>
//     const ruleForPrev = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'prev', sourceCode);
//     const ruleForNext = getRuleForNodes(options, prevNode, nextNode, currNodeType, 'next', sourceCode);

//     if (ruleForPrev && options[currNodeType].prev[nextNode.type] !== undefined) {
//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'prev', sourceCode);
//     } else if (ruleForNext && options[currNodeType].next[prevNode.type] !== undefined) {
//         verifyRule(context, options, prevNode, nextNode, currNodeType, 'next', sourceCode);
//     }

// } //<

// function findPrevNode(node, sourceCode, options, currNodeType, context) {
//     let prev = node;

//     do {
//         prev = sourceCode.getPreviousSibling(prev);  // Get the sibling

//         if (!prev) {
//             break; // Exit the loop if there's no previous sibling
//         }

//     } while (prev && isPaddingComment(prev, sourceCode, context));

//     return prev;
// }

// function isPaddingComment(node, sourceCode, context) {  // Ensure sourceCode is passed here
//     const commentTypes = context.options[0];
//     for (const type in commentTypes) {
//         if (
//             Object.prototype.hasOwnProperty.call(commentTypes, type) &&
//             StatementTypes[type] &&
//             StatementTypes[type](node, sourceCode) // Pass sourceCode to StatementTypes functions
//         ) {
//             return true;
//         }
//     }
//     return false;
// }

// function getRuleForNodes(options, prevNode, nextNode, currNodeType, target, sourceCode) { //>
//     const ruleConfig = options[currNodeType]

//     if (!ruleConfig) {
//         return null
//     }

//     const linesConfig = ruleConfig[target]

//     if (!linesConfig || typeof linesConfig !== 'object') {
//         return null
//     }

//     const nodeToCheck = target === 'prev' ? prevNode : nextNode
//     const lineCount = extractLineCount(linesConfig, nodeToCheck, sourceCode) // Pass sourceCode to extractLineCount

//     if (lineCount !== undefined) {
//         return { lines: lineCount, target }
//     }

//     return null
// } //<

// function extractLineCount(lineConfig, node, sourceCode) { //>
//     if (lineConfig && typeof lineConfig === 'object') {
//         if (Object.prototype.hasOwnProperty.call(lineConfig, node.type)) {
//             return lineConfig[node.type]
//         }

//         const mappedNodeType = NODE_TYPE_MAPPING[node.type]

//         if (mappedNodeType && Object.prototype.hasOwnProperty.call(lineConfig, mappedNodeType)) {
//             return lineConfig[mappedNodeType]
//         }

//         for (const typeKey in lineConfig) {
//             if (StatementTypes[typeKey] && StatementTypes[typeKey](node, sourceCode)) {
//                 return lineConfig[typeKey]
//             }
//         }

//         if (Object.prototype.hasOwnProperty.call(lineConfig, '*')) {
//             return lineConfig['*']
//         }
//     }

//     return undefined
// } //<

// function verifyRule(context, options, prevNode, nextNode, currNodeType, target, sourceCode) { //>
//     const rule = getRuleForNodes(options, prevNode, nextNode, currNodeType, target, sourceCode)

//     if (rule) {
//         const prevToken = getActualLastToken(prevNode, context.sourceCode)
//         const nextToken = context.sourceCode.getFirstToken(nextNode)

//         if (!prevToken || !nextToken) {
//             return
//         }

//         const expectedLines = rule.lines
//         const actualLines = nextToken.loc.start.line - prevToken.loc.end.line - 1

//         if (actualLines !== expectedLines) { // linesBetween is now defined inside the if statement
//             const linesBetween = actualLines
//             const nextNodeType = NODE_TYPE_MAPPING[nextNode.type] || nextNode.type
//             const prevNodeType = NODE_TYPE_MAPPING[prevNode.type] || prevNode.type

//             let message
//             if (target === 'prev') {
//                 message = `${nextNodeType} (Previous Node Type: '${prevNodeType}') requires ${expectedLines} blank line(s) before, but found ${linesBetween}.` // Use linesBetween here
//             }
//             else { // target === 'next'
//                 message = `${prevNodeType} (Next Node Type: '${nextNodeType}') requires ${expectedLines} blank line(s) after, but found ${linesBetween}.` // Use linesBetween here
//             }

//             context.report({
//                 node: target === 'prev' ? nextNode : prevNode,
//                 message, // Use the constructed message
//                 fix: (fixer) => {
//                     if (actualLines < expectedLines) {
//                         return fixer.insertTextBeforeRange(nextToken.range, '\n'.repeat(expectedLines - actualLines))
//                     }
//                     else if (actualLines > expectedLines) {
//                         const range = [prevToken.range[1], nextToken.range[0]]
//                         const text = context.sourceCode.text.substring(range[0], range[1])

//                         return fixer.replaceTextRange(range, text.replace(/^\s*\n/gm, '').replace(/\n/g, '\n'.repeat(expectedLines)))
//                     }
//                     return null // Explicitly return null if no fix is necessary. Could be undefined otherwise.
//                 },

//             })
//         }

//         return true
//     }

//     return false
// } //<

// function getActualLastToken(node, sourceCode) {
//     if (!node)
//         return null

//     const semiToken = sourceCode.getLastToken(node)
//     const prevToken = sourceCode?.getTokenBefore(semiToken)

//     if (!prevToken || !semiToken) { return node }

//     const nextToken = sourceCode.getTokenAfter(semiToken)

//     const isSemicolonLessStyle = prevToken
//       && nextToken
//       && prevToken.range[0] >= node.range[0]
//       && isSemicolonToken(semiToken)
//       && semiToken.loc.start.line !== prevToken.loc.end.line
//       && semiToken.loc.end.line === nextToken.loc.start.line

//     return isSemicolonLessStyle ? prevToken : semiToken
// }

// function skipChainExpression(node) { //>
//     return node?.type === AST_NODE_TYPES.ChainExpression ? node.expression : node
// } //<

//===============================================================================================================

// // const LT = `[${Array.from(new Set(['\r\n', '\r', '\n', '\u2028', '\u2029'])).join('')}]`
// // const PADDING_LINE_SEQUENCE = new RegExp(String.raw`^(\s*?${LT})\s*${LT}(\s*;?)$`, 'u')

// // function replacerToRemovePaddingLines(_, trailingSpaces, indentSpaces) { //>
// //     return trailingSpaces + indentSpaces
// // } //<

// // /***
// //  * Check and report statements for `never` configuration.
// //  * @param {RuleContext} context - The rule context to report.
// //  * @param {ASTNode} _ - Unused. The previous node to check.
// //  * @param {ASTNode} nextNode - The next node to check.
// //  * @param {Array<[Token, Token]>} paddingLines - The array of token pairs that blank lines exist between the pair.
// //  */
// // function verifyForNever(context, _, nextNode, paddingLines) { //>
// //     if (paddingLines.length === 0) {
// //         return
// //     }

// //     context.report({
// //         node: nextNode,
// //         messageId: 'unexpectedBlankLine',
// //         fix(fixer) {
// //             if (paddingLines.length >= 2) {
// //                 return null // Can't reliably fix with multiple padding lines
// //             }

// //             const [prevToken, nextToken] = paddingLines[0]
// //             const start = prevToken.range[1]
// //             const end = nextToken.range[0]
// //             const text = context.sourceCode.text.slice(start, end).replace(PADDING_LINE_SEQUENCE, replacerToRemovePaddingLines)

// //             return fixer.replaceTextRange([start, end], text)
// //         },
// //     })
// // } //<

// // /***
// //  * Verifies and reports padding lines for the 'always' configuration.
// //  * @param {RuleContext} context - The rule context to report.
// //  * @param {ASTNode} prevNode - The previous node to check.
// //  * @param {ASTNode} nextNode - The next node to check.
// //  * @param {Array<object>} paddingData - Information about the padding lines.
// //  * @param {number} numLines - The expected number of blank lines.
// //  * @param {string} prevType - type of previous node
// //  * @param {string} nextType - type of next node
// //  */
// // function verifyForAlways(context, prevNode, nextNode, paddingData, numLines, prevType, nextType) { //>
// //     const sourceCode = context.sourceCode

// //     // Robustly get the last token of prevNode
// //     const pt = prevNode && prevNode.type !== 'JSDoc'
// //         ? getActualLastToken(prevNode, sourceCode)
// //         : prevNode?.range ? prevNode : { range: [0, 0], loc: { end: { line: 0 } } }

// //     // Robustly get the first token of nextNode
// //     const ct = nextNode && nextNode.type !== 'JSDoc'
// //         ? sourceCode.getFirstToken(nextNode)
// //         : nextNode?.range ? { range: nextNode.range, loc: nextNode.loc } : null

// //     if (!ct)
// //         return // Nothing to compare against

// //     pt.loc = pt.loc ?? { end: { line: 0 } } // Handle missing loc

// //     let linesBetween = ct.loc.start.line - pt.loc.end.line - 1
// //     let insertNode = pt // Use the node for insertion

// //     const commentsBeforeNext = sourceCode.getCommentsBefore(nextNode)
// //     if (commentsBeforeNext.length > 0) {
// //         const lastComment = commentsBeforeNext[commentsBeforeNext.length - 1]
// //         if (lastComment.loc?.end?.line) {
// //             linesBetween = ct.loc.start.line - lastComment.loc.end.line - 1
// //             insertNode = lastComment // Insert after last comment
// //         }
// //     }

// //     if (linesBetween !== numLines) {
// //         const message = `${nextNode.type} (p:'${prevType}', n:'${nextType}') requires ${numLines} blank line(s), but found ${linesBetween}.`

// //         context.report({
// //             node: nextNode,
// //             message,

// //             fix(fixer) {
// //                 if (linesBetween < numLines) {
// //                     const padding = '\n'.repeat(numLines - linesBetween)
// //                     return fixer.insertTextAfter(insertNode, padding) // Use insertNode!
// //                 }

// //                 else { // Correct the removal logic for too many lines:
// //                     if (!insertNode || !ct)
// //                         return null
// //                     if (insertNode.range && ct.range) {
// //                         return fixer.replaceTextRange(
// //                             [insertNode.range[1], ct.range[0]],
// //                             '\n'.repeat(numLines + 1), // Add 1 to include the newline at the end of insertNode
// //                         )
// //                     }
// //                     else {
// //                         return null // Handle cases where nodes or tokens are null
// //                     }
// //                 }
// //             },

// //         })
// //     }
// // } //<

// // const PaddingTypes = { //>
// //     any: { verify: () => { } },
// //     never: { verify: verifyForNever },
// //     always: { verify: verifyForAlways },
// // } //<

// // function verifyPadding(context, prevNode, nextNode, expectedLines, target) { //>
// //     if (!prevNode || !nextNode) {
// //         return
// //     }
// //     if (expectedLines !== undefined) {
// //         verifySpacing(context, prevNode, nextNode, expectedLines, target) // Pass target to verifySpacing
// //     }
// // } //<
