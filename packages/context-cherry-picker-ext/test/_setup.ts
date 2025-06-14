// packages/context-cherry-picker-ext/test/_setup.ts
// ESLint & Imports -->>

//= VITEST ====================================================================================================
import { beforeEach, vi } from 'vitest';

//= TSYRINGE ==================================================================================================
import { container } from 'tsyringe';

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, ExtensionMode, LogOutputChannel, Memento, LanguageModelChat, Extension, ExtensionKind as RealExtensionKind, ConfigurationTarget as RealConfigurationTarget, FileType as RealFileType } from 'vscode';

//= NODE JS ===================================================================================================
import { createReadStream as nodeFsCreateReadStreamFunction } from 'node:fs';
import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import * as nodeOs from 'node:os';
import * as nodeFsPromises from 'node:fs/promises';

//= IMPLEMENTATIONS ===========================================================================================
import { mockly, vscodeSimulator } from 'mockly-vsc';
import type { IWindow, IWorkspace, ICommands, IEnv } from '@focused-ux/shared-services'; // Interfaces from Shared Services
import { SharedServicesModule } from '@focused-ux/shared-services'; // To register shared services

//--------------------------------------------------------------------------------------------------------------<<

// Mocks for vscode enums
const mockConfigurationTarget = { //>
	Global: 1,
	Workspace: 2,
	WorkspaceFolder: 3,
} as const satisfies Record<keyof typeof RealConfigurationTarget, RealConfigurationTarget>; //<
const mockFileType = { //>
	Unknown: 0,
	File: 1,
	Directory: 2,
	SymbolicLink: 64,
} as const satisfies Record<keyof typeof RealFileType, RealFileType>; //<
const mockExtensionKind = { //>
	UI: 1,
	Workspace: 2,
} as const satisfies Record<keyof typeof RealExtensionKind, RealExtensionKind>; //<

export interface CCPTestSetupContext { //>
	container: typeof container;
	mockContext: ExtensionContext;
	mockly: typeof mockly;
	simulator: typeof vscodeSimulator;
} //<

const createMockExtensionContext = (): ExtensionContext => { //>
	const mockMemento: Memento = {
		get: vi.fn((key: string, defaultValue?: any) => defaultValue),
		update: vi.fn(() => Promise.resolve()),
		keys: vi.fn(() => []),
	};
	const mockLogOutputChannel: LogOutputChannel = {
		name: 'MockLogChannel',
		append: vi.fn(),
		appendLine: vi.fn(),
		replace: vi.fn(),
		clear: vi.fn(),
		show: vi.fn(),
		hide: vi.fn(),
		dispose: vi.fn(),
		onDidChangeLogLevel: vi.fn(() => ({ dispose: vi.fn() })),
		logLevel: 0,
		trace: vi.fn(),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	};
	return {
		extensionUri: mockly.Uri.file('/mock/ccp-extension/path'),
		storageUri: mockly.Uri.file('/mock/ccp-storage/path'),
		globalStorageUri: mockly.Uri.file('/mock/ccp-globalStorage/path'),
		logUri: mockly.Uri.file('/mock/ccp-log/path'),
		extensionPath: '/mock/ccp-extension/path',
		environmentVariableCollection: {} as any,
		subscriptions: [],
		workspaceState: mockMemento,
		globalState: { ...mockMemento, setKeysForSync: vi.fn() },
		secrets: { get: vi.fn(), store: vi.fn(), delete: vi.fn(), onDidChange: vi.fn(() => ({ dispose: vi.fn() })) } as any,
		extensionMode: 1 as ExtensionMode, // Production
		globalStoragePath: '/mock/ccp-globalStoragePath',
		logPath: '/mock/ccp-logPath',
		asAbsolutePath: (relativePath: string) => `/mock/ccp-extension/path/${relativePath}`,
		storagePath: '/mock/ccp-storagePath',
		extension: {
			id: 'mock.ccp-extension',
			extensionUri: mockly.Uri.file('/mock/ccp-extension/path'),
			extensionPath: '/mock/ccp-extension/path',
			isActive: true,
			packageJSON: { name: 'mock-ccp-extension', version: '0.1.0', publisher: 'mock-publisher', engines: { vscode: '^1.0.0' } },
			extensionKind: mockExtensionKind.Workspace, // Typically extensions are Workspace
			activate: vi.fn(() => Promise.resolve({} as any)),
			exports: {},
			isActivePromise: Promise.resolve(true),
		} as Extension<any>,
		languageModelAccessInformation: {
			onDidChange: vi.fn(() => ({ dispose: vi.fn() })),
			canSendRequest: vi.fn((_chat: LanguageModelChat) => undefined),
		},
		outputChannelName: 'MockCCPOutput',
		createOutputChannel: vi.fn((_name: string) => mockLogOutputChannel),
	} as ExtensionContext;
}; //<

export function commonCCPTestSetup(): CCPTestSetupContext { //>
	const context: Partial<CCPTestSetupContext> = {};

	beforeEach(async () => { //>
		container.clearInstances();
		await vscodeSimulator.reset(); // Reset mockly's simulator

		context.mockContext = createMockExtensionContext();
		context.mockly = mockly;
		context.simulator = vscodeSimulator;
		context.container = container;

		// Register mockly's implementations for VS Code API interfaces from SharedServices
		// These are registered by SharedServicesModule now.
		// container.register<IWindow>('iWindow', { useValue: mockly.window as any });
		// container.register<IWorkspace>('iWorkspace', { useValue: mockly.workspace as any });
		// container.register<ICommands>('iCommands', { useValue: mockly.commands as any });
		// container.register<IEnv>('iEnv', { useValue: mockly.env as any });
		container.register<ExtensionContext>('iContext', { useValue: context.mockContext });

		// Register mock enum values (these are what injection.ts would import from 'vscode')
		// These are typically used if your main injection.ts registers these tokens.
		// For testing services that get these via DI, this is important.
		container.register('vscodeConfigurationTarget', { useValue: mockConfigurationTarget as any });
		container.register('vscodeFileType', { useValue: mockFileType as any });


		// Register actual Node.js functions for their respective tokens
		container.register<typeof nodeFsCreateReadStreamFunction>('iFsCreateReadStream', { useValue: nodeFsCreateReadStreamFunction });
		container.register<typeof nodeFs.readFileSync>('iFsReadFileSync', { useValue: nodeFs.readFileSync });
		container.register<typeof nodeFs.statSync>('iFsStatSync', { useValue: nodeFs.statSync });
		container.register<typeof nodeFsPromises.stat>('iFspStat', { useValue: nodeFsPromises.stat });
		container.register<typeof nodeFsPromises.readFile>('iFspReadFile', { useValue: nodeFsPromises.readFile });
		container.register<typeof nodeFsPromises.writeFile>('iFspWriteFile', { useValue: nodeFsPromises.writeFile });
		container.register<typeof nodeFsPromises.readdir>('iFspReaddir', { useValue: nodeFsPromises.readdir });
		container.register<typeof nodeFsPromises.copyFile>('iFspCopyFile', { useValue: nodeFsPromises.copyFile });
		container.register<typeof nodeFsPromises.access>('iFspAccess', { useValue: nodeFsPromises.access });
		container.register<typeof nodeFsPromises.mkdir>('iFspMkdir', { useValue: nodeFsPromises.mkdir });
		container.register<typeof nodeFsPromises.rename>('iFspRename', { useValue: nodeFsPromises.rename });

		container.register<typeof nodePath.dirname>('iPathDirname', { useValue: nodePath.dirname });
		container.register<typeof nodePath.join>('iPathJoin', { useValue: nodePath.join });
		container.register<typeof nodePath.basename>('iPathBasename', { useValue: nodePath.basename });
		container.register<typeof nodePath.isAbsolute>('iPathIsAbsolute', { useValue: nodePath.isAbsolute });
		container.register<typeof nodePath.resolve>('iPathResolve', { useValue: nodePath.resolve });
		container.register<typeof nodePath.normalize>('iPathNormalize', { useValue: nodePath.normalize });
		container.register<typeof nodePath.relative>('iPathRelative', { useValue: nodePath.relative });
		container.register<typeof nodePath.parse>('iPathParse', { useValue: nodePath.parse });
		container.register<typeof nodePath.extname>('iPathExtname', { useValue: nodePath.extname });

		container.register<typeof nodeOs.homedir>('iOsHomedir', { useValue: nodeOs.homedir });
		
		// CRITICAL: Register dependencies from SharedServicesModule
		// This will register the adapters (iWindow, iWorkspace etc.) using mockly instances
		// if mockly was used to provide them when SharedServicesModule itself was tested/configured for tests.
		// For this to work seamlessly, SharedServicesModule's registerDependencies
		// should ideally pick up the mockly instances if they are already registered (which they are above by mockly-vsc).
		// Or, SharedServicesModule itself should use mockly when in a test environment.
		// For now, we assume SharedServicesModule correctly registers its services and adapters.
		// The adapters (iWindow etc.) will be registered by SharedServicesModule using mockly's instances.
		SharedServicesModule.registerDependencies(container);


	}); //<

	return context as CCPTestSetupContext;
} //<