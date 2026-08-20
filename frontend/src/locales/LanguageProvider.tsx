import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { changeLanguage, getStoredLanguage } from './i18n';

interface LanguageContextType {
  language: string;
  setLanguage: (lng: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  isLoading: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLang] = useState<string>(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const stored = await getStoredLanguage();
        if (stored && ['en', 'te', 'hi'].includes(stored)) {
          await changeLanguage(stored);
          setCurrentLang(stored);
        }
      } catch (e) {
        console.error('[LanguageProvider] Error initializing language:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();

    const handleLanguageChange = (lng: string) => {
      setCurrentLang(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const handleSetLanguage = async (lng: string) => {
    await changeLanguage(lng);
    setCurrentLang(lng);
  };

  return (
    <LanguageContext.Provider value={{ language: currentLang, setLanguage: handleSetLanguage, isLoading }}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
