# Skipo

Notas sobre Skipo como plataforma que el usuario puede registrar en el tracker. Basado en una revision de https://skipo.com/es/ hecha el 2026-11-04 (135 URLs del sitemap + paginas de producto revisadas a mano). Los datos de producto pueden cambiar: verificar en el sitio antes de usarlos como regla.

## Que es

Skipo Chile SpA (RUT 77.554.238-1). App chilena (iOS, Android, web) para:

- **xStocks**: acciones y ETFs de EE.UU. tokenizados (TSLAx, NVDAx, AAPLx, SPYx, QQQx, etc.), operables 24/7, desde $1.000 CLP. Emitidos por xStocks, no por Skipo. No dan derechos de voto. **Los dividendos se reinvierten automaticamente en el mismo stock.**
- **Cripto**: compra/venta con CLP de BTC, ETH, SOL, USDT, USDC y otras. Transferencias gratis entre usuarios Skipo; retiros a billeteras externas pagan comision de red (tabla en `/es/fees/`).
- **Cuenta remunerada (Skipo Earn)**: solo USDT (red BNB). Los USDT se depositan en el protocolo Aave. Ganancia **variable de hasta 5% anual**, liquidada cada 24 horas y sumada al saldo. Minimo 5 USDT, sin plazo. Skipo retiene una comision de administracion sobre la ganancia. Si se retira a mitad de ciclo, la ganancia de ese ciclo se calcula sobre el saldo minimo.
- **Ordenes recurrentes (DCA)**, mesa OTC y cuenta empresas con API.

Regulacion: inscrita en el Registro de Prestadores de Servicios Financieros de la CMF con autorizacion **en tramite** bajo la Ley Fintec (21.521), registrada en la UAF, certificada ISO/IEC 27001:2022. Aave no esta supervisado por Skipo ni por reguladores chilenos.

## Como registrar cuentas Skipo en el tracker

Aplica las reglas de negocio de `CLAUDE.md`. Recomendaciones especificas:

| Producto Skipo | `tipo` | `moneda` | Nota |
|---|---|---|---|
| xStocks | `acciones` | `USD` | El subyacente cotiza en dolares. Si el usuario prefiere copiar el saldo en pesos que muestra la app, usar `CLP` y no mezclar criterios en la misma cuenta. |
| Cuenta remunerada USDT | `cripto` | `USD` | USDT ~ 1 USD. El pequeno desvio de paridad queda como rendimiento, lo que es correcto. |
| Cripto volatil (BTC, ETH, ...) | `cripto` | `CLP` | El schema solo admite CLP/USD/UF; registrar el valor en pesos que muestra la app. |

Una cuenta por producto: mezclar xStocks y Earn en una sola cuenta "Skipo" esconde que rinden por razones distintas.

### Que es aporte y que es ganancia

- **Ganancia diaria de Earn**: es rendimiento. **No** registrarla como movimiento; aparece sola en el siguiente snapshot.
- **Dividendos de xStocks**: se reinvierten automaticamente, asi que tambien son rendimiento. **No** registrarlos como aporte.
- **Comprar USDT o xStocks con pesos depositados desde el banco**: aporte, en la moneda de la cuenta, con la `tasa_cambio` de mindicador.cl de ese dia.
- **Mover plata entre productos Skipo** (por ejemplo, vender xStocks para pasar a Earn): es un **retiro** en la cuenta de origen y un **aporte** en la de destino, misma fecha. Si no se registra, la cuenta de origen parece perder plata y la de destino parece ganarla.
- **Retiro a una billetera externa**: retiro por el monto que sale. La comision de red no es movimiento; es un costo real que reduce el valor.

### Spread cambiario

El tracker usa el dolar observado de mindicador.cl. Skipo cambia CLP a USDT a su propio precio, con spread. Por eso, justo despues de comprar, el valor en CLP de una cuenta USD puede aparecer algo mas bajo que lo depositado. Es un costo real (regla 4: no esconderlo), no un error del calculo. Skipo anuncia "sin comision" en la compra, pero no publica el spread.

## Hallazgos de la revision del sitio (2026-11-04)

Referencia, no accion: estos puntos son del sitio de Skipo, no del tracker.

**Privacidad y seguridad**
- Los pixeles de TikTok, Meta, LinkedIn, Google Ads y GA se cargan antes de aceptar cookies, en todo el sitio. Las cookies `_ttp` y `ttcsid` se guardan sin consentimiento.
- El canal de denuncias anonimas (`/es/report/`) tambien carga esos pixeles.
- La CSP esta en modo `report-only` y no incluye los pixeles realmente cargados (210 violaciones en consola solo en `/es/businesses/demo/`).
- En movil, el boton del chat tapa "Aceptar todo" del banner de cookies.

**Coherencia de producto (lo relevante para el tracker)**
- `/es/fees/` dice que todas las operaciones internas son gratis, pero Earn cobra comision de administracion sobre la ganancia y el spread no se publica.
- `/es/earn/` no muestra tasa ni riesgos; `/es/cuenta-remunerada/` si (hasta 5% variable, riesgos de Aave, comision). Usar esta ultima como fuente.
- `/es/stocks/` dice "respaldado 1:1" y despues "disenado para seguir el precio"; promete dividendos sin mencionar retencion de impuestos de EE.UU.
- `/es/fees/` lista HYPE, PAXG, TON y UNI, que no tienen paginas propias en el sitio.

**SEO / tecnico**
- Las 135 URLs responden 200, canonicals y hreflang correctos, JSON-LD valido, todas las imagenes con `alt`, buena velocidad.
- Paginas que compiten entre si: acciones (`/stocks/`, `/acciones/`, `/invertir-en-acciones-de-estados-unidos/`), cripto (`/crypto/`, `/buy-cryptocurrencies/`, `/cryptocurrencies/`) y USDT (`/dolar-digital/`, `/buy/usdt/`, `/cryptocurrencies/usdt/`).
- ~60 paginas de cripto con 80-250 palabras.
- Imagen `screenshot` del JSON-LD de la home da 404; Organization duplicada.
