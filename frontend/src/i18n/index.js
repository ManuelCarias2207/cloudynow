import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.js';
import es from './es.js';

export const LANGUAGES = ['en', 'es'];
const STORAGE_KEY = 'lang';

const saved = localStorage.getItem(STORAGE_KEY);
const browser = navigator.language?.slice(0, 2);

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: LANGUAGES.includes(saved) ? saved : LANGUAGES.includes(browser) ? browser : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = i18n.language;
i18n.on('languageChanged', (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
});

export default i18n;
