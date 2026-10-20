import { useState, useEffect } from 'react';
import { AppSettings } from '../types';

const SETTINGS_KEY = 'cognilearn_app_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  speechRate: 1.0,
  autoFlipTTS: false,
  autoAdvanceOnRate: true,
  showMnemonicsByDefault: false,
  soundEffects: true,
  hapticFeedback: true,
  quizTimerSeconds: 0,
  dailyGoalCards: 20,
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetToDefaults,
  };
}
