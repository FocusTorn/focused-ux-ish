export interface IStorageService {
	update(key: string, value: any): Promise<void>
	get<T>(key: string): Promise<T | undefined>
}