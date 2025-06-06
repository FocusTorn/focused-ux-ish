# Action Plan: focused-ux Monorepo

This document outlines key configurations, conventions, and troubleshooting steps for the `focused-ux` monorepo.

## 1. Project Setup & Configuration

### 1.1. Rule: Module Strategy for Packages (ESM/CJS)

-   **Directive:** For packages intended as dependencies of a VS Code extension part (which is typically CommonJS, CJS), ensure the dependency package also outputs CJS.
    -   **Action:** In the `package.json` of such library packages (e.g., `@focused-ux/dynamicons-core` when consumed by `@focused-ux/dynamicons-ext`):
        -   Set `format: cjs` in `esbuild` (or equivalent bundler) build scripts.
        -   Remove `"type": "module"` if present, or ensure it's not set, to default to CJS.
-   **Directive:** The root project and standalone tool scripts (e.g., in `@focused-ux/tools`) **MAY** remain ES Modules (ESM) by having `"type": "module"` in their respective `package.json` files.
-   **Rationale:** Ensures compatibility between VS Code extension CJS parts and their CJS library dependencies, particularly for resolving special modules like `vscode`.

### 1.2. Rule: VS Code Debugging for Satellite Packages

-   **Directive:** Maintain separate launch configurations in the root `.vscode/launch.json` for each satellite extension package (e.g., "Debug Dynamicons Extension", "Debug TerminalActions Extension").
    -   **Path Configuration:** The `args` array's `"--extensionDevelopmentPath"` **MUST** point to the specific satellite package's extension directory (e.g., `"${workspaceFolder}/packages/dynamicons/ext"`).
    -   **Workspace Argument:** The second path argument in `args` (which determines the workspace opened in the Extension Host) **MAY** point to the satellite package's directory for focused debugging or to `"${workspaceFolder}"` to debug in the context of the entire monorepo.
    -   **Output Files:** The `outFiles` array **SHOULD** include paths to the `dist` directories of both the satellite extension package and its corresponding core package (if any) to aid source map discovery (e.g., `"${workspaceFolder}/packages/dynamicons/ext/dist/**/*.js"`, `"${workspaceFolder}/packages/dynamicons/core/dist/**/*.js"`).
-   **Directive:** Create corresponding `preLaunchTask` entries in the root `.vscode/tasks.json` for each satellite debug configuration.
    -   **Task Command:** These tasks **SHOULD** use `pnpm exec turbo run dev --filter=<satellite-ext-name> --filter=<satellite-core-name>` (adjusting package names) to build and watch only the necessary packages for that specific debug session.
    -   **Background Task:** Set `isBackground: true` for these watch tasks.
-   **Rationale:** Provides isolated and efficient debugging environments for each satellite extension, with builds scoped to relevant packages.

### 1.3. Rule: NPM Script Conventions

-   **Directive:** For setting environment variables (e.g., `NODE_NO_WARNINGS=1`) within `package.json` scripts, **MUST** use `cross-env` to ensure cross-platform compatibility.
    -   _Example:_ `"myscript": "cross-env MY_VAR=true node ./script.js"`
-   **Directive:** For executing `.ts` files directly with Node.js in an ESM context (especially for scripts within packages that are themselves `"type": "module"` or when the root project is ESM):
    -   **MUST** use the `node --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));' your_script.ts` pattern.
    -   This addresses Node.js warnings about `--experimental-loader` and is the current recommended method.
-   **Directive:** For lengthy or complex Node.js invocations (like the ESM `.ts` execution command above), **SHOULD** create a simple CLI wrapper script (e.g., `ts-run.js`) within the `@focused-ux/tools` package.
    -   This wrapper script **MUST** be exposed as an executable command via the `bin` field in `packages/tools/package.json`.
    -   Root `package.json` scripts **SHOULD** then use `pnpm exec <wrapper-command>` (e.g., `pnpm exec ts-run`) for a cleaner and more maintainable interface.
-   **Rationale:** Promotes script portability, adherence to modern Node.js practices, and script readability.

### 1.4. Rule: `pnpm` Workspace and Binaries

-   **Directive:** When defining executable scripts for a workspace package via the `bin` field in its `package.json`:
    -   Ensure the script path in the `bin` value is correct and relative to the package's root.
    -   Ensure the script file itself has the appropriate shebang (e.g., `#!/usr/bin/env node`).
-   **Directive:** If `pnpm` fails to recognize or link a `bin` command from a local workspace package:
    -   **MUST** first verify the `bin` definition and script path.
    -   **MUST** then perform a full clean pnpm installation at the monorepo root (e.g., `rimraf node_modules pnpm-lock.yaml && pnpm install`) to resolve potential linking or caching issues.
-   **Rationale:** Ensures that local package binaries are correctly installed and accessible within the pnpm workspace.

## 2. Build & Utility Scripts

### 2.1. Rule: Script Compatibility with Package Module Type

-   **Directive:** Utility scripts within a package (e.g., build scripts, generators like `generate_icon_manifests.ts` in `dynamicons-core`) **MUST** be compatible with the module type (`"type": "module"` for ESM, or default CJS) of the package they reside in, especially if they are type-checked under that package's `tsconfig.json` context.
    -   If the package is CJS (no `"type": "module"` in its `package.json`), scripts type-checked by its `tsc` **MUST NOT** use ESM-specific features like `import.meta.url`.
    -   **Action:** Use CJS alternatives (e.g., `__dirname`, `__filename`, which `ts-node` provides in a CJS execution context) or ensure the script is executed in an environment that supports its syntax (e.g., `ts-node --esm` if the script itself is ESM but the package is CJS, though this can be complex for type-checking).
-   **Rationale:** Prevents TypeScript errors (like TS1470 for `import.meta` in CJS) when scripts are type-checked or executed.

### 2.2. Rule: Output Parsing Scripts (e.g., `aggregate-tsc-errors.ts`)

-   **Directive:** Scripts designed to parse output from build tools like `turbo` and `tsc` **MUST** be resilient to interleaved output from multiple packages.
    -   **Context Tracking:** Implement robust "sticky" context tracking (e.g., for the active package name based on `turbo`'s output prefixes) to correctly attribute unprefixed lines to the last known context.
    -   **Error Pattern Matching:** Utilize regular expressions for both detailed error lines (e.g., `tsc`'s file, line, and column output) and summary/generic failure lines from the tools.
    -   **Generic Failure Handling:** Account for generic failure reports from `turbo` (e.g., `ERROR: command finished with error`) and provide a fallback message in the aggregated summary if detailed errors for that package aren't successfully parsed.
-   **Directive:** When invoking `turbo` for such aggregation purposes, **MUST** use the `--continue` flag to ensure the script can collect errors from all packages, not just the first one that fails.
-   **Rationale:** Ensures comprehensive and accurate error reporting in a monorepo environment.

## 3. VS Code Extension Specifics (e.g., `dynamicons/ext`)

### 3.1. Rule: `package.json` Contributions

-   **Directive:** To make commands visible in the VS Code UI, **MUST** add appropriate `menus` contributions in the extension's `package.json` (e.g., for `explorer/context`, `view/title`).
-   **Directive:** For commands primarily intended for context menus or other specific UI elements and not general use from the Command Palette, **SHOULD** use `"when": "false"` in their `menus > commandPalette` contribution to hide them from the palette.
-   **Rationale:** Provides a clean and intuitive user experience for extension commands.

### 3.2. Rule: Asset Path Resolution

-   **Directive:** When accessing assets packaged with an extension (e.g., built-in icons, HTML views) from within the extension's runtime code (services, providers):
    -   The service or class needing access **MUST** have `ExtensionContext` injected (typically in its constructor).
    -   **MUST** use `vscode.Uri.joinPath(context.extensionUri, 'path', 'to', 'asset')` to construct correct and platform-independent file URIs for these assets.
-   **Rationale:** Ensures reliable access to extension assets regardless of installation location or platform.

### 3.3. Rule: Configuration Access

-   **Directive:** Services and other extension components **MUST** use the injected `IWorkspace` adapter (or `vscode.workspace` directly if not using an adapter) to retrieve configuration values.
-   **Directive:** Configuration keys **SHOULD** be accessed using a combination of a defined `configPrefix` (e.g., `dynamiconsConstants.configPrefix`) and the specific key (e.g., `config.get<string>(`${CONFIG_PREFIX}.${CONFIG_KEYS.userIconsDirectory}`)`).
-   **Rationale:** Promotes consistent and safe access to extension settings.

## 4. Troubleshooting: Issues and Corrections

This section documents common issues encountered during development and their resolutions.

### 4.1. Issue: `TypeError: Unknown file extension ".ts"` when running `.ts` scripts with `node`.

-   **Symptom:** `ERR_UNKNOWN_FILE_EXTENSION` when executing a command like `node ./path/to/script.ts`.
-   **Cause:** Node.js is trying to execute a TypeScript file directly without a transpiler/loader, especially in a project configured for ES Modules.
-   **Correction:**
    -   Modify the npm script (or direct command) to use `node --import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));' ./path/to/script.ts`.
    -   Alternatively, create a CLI wrapper (like `ts-run` in `@focused-ux/tools`) that encapsulates this Node.js invocation and use `pnpm exec <wrapper-command> ./path/to/script.ts`.
-   **Reference:** Section 1.3 (NPM Script Conventions).

### 4.2. Issue: `'ENV_VAR' is not recognized as an internal or external command...` on Windows.

-   **Symptom:** Error when trying to set an environment variable directly in an npm script on Windows (e.g., `NODE_NO_WARNINGS=1 mycommand`).
-   **Cause:** Windows Command Prompt/PowerShell do not support setting environment variables and running a command on the same line in that manner.
-   **Correction:**
    -   Install `cross-env` as a root devDependency (`pnpm add -D -w cross-env`).
    -   Prefix the command in `package.json` script with `cross-env`: `"myscript": "cross-env NODE_NO_WARNINGS=1 mycommand"`.
-   **Reference:** Section 1.3 (NPM Script Conventions).

### 4.3. Issue: `ERR_REQUIRE_CYCLE_MODULE` or `Cannot require() ES Module ... in a cycle`.

-   **Symptom:** Error when a CommonJS context attempts to `require()` an ES Module, especially if the ESM context is not clearly defined for the package containing the target script.
-   **Cause:** Mismatch in module systems or unclear module type declaration for a package.
-   **Correction:**
    -   Ensure the `package.json` of the package containing the ES Module script (e.g., `packages/tools/package.json` for `aggregate-tsc-errors.ts`) explicitly declares `"type": "module"`.
    -   Ensure the command invoking the script correctly uses ESM loading mechanisms (e.g., `node --import 'data:...'` as per 4.1).
-   **Reference:** Section 1.1 (Module Strategy), Section 1.3 (NPM Script Conventions).

### 4.4. Issue: `TypeError: Cannot read properties of undefined (reading 'trim')` in regex match.

-   **Symptom:** Script crashes when trying to access a property of a regex match's `groups` object that doesn't exist because the capture group was unnamed or incorrectly named.
-   **Cause:** Incorrectly trying to access a named capture group (e.g., `match.groups.myGroup`) when the group was defined as unnamed (`(.*)`) in the regex, or a typo in the group name.
-   **Correction:**
    -   If the regex uses an unnamed capture group like `(.*)`, access its content via the match array index (e.g., `match[1]`, `match[2]`, etc., where `match[0]` is the full match).
    -   Ensure named capture groups in the regex (`(?<name>...)`) are spelled correctly when accessed via `match.groups.name`.
    -   Add checks for `undefined` before attempting to call methods like `.trim()` on potentially undefined capture group results.
-   **Example Fix:** Change `match.groups.restOfLine.trim()` to `(match[2] !== undefined ? match[2] : '').trim()` if `restOfLine` corresponded to the second capture group `(.*)`.

## 5. General Development & Troubleshooting

## Personal Notes

Check on the sim for any bin created
dir node_modules\.bin

pnpm m ls
pnpm list @focused-ux/tools
