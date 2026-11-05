# Skipo: referencias visuales

Recopilado el 2026-11-04 desde https://skipo.com/es/, solo como referencia para el rediseño. No es material para copiar: los textos, logos, ilustraciones 3D y fuentes son de Skipo.

## Archivos

| Archivo | Qué es |
|---|---|
| `capturas/<pagina>-1440.jpg` / `-390.jpg` | Página completa en escritorio (1440×900) y móvil (390×844), dpr 1. Páginas: `portada`, `stocks`, `cuenta-remunerada`, `crypto`, `fees`. |
| `capturas/mockups/*.jpg` | Recortes a 2x de las pantallas de la app que muestra el sitio (balance, listas de precios, conversor, gráficos). |
| `portada-scroll.webm` | 27 s de scroll lento por la portada en escritorio, para ver el movimiento. |
| `estilos.json` | Estilos calculados de la portada: tokens de color, tipografía y caja de cada tipo de elemento, `@font-face`, keyframes, transiciones y estados hover. |

Nota: en `crypto-1440.jpg`, algunas imágenes salieron semitransparentes porque estaban a mitad de su animación de entrada. Las versiones limpias están en `capturas/mockups/`.

## Paleta

El sitio (Astro + Tailwind v3) no define variables CSS propias en `:root`; los colores salen del tema de Tailwind. Nombres entre paréntesis = token del sitio.

| Hex | Dónde se usa |
|---|---|
| `#0B101D` (`background-color`) | Fondo más oscuro: secciones navy, footer, banner de cookies. |
| `#0A1728` (`blue-20`, `dark-blue`) | Tarjeta oscura grande de stocks en la portada. |
| `#0B1B33` (`blue-30`) | Barra de navegación flotante. |
| `#0F223D` (`blue-primary`) | Texto principal sobre fondo claro, botón sólido oscuro, texto sobre el CTA turquesa, cabecera de tablas. |
| `#112849` | Tarjeta oscura (business) dentro de bloques azules. |
| `#1C365A` (`secondary-color`) | Bordes de tarjetas y acordeones sobre navy. |
| `#2F5284` (`light-blue`) | Extremo claro de los degradados azules de los héroes de producto. |
| `#00D8AE` (`turquoise`, `primary`) | **Único acento**: CTA primario, palabras destacadas en titulares, enlaces, encabezados del footer, "Gratis" en tablas, h3. |
| `#E6EDF5` | Texto largo sobre navy (nunca blanco puro en párrafos largos). |
| `#EBEBEB` | Contenedores grises claros que agrupan tarjetas sobre fondo blanco. |
| `#9C9C9C` (`light-gray`) | Texto secundario. |
| `#FFFFFF` | Fondos de secciones claras, tarjeta clara (earn), titulares sobre oscuro. |

Fuera del CSS, dentro de los mockups de la app: verde para variaciones positivas (flecha ↑ y %), rojo para las negativas, y un degradado turquesa→transparente en el área de los gráficos.

Fondos: alternan bloques blancos y navy; los héroes de las páginas de producto usan un degradado azul vertical (de `#0F223D` hacia `#2F5284`). La portada usa video a pantalla completa.

## Tipografía

| Familia | Uso | Pesos |
|---|---|---|
| **TikTok Sans** | Titulares (h1, h2), píldoras del hero, texto de tarjetas | 300, 400, 500, 700 |
| **Poppins** | Cuerpo, navegación, botones, enlaces, h3, footer | 300, 400, 500, 600, 700 |
| Montserrat, Instrument Serif (+ itálica), IBM Plex Mono | Declaradas en `@font-face`; no las vi usadas en la portada | — |

Escala observada (escritorio):

| Rol | Tamaño / interlineado | Peso | Nota |
|---|---|---|---|
| h1 hero | 72 / 75.6 px (1.05) | 400 | Blanco, centrado. |
| h2 sección | 42 / 45–48 px (~1.07–1.15) | 400 | Las palabras clave van en turquesa y negrita, en la misma línea. |
| h2 bloque de texto | 40 / 60 px | 400 | |
| h3 / eyebrow | 16 / 24 px | 600 | Turquesa. |
| Cuerpo | 16 / 20.8 px (1.3) | 300 | El párrafo de sección usa 16 px / 400 en `#0B101D`. |
| Navegación | 14 / 20.8 px | 300 | |
| Botones | 14 / 21 px | 300–400 | Sin mayúsculas. |
| Píldoras hero | 18 / 27 px | 700 | `letter-spacing: 0.5px`, el único tracking positivo entre los elementos medidos. |
| Chips | 14.4 / 21.6 px | 400 | |

Lo característico: titulares grandes en peso regular (no bold) con interlineado muy cerrado, y cuerpo en Poppins light.

## Radios, espaciado, sombras y bordes

- **Radios:** 8 px (CTA primario), 11 px (píldoras del hero), 12 px (tarjetas de contenido y barra de navegación), 16 px (tarjetas grandes, footer), 32 px (botones "Conoce más"), 999 px (chips).
- **Espaciado:** secciones con `py` 80 px en móvil y 128 px en escritorio; `px` 16 → 64 px. Tarjetas con padding de 32 px. Botones de 16×24 px (12×24 px el del header). Ancho máximo del contenido: 72 rem (1152 px).
- **Sombras:** casi no hay. Solo los botones de vidrio llevan `0 4px 30px rgba(0,0,0,.1)`. La profundidad viene del color y el blur, no de sombras.
- **Bordes:** 1 px `rgba(255,255,255,.5–.7)` en chips y píldoras de vidrio; 1 px `#1C365A` en tarjetas y acordeones sobre navy.
- **Vidrio:** `backdrop-filter: blur(24px) saturate(1.2)` en las píldoras del hero y `blur(5px)` en los botones secundarios, con fondo `rgba(255,255,255,.1)`.

## Composición de la portada (de arriba hacia abajo)

1. **Header flotante:** barra navy redondeada, separada 16 px del borde, con un marco translúcido alrededor. A la izquierda: logo, "Empieza a invertir ▾" y "Empresas". A la derecha: Ayuda, "Iniciar sesión" (enlace turquesa), "Registrarse" (botón turquesa) e idioma. En móvil queda el logo y una hamburguesa.
2. **Hero (alto de la pantalla, mínimo ~768 px):** video a pantalla completa de un atardecer con un flamenco, h1 centrado y tres píldoras de vidrio (Cripto, Stocks, Stablecoins) con una bajada corta debajo. No hay CTA de registro.
3. **Stocks:** fondo blanco. Eyebrow con el logo y la palabra "stocks" separados por una barra, h2 centrado, una bajada y una tarjeta navy ancha con un video de logos 3D de acciones y un botón de vidrio.
4. **Crypto:** fondo navy, dos columnas: video vertical en tarjeta redondeada a la izquierda y texto a la derecha, con el mismo patrón de eyebrow.
5. **Earn + Business:** fondo azul degradado con dos tarjetas grandes apiladas. La de earn es blanca con imagen a la izquierda; la de business es navy con imagen a la derecha (layout invertido).
6. **"¿Qué es Skipo?":** bloque de texto sobre navy y una fila de chips con borde fino, bajo un h3 turquesa.
7. **Cierre:** imagen de atardecer de fondo, titular y botón de vidrio a la izquierda, y tres celulares con la app a la derecha.
8. **Footer:** tarjeta navy redondeada con logo grande, sellos regulatorios (CMF, UAF, FinteChile), cuatro columnas de enlaces con encabezado turquesa, badges de las tiendas, redes y disclaimer legal en letra chica.

Páginas internas: héroe en degradado azul con texto a la izquierda e imagen 3D o celular a la derecha; luego secciones que alternan imagen y texto, grillas de tarjetas, acordeones de FAQ y un bloque de cierre. `cuenta-remunerada` es más sobria: todo navy, cuatro tarjetas con borde y dos columnas de pasos numerados y advertencias.

## Cómo presentan cifras, precios, rendimientos, gráficos y la app

- **Balance (mockups):** un número grande, blanco y de peso ligero con la moneda en un sufijo pequeño (`2,155,057 CLP`). Debajo, en gris: "Rentabilidad: 85,000 CLP" y luego `↑ 1,3%` en verde. Monto absoluto y porcentaje siempre juntos.
- **Gráfico de evolución:** área con degradado turquesa→transparente y una línea blanca de comparación encima, sin grilla y solo con fechas en el eje X. Un toggle permite cambiar entre gráfico de área y anillo.
- **Anillo de distribución:** segmentos de colores con el balance total al centro.
- **Listas de activos y precios:** ícono circular, nombre en negrita y cantidad debajo en gris, valor alineado a la derecha, una barra de color a la izquierda por activo, y minigráficos con % en verde o rojo.
- **Conversor:** dos tarjetas apiladas ("Pagar" y "Recibir") con selector de moneda con bandera o ícono, y un botón circular de intercambio entre ellas.
- **Acciones rápidas:** cuatro íconos en cuadrados redondeados con etiqueta debajo (Comprar, Vender, Depositar, Enviar).
- **En la web:** las cifras casi nunca van en grande. Se muestran como titular de tarjeta en turquesa ("Hasta 5% anual variable", "Desde 5 USDT") o dentro de tablas:
  - Tabla de comisiones con cabecera navy y filas gris claro, números alineados a la derecha con la unidad como sufijo y "Gratis" en turquesa.
  - Tabla comparativa en `stocks` con la columna propia resaltada en navy frente a una columna gris.
- **Fecha de vigencia:** "Actualizado el …" en gris bajo el héroe de `cuenta-remunerada`.
- **La app** aparece siempre dentro de celulares (de frente, inclinados en isometría o en tríos), rodeados de objetos 3D: monedas, logos de acciones en forma de "X" y gráficos de barras.
- Ojo: los mockups usan coma como separador de miles (`2,155,057`). Para Chile (es-CL) corresponde punto.

## Movimiento

- **Videos en loop**, en silencio y sin controles. El del hero (flamenco) carga de inmediato. Los de las tarjetas de stocks, crypto, earn y business usan `data-src`: se cargan y reproducen al entrar en pantalla.
- **Animaciones de entrada** con clases que se agregan con JS al hacer scroll (ver `clases_animacion` en `estilos.json`):
  - `fadeInUp` en 0.6 s `ease-out`: opacidad 0→1 y `translateY(10vh)`→0.
  - `slide-in-from-{bottom,top,left,right}` en 1 s `ease`: `translate` de 100% a 0.
  - `text-from-top` en 1 s: el texto baja 4 rem hasta su lugar.
  - `fadeInOnly` y `fadeInUpCentered` en 0.5 s.
- **Flotación:** `moveUpDown` (−35 px) y `moveUpDownPhone` (−20 px) mueven en vertical los objetos 3D y los celulares, en loop.
- **Carrusel infinito** de logos de acciones en `stocks` (la lista está duplicada para el loop).
- **Hover:**
  - Botón de vidrio: el fondo pasa a `rgba(0,216,174,.2)` en 0.3 s con `cubic-bezier(.25,1,.5,1)`.
  - Píldora del hero: fondo `rgba(0,216,174,.1)` y `scale(1.01)` en 0.5 s.
  - Enlaces: color en 0.2 s.
  - El CTA primario no cambia.
- **Header:** tiene `transition-colors` de 500 ms, pero no cambia al hacer scroll; se mantiene igual flotando.
- En general el movimiento es lento y suave (0.5 a 1 s): nada rebota.

## Las 5 cosas que más definen su estilo

1. **Navy profundo con un solo acento turquesa (`#00D8AE`).** El turquesa marca solo lo importante: la acción principal y la palabra clave de cada titular.
2. **Titulares grandes en peso regular con la palabra clave en turquesa y negrita**, con interlineado muy cerrado (~1.05). El cuerpo va en Poppins light.
3. **Vidrio (glassmorphism) en los elementos interactivos:** píldoras y botones translúcidos con blur, y header flotante enmarcado.
4. **Objetos 3D y celulares inclinados como protagonistas visuales**, con videos en loop y flotación suave. El producto se muestra con pantallas reales de la app, no con ilustraciones abstractas.
5. **Tarjetas grandes y redondeadas (12–16 px) que alternan claro y oscuro**, en layouts de dos columnas que invierten el orden entre imagen y texto. Casi sin sombras: la profundidad viene del color.
