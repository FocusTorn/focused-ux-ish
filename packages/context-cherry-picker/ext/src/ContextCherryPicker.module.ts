// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import type { container as globalContainerType } from 'tsyringe'
import { container as globalContainer } from 'tsyringe' // Or pass as arg if preferred

//= IMPLEMENTATION TYPES ======================================================================================
import {
	// Interfaces
	type IContextCherryPickerManager,
	type IFileExplorerDataProvider,
	type ISavedStatesDataProvider,
	type IQuickSettingsDataProvider,
	type IStorageService,
	type IGoogleGenAiService,
	type IContextDataCollectorService,
	type IFileContentProviderService,
	type IContextFormattingService,
	// Services
	ContextCherryPickerManager,
	StorageService,
	GoogleGenAiService,
	ContextDataCollectorService,
	FileContentProviderService,
	ContextFormattingService,
	// Providers
	FileExplorerDataProvider,
	SavedStatesDataProvider,
	QuickSettingsDataProvider,
} from '@focused-ux/context-cherry-picker-core'

//--------------------------------------------------------------------------------------------------------------<<

export class ContextCherryPickerModule { //>

	public static registerDependencies( //>
		container: typeof globalContainerType = globalContainer,
	): void {
		// Services
		container.registerSingleton<IStorageService>('IStorageService', StorageService)
		container.registerSingleton<IGoogleGenAiService>('IGoogleGenAiService', GoogleGenAiService)
		container.registerSingleton<IContextDataCollectorService>('IContextDataCollectorService', ContextDataCollectorService)
		container.registerSingleton<IFileContentProviderService>('IFileContentProviderService', FileContentProviderService)
		container.registerSingleton<IContextFormattingService>('IContextFormattingService', ContextFormattingService)
		container.registerSingleton<IContextCherryPickerManager>('IContextCherryPickerManager', ContextCherryPickerManager)

		// Providers
		container.registerSingleton<IFileExplorerDataProvider>('IFileExplorerDataProvider', FileExplorerDataProvider)
		container.registerSingleton<ISavedStatesDataProvider>('ISavedStatesDataProvider', SavedStatesDataProvider)
		container.registerSingleton<IQuickSettingsDataProvider>('IQuickSettingsDataProvider', QuickSettingsDataProvider)
	} //<

}
