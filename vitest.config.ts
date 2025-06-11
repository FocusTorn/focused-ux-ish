// import { resolve } from 'path'

import { defineConfig } from 'vitest/config'

const testFiles = [
    
    'test/**/*.{vi,vite}.{ts,tsx}',
    '**/test**/*.{vi,vite}.?(c|m)[jt]s?(x)'

]
const excludedFiles = [

]

export default defineConfig({
    test: {
        poolOptions: { //>
            threads: {
                minThreads: 1,
                maxThreads: 4, // Increase this value to allow more concurrent runners
        
                // Causes equal or worse execution times.
                // useAtomics: true,
            },
        }, //<
        
        globals: true,
        environment: 'node', // Node.js environment for VS Code extension
        deps: { optimizer: { ssr: { include: ['vscode'] } } }, // VS Code extension specific settings
        testTimeout: 10000,
        
        include: testFiles,
        
        exclude: [ //>
            ...excludedFiles,
            '**/node_modules/**',
            '**/dist/**',
            '.vscode-test/**',
            'src/test/**/___removed___/**',
            
            '**/*.d.ts',
        ], //<
        
        reporters: [ //>
            'default',
            // 'dot',
            // './src/test/custom-reporter_rollupPassing.ts'
        ], //<

        // ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
        // │                                           COVERAGE                                           │
        // └──────────────────────────────────────────────────────────────────────────────────────────────┘
        coverage: {
            all: false,
            
            provider: 'v8', //istanbul

            //> INCLUDE AND EXCLUDE
            // Use a different glob for coverage if needed:
            // include: ['src/**/*'],
            // exclude: [], OR exclude: excludedFiles

            // Or use ( Example: replace '/test/' with '/') :
            // include: testAndCoverageFiles.map(file => file.replace('/test/', '/')),

            //<
            // include: testAndCoverageFiles,
            // exclude: excludedFiles,

            
            // include: testFiles,
            exclude: [ //>
                ...excludedFiles,
                '**/node_modules/**',
                '**/dist/**',
                '.vscode-test/**',
                'src/test/**/___removed___/**',
                '**/*.d.ts',
            ], //<
            reporter: ['text', 'html'],
        },
    },
})
