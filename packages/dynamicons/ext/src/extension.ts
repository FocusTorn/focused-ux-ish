// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'
import { container } from 'tsyringe'

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { ExtensionContext, Uri } from 'vscode'
import * as vscode from 'vscode'

//= IMPLEMENTATIONS ===========================================================================================
import { registerDynamiconsDependencies } from './injection.js'
      
import { dynamiconsConstants } from '@focused-ux/dynamicons-core'

import type { IIconActionsService, IIconThemeGeneratorService } from '@focused-ux/dynamicons-core'
import type {
	IPathUtilsService,
	IFileUtilsService,
	IWorkspace,
} from '@focused-ux/utilities-core'

//--------------------------------------------------------------------------------------------------------------<<

let iconActionsService: IIconActionsService
let iconThemeGeneratorService: IIconThemeGeneratorService
let pathUtilsService: IPathUtilsService
let fileUtilsService: IFileUtilsService
let workspaceService: IWorkspace

// Use the shared constants directly

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
	console.log(`[${EXT_NAME}] Deactivated.`)

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

	console.log(`[${EXT_NAME}] Deactivated.`)
    
	return pathUtils.iPathJoin(context.extensionPath, ASSETS_PATHS.themesPath, baseThemeFileName)
} //<

async function ensureThemeAssets(context: ExtensionContext): Promise<void> { //>
	console.log(`[${EXT_NAME}] Deactivated.`)

	pathUtilsService = pathUtilsService || container.resolve<IPathUtilsService>('IPathUtilsService')
	fileUtilsService = fileUtilsService || container.resolve<IFileUtilsService>('IFileUtilsService')

	const themesDir = pathUtilsService.iPathJoin(context.extensionPath, ASSETS_PATHS.themesPath)
	const baseThemePath = await getBaseThemePath(context)
	const generatedThemePath = await getGeneratedThemePath(context)

	try {
		await fileUtilsService.iFspAccess(themesDir)
	} catch {
		await fileUtilsService.iFspMkdir(themesDir, { recursive: true })
	}

	const defaultBaseManifest = {
		iconDefinitions: {
			_file: { iconPath: './icons/file.svg' },
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
		await regenerateAndApplyTheme(context)
	}
} //<

async function regenerateAndApplyTheme(context: ExtensionContext): Promise<void> { //>
	console.log(`[${EXT_NAME}] Deactivated.`)

	iconThemeGeneratorService = iconThemeGeneratorService
	  || container.resolve<IIconThemeGeneratorService>('IIconThemeGeneratorService')

	workspaceService = workspaceService || container.resolve<IWorkspace>('iWorkspace')

	const config = workspaceService.getConfiguration(CONFIG_PREFIX)
	const userIconsDir = config.get<string>(CONFIG_KEYS.userIconsDirectory)
	const customMappings = config.get<Record<string, string>>(CONFIG_KEYS.customIconMappings)
	const hideArrows = config.get<boolean | null>(CONFIG_KEYS.hideExplorerArrows)

	const baseThemePath = await getBaseThemePath(context)
	const generatedThemePath = await getGeneratedThemePath(context)

	try {
		const newManifest = await iconThemeGeneratorService.generateIconThemeManifest(
			baseThemePath,
			userIconsDir || undefined,
			customMappings,
			hideArrows,
		)

		if (newManifest) {
			await iconThemeGeneratorService.writeIconThemeFile(newManifest, generatedThemePath)

			const workbenchConfiguration = workspaceService.getConfiguration('workbench')
			const currentTheme = workbenchConfiguration.get<string>('iconTheme')

			if (currentTheme === ICON_THEME_ID) {
				// To force a refresh, set the theme to null (or another theme) and then back.
				await workbenchConfiguration.update('iconTheme', null, vscode.ConfigurationTarget.Global)
				// A small delay can sometimes be helpful but often isn't strictly necessary.
				// await new Promise(resolve => setTimeout(resolve, 50));
				await workbenchConfiguration.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)
				console.log(`[${EXT_NAME}] Theme re-applied after regeneration.`)
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
	console.log(`[${EXT_NAME}] Deactivated.`)

	workspaceService = workspaceService || container.resolve<IWorkspace>('iWorkspace')

	const workbenchConfig = workspaceService.getConfiguration('workbench')
	const currentTheme = workbenchConfig.get<string>('iconTheme')

	if (currentTheme !== ICON_THEME_ID) {
		const generatedThemePath = await getGeneratedThemePath(context)

		try {
			fileUtilsService = fileUtilsService || container.resolve<IFileUtilsService>('IFileUtilsService')
			await fileUtilsService.iFspAccess(generatedThemePath)

			const choice = await vscode.window.showInformationMessage(
				`The "${EXT_NAME}" extension provides an icon theme. Do you want to activate it?`,
				'Activate',
				'Later',
			)

			if (choice === 'Activate') {
				await workbenchConfig.update('iconTheme', ICON_THEME_ID, vscode.ConfigurationTarget.Global)
			}
		} catch {
			// Theme file doesn't exist
		}
	}
} //<

export async function activate(context: ExtensionContext): Promise<void> { //>
	console.log('ya')
	console.log(`[${EXT_NAME}] Activating...`)
	console.log(`[${EXT_NAME}] Deactivated.`)

	registerDynamiconsDependencies(context)

	iconActionsService = container.resolve<IIconActionsService>('IIconActionsService')

	await ensureThemeAssets(context)
	await regenerateAndApplyTheme(context) // Ensures theme is generated and applied on activation
	await activateIconThemeIfNeeded(context)

	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.activateIconTheme, async () => {
			workspaceService = workspaceService || container.resolve<IWorkspace>('iWorkspace')

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
			// Message reflects that regeneration and application were handled by the function above.
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
	console.log(`[${EXT_NAME}] Activated.`)
	console.log(`[${EXT_NAME}] Activated.`)
} //<

export function deactivate(): void { //>
	console.log(`[${EXT_NAME}] Deactivated.`)
	console.log('ya')
} //<
