# DESIGN.md — Sistema de Diseño & Especificaciones de Arquitectura UI/UX

Este documento define de forma exhaustiva los principios de diseño, la metodología de tokens de color, la jerarquía tipográfica, la arquitectura de layout y las pautas de componentes para el desarrollo de la interfaz de usuario.

---

## 1. Filosofía Visual y Accesibilidad (A11Y)

### 1.1 Enfoque Visual
- **Estilo**: Diseño Corporativo / *Modern Enterprise*.
- **Características**: Interfaz altamente estructurada, formal, limpia y modular. Uso de bordes sutiles, tarjetas para delimitar contenido y una sólida jerarquía tipográfica orientada a aplicaciones SaaS y paneles de administración de alta productividad.

### 1.2 Normas de Accesibilidad (WCAG 2.1 - Nivel AA)
- **Contraste de Color**:
  - Ratio mínimo de **4.5:1** para texto normal (< 18pt / 24px).
  - Ratio mínimo de **3.0:1** para texto grande (≥ 18pt o 14pt en negrita) y componentes UI activos.
- **Navegación por Teclado & Focus**:
  - Todos los elementos interactivos cuentan con un foco visible de alto contraste mediante un anillo `focus-ring` (2px con offset de 2px).
  - Orden lógico de tabulación (`tabindex`) en toda la interfaz.
- **Lectores de Pantalla (ARIA)**:
  - Uso obligatorio de etiquetas HTML5 semánticas (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`).
  - Atributos `aria-expanded`, `aria-controls`, `aria-label` y `role` en componentes interactivos (modales, menús desplegables y drawers).
- **Animaciones Adaptativas**:
  - Respeto estricto a las preferencias del usuario (`prefers-reduced-motion: reduce`), desactivando o suavizando transiciones complejas.

---

## 2. Tokens de Color y Tipografía

### 2.1 Metodología de Color (Design Tokens Semánticos Radix UI)
El sistema utiliza una escala semántica de 12 pasos para garantizar contraste, consistencia e inversión entre Modo Claro y Modo Oscuro.

| Paso | Función | Uso en la UI |
| :--- | :--- | :--- |
| **1 - 2** | Fondo de App | Fondos principales de página y superficies anidadas. |
| **3 - 5** | Fondos de Componentes | Tarjetas, campos de texto y estados hover/active de componentes. |
| **6 - 8** | Bordes y Separadores | Líneas divisorias, bordes sutiles e indicadores de estado interactivo. |
| **9 - 10** | Colores Sólidos / Primarios | Botones primarios, estados activos principales y fondos de acento. |
| **11 - 12** | Texto e Iconos | Texto secundario/de bajo contraste (11) y texto primario de alto contraste (12). |

### 2.2 Inversión Semántica (Modo Claro vs Modo Oscuro)

#### Primarios & Acento
- **Brand Primary**: `#2563EB` (Blue 600 - Light) / `#3B82F6` (Blue 500 - Dark)
- **Brand Accent**: `#06B6D4` (Cyan 500) / `#6366F1` (Indigo 500)

#### Tabla de Tokens
| Token | Modo Claro (Light Mode) | Modo Oscuro (Dark Mode) |
| :--- | :--- | :--- |
| `--bg-app` | `#FFFFFF` | `#0F172A` (Slate 900) |
| `--bg-surface` | `#F8FAFC` (Slate 50) | `#1E293B` (Slate 800) |
| `--bg-card` | `#FFFFFF` | `#1E293B` (Slate 800) |
| `--border-subtle` | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) |
| `--border-strong` | `#CBD5E1` (Slate 300) | `#475569` (Slate 600) |
| `--text-primary` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) |
| `--text-secondary` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) |
| `--primary-action` | `#2563EB` | `#3B82F6` |
| `--primary-hover` | `#1D4ED8` | `#2563EB` |

### 2.3 Tipografía
- **Fuente Principal (Sans-serif)**: `Inter`, `Geist`, system-ui, sans-serif.
- **Fuente Monoespaciada**: `Geist Mono`, `JetBrains Mono`, monospace.

#### Escala Tipográfica
- **Display**: `36px` (`2.25rem`), line-height: 1.2, font-weight: 700.
- **H1**: `30px` (`1.875rem`), line-height: 1.25, font-weight: 700.
- **H2**: `24px` (`1.5rem`), line-height: 1.3, font-weight: 600.
- **H3**: `20px` (`1.25rem`), line-height: 1.4, font-weight: 600.
- **Body Large**: `16px` (`1rem`), line-height: 1.5, font-weight: 400/500.
- **Body Base**: `14px` (`0.875rem`), line-height: 1.5, font-weight: 400/500.
- **Caption / Small**: `12px` (`0.75rem`), line-height: 1.4, font-weight: 400.

---

## 3. Espaciado, Bordes, Sombras y Layout

### 3.1 Espaciado Base (Sistema de 4px / 8px)
- **Incrementos**: `4px` (xs), `8px` (sm), `16px` (md), `24px` (lg), `32px` (xl), `48px` (2xl).
- **Bordes (Border Radius)**:
  - Componentes pequeños (botones, inputs, badges): `rounded-md` (`6px` / `0.375rem`).
  - Tarjetas y contenedores principales: `rounded-lg` (`8px` / `0.5rem`).
- **Sombras (Elevaciones)**:
  - **Baja (`shadow-sm`)**: Botones, tarjetas estándar, inputs.
  - **Media (`shadow-md`)**: Menús desplegables (dropdowns), tooltips.
  - **Alta (`shadow-lg`)**: Modales, diálogos y drawers móviles.

### 3.2 Arquitectura de Layout
- **Topbar Superior Fija**:
  - Contiene: Logo de la aplicación, menús desplegables de navegación global, buscador central y perfil de usuario/notificaciones a la derecha.
  - Comportamiento: Fija (`sticky top-0 z-40`), fondo con blur `backdrop-blur-md` y borde inferior `--border-subtle`.
- **Contenedor Principal**:
  - Ancho máximo centralizado: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Adaptación Móvil (< 768px)**:
  - La navegación superior se repliega en una barra móvil reducida con un botón hamburguesa.
  - Al presionar el botón hamburguesa, abre un **Drawer lateral desplegable** (`Sheet`) que desliza desde la izquierda cubriendo las opciones de navegación.

---

## 4. Elementos Base y Estados de Interacción (Core UI)

### 4.1 Jerarquía de Botones & Estados
1. **Primario**: Fondo azul de marca, texto blanco, sombra sutil.
2. **Secundario**: Fondo gris neutro de superficie, borde sutil, texto primario.
3. **Outline**: Fondo transparente, borde neutro fuerte, texto primario.
4. **Ghost**: Sin fondo ni borde, hover con fondo gris sutil.
5. **Destructivo**: Fondo rojo alerta, texto blanco.

#### Estados Globale de Interacción
- **Hover**: Transición suave de tono (`duration-200 ease-in-out`).
- **Active**: Oscurecimiento sutil del color base.
- **Focus Ring**: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`.
- **Disabled**: `opacity-50 pointer-events-none cursor-not-allowed`.

### 4.2 Inputs de Formulario Base
- Etiqueta fija en la parte superior del input con peso `font-medium`.
- Borde sutil que cambia a color primario de marca al enfocar (`focus:border-blue-600`).
- Mensaje de error visible en rojo bajo el input acompañado de un icono de advertencia.
- Indicador de estado de carga con spinner SVG integrado a la derecha cuando corresponda.

---

## 5. Componentes del Sistema (HTML & Tailwind CSS)

### 5.1 Componentes Base de Interfaz

#### Botón Primario
```html
<button 
  type="button" 
  class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:pointer-events-none"
>
  Guardar Cambios
</button>