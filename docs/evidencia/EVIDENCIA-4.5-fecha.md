# EVIDENCIA-4.5-fecha — Fecha del gasto diario (período por `fecha`, fallback `createdAt`)

**Estado:** **IMPLEMENTACIÓN COMPLETA — cierre pendiente.** Commit de código en `AppFinanciera/staging`: **`9d350d2`** (local, **sin push**). Gates corridos: `test:gastos` **8/8**, `harness:reintegros` **57/57**, `test:rules` **44/44** (reglas **sin cambios**), lint baseline 4 (0 nuevos), build OK.
**Pendiente para cerrar:** (1) **Paso 0 / reglas** — falta el **texto de la consola** (Firebase Console → Firestore → Rules) para diffear y, si corresponde, hacer el commit de sincronización + el cambio de `gastos`; (2) **verificación funcional en Staging** (requiere push, autorización aparte).
Repo: `AppFinanciera/` · rama `staging` · sin tocar `main` · **0 escrituras en Firestore real**.

---

## 1. Alcance (aprobado 03/11/2026)

- **Campo `fecha` (Timestamp)** en el gasto diario: alta modo único, alta modo compra y edición.
- **Período/mes derivado de `fecha`**, con **fallback a `createdAt`** en los documentos históricos.
- **`createdAt` queda como auditoría inmutable** (nunca se escribe desde la edición).
- **Sin migración ni backfill**; los gastos de octubre cargados por consola no se tocan.
- **Una fecha por compra** (no por ítem).
- **`fecha` opcional en reglas** (compatibilidad con clientes viejos), **obligatoria en la app**.
- **Sin dependencias nuevas**; **`subscribeGastos.js` sin cambios** (el fallback depende de no cambiar la query).

---

## 2. Criterio de fecha (modelo)

| Caso | Comportamiento |
|---|---|
| Gasto nuevo (app 4.5-fecha) | `fecha` = Timestamp a **medianoche local** del día elegido; `createdAt` = `serverTimestamp()` (auditoría) |
| Documento histórico sin `fecha` | Se lee con **fallback a `createdAt`** — mismo comportamiento que antes del cambio |
| Documento sin `fecha` ni `createdAt` | `fechaEfectiva` → `null`; no aparece en ningún mes (no se inventa fecha) |
| Edición de un documento histórico | El modal inicializa con `createdAt`; al guardar agrega `fecha` (**upgrade perezoso**, sin backfill) |
| Transferencias | Sin `fecha`: siguen entrando por `createdAt` (fallback), sin cambio de comportamiento |

**Por qué medianoche local:** misma convención que `DevolucionModal` (reintegros). Un parseo UTC correría el día —y en el borde, el mes—. El filtro de mes (`getMonthRange`) también es local, así que ambos lados coinciden.

**Efecto lateral positivo:** `fecha` es un Timestamp de cliente (no `serverTimestamp()`), así que un gasto recién creado aparece en su mes **sin esperar el ack del servidor** (con `createdAt` pendiente, el snapshot local lo trae `null` y el gasto “desaparecía” hasta confirmar).

---

## 3. Cambios de código (commit `9d350d2`)

### 3.1 Helpers — `app/gastos/helpers/dateHelpers.js` (puro, sin SDK)

| Export | Función |
|---|---|
| `aDate(valor)` | `Timestamp` \| `Date` \| `string` → `Date` \| `null` (duck-typing de `toDate`) |
| `fechaEfectiva(item)` | `fecha ?? createdAt` — **el criterio único del período** |
| `fechaLocal(iso)` | `'YYYY-MM-DD'` → `Date` a medianoche **local** (el caller lo envuelve en `Timestamp`) |
| `isoDeFecha(valor)` | `Timestamp`/`Date` → `'YYYY-MM-DD'` local (inicializa `<input type="date">`) |
| `hoyISO()` | `'YYYY-MM-DD'` de hoy (default y `max` del input) |
| `getMonthRange(date)` | **sin cambios** |

El archivo no importa el SDK: el fallback se testea con `node --test` sin emulador.

### 3.2 Lectura — `/gastos`

| Archivo | Cambio |
|---|---|
| `app/gastos/hooks/useGastos.js` | `enMes` usa `fechaEfectiva`; `gastosPersonales` y `gastosPorGrupo` se ordenan por fecha efectiva desc (`tiempo`/`porFechaDesc`) |
| `app/gastos/components/FilaGasto.jsx` | La fila muestra `fechaEfectiva(gasto)` (fallback `createdAt`) |
| `app/gastos/services/subscribeGastos.js` | **SIN CAMBIOS** — sigue trayendo todo con `orderBy("createdAt")`; filtrar/ordenar en cliente es lo que preserva el fallback (un `where("fecha", …)` excluiría los docs sin `fecha`) |

Los totales (`TotalMesCard`, `totalGastos`, `totalTransacciones`) no se tocaron: derivan de las listas ya filtradas.

### 3.3 Alta modo único

| Archivo | Cambio |
|---|---|
| `app/agregar/components/unico/hooks/useModoUnico.js` | Estado `fecha` (`hoyISO`) + `setFecha` |
| `app/agregar/components/ModoUnico.jsx` | `<input type="date" max={hoyISO()}>` en el paso `detalle`; `canSubmit` exige `fecha`; pasa `fechaISO` |
| `app/agregar/components/unico/helpers/submitUnico.js` | `fecha: Timestamp.fromDate(fechaLocal(fechaISO))` + `createdAt: serverTimestamp()` intacto |

### 3.4 Alta modo compra

| Archivo | Cambio |
|---|---|
| `app/agregar/components/compra/hooks/useModoCompra.js` | Estado `fecha` (`hoyISO`), `canFinish` exige `fecha`, pasa `fechaISO` |
| `app/agregar/components/compra/sections/PasoResumen.jsx` | Un `<input type="date">` para toda la compra |
| `app/agregar/components/compra/helpers/submitCompra.js` | **El mismo `Timestamp` para todos los ítems del batch** |

### 3.5 Edición

`app/gastos/components/EditarGastoModal.jsx`: input de fecha inicializado con `isoDeFecha(gasto.fecha ?? gasto.createdAt)`; `canSave` exige fecha; el payload agrega `fecha` y **nunca** `createdAt`.

---

## 4. Reglas — Paso 0 (PENDIENTE)

**No se modificó `firestore.rules` en este commit.** El Paso 0 no puede cerrarse sin el **texto pegado de la consola** (decisión 03/11/2026: sin Rules API con credenciales).

- Si el texto de consola **coincide** con el repo: no hay commit de sincronización; se aplica solo el cambio de `gastos`.
- Si **difiere**: primero un **commit de sincronización** con el texto real y el delta documentado; después el cambio de `gastos`. Los tests de reglas se escriben contra el texto real.

**Cambio previsto (no aplicado aún), sobre el texto vigente:**

```js
function fechaGastoValida(f) {
  return f is timestamp
    && f >= timestamp.date(2020, 1, 1)
    && f <= request.time + duration.value(1, 'd');
}

// create:  ... && (!('fecha' in request.resource.data) || fechaGastoValida(request.resource.data.fecha))
//          && request.resource.data.createdAt == request.time        (conservar si ya está en consola)
// update:  ... && request.resource.data.createdAt == resource.data.createdAt
//          && (!('fecha' in request.resource.data) || fechaGastoValida(request.resource.data.fecha))
```

`fecha` **opcional** en reglas: un cliente viejo en caché sigue creando sin `fecha` y el fallback lo cubre.

**Riesgo a vigilar en Staging:** si las reglas desplegadas validan un **conjunto cerrado de campos** (`hasOnly`) en `gastos`, el nuevo campo `fecha` haría fallar el alta. El texto versionado no tiene esa validación; se confirma con el diff del Paso 0.

---

## 5. Tests

### 5.1 Nuevo `tests/unit/gastosFecha.test.mjs` — 8/8

| # | Caso |
|---|---|
| 1 | `fecha` manda sobre `createdAt` (gasto cargado a mes vencido: `fecha` oct, `createdAt` nov) |
| 2 | Sin `fecha`: fallback a `createdAt` (documento histórico) |
| 3 | Sin `fecha` ni `createdAt`: `null` (no inventa fecha) |
| 4 | Acepta `Date` y `string` además de `Timestamp` |
| 5 | Un gasto de octubre **no** cae en el rango de noviembre |
| 6 | Un gasto de noviembre **no** cae en el rango de octubre |
| 7 | `fechaLocal`/`isoDeFecha` conservan el día local (sin corrimiento; hora 00:00) |
| 8 | `hoyISO` tiene formato `YYYY-MM-DD` |

Nuevo script: `npm run test:gastos` (`node --experimental-detect-module --test tests/unit/`).

### 5.2 Hallazgo: H29 del harness de Reintegros era una bomba de calendario

`H29 — espejo con monto editado` sembraba con `baseObl` (`createdAt: Timestamp.now()`) y consultaba el rango **hardcodeado** de octubre 2026 (`new Date(2026, 9, 1)`). Al pasar el calendario a **noviembre**, el caso devolvía `0` en vez de `1500`.

- **No es una regresión de 4.5-fecha.** Verificado con el árbol **sin cambios** (`git stash -u` → mismo fallo: 56/57, `not ok 39`).
- **Fix mínimo (solo test):** el rango se deriva del mes real (`ahora.getFullYear()/getMonth()`), conservando el intento del caso (“createdAt = ahora”). Sin cambios de lógica de producto.
- **Para el Organizador:** cualquier test que mezcle `Timestamp.now()` con un mes fijo es una bomba de calendario; este era el único del harness (los demás fijan `createdAt` explícito).

---

## 6. Gates (03/11/2026)

| Gate | Resultado |
|---|---|
| `npm run test:gastos` | **8/8** (fail 0) |
| `npm run harness:reintegros` | **57/57** (fail 0, exit 0) — incluye el fix de H29 |
| `npm run test:rules` | **44/44** (fail 0) — `firestore.rules` **sin cambios** |
| `npm run lint` | baseline exacta 4 (`useIngresos.js:39`, `GroupContext.jsx:17`, `HomeHeader.jsx:28`, `page.js:10`), **0 nuevos** |
| `npm run build` | `✓ Compiled successfully`, 10 páginas, exit 0 |
| Escrituras en Firestore real | **0** (todo local; sin push) |

---

## 7. Compatibilidad y datos

- **Sin migración.** Los documentos sin `fecha` se leen por `createdAt`: comportamiento idéntico al anterior.
- **Gastos de octubre cargados por consola:** si tienen `createdAt` de octubre, se ven por fallback; si el lote se cargó también con `fecha` (recomendado), quedan canónicos desde el origen.
- **Cliente viejo / PWA en caché:** sigue creando sin `fecha` (reglas lo permitirán) y aparece por `createdAt`.
- **`REQUIERE_VALIDACIÓN_FIRESTORE` (read-only, no bloqueante):** contar documentos de `gastos` sin `fecha` **y** sin `createdAt` (serían invisibles antes y después; el fix no puede inventarles fecha).

---

## 8. Contrato para la Etapa 5 (5.1)

`balanceDelMes(mes, uid)` **debe** derivar el período con el mismo criterio: `fecha`, con **fallback a `createdAt`**.

**No puede resolverse con `where("fecha", ">=", inicio)`**: ese query **excluye los documentos sin `fecha`** (el fallback se rompe a nivel de query, no de filtro). Opciones válidas para 5.1:

1. filtrar en cliente como hace hoy `/gastos` (traer y filtrar), o
2. introducir `periodo: "YYYY-MM"` **con backfill** en ese momento (decisión de 5.1, no de esta subetapa).

Documentado en `ROADMAP.md` (Etapa 5), `context/dominio.md` (§3.1) y `context/arquitectura.md`.

---

## 9. Cierre (PENDIENTE)

- [x] Código + tests + gates locales.
- [x] Docs de apertura (HANDOFF §0/§4, PROPUESTA §1.6, AGENTS, ROADMAP).
- [x] `context/dominio.md`, `context/arquitectura.md`, `context/MAPA-APPFINANCIERA.md`.
- [ ] **Paso 0 / reglas** (texto de consola → diff → sincronización si hay delta → cambio de `gastos` → tests de reglas `44 + N`).
- [ ] **Push a `staging`** (autorización aparte) y **verificación funcional**: alta con fecha de octubre estando en noviembre → aparece en octubre, **no** en noviembre, suma en el total de octubre; edición que mueve de mes; doc legacy sin `fecha` visible por fallback.
- [ ] Entrada datada en `ROADMAP.md` §Histórico con el commit de cierre (al cerrar).

**Siguiente:** 4.5 (retiro de Transferencias), sin cambios en su alcance.
