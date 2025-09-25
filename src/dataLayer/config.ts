import { DefaultAppConfig, type AppConfig } from '../types';
import { ConfigSchema } from './schemas';
import { readDB, writeDB } from './db';

/** Convenience helpers for the config slice */
export function getConfig(): AppConfig {
	const curr = readDB()
	return curr.config ?? DefaultAppConfig
}

export function setConfig(next: AppConfig): AppConfig {
	const parsed = ConfigSchema.safeParse(next);
	if (!parsed.success) {
		throw new Error(parsed.error.issues.map(i => i.message).join(', '));
	}
	return writeDB(prev => ({ ...prev, config: parsed.data })).config;
}
