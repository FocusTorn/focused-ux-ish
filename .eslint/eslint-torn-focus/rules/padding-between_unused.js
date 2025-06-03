//>- OLD -----------------------------------------------------------------------

// function verifyForAlways(context, prevNode, nextNode, paddingData, numLines, prevType, nextType) {
//     const pt = getActualLastToken(prevNode, context.sourceCode)
//     const ct = context.sourceCode.getFirstToken(nextNode)

//     let linesBetween = ct.loc.start.line - pt.loc.end.line - 1

//     const commentsBeforeNext = context.sourceCode.getCommentsBefore(nextNode)

//     let insertPoint = pt.range[1] // Default insert point after the previous node

//     if (commentsBeforeNext.length > 0) {
//         const lastComment = commentsBeforeNext[commentsBeforeNext.length - 1]

//         const linesToComment = lastComment.loc.start.line - pt.loc.end.line - 1

//         if (linesToComment === 0) {
//             linesBetween -= 1 // Treat the comment as part of the next node
//         }
//         else if (linesBetween < numLines && linesBetween > 0) { // Adjust linesBetween to count comment lines
//             linesBetween = lastComment.loc.end.line - pt.loc.end.line - 1
//         }

//         insertPoint = lastComment.range[1] // Change insertion point to after the last comment
//     }

//     if (linesBetween !== numLines) {
//         const message = `${nextNode.type} (p:'${prevType}', n:'${nextType}') requires ${numLines} blank line(s), but found ${linesBetween}.`

//         context.report({
//             node: nextNode,
//             message,
//             fix(fixer) {
//                 if (linesBetween < numLines) { // Insert lines
//                     const padding = '\n'.repeat(numLines - linesBetween)
//                     return fixer.insertTextAfterRange([insertPoint - 1, insertPoint - 1], padding)
//                 }
//                 else { // Remove lines
//                     const rangeToRemove = [insertPoint, ct.range[0]]

//                     let newlinesToRemove = 0
//                     for (let i = insertPoint; i < rangeToRemove[1]; i++) {
//                         if (context.sourceCode.text[i] === '\n') {
//                             newlinesToRemove++
//                         }
//                         if (newlinesToRemove >= Math.abs(numLines - linesBetween)) {
//                             rangeToRemove[1] = i + 1
//                             break
//                         }
//                     }
//                     return fixer.removeRange(rangeToRemove)
//                 }
//             },
//         })
//     }
// }

// function verifyForAlways(context, prevNode, nextNode, paddingData, numLines, prevType, nextType) {
//     const pt = getActualLastToken(prevNode, context.sourceCode)
//     const ct = context.sourceCode.getFirstToken(nextNode)

//     let linesBetween = ct.loc.start.line - pt.loc.end.line - 1

//     const commentsBeforeNext = context.sourceCode.getCommentsBefore(nextNode)

//     let insertPoint = pt.range[1] // Default insert point after the previous node

//     if (commentsBeforeNext.length > 0) {
//         const lastComment = commentsBeforeNext[commentsBeforeNext.length - 1]

//         const linesToComment = lastComment.loc.start.line - pt.loc.end.line - 1

//         if (linesToComment === 0) {
//             linesBetween -= 1 // Treat the comment as part of the next node
//         }
//         else if (linesBetween < numLines && linesBetween > 0) { // Adjust linesBetween to count comment lines
//             linesBetween = lastComment.loc.end.line - pt.loc.end.line - 1
//         }

//         insertPoint = lastComment.range[1] // Change insertion point to after the last comment
//     }

//     if (linesBetween !== numLines) {
//         const message = `${nextNode.type} (p:'${prevType}', n:'${nextType}') requires ${numLines} blank line(s), but found ${linesBetween}.`

//         context.report({
//             node: nextNode,
//             message,
//             fix(fixer) {
//                 if (linesBetween < numLines) { // Insert lines
//                     const padding = '\n'.repeat(numLines - linesBetween)
//                     return fixer.insertTextAfterRange([insertPoint - 1, insertPoint - 1], padding)
//                 }
//                 else { // Remove lines
//                     const rangeToRemove = [insertPoint, ct.range[0]]

//                     let newlinesToRemove = 0
//                     for (let i = insertPoint; i < rangeToRemove[1]; i++) {
//                         if (context.sourceCode.text[i] === '\n') {
//                             newlinesToRemove++
//                         }
//                         if (newlinesToRemove >= Math.abs(numLines - linesBetween)) {
//                             rangeToRemove[1] = i + 1
//                             break
//                         }
//                     }
//                     return fixer.removeRange(rangeToRemove)
//                 }
//             },
//         })
//     }
// }

// create(context) {
//     const sourceCode = context.sourceCode

//     function checkPadding(prevNode, nextNode) {
//         console.log(`Checking padding between ${prevNode?.type} and ${nextNode?.type}`) // Log node types

//         if (!prevNode || !nextNode) { return }

//         // //- Non JSON rule config ----------------------->>
//         //     const options = context.options

//         //     if (!options || options.length === 0) { return }

//         //     for (const option of options) {
//         //         const { blankLine, prev, next } = option
//         //         // Get the tester functions for prev and next
//         //         const prevTester = StatementTypes[prev] || StatementTypes['*'] // Default to '*'
//         //         const nextTester = StatementTypes[next] || StatementTypes['*']
//         //         console.log(prevNode.type, nextNode.type, blankLine, prev, next)

//         //         if (prevTester.test(prevNode, sourceCode) && nextTester.test(nextNode, sourceCode)) {
//         //             const blankLineValue = blankLine[0]
//         //             const lines = blankLine[1]

//         //             const paddingType = PaddingTypes[blankLineValue]
//         //             if (!paddingType) {
//         //                 continue
//         //             }

//         //             // // Check if padding lines include comments
//         //             // const pt = getActualLastToken(prevNode, sourceCode);
//         //             // const ct = sourceCode.getFirstToken(nextNode);
//         //             // const range = [pt.range[1], ct.range[0]];
//         //             // const textBetween = sourceCode.text.slice(range[0], range[1]);
//         //             // const linesBetween = ct.loc.start.line - pt.loc.end.line - 1;

//         //             if (blankLineValue === 'always') {
//         //                 paddingType.verify(context, prevNode, nextNode, [], lines, prev, next) // Pass an empty array for paddingData if not used
//         //             }
//         //             else if (blankLineValue === 'never') {
//         //                 paddingType.verify(context, prevNode, nextNode, [], 0, prev, next)
//         //             }
//         //         }
//         //     }
//         // }

//         //-----------------------------------------------<<

//         const options = context.options[0] || {} // Get options, default to empty object

//         for (const currNodeType in options) { // Use currNodeType to avoid confusion
//             if (!Object.prototype.hasOwnProperty.call(options, currNodeType)) {
//                 continue
//             }

//             const currNodeTester = StatementTypes[currNodeType] || (() => false)
//             if (typeof currNodeTester.test !== 'function') {
//                 continue // Skip if no valid tester for the current node type
//             }

//             let lines = -1

//             // Check "prev" rules
//             const prevOptions = options[currNodeType]?.prev || {} // Access "prev" rules
//             if (currNodeTester.test(nextNode, sourceCode)) { // nextNode matches current node type. If this node matches the next node
//                 for (const prevType in prevOptions) { // Iterate through prev rules
//                     if (Object.prototype.hasOwnProperty.call(prevOptions, prevType)) {
//                         const prevTester = StatementTypes[prevType] || (() => false)
//                         if (typeof prevTester.test === 'function' && prevTester.test(prevNode, sourceCode)) {
//                             lines = prevOptions[prevType]
//                             break
//                         }
//                     }
//                 }
//             }

//             // Check "next" rules (only if "prev" didn't match)
//             const nextOptions = options[currNodeType]?.next || {} // Access next rules

//             if (lines === -1 && currNodeTester.test(prevNode, sourceCode)) { // prevNode matches currNodeType if this node matches the previous node
//                 for (const nextType in nextOptions) { // Iterate through next rules
//                     if (Object.prototype.hasOwnProperty.call(nextOptions, nextType)) {
//                         const nextTester = StatementTypes[nextType] || (() => false)

//                         if (typeof nextTester.test === 'function' && nextTester.test(nextNode, sourceCode)) {
//                             lines = nextOptions[nextType]

//                             break
//                         }
//                     }
//                 }

//                 if (lines !== -1) {
//                     console.log(`Match found. Lines: ${lines}`) // Log when lines are set

//                     verifyPadding(context, prevNode, nextNode, lines)
//                 }
//                 else {
//                     console.log('No matching rule found.') // Log if no rule matches
//                 }
//             }
//             else {
//                 console.log(`No typeTester found for ${currNodeType}`)
//             }
//         }
//     }

//     function verifyPadding(context, prevNode, nextNode, lines) { // New function
//         const paddingType = lines === 0 ? PaddingTypes.never : PaddingTypes.always // Determine padding type dynamically
//         paddingType.verify(context, prevNode, nextNode, [], lines, '*', '*') // Pass wildcard type for prev and next
//     }

//     return {
//         Program(node) { // Entry point for AST traversal
//             for (let i = 1; i < node.body.length; i++) {
//                 checkPadding(node.body[i - 1], node.body[i])
//             }
//         },

//         BlockStatement(node) {
//             for (let i = 1; i < node.body.length; i++) {
//                 checkPadding(node.body[i - 1], node.body[i])
//             }
//         },
//     }
// },

//<---------------------------------------------------------------------------<<
