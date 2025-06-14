// packages/dynamicons/ext/src/extension.ts
// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Uri } from 'vscode'
import * as vscode from 'vscode' // Keep for vscode.ConfigurationTarget

//= NODE JS ===================================================================================================
import type * as nodePath from 'node:path' // For type of iPathDirname

//= IMPLEMENTATIONS ===========================================================================================
import { registerDynamiconsDependencies } from './injection.js'

import { dynamiconsConstants } from '@focused-ux/dynamicons-core'

import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import type {
	IPathUtilsService,
	IFileUtilsService,
	IWorkspace,
} from '@focused-ux/shared-services'

//--------------------------------------------------------------------------------------------------------------<<

let iconActionsService: IIconActionsService
let iconThemeGeneratorService: IIconThemeGeneratorService
let fileUtilsService: IFileUtilsService
let workspaceService: IWorkspace
let iPathDirname: typeof nodePath.dirname // Variable to hold the resolved dirname function

const EXT_NAME = dynamiconsConstants.packageNameExt
const CONFIG_PREFIX = dynamiconsConstants.configPrefix
const COMMANDS = dynamiconsConstants.commands
const ICON_THEME_ID = dynamiconsConstants.iconThemeId
const CONFIG_KEYS = dynamiconsConstants.configKeys
const ASSETS_PATHS = dynamiconsConstants.assets
const DEFAULT_FILENAMES = dynamiconsConstants.defaults

async function getGeneratedThemePath( //>
	context: ExtensionContext,
): Promise<string> {
	const pathUtils = container.resolve<IPathUtilsService>('IPathUtilsService')
	const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)
	const generatedThemeFileName = config.get<string>(
		CONFIG_KEYS.generatedThemeFileName,
		DEFAULT_FILENAMES.generatedThemeFilenameDefault,
	)

	return pathUtils.iPathJoin(context.extensionPath, ASSETS_PATHS.themesPath, generatedThemeFileName)
} //<

async function getBaseThemePath(context: ExtensionContext): Promise<string> { //>
	const pathUtils = container.resolve<IPathUtilsService>('IPathUtilsService')
	const config = vscode.workspace.getConfiguration(CONFIG_PREFIX)
	const baseThemeFileName = config.get<string>(
		CONFIG_KEYS.baseThemeFileName,
		DEFAULT_FILENAMES.baseThemeFilenameDefault,
	)

	return pathUtils.iPathJoin(context.extensionPath, ASSETS_PATHS.themesPath, baseThemeFileName)
} //<

async function ensureThemeAssets(context: ExtensionContext): Promise<void> { //>
	// pathUtilsService = pathUtilsService || container.resolve<IPathUtilsService>('IPathUtilsService') // pathUtilsService is not used here
	fileUtilsService = fileUtilsService || container.resolve<IFileUtilsService>('IFileUtilsService')

	const localPathUtils = container.resolve<IPathUtilsService>('IPathUtilsService') // Use a local var if only for iPathJoin

	const themesDir = localPathUtils.iPathJoin(context.extensionPath, ASSETS_PATHS.themesPath)
	const baseThemePath = await getBaseThemePath(context)
	const generatedThemePath = await getGeneratedThemePath(context)

	try {
		await fileUtilsService.iFspAccess(themesDir)
	} catch {
		await fileUtilsService.iFspMkdir(themesDir, { recursive: true })
	}

	const defaultBaseManifest = {
		iconDefinitions: {
			_file: { iconPath: './icons/file.svg' }, // Example, actual default might differ
		},
		file: '_file',
	}

	try {
		await fileUtilsService.iFspAccess(baseThemePath)
	} catch {
		await fileUtilsService.iFspWriteFile(baseThemePath, JSON.stringify(defaultBaseManifest, null, 2))
		vscode.window.showInformationMessage(
			`${dynamiconsConstants.featureName}: Created default base theme at ${baseThemePath}. Consider generating a full one.`,
		)
	}

	try {
		await fileUtilsService.iFspAccess(generatedThemePath)
	} catch {
		// If generated theme doesn't exist, regenerate it.
		// regenerateAndApplyTheme will be called during activation anyway if needed.
		// For robustness, we can call it here too.
		await regenerateAndApplyTheme(context)
	}
} //<

async function regenerateAndApplyTheme(context: ExtensionContext): Promise<void> { //>
	iconThemeGeneratorService = iconThemeGeneratorService
	  || container.resolve<IIconThemeGeneratorService>('IIconThemeGeneratorService')
	workspaceService = workspaceService || container.resolve<IWorkspace>('IWorkspace')
	// const commandsService = container.resolve<ICommands>('iCommands'); // No longer needed here
	iPathDirname = iPathDirname || container.resolve<typeof nodePath.dirname>('iPathDirname')

	const config = workspaceService.getConfiguration(CONFIG_PREFIX)
	const userIconsDir = config.get<string>(CONFIG_KEYS.userIconsDirectory)
	const customMappings = config.get<Record<string, string>>(CONFIG_KEYS.customIconMappings)
	const hideArrows = config.get<boolean | null>(CONFIG_KEYS.hideExplorerArrows)

	const baseThemePath = await getBaseThemePath(context)
	const generatedThemePath = await getGeneratedThemePath(context)
	const generatedThemeDir = iPathDirname(generatedThemePath)

	try {
		const newManifest = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemePath,
			generatedThemeDir,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (newManifest) {
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemePath)

			const workbenchConfiguration = workspaceService.getConfiguration('workbench')
			const currentTheme = workbenchConfiguration.get<string>('iconTheme')

			if (currentTheme === ICON_THEME_ID) {
				// Option 1: Do nothing further and rely on VS Code's file watcher.
				// This is how the original project effectively refreshed for customIconMapping changes.
				console.log(`[${EXT_NAME}] ${ICON_THEME_ID} is active. VS Code should refresh the theme automatically.`)

				// Option 2 (If Option 1 is not enough): A more targeted command if available,
				// or a slightly less disruptive refresh hint if one exists.
				// For now, let's test Option 1.

				/*
                // OLD TOGGLE LOGIC - Temporarily disabled for testing
                try {
                    console.log(`[${EXT_NAME}] Attempting to re-apply theme via configuration update.`);
                    await workbenchConfiguration.update('iconTheme', null, vscode.ConfigurationTarget.Global);
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
                    await workbenchConfiguration.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global);
                    console.log(`[${EXT_NAME}] UI refresh attempted via configuration update.`);
                } catch (updateError) {
                    console.error(`[${EXT_NAME}] Error updating workbench.iconTheme configuration:`, updateError);
                    vscode.window.showWarningMessage(
                        `${dynamiconsConstants.featureName}: Could not automatically refresh theme. A window reload might be needed.`,
                    );
                }
                */
			} else {
				console.log(`[${EXT_NAME}] Theme file updated, but ${ICON_THEME_ID} is not the active theme. No UI refresh attempted.`)
			}
		} else {
			vscode.window.showErrorMessage(
				`${dynamiconsConstants.featureName}: Failed to generate icon theme manifest.`,
			)
		}
	} catch (error: any) {
		vscode.window.showErrorMessage(
			`${dynamiconsConstants.featureName}: Error regenerating theme: ${error.message}`,
		)
	}
} //<

async function activateIconThemeIfNeeded(context: ExtensionContext): Promise<void> { //>
	workspaceService = workspaceService || container.resolve<IWorkspace>('IWorkspace')
	fileUtilsService = fileUtilsService || container.resolve<IFileUtilsService>('IFileUtilsService') // Ensure fileUtilsService is initialized

	const workbenchConfig = workspaceService.getConfiguration('workbench')
	const currentTheme = workbenchConfig.get<string>('iconTheme')

	if (currentTheme !== ICON_THEME_ID) {
		const generatedThemePath = await getGeneratedThemePath(context)

		try {
			await fileUtilsService.iFspAccess(generatedThemePath) // Check if our theme file exists

			const choice = await vscode.window.showInformationMessage(
				`The "${EXT_NAME}" extension provides an icon theme. Do you want to activate it?`,
				'Activate',
				'Later',
			)

			if (choice === 'Activate') {
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)
			}
		} catch {
			// Theme file doesn't exist or other access error, do nothing.
			// It will be generated on first full activation or config change.
		}
	}
} //<

export async function activate(context: ExtensionContext): Promise<void> { //>
	console.log(`[${EXT_NAME}] Activating...`)

	registerDynamiconsDependencies(context) // This registers 'iPathDirname'

	iconActionsService = container.resolve<IIconActionsService>('IIconActionsService')
	// Other services like iPathDirname will be resolved on demand within functions

	await ensureThemeAssets(context)
	await regenerateAndApplyTheme(context) // Ensures theme is generated and applied on activation
	await activateIconThemeIfNeeded(context)

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.activateIconTheme, async () => {
			workspaceService = workspaceService || container.resolve<IWorkspace>('IWorkspace')

			const workbenchConfig = workspaceService.getConfiguration('workbench')

			await workbenchConfig.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)
			vscode.window.showInformationMessage(`"${ICON_THEME_ID}" icon theme activated.`)
		}),

		vscode.commands.registerCommand(COMMANDS.assignIcon, (uri?: Uri) =>
			iconActionsService.assignIconToResource(uri)),

		vscode.commands.registerCommand(COMMANDS.revertIcon, (uri?: Uri) =>
			iconActionsService.revertIconAssignment(uri)),

		vscode.commands.registerCommand(COMMANDS.toggleExplorerArrows, () =>
			iconActionsService.toggleExplorerArrows()),

		vscode.commands.registerCommand(COMMANDS.showUserFileIconAssignments, () =>
			iconActionsService.showUserIconAssignments('file')),

		vscode.commands.registerCommand(COMMANDS.showUserFolderIconAssignments, () =>
			iconActionsService.showUserIconAssignments('folder')),

		vscode.commands.registerCommand(COMMANDS.refreshIconTheme, async () => {
			await regenerateAndApplyTheme(context)
			vscode.window.showInformationMessage(
				`${dynamiconsConstants.featureName}: Icon theme regenerated and re-applied.`,
			)
		}),

		vscode.workspace.onDidChangeConfiguration(async (e) => {
			if (
				e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.customIconMappings}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.userIconsDirectory}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.hideExplorerArrows}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.baseThemeFileName}`)
				|| e.affectsConfiguration(`${CONFIG_PREFIX}.${CONFIG_KEYS.generatedThemeFileName}`)
			) {
				console.log(`[${EXT_NAME}] Configuration changed, regenerating theme...`)
				await regenerateAndApplyTheme(context)
			}
		}),
	)
} //<

export function deactivate(): void { //>
	console.log(`[${EXT_NAME}] Deactivated.`)
} //<