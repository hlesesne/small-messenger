import { AppSettings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'pwa_imessage_settings';

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    
    const settings = JSON.parse(stored);
    
    // Merge with defaults to handle new settings being added
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      ai: {
        ...DEFAULT_SETTINGS.ai,
        ...settings.ai
      }
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const resetSettings = (): AppSettings => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Legacy support - migrate old API key storage
export const migrateOldSettings = (): AppSettings => {
  try {
    const oldApiKey = localStorage.getItem('openai_api_key');
    const settings = loadSettings();
    
    if (oldApiKey && !settings.ai.apiKey) {
      settings.ai.apiKey = oldApiKey;
      saveSettings(settings);
      localStorage.removeItem('openai_api_key'); // Clean up old key
    }
    
    return settings;
  } catch (error) {
    console.error('Error migrating settings:', error);
    return loadSettings();
  }
};

export const validateEndpoint = (endpoint: string): boolean => {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isLocalEndpoint = (endpoint: string): boolean => {
  try {
    const url = new URL(endpoint);
    return url.hostname === 'localhost' || 
           url.hostname === '127.0.0.1' || 
           url.hostname.startsWith('192.168.') ||
           url.hostname.startsWith('10.') ||
           url.hostname.startsWith('172.');
  } catch {
    return false;
  }
};