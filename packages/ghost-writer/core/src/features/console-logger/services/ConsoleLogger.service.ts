import { injectable } from 'tsyringe'
import ts from 'typescript'
import type { ConsoleLoggerGenerateOptions, ConsoleLoggerResult, IConsoleLoggerService } from '../_interfaces/IConsoleLoggerService.js'

class LogMessageHelper {
	private documentContent: string
	private sourceFile: ts.SourceFile

	constructor(documentContent: string, fileName: string) {
		this.documentContent = documentContent
		this.sourceFile = ts.createSourceFile(fileName, documentContent, ts.ScriptTarget.Latest, true)
	}

	private getLineAndCharacterOfPosition(pos: number): { line: number, character: number } {
		const lineStarts = this.sourceFile.getLineStarts()
		let line = 0
		for (let i = lineStarts.length - 1; i >= 0; i--) {
			if (pos >= lineStarts[i]) {
				line = i
				break
			}
		}
		const character = pos - lineStarts[line]
		return { line, character }
	}

	private lineAt(line: number): { text: string, firstNonWhitespaceCharacterIndex: number } {
		const lines = this.documentContent.split('\n')
		const text = lines[line] || ''
		const firstNonWhitespaceCharacterIndex = text.search(/\S|$/)
		return { text, firstNonWhitespaceCharacterIndex }
	}

	private get lineCount(): number {
		return this.documentContent.split('\n').length
	}

	public getMsgTargetLine(selectionLine: number, selectedVar: string): number {
		const selectedNode = this.findNodeAtLine(selectionLine, selectedVar)
		if (!selectedNode) {
			return selectionLine + 1
		}
		return this.determineTargetLine(selectedNode)
	}

	public generateLogMessage(selectedVar: string, lineOfSelectedVar: number, includeClassName: boolean, includeFunctionName: boolean): string {
		const className = includeClassName ? this.getEnclosingClassName(lineOfSelectedVar) : ''
		const funcName = includeFunctionName ? this.getEnclosingFunctionName(lineOfSelectedVar) : ''
		const lineOfLogMsg = this.getMsgTargetLine(lineOfSelectedVar, selectedVar)
		const spacesBeforeMsg = this.calculateSpaces(lineOfSelectedVar)
		const debuggingMsg = `${spacesBeforeMsg}console.log('${className}${funcName}${selectedVar}:', ${selectedVar});`

		return `${lineOfLogMsg === this.lineCount ? '\n' : ''}${debuggingMsg}\n`
	}

	private findNodeAtLine(line: number, varName: string): ts.Node | undefined {
		let foundNode: ts.Node | undefined
		const traverse = (node: ts.Node) => {
			const nodeStartLine = this.getLineAndCharacterOfPosition(node.getStart()).line
			const nodeEndLine = this.getLineAndCharacterOfPosition(node.getEnd()).line

			if (nodeStartLine <= line && nodeEndLine >= line && node.getText(this.sourceFile).includes(varName)) {
				if (node.kind === ts.SyntaxKind.VariableDeclaration && (node as ts.VariableDeclaration).name.getText(this.sourceFile) === varName) {
					foundNode = node
					return
				}
				else if (!foundNode) {
					foundNode = node
				}
			}
			ts.forEachChild(node, traverse)
		}
		traverse(this.sourceFile)
		return foundNode
	}

	private determineTargetLine(node: ts.Node): number {
		let parent = node.parent
		while (parent) {
			if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
				let statement = node
				while (statement.parent && statement.parent !== parent) {
					statement = statement.parent
				}
				return this.getLineAndCharacterOfPosition(statement.getEnd()).line + 1
			}
			if (ts.isArrowFunction(parent) && parent.body !== node) {
				return this.getLineAndCharacterOfPosition(node.getEnd()).line + 1
			}
			parent = parent.parent
		}
		return this.getLineAndCharacterOfPosition(node.getEnd()).line + 1
	}

	private calculateSpaces(line: number): string {
		const currentLine = this.lineAt(line)
		return ' '.repeat(currentLine.firstNonWhitespaceCharacterIndex)
	}

	private getEnclosingClassName(lineOfSelectedVar: number): string {
		const classDeclarationRegex = /class\s+([a-zA-Z\d_]+)/
		for (let i = lineOfSelectedVar; i >= 0; i--) {
			const lineText = this.lineAt(i).text
			const match = lineText.match(classDeclarationRegex)
			if (match) {
				const closingLine = this.getClosingBraceLine(i)
				if (lineOfSelectedVar < closingLine) {
					return `${match[1]} -> `
				}
			}
		}
		return ''
	}

	private getEnclosingFunctionName(lineOfSelectedVar: number): string {
		const functionRegex = /(?:function\s+([a-zA-Z\d_]+)|([a-zA-Z\d_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\))\s*=>|const\s+([a-zA-Z\d_]+)\s*=\s*(?:async\s*)?function)/
		for (let i = lineOfSelectedVar; i >= 0; i--) {
			const lineText = this.lineAt(i).text
			const match = lineText.match(functionRegex)
			if (match) {
				const functionName = match[1] || match[2] || match[3]
				const closingLine = this.getClosingBraceLine(i)
				if (lineOfSelectedVar < closingLine) {
					return `${functionName} -> `
				}
			}
		}
		return ''
	}

	private getClosingBraceLine(startLine: number): number {
		let braceCount = 0
		let inBlock = false
		for (let i = startLine; i < this.lineCount; i++) {
			const lineText = this.lineAt(i).text
			for (const char of lineText) {
				if (char === '{') {
					braceCount++
					inBlock = true
				} else if (char === '}') {
					braceCount--
				}
			}
			if (inBlock && braceCount === 0) {
				return i
			}
		}
		return this.lineCount
	}
}

@injectable()
export class ConsoleLoggerService implements IConsoleLoggerService {
	public generate(options: ConsoleLoggerGenerateOptions): ConsoleLoggerResult | undefined {
		const { documentContent, fileName, selectedVar, selectionLine, includeClassName, includeFunctionName } = options

		if (!selectedVar.trim()) {
			return undefined
		}

		const helper = new LogMessageHelper(documentContent, fileName)
		const logStatement = helper.generateLogMessage(selectedVar, selectionLine, includeClassName, includeFunctionName)
		const insertLine = helper.getMsgTargetLine(selectionLine, selectedVar)

		return { logStatement, insertLine }
	}
}