import fs from 'node:fs'
import path from 'node:path'

export default function (plop) {
    // // Standard setGenerator ------------------------------>>

    // plop.setGenerator('component', {
    //     description: 'Create a new React component',
    //     prompts: [{
    //         type: 'input',
    //         name: 'name',
    //         message: 'What is your component name?'
    //     }],
    //     actions: [{
    //         type: 'add',
    //         path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.js',
    //         templateFile: 'plop-templates/component.js.hbs'
    //     }, {
    //         type: 'add',
    //         path: 'src/components/{{pascalCase name}}/{{pascalCase name}}.css',
    //         templateFile: 'plop-templates/component.css.hbs'
    //     }]
    // });

    // //------------------------------------------------------------------------<<
    // // With custom action --------------------------------->>

    // const fs = require('fs')
    // const path = require('path')

    // // 1. Create a custom action type "addDirectory"
    // plop.setActionType('addDirectory', (answers, config, plop) => {
    //     // plop.renderString renders path templates like {{name}}
    //     const newDirPath = plop.renderString(config.path, answers)

    //     // Create the directory if it doesn't exist
    //     if (!fs.existsSync(newDirPath)) {
    //         // { recursive: true } creates parent directories if they don't exist
    //         fs.mkdirSync(newDirPath, { recursive: true })
    //     }

    //     // Return a success message
    //     return `Directory created: ${newDirPath}`
    // })

    // // 2. Use your custom action in a generator
    // plop.setGenerator('component-folder', {
    //     description: 'Create a folder for a new component',
    //     prompts: [
    //         {
    //             type: 'input',
    //             name: 'name',
    //             message: 'What is the component name?',
    //         },
    //     ],
    //     actions: [
    //
    //     ],
    // })

    // //------------------------------------------------------------------------<<

    // Plop Helpers --------------------------------------->>

    // {{kebabCase name}}	my-awesome-feature	Folder names, URL slugs, npm package names.
    // {{pascalCase name}}	MyAwesomeFeature	Class names, Component names (React, Vue).
    // {{camelCase name}}	myAwesomeFeature	Variable names, function names.
    // {{titleCase name}}	My Awesome Feature	displayName in package.json, page titles, headings.
    // {{sentenceCase name}}	My awesome feature	Descriptions, full sentences.
    // {{snakeCase name}}	my_awesome_feature	Often used in Python, Ruby; sometimes for database columns.
    // {{constantCase name}}	MY_AWESOME_FEATURE	Constant variables (e.g., const MY_CONSTANT = ...).

    //------------------------------------------------------------------------<<

    plop.setActionType('addDirectory', (answers, config, plop) => {
        // {
        // type: 'addDirectory',
        // path: 'src/components/{{pascalCase name}}',

        // type: 'add',
        // path: `${coreBasePath}/src/services/.gitkeep`,
        // template: '',
        // },

        const newDirPath = plop.renderString(config.path, answers)

        if (!fs.existsSync(newDirPath)) {
            {
                recursive: true
            }
            fs.mkdirSync(newDirPath, { recursive: true })
        }

        // Return a success message
        return `Directory created: ${newDirPath}`
    })

    plop.setGenerator('ext', {
        description: 'Create a new mono-extension package structure',
        prompts: [
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the extension?',
            },
        ],
        actions: (_data) => {
            const actions = []

            // ┌──────────────────────────────────────────────────────────────────────────┐
            // │                               CORE PACKAGE                               │
            // └──────────────────────────────────────────────────────────────────────────┘
            const coreBasePath = 'packages/{{kebabCase name}}/core'
            actions.push(
                {
                    type: 'add',
                    path: `${coreBasePath}/package.json`,
                    templateFile: 'plop-templates/core-package.json.hbs',
                },
                {
                    type: 'add',
                    path: `${coreBasePath}/tsconfig.json`,
                    templateFile: 'plop-templates/core-tsconfig.json.hbs',
                },
                {
                    type: 'add',
                    path: `${coreBasePath}/src/index.ts`,
                    templateFile: '',
                },
                {
                    type: 'add',
                    path: `${coreBasePath}/src/_config/constants.ts`,
                    template: 'plop-templates/constants.ts.hbs',
                },
                {
                    type: 'addDirectory',
                    path: `${coreBasePath}/src/_interfaces/`,
                },
                {
                    type: 'addDirectory',
                    path: `${coreBasePath}/src/providers/`,
                },
                {
                    type: 'add',
                    path: `${coreBasePath}/src/services/.gitkeep`,
                    template: '',
                }
            )

            // ┌────────────────────────────────────────────────────────────────────────────┐
            // │                             EXTENSION PACKAGE                              │
            // └────────────────────────────────────────────────────────────────────────────┘
            const extBasePath = 'packages/{{kebabCase name}}/ext'
            actions.push(
                {
                    type: 'add',
                    path: `${extBasePath}/.vscodeignore`,
                    templateFile: 'plop-templates/ext-vscodeignore.hbs',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/LICENSE.txt`,
                    templateFile: 'plop-templates/license.txt.hbs',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/package.json`,
                    templateFile: 'plop-templates/ext-package.json.hbs',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/tsconfig.json`,
                    templateFile: 'plop-templates/ext-tsconfig.json.hbs',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/src/extension.ts`,
                    templateFile: 'plop-templates/ext-extension.ts.hbs',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/src/injection.ts`,
                    templateFile: '',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/src/{{pascalCase name}}.module.ts`,
                    templateFile: '',
                },
                {
                    type: 'add',
                    path: `${extBasePath}/src/_config/constants.ts`,
                    template: 'plop-templates/constants.ts.hbs',
                }
            )

            //- Create empty assets directory ---------------
            actions.push({
                type: 'add',
                path: `${extBasePath}/assets/.gitkeep`,
                template: '',
            })

            actions.push(() => { return `✅ Success! The mono-extension has been created.` })

            return actions
        },
    })
}
