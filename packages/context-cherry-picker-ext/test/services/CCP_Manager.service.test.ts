// ESLint & Imports -->>

//= TSYRINGE ==================================================================================================
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';

//= VITEST ====================================================================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, mockReset, mockDeep } from 'vitest-mock-extended'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IContextCherryPickerManager } from '../../src/_interfaces/IContextCherryPickerManager';
import { ContextCherryPickerManager } from '../../src/services/CCP_Manager.service';
import { ContextCherryPickerModule } from '../../src/ContextCherryPicker.module';
import type { IFileExplorerDataProvider } from '../../src/_interfaces/IFileExplorerDataProvider';
import type { ISavedStatesDataProvider } from '../../src/_interfaces/ISavedStatesDataProvider';
import type { IQuickSettingsDataProvider } from '../../src/_interfaces/IQuickSettingsDataProvider';
import type { IStorageService } from '../../src/_interfaces/IStorageService';
import type { IContextDataCollectorService } from '../../src/_interfaces/IContextDataCollectorService';
import type { IProjectTreeFormatterService } from '../../src/_interfaces/IProjectTreeFormatterService';
import type { IFileContentProviderService } from '../../src/_interfaces/IFileContentProviderService';
import type { SavedStateItem } from '../../src/models/SavedStateItem';

//= IMPLEMENTATIONS ===========================================================================================
import { commonCCPTestSetup } from '../_setup'
import type { CCPTestSetupContext } from '../_setup'
import type { ICommands, IWindow, IWorkspace } from '@focused-ux/shared-services'
import { constants } from '../../src/_config/constants'
import { Uri, TreeItemCheckboxState } from 'vscode';

//--------------------------------------------------------------------------------------------------------------<<

describe('ContextCherryPickerManager (Satellite)', () => { //>
	// SETUP -->>
	/* eslint-disable unused-imports/no-unused-vars */
	let testContext: CCPTestSetupContext;
	/* eslint-enable unused-imports/no-unused-vars */
	let manager: IContextCherryPickerManager;

	// Mocks for direct dependencies of ContextCherryPickerManager
	const mockFileExplorerDataProvider = mock<IFileExplorerDataProvider>();
	const mockSavedStatesDataProvider = mock<ISavedStatesDataProvider>();
	const mockQuickSettingsDataProvider = mock<IQuickSettingsDataProvider>();
	const mockStorageService = mock<IStorageService>();
	const mockContextDataCollector = mock<IContextDataCollectorService>();
	const mockProjectTreeFormatter = mock<IProjectTreeFormatterService>();
	const mockFileContentProvider = mock<IFileContentProviderService>();
	
	// Mocks for dependencies injected via @focused-ux/shared-services (already mocked by mockly in _setup.ts)
	let mockVSCodeWindow: ReturnType<typeof mockDeep<IWindow>>;
	let mockVSCodeWorkspace: ReturnType<typeof mockDeep<IWorkspace>>;
	let mockVSCodeCommands: ReturnType<typeof mockDeep<ICommands>>;
	let mockPathBasename: ReturnType<typeof vi.fn>;


	testContext = commonCCPTestSetup(); // Applies beforeEach hook from _setup.ts

	beforeEach(() => { //>
		// Reset mocks for direct dependencies before each test
		mockReset(mockFileExplorerDataProvider);
		mockReset(mockSavedStatesDataProvider);
		mockReset(mockQuickSettingsDataProvider);
		mockReset(mockStorageService);
		mockReset(mockContextDataCollector);
		mockReset(mockProjectTreeFormatter);
		mockReset(mockFileContentProvider);

		// Get the mockly instances for VS Code APIs (these were registered in commonCCPTestSetup)
		mockVSCodeWindow = container.resolve<IWindow>('iWindow') as any;
		mockVSCodeWorkspace = container.resolve<IWorkspace>('iWorkspace') as any;
		mockVSCodeCommands = container.resolve<ICommands>('iCommands') as any;
		mockPathBasename = container.resolve<typeof nodePath.basename>('iPathBasename') as any;


		// Register actual CCP dependencies (they will get the mockly instances for shared services)
		ContextCherryPickerModule.registerDependencies(container);

		// Now, override specific CCP dependencies with our mocks for *this test suite*
		container.registerInstance<IFileExplorerDataProvider>('IFileExplorerDataProvider', mockFileExplorerDataProvider);
		container.registerInstance<ISavedStatesDataProvider>('ISavedStatesDataProvider', mockSavedStatesDataProvider);
		container.registerInstance<IQuickSettingsDataProvider>('IQuickSettingsDataProvider', mockQuickSettingsDataProvider);
		container.registerInstance<IStorageService>('IStorageService', mockStorageService);
		container.registerInstance<IContextDataCollectorService>('IContextDataCollectorService', mockContextDataCollector);
		container.registerInstance<IProjectTreeFormatterService>('IProjectTreeFormatterService', mockProjectTreeFormatter);
		container.registerInstance<IFileContentProviderService>('IFileContentProviderService', mockFileContentProvider);
		
		// Resolve the manager - it will get the mocks we just registered for its direct dependencies
		// and the mockly-provided shared services.
		manager = container.resolve<IContextCherryPickerManager>('IContextCherryPickerManager');
	}); //</
	//-----------------------------------------------------------------------------------<<

	it('should be defined', () => { //>
		expect(manager).toBeInstanceOf(ContextCherryPickerManager);
	}); //</

	describe('initializeViews', () => { //>
		it('should create explorer and saved states tree views and register quick settings provider', async () => { //>
			// Arrange
			const explorerViewId = 'ccp.explorer';
			const savedStatesViewId = 'ccp.savedStates';
			const quickSettingsViewId = 'ccp.quickSettings';

			// Act
			await manager.initializeViews(explorerViewId, savedStatesViewId, quickSettingsViewId);

			// Assert
			expect(mockVSCodeWindow.createTreeView).toHaveBeenCalledWith(explorerViewId, {
				treeDataProvider: mockFileExplorerDataProvider, // It got the actual provider instance
				showCollapseAll: true,
				canSelectMany: true,
			});
			expect(mockVSCodeWindow.createTreeView).toHaveBeenCalledWith(savedStatesViewId, {
				treeDataProvider: mockSavedStatesDataProvider, // Actual provider instance
			});
			expect(mockVSCodeWindow.registerWebviewViewProvider).toHaveBeenCalledWith(
				quickSettingsViewId,
				mockQuickSettingsDataProvider, // Actual provider instance
			);
			expect(mockFileExplorerDataProvider.refresh).toHaveBeenCalled();
			expect(mockSavedStatesDataProvider.refresh).toHaveBeenCalled();
			expect(mockQuickSettingsDataProvider.refresh).toHaveBeenCalled();
		}); //</
	}); //</

	describe('getCheckedExplorerItems', () => { //>
		it('should call IFileExplorerDataProvider.getAllCheckedItems', () => { //>
			// Arrange
			const mockUris = [Uri.file('/test/file1.ts')];
			mockFileExplorerDataProvider.getAllCheckedItems.mockReturnValue(mockUris);

			// Act
			const result = manager.getCheckedExplorerItems();

			// Assert
			expect(mockFileExplorerDataProvider.getAllCheckedItems).toHaveBeenCalled();
			expect(result).toEqual(mockUris);
		}); //</
	}); //</

	describe('saveCurrentCheckedState', () => { //>
		it('should show info message if no items are checked', async () => { //>
			// Arrange
			mockFileExplorerDataProvider.getAllCheckedItems.mockReturnValue([]);

			// Act
			await manager.saveCurrentCheckedState();

			// Assert
			expect(mockVSCodeWindow.showInformationMessage).toHaveBeenCalledWith('No items are checked to save.');
			expect(mockVSCodeWindow.showInputBox).not.toHaveBeenCalled();
			expect(mockStorageService.saveState).not.toHaveBeenCalled();
		}); //</

		it('should save state if items are checked and name is provided', async () => { //>
			// Arrange
			const uri1 = Uri.file('/test/file1.ts');
			const mockCheckedUris = [uri1];
			mockFileExplorerDataProvider.getAllCheckedItems.mockReturnValue(mockCheckedUris);
			mockFileExplorerDataProvider.getCheckboxState.calledWith(uri1).mockReturnValue(TreeItemCheckboxState.Checked);
			mockVSCodeWindow.showInputBox.mockResolvedValue('My Test State');

			// Act
			await manager.saveCurrentCheckedState();

			// Assert
			expect(mockVSCodeWindow.showInputBox).toHaveBeenCalledWith({ prompt: 'Enter a name for this saved state' });
			expect(mockStorageService.saveState).toHaveBeenCalledWith('My Test State', [
				{ uriString: uri1.toString(), checkboxState: TreeItemCheckboxState.Checked }
			]);
			expect(mockSavedStatesDataProvider.refresh).toHaveBeenCalled();
			expect(mockVSCodeWindow.showInformationMessage).toHaveBeenCalledWith("State 'My Test State' saved.");
		}); //</

		it('should not save state if no name is provided', async () => { //>
			// Arrange
			mockFileExplorerDataProvider.getAllCheckedItems.mockReturnValue([Uri.file('/test.ts')]);
			mockVSCodeWindow.showInputBox.mockResolvedValue(undefined); // User cancels input

			// Act
			await manager.saveCurrentCheckedState();

			// Assert
			expect(mockStorageService.saveState).not.toHaveBeenCalled();
			expect(mockSavedStatesDataProvider.refresh).not.toHaveBeenCalled();
		}); //</
	}); //</
	
	// Add more tests for:
	// - copyCheckedFilePaths
	// - refreshExplorerView
	// - deleteSavedState (with confirmation)
	// - loadSavedStateIntoExplorer
	// - clearAllCheckedInExplorer
	// - copyContextOfCheckedItems (this will be a more complex integration test)
	// - getQuickSettingState

	describe('copyContextOfCheckedItems', () => { //>
		it('should show message if no workspace folder is open', async () => { //>
			// Arrange
			(mockVSCodeWorkspace.workspaceFolders as any) = undefined; // Simulate no workspace

			// Act
			await manager.copyContextOfCheckedItems();

			// Assert
			expect(mockVSCodeWindow.showInformationMessage).toHaveBeenCalledWith('No workspace folder open.');
		}); //</

		// More detailed tests for copyContextOfCheckedItems would involve:
		// - Mocking getQuickSettingState
		// - Mocking the various getGlobs methods on mockFileExplorerDataProvider
		// - Mocking _contextDataCollector.collectContextData
		// - Mocking _projectTreeFormatter.formatProjectTree
		// - Mocking _fileContentProvider.getFileContents
		// - Mocking vscode.env.clipboard.writeText
		// - Asserting the correct messages are shown based on different outcomes
	}); //</
});