import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationES from '../locales/es/translation.json';
import translationEN from '../locales/en/translation.json';

const resources = {
  es: {
    translation: translationES
  },
  en: {
    translation: translationEN
  }
};

i18n
  .use(LanguageDetector) // Detecta el idioma del navegador
  .use(initReactI18next) // Pasa i18n a react-i18next
  .init({
    resources,
    fallbackLng: 'es', // Idioma por defecto
    lng: localStorage.getItem('i18nextLng') || 'es', // Idioma inicial
    
    interpolation: {
      escapeValue: false // React ya escapa valores
    },
    
    detection: {
      // Orden de detección de idioma
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'], // Guarda el idioma seleccionado
    }
  });

export default i18n;

