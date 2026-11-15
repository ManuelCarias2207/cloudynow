# Baseline de rendimiento del frontend

Medido el 2026-11-14 sobre el commit `fa6e259` (selector EN/ES), antes de mejorar el diseño. Build de producción `vite build` (Vite 6.4) servida con `vite preview`.

## Librerías

| Librería | Tipo | ¿Se usa? |
|---|---|---|
| react / react-dom 19 | UI | Sí |
| react-router-dom 7 | Rutas | Sí |
| i18next / react-i18next | Idioma EN/ES | Sí (15 archivos) |
| maplibre-gl 5 | Mapa | Sí, solo en `ZoneMap.jsx` (pantalla de ubicación) |
| tailwindcss 4 (+ @tailwindcss/vite) | Estilos | Sí |
| react-leaflet, recharts, lucide-react | Mencionadas en `context/nasa.simpler.json` | No están instaladas |

## Bundle (un solo chunk, sin code splitting)

| Archivo | Bruto | gzip |
|---|---|---|
| `index-*.js` (todo) | 1,395.6 KB | 391.6 KB |
| `index-*.css` | 84.7 KB | 13.6 KB |
| JS sin maplibre-gl* | 334.2 KB | 106.6 KB |
| CSS sin `maplibre-gl.css`* | 14.8 KB | 3.9 KB |

\* Build de prueba con maplibre-gl sustituido por un stub, para medir el JS inicial "sin mapa".

Dependencias más pesadas dentro del JS (source-map-explorer, bytes minificados):

| # | Paquete | Bruto | % del JS |
|---|---|---|---|
| 1 | maplibre-gl | 1,057.5 KB | 75.8 % |
| 2 | react-dom | 210.2 KB | 15.1 % |
| 3 | i18next | 46.2 KB | 3.3 % |
| 4 | react-router | 39.4 KB | 2.8 % |
| 5 | código de la app (`src/`) | 21.8 KB | 1.6 % |

## Lighthouse 12.8, pantalla de ubicación (`/zone`)

Móvil, throttling simulado "Slow 4G" (RTT 150 ms, 1.6 Mbps, CPU ×4). Mediana de 3 corridas (rango entre paréntesis).

| Métrica | Valor | Presupuesto |
|---|---|---|
| Performance | **60** (40–63) | ≥ 90 |
| LCP | **3.3 s** (3.3–5.6 s) | < 2.5 s |
| CLS | 0.024 | < 0.1 |
| TBT | **1,520 ms** (1,040–1,560 ms) | — |
| Peso total de la página | 1,194 KB transferidos | — |

Reparto del peso: JS 395 KB · fuentes Inter 343 KB · tiles/sprites/glifos del mapa ~431 KB · CSS 16 KB.

## Hallazgos

- **Mapa sin carga diferida:** maplibre-gl (≈285 KB gzip) y su CSS (10 KB gzip) van en el chunk único y se descargan en todas las rutas, incluida la portada.
- **Fuente externa:** `index.html` carga `https://rsms.me/inter/inter.css`, una hoja que bloquea el render, más 3 pesos `woff2` (Regular, Medium y SemiBold, unos 115 KB cada uno, con todos los caracteres).
- **Dependencias sin uso:** ninguna en `package.json`.
- **Duplicadas:** solo `@mapbox/unitbezier` (0.0.1 y 1.0.0, ambas traídas por maplibre-gl; pesan muy poco).
- **Imágenes:** solo `public/favicon.svg` (271 B). El sprite `ofm@2x.png` (119 KB) viene del servidor de tiles.

## Presupuesto

| Regla | Baseline | Estado |
|---|---|---|
| JS inicial de la primera pantalla ≤ 170 KB gzip, sin contar el mapa | 106.6 KB | Cumple |
| Mapa con carga diferida, solo en `/zone` | Va en el chunk único | No cumple |
| Performance ≥ 90, LCP < 2.5 s, CLS < 0.1 | 60 / 3.3 s / 0.024 | Solo cumple CLS |

## Cómo repetir la medición

```
cd frontend
npx vite build --sourcemap --outDir /tmp/perf-dist
npx source-map-explorer /tmp/perf-dist/assets/index-*.js --no-border-checks
npx vite preview --outDir /tmp/perf-dist --port 4173
npx lighthouse http://localhost:4173/zone --form-factor=mobile --throttling-method=simulate --only-categories=performance
```

## Después de la identidad visual (tokens, fuentes del sistema, mapa diferido)

| Medida | Baseline | Ahora | Diferencia |
|---|---|---|---|
| JS inicial (gzip) | 391.6 KB | 107.0 KB | −284.6 KB (sin el mapa: 106.6 → 107.0, +0.4 KB) |
| CSS inicial (gzip) | 13.6 KB | 4.1 KB | −9.5 KB |
| Chunk diferido del mapa `ZoneMap-*` | — | 284.0 KB JS + 10.0 KB CSS (gzip) | Solo se carga en `/zone` |
| Fuentes externas | 343 KB (Inter, rsms.me) | 0 (fuente del sistema) | −343 KB |
| Lighthouse `/zone`: Performance / LCP / CLS / TBT | 60 / 3.3 s / 0.024 / 1,520 ms | 74 / 1.7 s / 0.024 / 1,220 ms | — |
| Peso total de `/zone` | 1,194 KB | 849 KB | −345 KB |
| Lighthouse Accesibilidad `/zone` | — | 100 | — |

El TBT que queda viene de inicializar MapLibre en `/zone`, por eso Performance sigue por debajo de 90.
