# context/arquitectura.md — Cómo funciona técnicamente AppFinanciera

Detalle técnico de implementación, verificado sobre el código (23/09/2026). Para el "qué" de negocio ver `context/dominio.md`; para ubicar módulos ver `context/MAPA-APPFINANCIERA.md`.

## Stack

| Componente | Versión / detalle | Evidencia |
|---|---|---|
| Next.js | 16.2.4, App Router, build/dev con `--webpack` | `AppFinanciera/package.json` |
| React / ReactDOM | 19.2.4 | `package.json` |
| Firebase | ^12.12.1 (Auth, Firestore, Storage importado) | `package.json`, `lib/firebase.js` |
| PWA | `next-pwa` ^5.6.0 (manifest + service worker en build) | `package.json`, `next.config.mjs`, `app/manifest.json` |
| Estilos | Tailwind 4 (`@tailwindcss/postcss`) + `globals.css` | `package.json`, `app/globals.css` |
| Alias | `@/*` → raíz del proyecto (`./`) | `jsconfig.json` |
| Lint | `eslint` (sin script de typecheck) | `package.json` |

Scripts: `dev`, `build`, `start`, `lint`. No hay `typecheck`; el proyecto es JavaScript (`.js`/`.jsx`), no TypeScript.

## Estructura técnica por capas

### 1. Inicialización y contexto (`lib/`)

- **`lib/firebase.js`** — `initializeApp`, `getAuth`, `getFirestore`. Exporta `auth`, `googleProvider`, `db`. *(El import de `getStorage` y `export storage` fueron eliminados en **2.6**, 11/10/2026, `10ab576`; `storageBucket` permanece en el config.)*
- **`lib/AuthContext.jsx`** — provee contexto de autenticación exponiendo `{ user, loading }`, donde `loading = user === undefined` (sesión aún no resuelta por `onAuthStateChanged`). Incluye salvaguarda de 8 s (`AUTH_RESOLVE_TIMEOUT_MS`) que, si el observer nunca emite, pasa `undefined → null` sin pisar sesiones resueltas, y un `try/catch` síncrono sobre la creación de la suscripción (corregido en **2.4**, 10/10/2026, commit `1716a19`; ver `PROPUESTA-2.4.md`). No maneja login/registro/logout: solo observa `onAuthStateChanged`. El login está en `app/login/page.jsx` (`signInWithEmailAndPassword`) y el logout en `app/home/page.jsx` (`signOut`). No hay registro implementado en el repo.
- **`lib/GroupContext.jsx`** — provee `{ groups, loadingGroups }` leyendo la colección `groups` del usuario. Con un solo grupo real hoy, `groups[0]` es el grupo usado en casi todas las suscripciones.

### 2. Capa de datos (services — suscripciones Firestore)

Patrón: **`onSnapshot` + `query` en colecciones**, agrupando por usuario/grupo. No hay capa de caché local ni server-state.

| Service | Colección | Query | Dónde se consume |
|---|---|---|---|
| `subscribeGastos` (`app/gastos/services/subscribeGastos.js`) | `gastos` (personal: `usuario`+`tipo="personal"`; grupo: `groupId`+`tipo="compartido"`) + `transferencias` (por `groupId`) | `orderBy("createdAt","desc")` en c/u; `onLoaded` tras completar todas las queries | `useGastos` |
| `subscribeFixedExpenses` (`app/gastos/services/subscribeFixedExpenses.js`) | `fixed_expense_entries` por `usuario`/`periodo` (personales) y por `groupId`/`periodo` (compartidos) | Deduplica por id entre ambas | `useGastos` |
| `subscribeIngresos` (`app/ingresos/services/subscribeIngresos.js`) | `ingresos` (por `usuario` + rango de mes) y `transferencias` (por `paraUid` + rango de mes) | `orderBy("createdAt","desc")`; emite solo cuando ambas cargaron | `useIngresos` |
| ~~`fixedExpensesService.jsx` (LEGACY)~~ | ~~`fixed_expenses` con `compartido`+`fecha`~~ | **Eliminado en 2.6** (11/10/2026, `10ab576`; 0 importadores) | — |

**Nota importante (requiere índice compuesto):** `subscribeIngresos` usa `where(usuario) + where(createdAt >=/<) + orderBy(createdAt)` → requiere **índice compuesto en Firestore** (`ingresos`: `usuario` + `createdAt`). Ídem `subscribeGastos` (`gastos`: `usuario` + `tipo` + `createdAt`; `gastos`: `groupId` + `tipo` + `createdAt`) y `transferencias` (`groupId` + `createdAt`, `paraUid` + `createdAt`). Si esos índices no existen, la suscripción falla (probablemente con `loading` infinito en la UI). → `REQUIERE_VALIDACIÓN_FIRESTORE`.

### 3. Capa de hooks (UI logic + cálculo)

- **`useGastos`** (`app/gastos/hooks/useGastos.js`) — orquesta las suscripciones de `/gastos`, filtra por mes (`getMonthRange`), calcula: `gastosPersonales` (personales + **transferencias enviadas re-etiquetadas como "Transferencia"**), `gastosPorGrupo` (por grupo: total del grupo y "total del usuario"), `fixedCompartidos` (`montoTotal/2`), `fixedPersonales`, `totalFixed`, y el **total mensual** (`totalGastos`).
- **`useFixedExpenses`** (`app/gastos-fijos/hooks/useFixedExpenses.js`) — datos de `/gastos-fijos`: entradas del mes, estados, balance por gasto fijo compartido, acciones (registrar, saldar, dispensar/dar de baja). **El 50/50 está hardcodeado** (`montoTotal/2`, `participantes.length === 2`).
- **`useIngresos`** (`app/ingresos/hooks/useIngresos.js`) — agrupa ingresos por tipo (sueldo/banda/freelance), suma **transferencias recibidas** al total de ingresos (la sección visual de transferencias está comentada en `app/ingresos/page.jsx:99-111`).
- **`useHomeData`** (`app/home/hooks/useHomeData.js`) — solo datos de saludo/quick actions; el home no muestra datos financieros.
- **Hooks de registro** (`app/agregar/components/*/hooks/*.js`): `useModoUnico`, `useModoCompra`, `useModoIngreso`, `useModoTransferencia`, `useFixedExpense` — gestionan el estado multi-paso de cada tipo de alta.

### 4. Capa de escritura (services submit)

Los writes viven en `app/agregar/components/*/helpers|services/submit*.js`:

| Archivo | Colección | Payload clave |
|---|---|---|
| `submitUnico.js` | `gastos` | `usuario, tipo, monto, detalle, categoria, grupo?, createdAt (serverTimestamp)` |
| `submitCompra.js` | `gastos` | (multi-producto) `..., origenCompra: true` — **campo escrito pero jamás leído** |
| `submitIngreso.js` | `ingresos` | `usuario, tipo, monto, subtipo?, detalle?` |
| `submitTransferencia.jsx` | `transferencias` | `deUid, paraUid, paraNombre, monto, concepto, detalle?` |
| ~~`fixedExpenseHelpers.js` (`submitFixedExpense`)~~ | ~~`fixed_expenses` (schema LEGACY)~~ | **Eliminado en 2.5** (11/10/2026, `3216095`; junto con todo `ModoGastosFijos` y la carpeta `agregar/components/gastos-fijos/`) |
| `useFixedExpenses.agregarGastoPersonal` | `fixed_expenses` (config ACTIVA) | `expenseId, usuario, montoDefault, activo` |
| `useFixedExpenses.registrarGasto/Pago/Saldar` | `fixed_expense_entries` | entries mensuales + estado/participantes |

### 5. Capa de presentación

- Páginas en `app/*/page.jsx` (todas client components) que componen `sections/` + `components/`.
- `app/components/layout/`: `Appshell` (nav bottom), `RouteGuard` (consume `{ user, loading }` de AuthContext y espera la resolución de sesión antes de redirigir; corregido en **2.4**, `1716a19`), `BottomNav`.
- `/login`: formulario email/password (Appshell + card).
- PWA: `next-pwa` genera `manifest.json` + SW en build; en desarrollo se desactiva el registro.

## Flujos end-to-end (resumen)

### Alta de gasto único (personal/compartido)
`/agregar` → `ModoUnico` (paso tipo → detalle → grupo si compartido) → `useModoUnico` → `submitUnico` → write `gastos` → `subscribeGastos` (onSnapshot) → `useGastos` recalcula totales → `/gastos` se actualiza en vivo.

### Alta de compra (multi-producto)
`ModoCompra` → `useModoCompra` (carrito en memoria) → `submitCompra` → write `gastos` (varios docs) → mismo flujo de lectura.

### Gastos fijos (activo, `/gastos-fijos`)
El usuario activa gastos fijos escribiendo **config en `fixed_expenses`** (`{expenseId, usuario, montoDefault, activo}`) vía `useFixedExpenses.agregarGastoPersonal` (`useFixedExpenses.js:180-189`). Por mes se crean **entries** en `fixed_expense_entries` (`registrarGasto`). `/gastos-fijos` lee `fixed_expense_entries`, calcula balance por `groupId`, permite registrar pago (setea `paidByUid`), dispensar y saldar (balance vuelve a 0 sin borrar historial).

> ~~**Legacy:** `app/agregar/components/gastos-fijos/helpers/fixedExpenseHelpers.js` (`submitFixedExpense`) escribe el esquema **legacy** completo en `fixed_expenses`~~ → **código eliminado en 2.5** (11/10/2026, `3216095`). No existe escritor del esquema legacy desde la app; documentos legacy preexistentes en datos permanecen como histórico.

### Transferencias (legacy, deshabilitada en UI pero viva en datos)
`ModoTransferencia`/`useModoTransferencia` se alimenta de `groups.members` + `users` (lectura por doc). En `/agregar` el botón está comentado, pero el flujo completo existe en código y las colecciones `transferencias` **se siguen leyendo** en `/gastos` y `/ingresos`.

## Decisiones/cargas técnicas importantes

1. **`serverTimestamp()`** se usa en `createdAt` de gastos/ingresos/transferencias. **Los filtros de mes se calculan en local (client)** (`getMonthRange`: inicio/fin de mes local representados como `Date`). El desfase entre timezone del cliente y UTC de Firestore puede desplazar movimientos al borde de mes. → `REQUIERE_VALIDACIÓN_FIRESTORE`.
2. **Sin schemas ni types**: no hay validación de estructura en escritura; los esquemas viven implícitos en los forms/helpers ("implicit schema"). Riesgo de doc malformados (ej. `concepto` vs `detalle` en transferencias).
3. **Sin Firestore Rules en el repo** (no consultables).
4. **Sin capa de pruebas**: no hay tests en `package.json` (solo `lint`).
5. **`fixed_expenses` tenía DOS esquemas** en la misma colección: (a) **config activo** `{expenseId, usuario, montoDefault, activo}` escrito por `useFixedExpenses` (vigente) y (b) **legacy** `{nombre, compartido, monto, fecha, balanceado, saldoPendiente}` — **el escritor legacy (`fixedExpenseHelpers`/ModoGastosFijos) fue eliminado en 2.5** (11/10/2026). Queda el riesgo solo en datos históricos preexistentes.
6. **`subscribeIngresos` y `subscribeGastos` no exponen `onError`** (salvo console.error en fixed): si una suscripción falla (permisos/índice), la UI puede quedar en `loading` indefinido. Etapa 2.
7. Los componentes usan `lucide-react` en `app/ingresos/components/Acordeon.jsx`, pero **`lucide-react` NO está en `package.json`** — ese archivo no se importa actualmente; si se usara rompería el build. Etapa 2.

## Limitaciones y riesgos técnicos (resumen)

- Índices compuestos requeridos no verificables desde el repo.
- Esquema implícito / sin validación.
- Doble modelo de gastos fijos en la misma colección.
- 50/50 hardcodeado sin modelo de porcentajes.
- Transferencias (legacy) activas en lecturas.
- UI con botones de alta transferencia/gastos fijos deshabilitados (lógica sin pedir).
- PWA configurada pero sin verificación de build completo en CI (solo `dev`).
- Código muerto acumulado (ver `REPORT-ETAPA-0.md`, sección hallazgos).