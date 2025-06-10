export interface IIconThemeGeneratorService {
	generateIconThemeManifest: (
		baseManifestPath: string,
		generatedThemeDir: string, // New parameter
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	) => Promise<Record<string, any> | undefined>

	writeIconThemeFile: (manifest: Record<string, any>, outputPath: string) => Promise<void>
}
