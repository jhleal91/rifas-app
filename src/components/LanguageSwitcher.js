import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (event) => {
    const lng = event.target.value;
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'es', flag: '🇲🇽', name: 'Español' },
    { code: 'en', flag: '🇺🇸', name: 'English' }
  ];

  return (
    <div className="language-switcher">
      <select
        className="language-select"
        value={i18n.language || 'es'}
        onChange={changeLanguage}
        title={languages.find(l => l.code === (i18n.language || 'es'))?.name}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
