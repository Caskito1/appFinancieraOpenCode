# context/arquitectura.md — Cómo funciona técnicamente AppFinanciera

Detalle técnico de implementación, verificado sobre el código (23/09/2026; **actualizado 22/10/2026** con la Etapa 4 — Reintegros). Para el "qué" de negocio ver `context/dominio.md`; para ubicar módulos ver `context/MAPA-APPFINANCIERA.md`.

## Stack

| Componente | Versión / detalle | Evidencia |
|---|---|---|
| Next.js | 16.2.4, App Router, build/dev con `--webpack` | `AppFinanciera/package.json` |
| React / ReactDOM | 19.2.4 | `package.json` |
| Firebase | ^12.12.1 (Auth, Firestore; `getStorage` eliminado en 2.6) | `package.json`, `lib/firebase.js` |
| PWA | `next-pwa` ^5.6.0 (manifest + service worker en build) | `package.json`, `next.config.mjs`, `app/manifest.json` |
| Estilos | Tailwind 4 (`@tailwindcss/postcss`) + `globals.css` | `package.json`, `app/globals.css` |
| Alias | `@/*` → raíz del proyecto (`./`) | `jsconfig.json` |
| Lint | `eslint` (sin script de typecheck) | `package.json` |

Scripts: `dev`, `build`, `start`, `lint` y, desde la Etapa 4, `test:rules` (reglas), `harness:reintegros` (integración) y `seed:emulator` (datos del emulador), los dos primeros vía `emulators:exec`. No hay `typecheck`; el proyecto es JavaScript (`.js`/`.jsx`), no TypeScript.

## Estructura técnica por capas

### 1. Inicialización y contexto (`lib/`)

- **`lib/firebase.js`** — `initializeApp`, `getAuth`, `getFirestore`. Exporta `auth`, `googleProvider`, `db`. *(El import de `getStorage` y `export storage` fueron eliminados en **2.6**, 11/10/2026, `10ab576`; `storageBucket` permanece en el config.)*
- **`lib/AuthContext.jsx`** — provee contexto de autenticación exponiendo `{ user, loading }`, donde `loading = user === undefined` (sesión aún no resuelta por `onAuthStateChanged`). Incluye salvaguarda de 8 s (`AUTH_RESOLVE_TIMEOUT_MS`) que, si el observer nunca emite, pasa `undefined → null` sin pisar sesiones resueltas, y un `try/catch` síncrono sobre la creación de la suscripción (corregido en **2.4**, 10/10/2026, commit `1716a19`; ver `docs/propuestas/PROPUESTA-2.4.md`). No maneja login/registro/logout: solo observa `onAuthStateChanged`. El login está en `app/login/page.jsx` (`signInWithEmailAndPassword`) y el logout en `app/home/page.jsx` (`signOut`). No hay registro implementado en el repo.
- **`lib/GroupContext.jsx`** — provee `{ groups, loadingGroups }` leyendo la colección `groups` del usuario. Con un solo grupo real hoy, `groups[0]` es el grupo usado en casi todas las suscripciones.

### 2. Capa de datos (services — suscripciones Firestore)

Patrón: **`onSnapshot` + `query` en colecciones**, agrupando por usuario/grupo. No hay capa de caché local ni server-state.

| Service | Colección | Query | Dónde se consume |
|---|---|---|---|
| `subscribeGastos` (`app/gastos/services/subscribeGastos.js`) | `gastos` (personal: `usuario`+`tipo="personal"`; grupo: `groupId`+`tipo="compartido"`) | `orderBy("createdAt","desc")` en c/u; `onLoaded` tras completar todas las queries. **4.5-fecha:** la query **no** filtra por fecha; `useGastos` filtra y ordena en cliente por `fechaEfectiva` (`fecha ?? createdAt`) — un `where("fecha", …)` excluiría los documentos sin `fecha` | `useGastos` |
| `subscribeFixedExpenses` (`app/gastos/services/subscribeFixedExpenses.js`) | `fixed_expense_entries` por `usuario`/`periodo` (personales) y por `groupId`/`periodo` (compartidos) | Deduplica por id entre ambas | `useGastos` |
| `subscribeReintegros` (`app/reintegros/services/subscribeReintegros.js`, 4.1) | `reintegros` + `reintegro_devoluciones` (esta última por tandas `in` de a 10, `TANDA`) | `orderBy("createdAt","desc")`; recibe `db` como parámetro (la app pasa el de `@/lib`, el harness el del emulador); `onData` solo cuando cargan ambas (fix del `emit()` en 4.3b) | `useReintegros` |
| `subscribeIngresos` (`app/ingresos/services/subscribeIngresos.js`) | `ingresos` (por `usuario`, **sin rango**) — **una sola query desde 4.5** | `orderBy("createdAt","desc")`; **4.5:** sin query de transferencias ni `emitIfReady`. **4.5-fecha:** el período de ingresos se filtra/ordena en cliente con `fechaEfectiva` (`fecha ?? createdAt`) — un `where("fecha", …)` excluiría los docs sin `fecha` | `useIngresos` |
| ~~`fixedExpensesService.jsx` (LEGACY)~~ | ~~`fixed_expenses` con `compartido`+`fecha`~~ | **Eliminado en 2.6** (11/10/2026, `10ab576`; 0 importadores) | — |

**Nota importante (requiere índice compuesto):** `subscribeIngresos` usa `where(usuario) + orderBy(createdAt)` (sin rango desde 4.5-fecha) → requiere **índice compuesto en Firestore** (`ingresos`: `usuario` + `createdAt`). Ídem `subscribeGastos` (`gastos`: `usuario` + `tipo` + `createdAt`; `gastos`: `groupId` + `tipo` + `createdAt`). Los índices de `transferencias` dejaron de usarse con el retiro de 4.5. Si esos índices no existen, la suscripción falla (probablemente con `loading` infinito en la UI). → `REQUIERE_VALIDACIÓN_FIRESTORE`.

### 3. Capa de hooks (UI logic + cálculo)

- **`useGastos`** (`app/gastos/hooks/useGastos.js`) — orquesta las suscripciones de `/gastos`, filtra por mes (`getMonthRange`) con **`fechaEfectiva` (`fecha ?? createdAt`, 4.5-fecha)** y ordena por fecha efectiva desc, calcula: `gastosPersonales` (solo personales reales desde 4.5), `gastosPorGrupo` (por grupo: total del grupo y "total del usuario"), `fixedCompartidos` (`montoTotal/2`), `fixedPersonales`, `totalFixed`, y el **total mensual** (`totalGastos`).
- **`useFixedExpenses`** (`app/gastos-fijos/hooks/useFixedExpenses.js`) — datos de `/gastos-fijos`: entradas del mes, estados, balance por gasto fijo compartido, acciones (registrar, saldar, dispensar/dar de baja). **El 50/50 está hardcodeado** (`montoTotal/2`, `participantes.length === 2`).
- **`useIngresos`** (`app/ingresos/hooks/useIngresos.js`) — filtra por mes con **`fechaEfectiva`** y ordena por fecha efectiva (4.5-fecha), agrupa ingresos por tipo (sueldo/banda/freelance/otros), **`totalIngresos` = solo ingresos reales** (4.5 retiró las transferencias recibidas) y expone **editar/eliminar** (`updateDoc`/`deleteDoc`) + `editingIngreso` para `EditarIngresoModal`.
- **`useReintegros`** (`app/reintegros/hooks/useReintegros.js`, 4.1) — suscribe `subscribeReintegros` y deriva estados/indicadores con `sentidoDelViewer` (saldo, estado, entradas/salidas del mes, reconciliación D-7 solo en dev) desde `app/reintegros/helpers/modelo.js`. **4.3-bis (23/10/2026):** `salidasDelMes` solo suma pagos cuya obligación siga activa (Set de ids sin `eliminacion`, espejo de `entradasDelMes.recibidas`) — una obligación eliminada hace que sus entregas conservadas dejen de contar en ambos libros; condonadas y liquidadas siguen contando (solo `eliminacion` filtra). Detalle y diff: `docs/evidencia/EVIDENCIA-4.3-bis.md` §2.
- **`useEdiciones`** (`app/reintegros/hooks/useEdiciones.js`, 4.3b) — suscripción a los eventos `edicion/` de las obligaciones activas (una por `rid`; los eventos no admiten collection-group) para el chip «Editado»; se desuscribe al cambiar de pestaña.
- **`useReintegroModal`** (`app/agregar/components/reintegros/hooks/useReintegroModal.js`, 4.2) — estado del alta en un paso desde `/agregar` (incluye el `rid` fijo que evita duplicados en reintentos).
- **`useHomeData`** (`app/home/hooks/useHomeData.js`) — solo datos de saludo/quick actions; el home no muestra datos financieros.
- **Hooks de registro** (`app/agregar/components/*/hooks/*.js`): `useModoUnico`, `useModoCompra`, `useModoIngreso` — gestionan el estado multi-paso de cada tipo de alta (`useFixedExpense` **fue eliminado en 2.5** junto con `ModoGastosFijos`; alta de reintegros en `useReintegroModal`, arriba).

### 4. Capa de escritura (services submit)

Los writes viven en `app/agregar/components/*/helpers|services/submit*.js`:

| Archivo | Colección | Payload clave |
|---|---|---|
| `submitUnico.js` | `gastos` | `usuario, tipo, monto, detalle, categoria, grupo?, fecha (Timestamp), createdAt (serverTimestamp)` — `fecha` desde 4.5-fecha; `createdAt` es auditoría inmutable |
| `submitCompra.js` | `gastos` | (multi-producto) `..., fecha (un Timestamp para todos los ítems), origenCompra: true` — `origenCompra` es **campo escrito pero jamás leído** |
| `submitIngreso.js` | `ingresos` | `usuario, tipo, monto, subtipo?, detalle?, fecha (Timestamp), createdAt (serverTimestamp)` — `fecha` desde 4.5-fecha; `createdAt` es auditoría inmutable |
| `submitReintegro.js` (`app/agregar/components/reintegros/helpers/`) | `reintegros` + `reintegros/{rid}/eventos` | transacción: `registradoPor, registradoPorNombre, contraparteUid, contraparteNombre, participantes, groupId, sentido, monto, devuelto: 0, movimientoInicial, concepto, detalle, gastoVinculadoId: null, createdAt` (+ `movimientoInicialTipo` solo en `por_cobrar`) + evento `creacion/obligacion` con `monto` y `sentido` (4.4-bis) |
| `submitDevolucion.js` | `reintegro_devoluciones` + `reintegros/{rid}` (`devuelto`) + `eventos` | transacción: entrega `{reintegroId, monto, realizadoPorUid, realizadoPorNombre, registradoPor, registradoPorNombre, fechaPago, detalle, createdAt}` (la ref se captura antes para publicar su id); `devuelto += monto` exacto (acople 3.8) + evento `creacion/entrega` con `entregaId` y `monto` (4.4-bis) |
| `editarObligacion.js` / `editarEntrega.js` (4.3b) | `reintegros` / `reintegro_devoluciones` + `eventos` | update de `monto` (obligación: solo con `devuelto == 0` y solo registrador) + evento `edicion/` (`montoAnterior`, `montoNuevo`, + `entregaId`) |
| `eliminarEntrega.js` / `eliminarObligacion.js` / `condonar.js` (4.3-bis) | `reintegros` / `reintegro_devoluciones` + `eventos` | constancia `eliminacion`/`condonacion` + evento `eliminacion/` o `condonacion/` (`entregaId` cuando la entidad es entrega; `monto` — `montoEliminado` en `eliminacion/entrega`, alias heredado —, `devuelto` —salvo entrega—, `motivo`). Esquema canónico: `context/dominio.md` §5.3 |
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

### Transferencias (legacy) — RETIRADAS en 4.5 (03/11/2026)
~~`ModoTransferencia`/`useModoTransferencia` se alimenta de `groups.members` + `users`; el flujo completo existe en código y las colecciones `transferencias` se siguen leyendo en `/gastos` y `/ingresos`.~~ → **Retirado en 4.5 (`f4a1cd7`):** se eliminaron el alta, el escritor, las lecturas y la UI; la colección queda intacta en Firestore pero la app no la lee ni escribe. Las reglas de `transferencias` se conservan (copia de consola).

### Reintegros (alta, pago, edición — 4.1–4.3)
`/agregar` → `ReintegroModal` (un paso; `rid` fijo al abrir) → `submitReintegro` (runTransaction: doc `reintegros` + evento `creacion/obligacion`) → `subscribeReintegros` → `/reintegros` (balance, pestañas Activos/Saldados, acordeones) en vivo. **Pago:** `DevolucionModal` → `submitDevolucion` (transacción: entrega en `reintegro_devoluciones`, `devuelto += monto`, evento `creacion/entrega`). **Edición:** `EditarReintegroModal` → `editarObligacion`/`editarEntrega` (+ evento `edicion/`), chips de edición vía `useEdiciones`. **Acciones 4.3-bis (24/10/2026):** menú ⋮ (`FilaReintegro`) → hoja **`MenuAccionesSheet` montada en `page.jsx`** como los otros modales — el acordeón `overflow-hidden`+`backdrop-blur` recorta los hijos `fixed` y un `createPortal` a `document.body` tapaba el `BottomNav` (descartado 24/10) → `ConfirmarAccionModal` → `condonar`/`eliminarObligacion`/`eliminarEntrega` (guardas cliente `ELIMINADA`/`CONDONADA`/`LIQUIDADA`/`NO_REGISTRADOR`/`NO_ACREEDOR`; eliminación lógica con constancia, sin cascada). **Regla estricta de Cerradas (24/10/2026):** en liquidadas/perdonadas no hay edición ni eliminación ni menú (D-9 opción B retirada). Sin confirmación bilateral (decisión 17/10/2026); reglas con ámbito `reintegros`/`reintegro_devoluciones`/`eventos` (create-only).

## Decisiones/cargas técnicas importantes

1. **`serverTimestamp()`** se usa en `createdAt` de gastos/ingresos. **Los filtros de mes se calculan en local (client)** (`getMonthRange`: inicio/fin de mes local representados como `Date`). El desfase entre timezone del cliente y UTC de Firestore puede desplazar movimientos al borde de mes. → `REQUIERE_VALIDACIÓN_FIRESTORE`.
   **4.5-fecha (03/11/2026):** el gasto diario tiene **`fecha`** (Timestamp de cliente, medianoche **local** del día elegido) y el período se deriva de `fecha` con **fallback a `createdAt`** (`fechaEfectiva`, `app/gastos/helpers/dateHelpers.js`). `createdAt` queda como auditoría inmutable. **Etapa 5 / 5.1:** `balanceDelMes` debe usar el mismo criterio y **no puede filtrar con `where("fecha", …)`** (excluiría los docs sin `fecha`).
2. **Sin schemas ni types**: no hay validación de estructura en escritura; los esquemas viven implícitos en los forms/helpers ("implicit schema"). Riesgo de doc malformados (ej. `concepto` vs `detalle` en transferencias).
3. **Firestore Rules versionadas desde 4.0** (`ff47291`): `firestore.rules`, `firestore.indexes.json` y `firebase.json` en el repo (ámbito completo de la app, incl. `reintegros`, `reintegro_devoluciones` y `reintegros/{rid}/eventos` create-only). El deploy a Producción queda pendiente hasta el cierre de la Etapa 4 (orden en `EVIDENCIA-4.3.md` §6.1). → `REQUIERE_VALIDACIÓN_FIRESTORE`.
4. **Capa de pruebas desde 4.0/4.1:** `npm run test:rules` (reglas, `tests/rules/`, **71/71**: 44 Reintegros + 14 gastos + 13 ingresos) y `npm run harness:reintegros` (integración contra emulador, `tests/harness/`, 57/57) vía `emulators:exec --project demo-finanzas`; **`npm run test:gastos`** (unitario, `tests/unit/`, 8/8, sin emulador — fallback de fecha 4.5-fecha); `npm run seed:emulator` crea datos de prueba. `test:rules` corre con `--test-concurrency=1` (los archivos comparten emulador). Sin typecheck (JS puro).
5. **`fixed_expenses` tenía DOS esquemas** en la misma colección: (a) **config activo** `{expenseId, usuario, montoDefault, activo}` escrito por `useFixedExpenses` (vigente) y (b) **legacy** `{nombre, compartido, monto, fecha, balanceado, saldoPendiente}` — **el escritor legacy (`fixedExpenseHelpers`/ModoGastosFijos) fue eliminado en 2.5** (11/10/2026). Queda el riesgo solo en datos históricos preexistentes.
6. **`subscribeIngresos` y `subscribeGastos` no exponen `onError`** (salvo console.error en fixed): si una suscripción falla (permisos/índice), la UI puede quedar en `loading` indefinido. Etapa 2.
7. Los componentes usan `lucide-react` en `app/ingresos/components/Acordeon.jsx`, pero **`lucide-react` NO está en `package.json`** — ese archivo no se importa actualmente; si se usara rompería el build. Etapa 2.

## Limitaciones y riesgos técnicos (resumen)

- Índices compuestos requeridos no verificables desde el repo.
- Esquema implícito / sin validación.
- Doble modelo de gastos fijos en la misma colección.
- 50/50 hardcodeado sin modelo de porcentajes.
- ~~Transferencias (legacy) activas en lecturas~~ → **retiradas en 4.5 (03/11/2026)**.
- UI con botón de alta de gastos fijos deshabilitado (lógica sin pedir).
- PWA configurada pero sin verificación de build completo en CI (solo `dev`).
- Código muerto acumulado (ver `docs/reportes/REPORT-ETAPA-0.md`, sección hallazgos).