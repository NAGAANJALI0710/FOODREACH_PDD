import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en/translation.json';
import te from './te/translation.json';
import hi from './hi/translation.json';

export interface LanguageOption {
  code: string;
  label: string;
  flag: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧', nativeName: 'English' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
];

const LANGUAGE_KEY = 'fs_language';

export const getStoredLanguage = async (): Promise<string | null> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const webStored = window.localStorage.getItem(LANGUAGE_KEY);
      if (webStored) return webStored;
    }
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch (e) {
    return null;
  }
};

export const setStoredLanguage = async (lng: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LANGUAGE_KEY, lng);
    }
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (e) {}
};

const detectDeviceLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const code = (locales[0].languageCode || '').toLowerCase();
      if (['en', 'te', 'hi'].includes(code)) {
        return code;
      }
    }
  } catch (e) {}
  return 'en';
};

// Synchronous initialization with a fallback language so hooks do not suspend
i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    te: { translation: te },
    hi: { translation: hi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

const initI18n = async () => {
  try {
    const savedLng = await getStoredLanguage();
    const initialLng = savedLng || detectDeviceLanguage();
    if (initialLng && initialLng !== 'en') {
      await i18n.changeLanguage(initialLng);
    }
  } catch (e) {
    console.error('[i18n] Async initialization error:', e);
  }
};

initI18n();

export const changeLanguage = async (lng: string) => {
  await i18n.changeLanguage(lng);
  await setStoredLanguage(lng);
};

export default i18n;
