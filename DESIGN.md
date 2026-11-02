---
name: Mi portafolio
northStar: Obsidian & Champagne — Premium Financial Intelligence
colors:
  obsidian: "#090d15"
  surface: "#17202d"
  surface-raised: "#1f2a3a"
  ink: "#f5f7fb"
  ink-soft: "#d3dae6"
  ink-muted: "#a8b4c5"
  ink-subtle: "#8794a8"
  champagne: "#e0bc78"
  champagne-light: "#ead3a2"
  gain: "#42d7b0"
  loss: "#f07b85"
  warning: "#e8a857"
  control-border: "#66758c"
  category-slate: "#9fb0c8"
  category-copper: "#d39a6a"
  category-mauve: "#a99bc0"
  category-steel: "#7f93ae"
  category-slate-light: "#c3cfdf"
  category-copper-light: "#e2b48e"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 11vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 0.95
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4.25rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
  micro:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    fontWeight: 500
    lineHeight: 1.35
  figure:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
rounded:
  control: "10px"
  card: "16px"
  panel: "20px"
  showcase: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  section-app: "40px"
  section-landing: "clamp(80px, 11vw, 168px)"
components:
  button-primary:
    backgroundColor: "{colors.champagne}"
    textColor: "{colors.obsidian}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.champagne-light}"
  button-secondary:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.control}"
    height: "40px"
  panel:
    backgroundColor: "rgba(23,32,45,0.88)"
    rounded: "{rounded.panel}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  input:
    backgroundColor: "rgba(255,255,255,0.04)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  segmented-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "7px"
  period-active:
    backgroundColor: "rgba(224,188,120,0.14)"
    textColor: "{colors.champagne-light}"
    rounded: "{rounded.pill}"
---

# Design System: Mi portafolio

## Overview

**Obsidian & Champagne — Premium Financial Intelligence.** Un producto oscuro, sereno y preciso para alguien que
revisa su patrimonio en el celular y lo analiza en el computador. La cifra del patrimonio y su gráfico son la
pantalla; todo lo demás (desempeño, cuentas, distribución, metas, actividad) es contexto que se abre cuando se
necesita. La belleza sale de la precisión: cifras tabulares, jerarquía por tamaño y peso, superficies que se
separan por un escalón de tono, y movimiento solo cuando comunica estado.

Antirreferencias confirmadas: dashboards de tarjetas iguales apiladas, etiquetas en MAYÚSCULAS espaciadas,
monoespaciado como disfraz técnico, gradientes violetas, vidrio esmerilado, sombras pesadas y anillos de
progreso decorativos.

Definido para modo oscuro. El modo claro está evaluado y pendiente (ver Do's and Don'ts).

## Colors

### Primary
- **Champán** (#e0bc78): marca, acción primaria (un solo botón primario por vista), línea del patrimonio,
  estado seleccionado de navegación y períodos. Nunca como color de categoría ni de ganancia.
- **Champán claro** (#ead3a2): texto sobre fondos champán suaves y hover del botón primario.

### Neutral
- **Obsidiana** (#090d15): fondo de la aplicación y de la landing.
- **Superficie** (#17202d) y **superficie elevada** (#1f2a3a): paneles, formularios, menús, popovers.
- **Tinta** (#f5f7fb, 18:1): cifras y títulos. **Tinta suave** (#d3dae6), **apagada** (#a8b4c5) y
  **tenue** (#8794a8, ≥5,2:1 sobre superficie) para jerarquía de texto secundario.
- **Borde de control** (#66758c, ≥3:1): solo inputs y selects (WCAG 1.4.11). Los paneles no llevan borde.

### Semantic
- **Ganancia** (#42d7b0) y **pérdida** (#f07b85): exclusivamente para resultados de inversión. Siempre con signo,
  ícono o texto además del color.
- **Advertencia** (#e8a857): datos atrasados (más de 14 días sin registro) y concentración (≥40 %).
- **Categóricos** (pizarra, cobre, malva, acero, arcilla, piedra, y sus tonos claros #c3cfdf / #e2b48e para
  texto de monogramas y segmentos de la landing): distribuciones y monogramas. Ninguno es verde ni rojo.

### Named Rules
- **Un aporte nunca es verde.** Aportes y retiros se muestran en champán o neutro, nunca con "+" verde: no son
  ganancia.
- **Un acento por pantalla.** El champán aparece en la acción principal y en el dato vivo; no se reparte.

## Typography

Una sola familia, **Geist**, para todo: títulos, interfaz y cifras. Las cifras usan números tabulares
(`.font-mono-tabular`, que ya no es monoespaciado) para que las columnas se alineen.

### Hierarchy
- **Display** (500, clamp(2.75rem, 11vw, 4.5rem), 0.95): la cifra del patrimonio; "$" a la mitad del tamaño y
  en tinta apagada. Escala menor sobre 11 caracteres para no desbordar a 320 px.
- **Headline** (600, clamp(2.25rem, 5vw, 4.25rem), 1.02): titulares de la landing; dos líneas como máximo.
- **Title** (600, 18 px, 1.25): títulos de sección de la app (`.titulo-seccion`), fuera de los paneles.
- **Body** (400, 15 px, 1.55): texto de lectura; 16–20 px en la landing; medida de 40–75 caracteres.
- **Label** (500, 13 px): etiquetas de métricas (`.etiqueta`). Piso absoluto: 12 px (`text-micro`) para
  metadatos, leyendas y etiquetas de la barra móvil; nada que se lea va por debajo.

### Named Rules
- **Montos en notación chilena.** Pesos con punto de miles ($17.751.007); porcentajes con coma decimal (+2,9 %);
  USD como US$ y UF con decimales. La entrada acepta "1.234,56" y "1.234.567".
- **Sin mayúsculas espaciadas** en etiquetas de producto.

## Layout

- **App:** sidebar contraíble (248/72 px) en escritorio; barra inferior flotante en móvil con safe areas
  (`env(safe-area-inset-bottom)`) y relleno inferior en `main` para que nunca tape contenido (verificado a 390,
  320 y 844×390 px). Inicio en dos niveles: hero a todo el ancho; debajo, columna principal y riel de 360 px
  desde 1280 px.
- **Landing:** un solo par de márgenes (`.landing-marco`, clamp(16px, 4vw, 48px), máx. 1320 px) para navegación,
  secciones y pie. Secciones separadas por clamp(80px, 11vw, 168px).
- Escala de espaciado 4 · 8 · 12 · 16 · 24 · 32. Más espacio sobre un título que debajo.

## Elevation & Depth

Plano y por capas de tono: obsidiana → superficie → superficie elevada. Sin sombras en lo que está en reposo.
Sombras solo en lo que flota: popovers de ayuda, menús, la barra móvil y el tooltip. Un único brillo champán muy
tenue detrás del hero del patrimonio, enmascarado para que no tenga cantos.

## Shapes

Radios: 10 px controles, 16 px tarjetas, 20 px paneles, 28 px vitrina de la landing, píldora para períodos y
chips. Monogramas circulares de institución. Gráfico: línea de patrimonio con rectas entre registros reales;
capital aportado en escalones punteados; puntos sobre los escalones para aportes y retiros.

## Components

- **Botones:** `.boton-primario` (champán, 40 px) y `.boton-secundario` (tono + borde suave). `:active` escala a
  0,98 en 120 ms.
- **Control segmentado** (`.segmentado`) con `aria-pressed`/`aria-selected`; **períodos** (`.periodos`) como texto
  con píldora champán en el activo.
- **Ayuda** (`Ayuda.tsx`): popover nativo, cierra con Escape o tocando fuera, entra en 160 ms.
- **Fila de cuenta** (`AccountRow`): monograma, nombre completo, institución · tipo · antigüedad, mini-gráfico
  neutro del valor, valor en CLP y rendimiento real en su moneda; detalle y acciones en un desplegable.
- **Patrimonio** (`PatrimonioHero`): cifra + gráfico SVG recorrible con mouse, dedo (`touch-action: pan-y`) y
  flechas (`role="slider"`, `aria-valuetext` con fecha, patrimonio, ganancia y aporte del día).
- **Paneles** (`.panel`) sin borde; listas con divisores (`.lista-filas`), nunca tarjetas dentro de tarjetas.

## Do's and Don'ts

- **Do:** mostrar siempre por separado patrimonio, capital aportado, ganancia real y cambio vs. registro
  anterior ("incluye aportes").
- **Do:** rotular como "Datos de ejemplo" toda cifra que no sea del usuario (solo en la landing).
- **Do:** movimiento de 150–260 ms con ease-out fuerte (cubic-bezier(0.23, 1, 0.32, 1)), solo transform y
  opacity, y anulado con `prefers-reduced-motion`.
- **Don't:** suavizar curvas, truncar el eje para dramatizar ni ocultar pérdidas.
- **Don't:** inventar testimonios, cifras de usuarios, integraciones bancarias ni certificaciones.
- **Pendiente (evaluado):** modo claro. Requiere un segundo juego de tokens con contraste propio (el champán
  #e0bc78 no llega a 3:1 sobre blanco; necesitaría un tono más oscuro, ~#8a6a2c, para texto) y revisar gráficos
  y correos. No se implementó en esta iteración.
