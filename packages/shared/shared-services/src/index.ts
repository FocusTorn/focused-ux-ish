// ESLint & Imports -->>

// This file is the public API of the shared-services package. It should export all and only the modules,
// services, and types that are intended for consumption by other packages.

//= MODULES ===================================================================================================
export { SharedServicesModule } from './SharedServices.module.js'

//= VSCODE ABSTRACTIONS =======================================================================================
// These interfaces define the contract with VSCode's API, allowing for mocked implementations.
export type { ICommands } from './_vscode_abstractions/ICommands.js'
export type { IEnv } from './_vscode_abstractions/IEnv.js'
export type { IWindow } from './_vscode_abstractions/IWindow.js'
export type { IWorkspace } from './_vscode_abstractions/IWorkspace.js'

//= SERVICE INTERFACES ========================================================================================
export type { ICommonUtilsService } from './_interfaces/ICommonUtilsService.js'
export type { IFileUtilsService } from './_interfaces/IFileUtilsService.js'
export type { IFrontmatterUtilsService } from './_interfaces/IFrontmatterUtilsService.js'
export type { IPathUtilsService } from './_interfaces/IPathUtilsService.js'
export type { IQuickPickUtilsService } from './_interfaces/IQuickPickUtilsService.js'
export type { IShellUtilsService } from './_interfaces/IShellUtilsService.js'
export type { ITokenizerService } from './_interfaces/ITokenizerService.js'
export type { IWorkspaceUtilsService } from './_interfaces/IWorkspaceUtilsService.js'
export type { ITreeFormatterService, TreeFormatterNode } from './services/TreeFormatter.service.js'

//= SERVICE IMPLEMENTATIONS ===================================================================================
// These are the concrete implementations of the services, which are registered with the DI container.
export { CommonUtilsService } from './services/CommonUtils.service.js'
export { FileUtilsService } from './services/FileUtils.service.js'
export { FrontmatterUtilsService } from './services/FrontmatterUtils.service.js'
export { PathUtilsService } from './services/PathUtils.service.js'
export { QuickPickUtilsService } from './services/QuickPickUtils.service.js'
export { ShellUtilsService } from './services/ShellUtils.service.js'
export { TokenizerService } from './services/Tokenizer.service.js'
export { TreeFormatterService } from './services/TreeFormatter.service.js'
export { WorkspaceUtilsService } from './services/WorkspaceUtils.service.js'
