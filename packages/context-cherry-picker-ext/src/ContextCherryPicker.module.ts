// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import type { container as globalContainerType } from 'tsyringe';
import { container as globalContainer } from 'tsyringe'; // Or pass as arg if preferred

//= IMPLEMENTATION TYPES ======================================================================================
// Interfaces
import type { IContextCherryPickerManager } from './_interfaces/IContextCherryPickerManager.ts';
import type { IFileExplorerDataProvider } from './_interfaces/IFileExplorerDataProvider.ts';
import type { ISavedStatesDataProvider } from './_interfaces/ISavedStatesDataProvider.ts';
import type { IQuickSettingsDataProvider } from './_interfaces/IQuickSettingsDataProvider.ts';
import type { IStorageService } from './_interfaces/IStorageService.ts';
import type { IGoogleGenAiService } from './_interfaces/IGoogleGenAiService.ts';
import type { IContextDataCollectorService } from './_interfaces/IContextDataCollectorService.ts';
import type { IProjectTreeFormatterService } from './_interfaces/IProjectTreeFormatterService.ts';
import type { IFileContentProviderService } from './_interfaces/IFileContentProviderService.ts';

// Services
import { ContextCherryPickerManager } from './services/CCP_Manager.service.js';
import { StorageService } from './services/CCP_Storage.service.js';
import { GoogleGenAiService } from './services/GoogleGenAi.service.js';
import { ContextDataCollectorService } from './services/ContextDataCollector.service.js';
import { ProjectTreeFormatterService } from './services/ProjectTreeFormatter.service.js';
import { FileContentProviderService } from './services/FileContentProvider.service.js';

// Providers
import { FileExplorerDataProvider } from './providers/FileExplorerDataProvider.js';
import { SavedStatesDataProvider } from './providers/SavedStatesDataProvider.js';
import { QuickSettingsDataProvider } from './providers/QuickSettingsDataProvider.js';

//--------------------------------------------------------------------------------------------------------------<<

export class ContextCherryPickerModule { //>

	public static registerDependencies( //>
		container: typeof globalContainerType = globalContainer,
	): void {
		// Services
		container.registerSingleton<IStorageService>('IStorageService', StorageService);
		container.registerSingleton<IGoogleGenAiService>('IGoogleGenAiService', GoogleGenAiService);
		container.registerSingleton<IContextDataCollectorService>('IContextDataCollectorService', ContextDataCollectorService);
		container.registerSingleton<IProjectTreeFormatterService>('IProjectTreeFormatterService', ProjectTreeFormatterService);
		container.registerSingleton<IFileContentProviderService>('IFileContentProviderService', FileContentProviderService);
		container.registerSingleton<IContextCherryPickerManager>('IContextCherryPickerManager', ContextCherryPickerManager);

		// Providers
		container.registerSingleton<IFileExplorerDataProvider>('IFileExplorerDataProvider', FileExplorerDataProvider);
		container.registerSingleton<ISavedStatesDataProvider>('ISavedStatesDataProvider', SavedStatesDataProvider);
		container.registerSingleton<IQuickSettingsDataProvider>('IQuickSettingsDataProvider', QuickSettingsDataProvider);
	} //<

	// The command and view registration logic will be handled directly in the satellite's extension.ts
	// using the resolved IContextCherryPickerManager.
	// This module class in the satellite is primarily for DI setup.

}