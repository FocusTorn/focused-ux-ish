# Action Plan: Refactor to a Suite with Shared Core Logic

**Goal:** Create a suite of VS Code tools where:
1.  Individual features (e.g., Dynamicons, Terminal Actions) can be published and installed as standalone VS Code extensions.
2.  A main "FocusedUX" suite extension can be published and installed, providing the combined functionality by directly using the core logic of these features.
3.  Code for core feature logic is kept DRY and reused across the standalone extensions and the main suite.
4.  When a user installs the "FocusedUX" suite, they see one primary extension entry, not multiple separate feature extensions being automatically installed as dependencies.

**Build Strategy Note:**
*   **TypeScript Compiler (`tsc`):** Will be used primarily for type checking (`--noEmit` or `emitDeclarationOnly: true`) and generating TypeScript declaration files (`.d.ts`).
*   **`esbuild`:** Will be used for fast JavaScript bundling and transformation, producing the final runnable JS files.

---

## 1. Monorepo Setup (Turborepo)

*   **Action:** Initialize Turborepo. Create root `package.json`, `turbo.json`, `tsconfig.base.json`. Create `packages/` (for shared core libraries and thin extension wrappers) and `apps/` (for the main suite extension).
*   **Details:**
    *   Use `pnpm` as the package manager, leveraging workspaces.
    *   Root `tsconfig.base.json` will define common TypeScript settings.
*   **Files/Cmds:**
    *   `npx create-turbo@latest focused-ui-suite`
    *   `focused-ui-suite/package.json` (root)
    *   `focused-ui-suite/turbo.json`
    *   `focused-ui-suite/tsconfig.base.json`
    *   `focused-ui-suite/pnpm-workspace.yaml`
    *   `focused-ui-suite/packages/`
    *   `focused-ui-suite/apps/`

## 2. Create Shared `utilities-core` Library

*   **Action:**
    *   Create `packages/utilities-core/`. This is a **local library package**, not a VS Code extension.
    *   Move original `src/modules/utilities/` content (services, interfaces) and relevant helpers (e.g., `readJsonFileSync.ts`) here.
    *   Setup `package.json` (name: `@focused-ui/utilities-core`, version, main pointing to `esbuild` output, types pointing to `tsc` output, `"private": true` to prevent accidental NPM publishing).
        *   **Build Scripts:** Implement `build:types` (using `tsc -p . --emitDeclarationOnly`) and `build:js` (using `esbuild`), with a main `build` script orchestrating them. Add a `typecheck` script (`tsc --noEmit`).
        *   **Dependencies:**
            *   Include necessary runtime dependencies (e.g., `strip-json-comments`, `gpt-tokenizer`).
            *   Include `@types/node` in `devDependencies` to provide type definitions for Node.js built-in modules and globals.
            *   **If the library uses types from the VS Code API (e.g., `vscode.Disposable`, `vscode.Uri`), add `@types/vscode` to its `devDependencies` to ensure it can be type-checked in isolation.**
            *   List `tsyringe` and `reflect-metadata` as `peerDependencies` if they are expected to be provided by the consuming VS Code extension environment.
    *   Setup `tsconfig.json` (extends base, `composite: true`, `emitDeclarationOnly: true`, `outDir` for declarations).
    *   **CRITICAL:** Ensure all imports from Node.js built-in modules use the `node:` prefix (e.g., `import * as fs from 'node:fs';`).
    *   This package will be a local workspace dependency for core logic libraries and all extensions.
*   **Files:**
    *   `packages/utilities-core/src/`
    *   `packages/utilities-core/package.json` (with `esbuild` and `tsc` scripts, and relevant `@types/*` packages in devDependencies)
    *   `packages/utilities-core/tsconfig.json` (configured for `emitDeclarationOnly: true`)
    *   `packages/utilities-core/src/index.ts` (to export utilities)

## 3. Develop Core Logic Libraries (Internal, Non-Extension Packages)

*   **General Approach for each feature's core logic (e.g., `Dynamicons`, `TerminalActions`):**
    *   (Example using "Dynamicons". Repeat for others.)

*   **Step 3.1: Create the Core Logic Library (e.g., `dynamicons-core`)**
    *   **Action:**
        *   Create `packages/dynamicons-core/`. This is a **local library package**, not a VS Code extension.
        *   Move the non-VS Code specific business logic, services (e.g., `IconThemeGeneratorService`, `IconActionsService` - to be renamed appropriately for Dynamicons), data models, and assets (e.g., icon definitions) from the original icon theme module into `packages/dynamicons-core/src/`.
        *   Create `packages/dynamicons-core/package.json`:
            *   `name`: `@focused-ui/dynamicons-core`
            *   `version`: e.g., "0.1.0"
            *   `main`: e.g., "dist/index.js" (points to its build output)
            *   `types`: e.g., "dist/index.d.ts"
            *   `"private": true` (recommended, as it's an internal library)
            *   `dependencies`: `{ "@focused-ui/utilities-core": "workspace:*" }` and any other pure JS/TS libs.
            *   **NO** VS Code specific fields like `engines.vscode`, `activationEvents`, `contributes`.
            *   **Build Scripts:** Similar to `utilities-core` (`build:types` with `tsc`, `build:js` with `esbuild`).
        *   Create `packages/dynamicons-core/tsconfig.json` (extends base, `composite: true`, `emitDeclarationOnly: true`).
        *   Create `packages/dynamicons-core/src/index.ts` to export its public API (services, types, etc.).
    *   **Files:**
        *   `packages/dynamicons-core/src/`
        *   `packages/dynamicons-core/package.json`
        *   `packages/dynamicons-core/tsconfig.json`
        *   `packages/dynamicons-core/src/index.ts`

*   **REPEAT STEP 3.1 FOR EACH FEATURE'S CORE LOGIC:**
    *   `packages/terminal-actions-core/` (exports `TerminalActionsService`, etc.)
    *   `packages/notes-hub-core/`
    *   `packages/context-cherry-picker-core/`
    *   `packages/code-editing-core/`
    *   (Each will depend on `@focused-ui/utilities-core": "workspace:*"`)

## 4. Develop Standalone "Satellite" VS Code Extensions (Thin Wrappers)

*   **General Approach for each feature's VS Code extension wrapper:**
    *   (Example using "Dynamicons". Repeat for others.)

*   **Step 4.1: Create the Satellite Extension Package (e.g., `dynamicons-ext`)**
    *   **Action:**
        *   Create `packages/dynamicons-ext/`. This **is** a full VS Code extension project.
        *   This extension will be a thin wrapper around the corresponding `-core` library.
    *   **Files:**
        *   `packages/dynamicons-ext/`

*   **Step 4.2: Satellite Extension's `package.json` (e.g., for `dynamicons-ext`)**
    *   **Action:**
        *   Create `packages/dynamicons-ext/package.json`.
        *   `publisher`, `name` (e.g., `yourPublisher.dynamicons`).
        *   `main`: e.g., `./dist/extension.js`.
        *   `engines.vscode`, `activationEvents`.
        *   `dependencies`:
            *   `"@focused-ui/dynamicons-core": "workspace:*"`
            *   `"@focused-ui/utilities-core": "workspace:*"` (if directly used, or rely on transitive from `-core`)
            *   `vscode` (devDependency, for types), `tsyringe` (if used for DI within the extension shell).
        *   `contributes`: Extract *only the `contributes` entries relevant to this specific feature* (Dynamicons) from the original icon theme `package.json`.
            *   **Prefixing:** All command IDs, view IDs, configuration keys in this satellite's `package.json` and its code **MUST** use a prefix unique to this satellite (e.g., `dynamicons.activateTheme`).
        *   `scripts`: `build` (using `esbuild` to bundle JS, potentially `tsc` for a final type check or if declarations are specific to the wrapper; `vsce package` would use the `esbuild` output). Add `typecheck` script.
            *   `esbuild` command should mark `vscode` as external.
    *   **Files:**
        *   `packages/dynamicons-ext/package.json`

*   **Step 4.3: Satellite Extension's Entry Point & Logic (e.g., for `dynamicons-ext`)**
    *   **Action:**
        *   Create `packages/dynamicons-ext/src/extension.ts`:
            *   `activate` function will:
                *   Import services/functions from `@focused-ui/dynamicons-core` (e.g., `import { DynamiconsService } from '@focused-ui/dynamicons-core';`).
                *   Perform DI setup if needed (e.g., `container.register('IDynamiconsService', { useClass: DynamiconsService })`).
                *   Register its VS Code commands, views, etc., using the logic from the imported core service.
        *   Create `packages/dynamicons-ext/src/_config/constants.ts` (using its unique prefix).
        *   Create `packages/dynamicons-ext/src/injection.ts` (if using DI for the extension shell itself).
        *   Move any VS Code specific UI or interaction logic (that wasn't part of the pure core logic) here.
    *   **Files:**
        *   `packages/dynamicons-ext/src/extension.ts`
        *   `packages/dynamicons-ext/src/_config/constants.ts`
        *   `packages/dynamicons-ext/src/injection.ts` (optional)

*   **Step 4.4: Satellite Extension's `tsconfig.json` (e.g., for `dynamicons-ext`)**
    *   **Action:** Create `packages/dynamicons-ext/tsconfig.json` (extends `../../tsconfig.base.json`, `composite: true`, references its `-core` package if needed for build order, `outDir` to `dist`). If `esbuild` handles all JS transformation, this `tsconfig.json` might also use `emitDeclarationOnly: true` or `noEmit: true` if its types are only for local dev.
    *   **Files:**
        *   `packages/dynamicons-ext/tsconfig.json`

*   **REPEAT STEPS 4.1 to 4.4 FOR EACH FEATURE EXTENSION WRAPPER:**
    *   `packages/terminal-actions-ext/` (depends on `@focused-ui/terminal-actions-core`)
    *   `packages/notes-hub-ext/`
    *   `packages/context-cherry-picker-ext/`
    *   `packages/code-editing-ext/`

## 5. Develop the Main "FocusedUX" Suite Extension

*   **Action:**
    *   Create `apps/focused-ux-ext/`. This **is** the main VS Code extension for the suite.
*   **Files:**
    *   `apps/focused-ux-ext/`

*   **Step 5.1: `FocusedUX` Extension's `package.json`**
    *   **Action:**
        *   Create `apps/focused-ux-ext/package.json`.
        *   `publisher`, `name` (e.g., `yourPublisher.focused-ux-suite`).
        *   `main`: `./dist/extension.js`.
        *   `activationEvents`.
        *   `dependencies`:
            *   `"@focused-ui/dynamicons-core": "workspace:*"`
            *   `"@focused-ui/terminal-actions-core": "workspace:*"`
            *   `"@focused-ui/notes-hub-core": "workspace:*"`
            *   `"@focused-ui/context-cherry-picker-core": "workspace:*"`
            *   `"@focused-ui/code-editing-core": "workspace:*"`
            *   `"@focused-ui/utilities-core": "workspace:*"`
            *   `vscode` (devDependency), `tsyringe` (if used).
        *   **`extensionDependencies`: DO NOT list the satellite `-ext` wrappers here.**
        *   `contributes`: Define any commands, views, or settings *unique to the FocusedUX suite itself* or that provide a unified interface over the core features. If it re-exposes features, ensure IDs are distinct or clearly namespaced for the suite.
        *   `scripts`: `build` (using `esbuild` to bundle JS, `tsc` for type checking). `esbuild` marks `vscode` as external. Add `typecheck` script.
    *   **Files:**
        *   `apps/focused-ux-ext/package.json`

*   **Step 5.2: `FocusedUX` Extension's Entry Point & Logic**
    *   **Action:**
        *   Create `apps/focused-ux-ext/src/extension.ts`:
            *   `activate` function will:
                *   Import services/functions from all necessary `-core` libraries (e.g., `import { DynamiconsService } from '@focused-ui/dynamicons-core';`, `import { TerminalActionsService } from '@focused-ui/terminal-actions-core';`).
                *   Perform DI setup for all core services it uses.
                *   Register its VS Code commands, views, etc., orchestrating or directly using the logic from the imported core services.
        *   Create `apps/focused-ux-ext/src/_config/constants.ts` (for suite-specific constants).
        *   Create `apps/focused-ux-ext/src/injection.ts` (for DI setup).
        *   Original `logger.ts` can live here: `apps/focused-ux-ext/src/core/helpers/logger.ts`.
    *   **Files:**
        *   `apps/focused-ux-ext/src/extension.ts`
        *   `apps/focused-ux-ext/src/_config/constants.ts`
        *   `apps/focused-ux-ext/src/injection.ts`
        *   `apps/focused-ux-ext/src/core/helpers/logger.ts`

*   **Step 5.3: `FocusedUX` Extension's `tsconfig.json`**
    *   **Action:** Create `apps/focused-ux-ext/tsconfig.json` (extends `../../tsconfig.base.json`, `composite: true`, references all `-core` packages, `outDir` to `dist`). Similar to satellite extensions, may use `emitDeclarationOnly: true` or `noEmit: true` if `esbuild` handles JS.
    *   **Files:**
        *   `apps/focused-ux-ext/tsconfig.json`

## 6. Update Build System & Adapt Scripts

*   **Action:**
    *   Configure `turbo.json` build pipelines.
        *   Ensure `-core` libraries' `build:types` and `build:js` tasks are dependencies for the `build` tasks of extensions that consume them.
        *   Include a root `typecheck` pipeline in `turbo.json` that runs `tsc --noEmit` across all relevant packages.
    *   Root `package.json` scripts use `turbo run build`, `turbo run typecheck`, etc.
    *   Each extension (`-ext` wrappers and `focused-ux-ext`) will have its own build script. This script will:
        1.  (Optionally) Run `tsc -p . --emitDeclarationOnly true` if the package needs to emit its own specific declarations not covered by its `-core` dependency.
        2.  Run `esbuild` to bundle its `src/extension.ts` (and imported local code from its `-core` dependencies) into a single JS file in its `dist/` folder (e.g., `dist/extension.js`), ensuring `vscode` is marked as external.
    *   Adapt original `src/scripts/` (validation, version bumping). Asset generation scripts (like for icons) will now live within their respective `-core` or `-ext` packages.
*   **Files:**
    *   `turbo.json` (updated pipelines)
    *   `package.json` (root, updated scripts)
    *   Build scripts within each package/app (reflecting `tsc` for types/declarations and `esbuild` for JS bundling).

## 7. Development, Testing, and Publishing

*   **Action:**
    *   Run `pnpm install` at the root.
    *   Build all packages/apps using `turbo run build` (or `pnpm build`).
    *   **Testing Standalone Extensions:** Open specific `packages/*-ext/` folders in VS Code and use F5 to debug them individually.
    *   **Testing Suite Extension:** Open `apps/focused-ux-ext/` folder in VS Code and use F5 to debug the full suite.
    *   Publish each `-ext` wrapper and the `focused-ux-ext` to the VS Code Marketplace as separate `.vsix` files.
*   **Files:** All files across the monorepo.

## 8. Notes for Implementing Additional Features (from original project)

To integrate remaining features (e.g., `ContextCherryPicker`, `CodeEditing`, `NotesHub`) from the original `focused-ui` project into this new architecture, follow the same pattern:

1.  **Create a Core Logic Library (`packages/<feature>-core/`):**
    *   Isolate the non-VS Code specific business logic, services, data models, and assets for the feature.
    *   Define its `package.json` (making it a private workspace library, e.g., `@focused-ui/<feature>-core`) and `tsconfig.json`.
    *   Export its public API from `src/index.ts`.
    *   This library will depend on `@focused-ui/utilities-core": "workspace:*"`.

2.  **Create a Thin VS Code Extension Wrapper (`packages/<feature>-ext/`):**
    *   This is the independently publishable VS Code extension for the individual feature.
    *   It depends on `packages/<feature>-core/` via `workspace:*`.
    *   Its `package.json` defines VS Code contributions (commands, views, settings) specific to this feature, with unique ID prefixes.
    *   Its `src/extension.ts` imports from its `-core` library and wires up the VS Code integrations.

3.  **Integrate into `FocusedUX` Suite Extension (`apps/focused-ux-ext/`):**
    *   Add `packages/<feature>-core/` as a `workspace:*` dependency to `apps/focused-ux-ext/package.json`.
    *   In `apps/focused-ux-ext/src/extension.ts`:
        *   Import the necessary services/functions from `@focused-ui/<feature>-core`.
        *   Initialize/register them within the suite's DI container (if applicable).
        *   If the suite provides a unified UI or commands for this feature, implement that logic here, calling into the `-core` services.
    *   Update the `FocusedUX` `package.json` `contributes` section if the suite exposes any new unified commands/views related to this feature.

4.  **Update Build System:**
    *   Ensure `turbo.json` and `tsconfig.json` references are updated to include the new `-core` and `-ext` packages in the build order.

**Example: Adding `ContextCherryPicker`**

*   `packages/context-cherry-picker-core/`: Contains `CCP_Manager.service.ts`, `ContextDataCollector.service.ts`, etc. (refactored to be VS Code agnostic if possible, or to take VS Code specific parts as constructor args/dependencies).
*   `packages/context-cherry-picker-ext/`:
    *   Depends on `@focused-ui/context-cherry-picker-core`.
    *   `package.json` contributes `focusedUiCCP.*` commands and views.
    *   `extension.ts` initializes and uses services from the core.
*   `apps/focused-ux-ext/`:
    *   Depends on `@focused-ui/context-cherry-picker-core`.
    *   Its `extension.ts` might initialize CCP services if the suite needs to interact with CCP data or trigger CCP actions programmatically.
    *   If `FocusedUX` has a "master dashboard" view, it might display information or provide quick actions related to CCP, using the CCP core services.

This approach ensures that new features are also developed with a clean separation of core logic and VS Code integration, maintaining the DRY principle and the desired publishing structure.