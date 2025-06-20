# SOP: Adding a New Mono-Extension

## 1.0 Project Overview

The **Focused-UX (F-UX)** project is a monorepo designed to produce a suite of VS Code extensions. The architecture follows two primary goals:

1.  **Standalone Extensions:** Each feature (e.g., "Chronocopy", "Autoterm") is developed as a self-contained, installable VS Code extension. This is achieved through a `core`/`ext` package pair.
2.  **Orchestrator Extension:** A primary extension, named **"Focused UX"**, serves as an orchestrator. It consumes the `core` library of each feature, combining all functionalities into a single, unified extension. This provides users with a complete experience without needing to install multiple individual extensions.

This dual approach necessitates a strict separation of concerns.

## 2.0 The `core`/`ext` Pattern

*   **`core` Package:** A framework-agnostic library containing the feature's abstract business logic (services, interfaces, models). It is published with type definitions and is consumable by any other package, most notably the "Focused UX" orchestrator.
*   **`ext` Package:** A lightweight VS Code extension that depends on the `core` package. It is responsible only for the VS Code-specific implementation, such as registering commands, creating UI elements, and managing state. It is not intended to be imported by other packages.

---

## 3.0 Key Configuration Principles

### 3.1 Workspace (`pnpm-workspace.yaml`)
*   Both the new `core` and `ext` packages MUST be added to the `packages` list in the root `pnpm-workspace.yaml` file to be recognized by the workspace.

### 3.2 `core` Package (`package.json`)
*   **Purpose:** To be consumed as a library.
*   **Entry Points:** MUST define `"main"`, `"module"`, and `"types"` fields to declare its public API for consumers.
*   **Build Script:** The `build` script MUST include a `build:types` step (`tsc -p tsconfig.json`) to generate declaration files, and a `build:js` step that uses the `--library` flag with `fux-build`.

### 3.3 `ext` Package (`package.json`)
*   **Purpose:** To be published as a VS Code extension.
*   **Entry Point:** MUST define the `"main"` field, which points to the compiled extension's entry script (e.g., `./dist/extension.js`).
*   **Redundant Fields:** MUST NOT include `"module"` or `"types"` fields, as it is not consumed as a library.
*   **Build Script:** The `build` script MUST include a `build:types` step (`tsc -p tsconfig.json`) for internal type-checking and dependency validation.
*   **Packaging:** MUST include a `.vscodeignore` file to exclude source code (`src/`), configuration files, and other development artifacts from the final VSIX package.
*   **Tooling Scripts:** Scripts like `version-bump` MUST use a correct relative path to the `@focused-ux/tools` package.

### 3.4 Build & Task Execution (`turbo.json`)
*   **Dependency Graph:** All `build` tasks MUST include `"dependsOn": ["^build"]` to ensure Turbo builds dependencies first.
*   **Cache Invalidation:** Any task that performs a "clean" operation (e.g., `build:clean`, `clean`) MUST have `"cache": false` in its task definition to prevent Turbo from caching the operation.

### 3.5 PowerShell Aliases (`powershell_profile.ps1`)
*   **Command Structure:** Aliases MUST be implemented to construct and execute the idiomatic `turbo run <task> --filter=<package-name>` command.
*   **Default Flags:** Default flags for common tasks (e.g., `--output-logs=new-only` for `build` and `package`) SHOULD be handled within the central `Invoke-TurboCommand` function.
*   **Alias Mapping:** New aliases MUST be added to the central `$packageAliases` hashtable for dynamic generation.

---

## 4.0 Standard Workflow

1.  **Provide Context:** The new file and folder structure for the `mono-extension-name` will be provided.
2.  **Update Workspace:** The `pnpm-workspace.yaml` will be updated to include the new packages.
3.  **Implement Logic:** The `core` and `ext` packages will be implemented following the principles outlined above.
4.  **Verify:** The build will be tested from the monorepo root using the `turbo run build --filter=...` command to ensure correctness.