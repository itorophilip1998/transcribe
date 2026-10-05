import {
  DEFAULT_POSITION,
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  type FloatingPosition,
} from './types';

const SETTINGS_KEY = 'mma_settings';
const POSITION_KEY = 'mma_position';

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined) };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getPosition(): Promise<FloatingPosition> {
  const result = await chrome.storage.local.get(POSITION_KEY);
  return { ...DEFAULT_POSITION, ...(result[POSITION_KEY] as Partial<FloatingPosition> | undefined) };
}

export async function savePosition(position: FloatingPosition): Promise<void> {
  await chrome.storage.local.set({ [POSITION_KEY]: position });
}
