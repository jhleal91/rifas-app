# Estructura de Estilos CSS Modular

Este proyecto ahora utiliza una estructura de estilos CSS modular para mejorar la organización y mantenibilidad del código.

## Estructura

```
src/
├── styles/
│   ├── variables.css      # Variables CSS (colores, fuentes, espaciado, etc.)
│   ├── common.css         # Estilos comunes (botones, inputs, formularios, etc.)
│   └── README.md          # Este archivo
├── components/
│   ├── LandingPage.css    # Estilos específicos de LandingPage
│   ├── RafflePortal.css   # Estilos específicos de RafflePortal
│   └── ...                # Otros componentes con sus propios CSS
└── App.css                # Estilos globales y navegación
```

## Uso

Cada componente importa sus propios estilos:

```javascript
// LandingPage.js
import './LandingPage.css';
```

Los archivos CSS de componentes pueden importar variables y estilos comunes:

```css
/* LandingPage.css */
@import '../styles/variables.css';
@import '../styles/common.css';

/* Estilos específicos del componente */
.landing-page {
  /* ... */
}
```

## Variables CSS

Las variables CSS están definidas en `styles/variables.css` y pueden ser usadas en cualquier archivo:

```css
.my-component {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
}
```

## Beneficios

1. **Organización**: Cada componente tiene sus propios estilos
2. **Mantenibilidad**: Fácil encontrar y modificar estilos
3. **Reutilización**: Variables y estilos comunes compartidos
4. **Performance**: Mejor tree-shaking y carga incremental
5. **Escalabilidad**: Fácil agregar nuevos componentes

## Próximos Pasos

1. Extraer estilos de componentes adicionales (AdvertiserDashboard, UserDashboard, etc.)
2. Crear archivos CSS específicos para componentes más pequeños
3. Optimizar y minificar CSS en producción

