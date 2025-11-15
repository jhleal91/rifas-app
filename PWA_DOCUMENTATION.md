# SorteoHub - Progressive Web App (PWA)

## 🎯 Características PWA Implementadas

### ✅ Logo y Favicon
- **Logo SorteoHub**: Configurado como favicon principal
- **Iconos múltiples**: Disponible en diferentes tamaños (192x192, 512x512)
- **Apple Touch Icon**: Configurado para dispositivos iOS
- **Windows Tile**: Configurado para Windows

### ✅ Manifest.json
- **Nombre corto**: SorteoHub
- **Nombre completo**: SorteoHub - Plataforma profesional para crear rifas sin fines de lucro
- **Tema**: Color azul (#1e22aa) que coincide con el diseño
- **Modo de visualización**: Standalone (como app nativa)
- **Orientación**: Portrait-primary
- **Categorías**: Business, Productivity, Utilities

### ✅ Service Worker
- **Cache Strategy**: Cache-first para recursos estáticos
- **Offline Support**: La app funciona sin conexión
- **Auto-update**: Actualización automática del cache
- **Performance**: Carga más rápida en visitas posteriores

### ✅ Meta Tags
- **Theme Color**: #1e22aa (azul corporativo)
- **Apple Web App**: Configurado para iOS
- **Microsoft Tiles**: Configurado para Windows
- **Viewport**: Optimizado para móviles

## 📱 Cómo Instalar la PWA

### En Chrome/Edge (Desktop):
1. Abre la aplicación en el navegador
2. Busca el ícono de "Instalar" en la barra de direcciones
3. Haz clic en "Instalar SorteoHub"
4. La app se instalará como aplicación nativa

### En Chrome (Móvil):
1. Abre la aplicación en Chrome móvil
2. Toca el menú (3 puntos) → "Agregar a pantalla de inicio"
3. Confirma la instalación
4. La app aparecerá en tu pantalla de inicio

### En Safari (iOS):
1. Abre la aplicación en Safari
2. Toca el botón "Compartir" (cuadrado con flecha)
3. Selecciona "Agregar a pantalla de inicio"
4. Confirma la instalación

## 🔧 Archivos PWA Creados

```
public/
├── manifest.json          # Configuración PWA
├── sw.js                  # Service Worker
├── icons/
│   ├── SorteoHub.png      # Logo principal
│   ├── icon-192x192.png   # Icono 192x192
│   └── icon-512x512.png   # Icono 512x512
└── index.html             # Meta tags PWA
```

## 🚀 Beneficios de la PWA

1. **Instalable**: Se puede instalar como app nativa
2. **Offline**: Funciona sin conexión a internet
3. **Rápida**: Carga instantánea después de la primera visita
4. **Responsive**: Optimizada para todos los dispositivos
5. **Actualizable**: Se actualiza automáticamente
6. **Nativa**: Se integra con el sistema operativo

## 📊 Verificación PWA

Para verificar que la PWA funciona correctamente:

1. **Chrome DevTools**:
   - Abre DevTools → Application → Manifest
   - Verifica que el manifest se carga correctamente
   - Revisa que los iconos estén disponibles

2. **Lighthouse**:
   - Ejecuta Lighthouse en Chrome DevTools
   - Verifica la puntuación PWA (debería ser alta)

3. **Test de Instalación**:
   - Intenta instalar la app desde el navegador
   - Verifica que aparezca en el escritorio/aplicaciones

## 🎨 Personalización

El logo SorteoHub está configurado con:
- **Color de tema**: #1e22aa (azul corporativo)
- **Color de fondo**: #ffffff (blanco)
- **Orientación**: Portrait-primary
- **Idioma**: Español (es)

## 📝 Notas Técnicas

- El Service Worker se registra automáticamente al cargar la app
- Los recursos se cachean para funcionamiento offline
- El manifest.json define el comportamiento de la PWA
- Los meta tags optimizan la experiencia en diferentes plataformas
