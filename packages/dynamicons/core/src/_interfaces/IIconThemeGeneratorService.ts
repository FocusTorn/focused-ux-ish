export interface IIconThemeGeneratorService {
	generateIconThemeManifest: (
		baseManifestPath: string,
		userIconsDirectory?: string,
		customMappings?: Record<string, string>,
		hideExplorerArrows?: boolean | null,
	) => Promise<Record<string, any> | undefined>

	writeIconThemeFile: (manifest: Record<string, any>, outputPath: string) => Promise<void>
}
