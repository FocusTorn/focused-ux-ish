# Mockly-VSC

Mockly-VSC is a comprehensive library for mocking the Visual Studio Code (VSCode) API within a [Vitest](https://vitest.dev/) testing environment. It simplifies testing VSCode extensions by providing a robust, in-memory simulation of the `vscode` namespace, enabling you to reliably test editor states, user interactions, file system operations, and more.

By accurately replicating key VSCode components like `workspace`, `window`, `commands`, `env`, and `extensions`, Mockly-VSC helps you write effective unit and integration tests for your extensions with greater ease.

## Key Features

*   **Comprehensive API Mocking:** Faithfully simulates `vscode.workspace`, `vscode.window`, `vscode.commands`, `vscode.env`, and `vscode.extensions`.
*   **Realistic Editor Simulation:** Includes an in-memory file system, text document and editor management, and event simulation.
*   **Interactive Element Mocking:** Simulate user inputs (quick picks, input boxes), messages, terminals, and output channels.
*   **Robust Test Control:** Easily manage and reset the mock environment's state between tests with `vscodeSimulator.reset()`.
*   **Core VSCode Type Implementations:** Provides mock versions of essential types like `Uri`, `Position`, `Range`, `EventEmitter`, and more.

## Getting Started

### Installation

To add Mockly-VSC to your project, use your preferred package manager:

~~~bash
npm install mockly-vsc --save-dev
# or
yarn add mockly-vsc --dev
# or
pnpm add mockly-vsc --dev
~~~

Ensure you also have `vitest` and `vscode-uri` (a peer dependency often used with VSCode related projects) installed. Mockly-VSC also uses `reflect-metadata` for `tsyringe`, so you'll need to import it once in your test setup file.

~~~bash
npm install vitest vscode-uri reflect-metadata --save-dev
# or
yarn add vitest vscode-uri reflect-metadata --dev
# or
pnpm add vitest vscode-uri reflect-metadata --dev
~~~

**Test Setup File (e.g., `vitest.setup.ts`):**
~~~typescript
import 'reflect-metadata';
~~~
Make sure to configure Vitest to use this setup file.

### Basic Usage

Here's a quick glimpse of how you can use Mockly-VSC in your tests:

~~~typescript
// myExtension.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mockly, vscodeSimulator } from 'mockly-vsc';

describe('My Extension Tests', () => {
  beforeEach(async () => {
    await vscodeSimulator.reset(); // Reset the mock environment
  });

  it('should simulate opening a document', async () => {
    const testUri = mockly.Uri.file('/test/file.txt');
    // Create a dummy file in the mock file system
    await mockly.workspace.fs.writeFile(testUri, Buffer.from('Hello Mockly!'));
    
    const document = await mockly.workspace.openTextDocument(testUri);
    expect(document.getText()).toBe('Hello Mockly!');
    expect(mockly.workspace.textDocuments.length).toBe(1);
  });
});
~~~

For a more detailed guide on setup and usage, please see our **[Full Getting Started Guide](./docs/getting-started.md)**.

## Full Documentation

Explore the full capabilities of Mockly-VSC:

*   **[Getting Started](./docs/getting-started.md)**: Detailed installation, setup, and initial examples.
*   **[Core Concepts](./docs/core-concepts.md)**: Understanding the `mockly` object and the `vscodeSimulator`.
*   **API Reference**:
    *   [`mockly.workspace`](./docs/api-reference/workspace.md)
    *   [`mockly.window`](./docs/api-reference/window.md)
    *   [`mockly.commands`](./docs/api-reference/commands.md)
    *   [`mockly.env`](./docs/api-reference/env.md)
    *   [`mockly.extensions`](./docs/api-reference/extensions.md)
    *   [Core VSCode Types](./docs/api-reference/core-types.md)
*   **[Test Control & State Management](./docs/test-control.md)**: Mastering test isolation and advanced setup.
*   **[Usage Examples](./docs/examples.md)**: Practical examples for common testing scenarios.

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.
(For more details, see [Contributing Guidelines](./docs/contributing.md) - *optional, create this file if needed*).

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.