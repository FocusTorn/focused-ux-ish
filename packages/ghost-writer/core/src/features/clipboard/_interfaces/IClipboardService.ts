export interface StoredFragment {
	text: string
	sourceFilePath: string
}

export interface IClipboardService {
	store(fragment: StoredFragment): Promise<void>
	retrieve(): Promise<StoredFragment | undefined>
	clear(): Promise<void>
}