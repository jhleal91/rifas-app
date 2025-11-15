# 🌍 Guía de Internacionalización (i18n) - SorteoHub

## 📋 Resumen

SorteoHub ahora soporta múltiples idiomas usando `react-i18next`. Actualmente soporta:
- 🇪🇸 **Español** (idioma por defecto)
- 🇺🇸 **Inglés**

## 🚀 Uso Básico

### En Componentes React

```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('landing.title')}</h1>
      <p>{t('landing.description')}</p>
    </div>
  );
};
```

### Cambiar Idioma

El componente `LanguageSwitcher` está disponible en el header. También puedes cambiar el idioma programáticamente:

```javascript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();

// Cambiar a inglés
i18n.changeLanguage('en');

// Cambiar a español
i18n.changeLanguage('es');
```

## 📁 Estructura de Archivos

```
src/
├── i18n/
│   └── config.js              # Configuración de i18next
├── locales/
│   ├── es/
│   │   └── translation.json   # Traducciones en español
│   └── en/
│       └── translation.json   # Traducciones en inglés
└── components/
    └── LanguageSwitcher.js    # Componente selector de idioma
```

## 📝 Agregar Nuevas Traducciones

### 1. Editar archivos de traducción

**Español** (`src/locales/es/translation.json`):
```json
{
  "miSeccion": {
    "titulo": "Mi Título",
    "descripcion": "Mi descripción"
  }
}
```

**Inglés** (`src/locales/en/translation.json`):
```json
{
  "miSeccion": {
    "titulo": "My Title",
    "descripcion": "My description"
  }
}
```

### 2. Usar en componentes

```javascript
const { t } = useTranslation();
return <h1>{t('miSeccion.titulo')}</h1>;
```

## 🔧 Configuración

El idioma se detecta automáticamente en este orden:
1. **localStorage** - Idioma guardado por el usuario
2. **Navegador** - Idioma del navegador del usuario
3. **HTML tag** - Atributo `lang` del HTML
4. **Fallback** - Español (por defecto)

## 📚 Secciones de Traducción Actuales

- `common` - Textos comunes (loading, error, success, etc.)
- `nav` - Navegación (home, dashboard, etc.)
- `landing` - Página de inicio
- `auth` - Autenticación (login, register)
- `raffle` - Rifas (create, edit, delete)
- `plans` - Planes de creadores
- `advertiser` - Portal de anunciantes

## 🎯 Mejores Prácticas

1. **Usar claves descriptivas**: `landing.createAccount` en lugar de `text1`
2. **Agrupar por sección**: Organizar traducciones por funcionalidad
3. **Mantener consistencia**: Usar las mismas claves para conceptos similares
4. **Traducir todo**: Incluir todos los textos visibles al usuario
5. **Contexto**: Agregar comentarios en JSON si es necesario

## 🔄 Agregar un Nuevo Idioma

1. Crear carpeta: `src/locales/[codigo]/`
2. Crear archivo: `translation.json`
3. Copiar estructura de `es/translation.json`
4. Traducir todos los valores
5. Actualizar `src/i18n/config.js`:

```javascript
import translationFR from '../locales/fr/translation.json';

const resources = {
  es: { translation: translationES },
  en: { translation: translationEN },
  fr: { translation: translationFR } // Nuevo idioma
};
```

6. Agregar botón en `LanguageSwitcher.js`

## 🐛 Troubleshooting

### Las traducciones no se muestran
- Verifica que `src/i18n/config.js` esté importado en `src/index.js`
- Revisa que las claves existan en ambos archivos JSON
- Verifica la consola del navegador por errores

### El idioma no se guarda
- Verifica que `localStorage` esté habilitado
- Revisa la configuración de `detection.caches` en `config.js`

### Traducciones faltantes
- Agrega las claves faltantes en ambos archivos JSON
- Usa `t('clave', 'Texto por defecto')` como fallback temporal

## 📖 Recursos

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)

