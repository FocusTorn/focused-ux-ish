// parse.js
const fs = require('fs');
const parser = require('@typescript-eslint/parser');

const filePath = process.argv[2]; // Get file path from command line argument
if (!filePath) {
    console.error("No file path provided.");
    process.exit(1);
}

const code = fs.readFileSync(filePath, 'utf8');
const functionNames = [];

try {
    const ast = parser.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'module',
        loc: false // We don't need location info
    });

    // This is a simple visitor function to traverse the AST
    function traverse(node) {
        if (!node) return;

        // Check for different types of function/method definitions
        if (
            (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') &&
            node.id && node.id.type === 'Identifier'
        ) {
            functionNames.push(node.id.name);
        } else if (
            node.type === 'MethodDefinition' &&
            node.key && node.key.type === 'Identifier'
        ) {
            functionNames.push(node.key.name);
        } else if (
            node.type === 'VariableDeclarator' &&
            node.init &&
            (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression') &&
            node.id && node.id.type === 'Identifier'
        ) {
            functionNames.push(node.id.name);
        }

        // Recurse into child nodes
        for (const key in node) {
            if (node.hasOwnProperty(key)) {
                const child = node[key];
                if (typeof child === 'object' && child !== null) {
                    if (Array.isArray(child)) {
                        child.forEach(traverse);
                    } else {
                        traverse(child);
                    }
                }
            }
        }
    }

    traverse(ast);
    // Output the result as a JSON string for easy parsing in AHK
    console.log(JSON.stringify([...new Set(functionNames)])); // Use Set to ensure unique names

} catch (e) {
    console.error("Error parsing file:", e.message);
    process.exit(1);
}