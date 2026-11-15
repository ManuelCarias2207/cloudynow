# Siembra Satelital — Reparto de trabajo (domingo)

Space Apps San Salvador, reto "Cambio de campo". La entrega cierra el **domingo a las 11:59 PM**. Fuente del plan:
`context/nasa.simpler.json`. Qué hace el backend: `context/backend_explicacion.txt`.

## Dónde estamos

**Ya funciona (en `main`)**

- Backend (Vercel serverless):
  - `GET /api/zones`, `GET /api/zones/:id` y `POST /api/recommend`.
  - Recibe cualquier punto de El Salvador (`lat`/`lon`) y datos NASA POWER en vivo, con respaldo guardado.
  - Puntaje por reglas, 3 rotaciones, textos en EN/ES y 58 pruebas.
  - Ya acepta `rainDelta` y `heatDelta`, que sirven para el slider de escenarios.
- Frontend (React + Vite + Tailwind + MapLibre):
  - Flujo completo: mapa → finca → resultados.
  - Búsqueda de lugares, GPS, vista satélite, celda NASA y cambio de idioma EN/ES.
  - Gráficas de lluvia y de humedad del suelo.

**Falta**

- Que nada tenga scroll: cada pantalla cabe completa en la ventana.
- Estilo final con componentes Arc UI (Skeleton, gráficas estilizadas y animaciones).
- Slider de escenarios y página "About the data", que incluye la declaración de IA.
- Gráficas traducidas al español.
- Desplegar en Vercel. **Es obligatorio.**
- Pitch en inglés y entrega en Space Apps.

Referencias de estilo: Arc UI https://uiarc.dev/components/ · animaciones https://cojeev.com/ui/

## Reglas para no pisarnos

1. Antes de empezar: `git checkout main && git pull`. Todos parten de la misma base.
2. Cada quien trabaja en **su propia rama**: `nombre/tarea`, por ejemplo `angel/no-scroll`.
3. Solo se tocan los archivos de la tabla "Archivos que te tocan". Si necesitas un archivo de otra persona, avísale primero.
4. Textos de la interfaz: cada quien agrega **su propia sección** en `frontend/src/i18n/en.js` y `es.js`, sin editar las de otros. Todo texto visible va en inglés y en español.
5. Abre un PR hacia `main` y **Astrelio lo revisa y lo fusiona**. Nadie hace push directo a `main`.
6. Antes del PR: `npm run build` en `frontend` y `npm test` en `backend`, sin errores.
7. Commits pequeños, con mensaje claro y en inglés.

## Horario (propuesta)

| Hora | Qué |
|---|---|
| 10:30 – 14:00 | Cada quien en su tarea; PRs pequeños apenas algo funcione |
| 14:00 – 15:00 | Último PR de funciones. **Congelado a las 15:00**, después solo arreglos |
| 15:00 – 17:00 | Despliegue final, pruebas en celular y PC, capturas para el pitch |
| 17:00 – 20:00 | Pitch, video y ensayo |
| 20:00 – 22:00 | Entrega en Space Apps (holgura antes de las 11:59 PM) |

## Asignaciones

### 1. Astrelio — , integración y despliegue

- Revisar y fusionar los PRs, resolver conflictos y mantener `main` funcionando.
- **Desplegar en Vercel** dos proyectos desde el mismo repo:
  - Proyecto `backend`, con Root Directory = `backend`.
  - Proyecto `frontend`, con Root Directory = `frontend` y la variable `VITE_API_URL` = URL del backend.
- Comprobar que el sitio público funciona de punta a punta, en celular y PC, después de cada merge importante.
- Entrega en Space Apps:
  - Enlace del sitio en vivo.
  - Pestaña de datos NASA (NASA POWER: T2M, PRECTOTCORR, RH2M y GWETROOT).
  - Declaración de IA y enlace del pitch.
- **Archivos que te tocan:** `frontend/vercel.json`, `backend/vercel.json`, variables de entorno de Vercel y el `Readme.md` raíz.

### 2. Anderson — Gráficas

- Rehacer las gráficas con el estilo de las gráficas de Arc UI, con animación de entrada y tooltip limpio.
- Traducir las gráficas a EN/ES con i18n. Hoy siempre salen en inglés.
- Arreglar la franja de "campo desnudo" en la gráfica de humedad: hoy solo sombrea meses seguidos. Si la ventana es Jan, Feb y Apr, abril no se marca.
- Diseñarlas compactas: deben caber en la pantalla de resultados sin scroll. Coordinar el tamaño con Angel.
- Glosario de términos (`TermGlossary`) corto, en tooltips o en un panel.
- Opcional, solo si sobra tiempo: `NdviChart`. Hoy no hay datos NDVI en el backend, así que no es prioridad.
- **Archivos que te tocan:** `frontend/src/components/charts/*` y la sección `charts` de `i18n/en.js` y `i18n/es.js`.

### 3. Angel — Distribución de pantallas sin scroll

- **Ninguna página puede tener scroll**, ni arriba ni abajo: todo se acomoda al alto de la ventana.
  - Usar `h-dvh`, grid o flex con `min-h-0` y `overflow-hidden`.
  - El encabezado y los pasos ocupan su alto fijo y el contenido llena el resto.
- Home: una sola pantalla con la frase, el botón de empezar y el aviso de apoyo.
- Mapa (`ZonePage`): el mapa llena el espacio libre y el panel lateral no se desborda.
- Finca (`FarmPage`): cultivos y prioridad visibles juntos.
- Resultados (`ResultsPage`), la pantalla más difícil:
  - Hoy es larga. Hay que reorganizarla con pestañas o un selector "Option A / B / C" y paneles.
  - Las tarjetas resumidas van lado a lado. El detalle (evidencia, riesgos, vacíos) va en un panel, pestaña o modal.
  - Las gráficas van en su propia pestaña.
- Que funcione en celular: en pantalla chica, pestañas en vez de columnas.
- Coloca los componentes que hacen Tikas (Skeleton y UI), Anderson (gráficas) y Henry 4.º (slider y About) dentro de las páginas.
- **Archivos que te tocan:** `frontend/src/pages/*`, `components/layout/*`, `components/results/RotationComparison.jsx` y el layout global de `index.css`.

### 4. Tikas — Componentes Arc UI, Skeleton y animaciones

- Pasar los componentes base al estilo Arc UI: `Button`, `Card`, `Badge`, `Tooltip`, `Slider` y las pestañas que necesite Angel.
- Crear `Skeleton` (Arc UI) para los estados de carga:
  - Resultados mientras llega la respuesta (hoy solo sale el texto "Reading 10 years…").
  - El nombre del lugar en el mapa.
  - Las gráficas.
- Animaciones suaves al cambiar de paso, al aparecer las tarjetas y al hacer hover en los botones (referencia cojeev.com/ui). Nada exagerado: el tono es "friendly y minimalista".
- Pulir las tarjetas de rotación: `RotationCard`, `ScoreBreakdown` y los colores de `tokens.css`.
- **Archivos que te tocan:** `frontend/src/components/ui/*` (incluido el nuevo `Skeleton.jsx`), `styles/tokens.css`, `components/results/RotationCard.jsx` y `components/results/ScoreBreakdown.jsx`.

### 5. Henry (4.º año) — Escenarios, página de datos y cultivos

- **Slider de escenarios** (`ScenarioSlider`): menos lluvia (de 0 % a −40 %) y más calor (de 0 a +3 °C).
  - Mandar `rainDelta` y `heatDelta` en `recommend()` (`services/api.js`). El backend ya los acepta.
  - Debe verse cómo cambian los puntajes.
- **Página "About the data"** (`AboutDataPage` y su ruta):
  - Datasets usados: NASA POWER, con sus parámetros y el periodo 2016–2025.
  - Cómo se calcula el puntaje y los límites: celda de unos 50 km, sin suelo local, sin precios ni plagas.
  - **Declaración de IA**: qué herramientas usamos y para qué. Es requisito de Space Apps.
- Revisar `backend/data/crops.json` con fuentes agronómicas (MAG, CENTA, FAO) y anotar las fuentes en el README del backend.
  - Si cambias un valor, corre `npm test`.
  - `needsValidation` se queda en `true`.
- **Archivos que te tocan:** `components/scenarios/ScenarioSlider.jsx`, `pages/AboutDataPage.jsx`, la ruta nueva en `routes.jsx`, `services/api.js`, `backend/data/crops.json`, `backend/README.md` y las secciones `about` y `scenario` de i18n.

### 6. Hanry (el niño) — Pitch, logo y pruebas

- **Pitch en inglés:**
  - Deck de 7 slides: problema, dato NASA usado, demo, cómo decide, impacto, límites y equipo, más la declaración de IA.
  - O un video de 30 s con subtítulos en inglés.
  - Guion de la demo en una frase: qué rotación le conviene al agricultor y por qué.
- **Logo:** una hoja o brote con una órbita satelital alrededor, minimalista. Entregar un SVG para reemplazar `frontend/public/favicon.svg`; pásaselo a Tikas.
- **Pruebas manuales** en celular y PC, en EN y ES, en cada versión desplegada:
  - Recorrer el flujo completo.
  - Anotar en una lista lo que se ve mal o tiene scroll, y avisar a quien le toca.
- Capturas de pantalla finales para el deck y la entrega.
- **Archivos que te tocan:** carpeta `docs/pitch/` (guion, notas y capturas) y el SVG del logo.

## Fuera de alcance (no hacer)

Login, perfiles, roles, base de datos, historial de clima, integración real con WhatsApp y calendario de siembra.
Estas dos últimas solo se mencionan en el pitch como "visión de futuro" (ver `nasa.simpler.json`).

## Si alguien termina antes

Ayuda a Hanry con las pruebas o toma, en este orden:

1. Asistente simulado tipo "Waze del campo" (`AssistantChat`), solo para la demo.
2. `NdviChart`.
