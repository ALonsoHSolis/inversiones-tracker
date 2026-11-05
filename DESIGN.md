---
name: Mi portafolio
northStar: Navy & Gold — Premium Financial Clarity
colors:
  background: "#F8F9FA"
  surface: "#FFFFFF"
  surface-raised: "#F2F4F7"
  navy: "#152238"
  navy-soft: "#1C2C46"
  ink: "#152238"
  paragraph: "#333333"
  ink-muted: "#566070"
  ink-subtle: "#616A79"
  gold: "#D4AF37"
  gold-hover: "#E0C160"
  gold-ink: "#7D6213"
  gain: "#0A7553"
  loss: "#B42F3A"
  warning: "#995A00"
  control-border: "#7C8594"
  category-slate: "#5E7CA3"
  category-copper: "#B07040"
  category-mauve: "#7F68A6"
  category-steel: "#3F5D82"
  category-clay: "#9A6A55"
  category-stone: "#7A7468"
  navy-scope-ink: "#F5F7FB"
  navy-scope-gold-ink: "#E2C25A"
  navy-scope-gain: "#4FD8AE"
  navy-scope-loss: "#F38C95"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 11vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.6vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
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
    fontWeight: 500
  micro:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "12px"
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
  hero: "28px"
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
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    height: "40px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.gold-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.paragraph}"
    rounded: "{rounded.control}"
    height: "40px"
  button-glass:
    backgroundColor: "rgba(255,255,255,0.10)"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    backdropFilter: "blur(24px) saturate(1.2)"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  hero-card:
    backgroundColor: "{colors.navy}"
    rounded: "{rounded.hero}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "44px"
  period-active:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
---

# Design System: Mi portafolio

## Overview

**Navy & Gold — Premium Financial Clarity.** Tema claro, minimalista y sobrio: fondo blanco roto que da amplitud,
azul marino para la estructura (menú lateral, barra móvil, navegación pública, pie y la tarjeta del patrimonio) y
los títulos, gris carbón para leer y dorado como único acento. La estructura de pantallas toma principios de las
apps de inversión (referencia revisada: Skipo, en `design-reference/skipo/`), sin copiar su identidad: tarjeta de
balance oscura con selector gráfico/anillo, cuatro acciones rápidas en cuadrados, lista de cuentas con barra de
color, titulares en peso regular con la palabra clave destacada, vidrio en elementos interactivos sobre navy y
secciones que alternan claro y navy en la landing.

Antirreferencias: dashboards de tarjetas iguales apiladas, etiquetas en MAYÚSCULAS espaciadas, gradientes violetas,
sombras pesadas, anillos de progreso decorativos (el anillo del inicio muestra datos reales), objetos 3D o
ilustraciones genéricas y cualquier logo, texto o fuente de otra marca.

## Colors

### Primary
- **Dorado** (#D4AF37): botones de acción (texto navy encima, 7,6:1), línea del patrimonio, marcadores de aporte,
  período activo. **Nunca como texto sobre claro** (2,0:1): para texto, íconos y anillos de foco se usa
  **dorado tinta** (#7D6213, 5,3:1). Dentro de bloques navy el dorado tinta pasa a #E2C25A (9,2:1).
- **Azul marino** (#152238): títulos y cifras (15:1), estructura y fondos de los bloques `.tema-navy`.

### Neutral
- **Blanco roto** (#F8F9FA): fondo. **Blanco** (#FFFFFF): paneles y tarjetas. **Elevada** (#F2F4F7): campos y
  zonas rellenas.
- **Gris carbón** (#333333, 12:1): párrafos. **Apagado** (#566070, 6:1) y **tenue** (#616A79, ≥4,8:1) para
  texto secundario.
- **Borde de control** (#7C8594, ≥3:1): inputs y selects (WCAG 1.4.11).

### Semantic
- **Ganancia** (#0A7553) y **pérdida** (#B42F3A) sobre claro; #4FD8AE / #F38C95 dentro de navy. Siempre con signo,
  ícono o texto además del color.
- **Advertencia** (#995A00): datos atrasados (más de 14 días) y concentración (≥40 %).
- **Categóricos** (pizarra, cobre, malva, navy, acero, arena, arcilla, piedra; versión clara dentro de navy):
  distribuciones, anillo y barra de color de cada cuenta. Ninguno es verde, rojo ni dorado.

### Temas por bloque
- `.tema-navy` redefine los mismos tokens para un bloque azul marino; `.tema-claro` vuelve al tema claro dentro de
  un bloque navy. Cualquier componente se ve bien en ambos sin variantes.

### Named Rules
- **Un aporte nunca es verde.** Aportes y retiros en dorado o neutro, nunca con "+" verde: no son ganancia.
- **El dorado no es texto sobre claro.** Relleno, línea o marcador; para texto, `text-accent-ink`.

## Typography

Una sola familia, **Geist**. Cifras con números tabulares (`.font-mono-tabular`).

- **Display** (400, clamp(2.75rem, 11vw, 4.5rem)): la cifra del patrimonio, en peso regular; "$" a la mitad y apagado.
- **Headline** (400, clamp(2.25rem, 4.6vw, 3.5rem), 1.05): titulares de la landing en peso regular; la palabra
  clave va en semibold y dorado tinta (`<strong>`), nunca todo el titular en negrita.
- **Title** (600, 18 px), **Body** (400, 15 px), **Label** (500, 13 px), **Micro** (500, 12 px, piso absoluto).
- **Montos en notación chilena:** $17.751.007, +2,9 %, US$ y UF con decimales. La entrada acepta "1.234,56".

## Layout

- **App:** menú lateral navy contraíble (248/72 px) en escritorio; barra inferior navy flotante en celular con safe
  areas. Inicio: tarjeta navy del patrimonio (gráfico ↔ anillo por plataforma), acciones rápidas en celular y tablet,
  y debajo columna principal + riel de 360 px desde 1280 px.
- **Landing:** navegación navy flotante en un marco de vidrio; hero navy con degradado, titular, píldoras de vidrio,
  CTA y la app en un celular (datos de ejemplo); secciones que alternan claro y navy; filas en tarjetas grandes que
  invierten texto e interfaz; cierre navy y pie navy redondeado.

## Elevation & Depth

Capas por tono: blanco roto → blanco con borde casi invisible → navy. Sombras suaves y azuladas solo en lo que
flota (popovers, menús, barra móvil, celular). Un brillo dorado muy tenue en la tarjeta del patrimonio y en el hero.

## Shapes

10 px controles, 16 px tarjetas, 20 px paneles, 24–28 px tarjeta del patrimonio y filas de la landing, 46 px el
celular, píldora para períodos y botones de vidrio. Monogramas circulares.

## Components

- **Botones:** `.boton-primario` (dorado, texto navy), `.boton-secundario` (blanco con borde), `.boton-vidrio`
  (solo sobre navy). `:active` escala a 0,98.
- **Patrimonio** (`PatrimonioHero`): tarjeta navy con la cifra, ganancia real, selector gráfico/anillo y gráfico
  recorrible (mouse, dedo, flechas).
- **Acciones rápidas:** cuatro cuadrados redondeados con ícono y etiqueta; el primero dorado.
- **Fila de cuenta** (`AccountRow`): barra del color de su plataforma (el mismo del anillo), monograma, nombre,
  mini-gráfico neutro, valor en CLP y rendimiento real en su moneda.
- **Celular de la portada** (`TelefonoApp`): maqueta estática del inicio con datos de ejemplo, rotulada.

## Motion

150–260 ms ease-out en la interfaz; en la landing, entradas de 700 ms (fundido y subida de 40 px) y una flotación
lenta del celular (6 s). Todo se anula con `prefers-reduced-motion`.

## Do's and Don'ts

- **Do:** mostrar siempre por separado patrimonio, capital aportado, ganancia real y cambio vs. registro anterior.
- **Do:** rotular "Datos de ejemplo" toda cifra que no sea del usuario.
- **Don't:** dorado como texto sobre fondo claro; suavizar curvas; truncar el eje; ocultar pérdidas.
- **Don't:** inventar testimonios, cifras de usuarios, integraciones bancarias ni certificaciones; copiar logos,
  textos, fuentes o ilustraciones de Skipo u otra marca.
- **Modo oscuro completo:** no existe como opción del usuario; el navy se usa por bloques.
