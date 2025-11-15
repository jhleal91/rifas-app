import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${i18n.language === 'es' ? 'active' : ''}`}
        onClick={() => changeLanguage('es')}
        title="Español"
      >
        🇪🇸 ES
      </button>
      <button
        className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
        onClick={() => changeLanguage('en')}
        title="English"
      >
        🇺🇸 EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;

