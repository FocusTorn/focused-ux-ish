// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata';
import { container } from 'tsyringe';

//= VITEST ====================================================================================================
import { describe, it, expect, beforeEach } from 'vitest';

//= IMPLEMENTATION TYPES ======================================================================================
// Interfaces
import type { IContextCherryPickerManager } from '../src/_interfaces/IContextCherryPickerManager';
import type { IFileExplorerDataProvider } from '../src/_interfaces/IFileExplorerDataProvider';
import type { ISavedStatesDataProvider } from '../src/_interfaces/ISavedStatesDataProvider';
import type { IQuickSettingsDataProvider } from '../src/_interfaces/IQuickSettingsDataProvider';
import type { IStorageService } from '../src/_interfaces/IStorageService';
import type { IGoogleGenAiService } from '../src/_interfaces/IGoogleGenAiService';
import type { IContextDataCollectorService } from '../src/_interfaces/IContextDataCollectorService';
import type { IProjectTreeFormatterService } from '../src/_interfaces/IProjectTreeFormatterService';
import type { IFileContentProviderService } from '../src/_interfaces/IFileContentProviderService';

// Services & Providers (concrete classes)
import { ContextCherryPickerManager } from '../src/services/CCP_Manager.service';
import { StorageService } from '../src/services/CCP_Storage.service';
import { GoogleGenAiService } from '../src/services/GoogleGenAi.service';
import { ContextDataCollectorService } from '../src/services/ContextDataCollector.service';
import { ProjectTreeFormatterService } from '../src/services/ProjectTreeFormatter.service';
import { FileContentProviderService } from '../src/services/FileContentProvider.service';
import { FileExplorerDataProvider } from '../src/providers/FileExplorerDataProvider';
import { SavedStatesDataProvider } from '../src/providers/SavedStatesDataProvider';
import { QuickSettingsDataProvider } from '../src/providers/QuickSettingsDataProvider';


//= IMPLEMENTATIONS ===========================================================================================
import { ContextCherryPickerModule } from '../src/ContextCherryPicker.module'; // The module to test
import { commonCCPTestSetup } from './_setup'; // Common test setup
import type { CCPTestSetupContext } from './_setup';

//--------------------------------------------------------------------------------------------------------------<<

describe('ContextCherryPickerModule (Satellite)', () => { //>
	// SETUP -->>
	/* eslint-disable unused-imports/no-unused-vars */
	let testContext: CCPTestSetupContext;
	/* eslint-enable unused-imports/no-unused-vars */

	testContext = commonCCPTestSetup(); // Applies beforeEach hook for container cleanup & shared DI setup

	beforeEach(() => { //>
		// Register dependencies from the module being tested
		ContextCherryPickerModule.registerDependencies(container);
	}); //<
	//-----------------------------------------------------------------------------------<<

	describe('registerDependencies', () => { //>
		it('should register IContextCherryPickerManager as ContextCherryPickerManager singleton', () => { //>
			const service1 = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager');
			const service2 = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager');
			expect(service1).toBeInstanceOf(ContextCherryPickerManager);
			expect(service1).toBe(service2);
		}); //<

		it('should register IFileExplorerDataProvider as FileExplorerDataProvider singleton', () => { //>
			const service1 = container.resolve<IFileExplorerDataProvider>('IFileExplorerDataProvider');
			const service2 = container.resolve<IFileExplorerDataProvider>('IFileExplorerDataProvider');
			expect(service1).toBeInstanceOf(FileExplorerDataProvider);
			expect(service1).toBe(service2);
		}); //<

		it('should register ISavedStatesDataProvider as SavedStatesDataProvider singleton', () => { //>
			const service1 = container.resolve<ISavedStatesDataProvider>('ISavedStatesDataProvider');
			const service2 = container.resolve<ISavedStatesDataProvider>('ISavedStatesDataProvider');
			expect(service1).toBeInstanceOf(SavedStatesDataProvider);
			expect(service1).toBe(service2);
		}); //<

		it('should register IQuickSettingsDataProvider as QuickSettingsDataProvider singleton', () => { //>
			const service1 = container.resolve<IQuickSettingsDataProvider>('IQuickSettingsDataProvider');
			const service2 = container.resolve<IQuickSettingsDataProvider>('IQuickSettingsDataProvider');
			expect(service1).toBeInstanceOf(QuickSettingsDataProvider);
			expect(service1).toBe(service2);
		}); //<

		it('should register IStorageService as StorageService singleton', () => { //>
			const service1 = container.resolve<IStorageService>('IStorageService');
			const service2 = container.resolve<IStorageService>('IStorageService');
			expect(service1).toBeInstanceOf(StorageService);
			expect(service1).toBe(service2);
		}); //<

		it('should register IGoogleGenAiService as GoogleGenAiService singleton', () => { //>
			const service1 = container.resolve<IGoogleGenAiService>('IGoogleGenAiService');
			const service2 = container.resolve<IGoogleGenAiService>('IGoogleGenAiService');
			expect(service1).toBeInstanceOf(GoogleGenAiService);
			expect(service1).toBe(service2);
		}); //<

		it('should register IContextDataCollectorService as ContextDataCollectorService singleton', () => { //>
			const service1 = container.resolve<IContextDataCollectorService>('IContextDataCollectorService');
			const service2 = container.resolve<IContextDataCollectorService>('IContextDataCollectorService');
			expect(service1).toBeInstanceOf(ContextDataCollectorService);
			expect(service1).toBe(service2);
		}); //<

		it('should register IProjectTreeFormatterService as ProjectTreeFormatterService singleton', () => { //>
			const service1 = container.resolve<IProjectTreeFormatterService>('IProjectTreeFormatterService');
			const service2 = container.resolve<IProjectTreeFormatterService>('IProjectTreeFormatterService');
			expect(service1).toBeInstanceOf(ProjectTreeFormatterService);
			expect(service1).toBe(service2);
		}); //<

		it('should register IFileContentProviderService as FileContentProviderService singleton', () => { //>
			const service1 = container.resolve<IFileContentProviderService>('IFileContentProviderService');
			const service2 = container.resolve<IFileContentProviderService>('IFileContentProviderService');
			expect(service1).toBeInstanceOf(FileContentProviderService);
			expect(service1).toBe(service2);
		}); //<
	}); //<
});