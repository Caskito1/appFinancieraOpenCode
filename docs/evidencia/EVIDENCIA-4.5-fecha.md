# EVIDENCIA-4.5-fecha — Fecha del gasto y del ingreso diario (período por `fecha`, fallback `createdAt`)

**Estado:** **CERRADA 03/11/2026.** Commits en `AppFinanciera/staging` (locales, **sin push**): **`9d350d2`** (gastos: app + tests unitarios), **`bbd3345`** (reglas de `gastos` + 14 tests) y **`6c708ef`** (ingresos: fecha + edit/delete + reglas + 13 tests) + **este commit** (docs del repo padre). Gates: `test:rules` **71/71**, `test:gastos` **8/8**, `harness:reintegros` **57/57**, lint baseline 4 (0 nuevos), build OK. **Verificación funcional local aprobada por el usuario** (§9).
**Paso 0 CERRADO (03/11/2026):** el texto de consola pegado por el usuario **coincide** con el BLOQUE A del repo ⇒ **sin delta, sin commit de sincronización**.
**Diferido al cierre de la Etapa 4 (no bloqueante):** (1) **push a Staging + verificación en Staging**; (2) **deploy de reglas**, junto con el BLOQUE B de Reintegros.
Repo: `AppFinanciera/` · rama `staging` · sin tocar `main` · **0 escrituras en Firestore real**.

---

## 1. Alcance (aprobado 03/11/2026; ampliado el 03/11/2026 a ingresos)

**Gastos:**
- **Campo `fecha` (Timestamp)** en el gasto diario: alta modo único, alta modo compra y edición.
- **Período/mes derivado de `fecha`**, con **fallback a `createdAt`** en los documentos históricos.
- **`createdAt` queda como auditoría inmutable** (nunca se escribe desde la edición).
- **Sin migración ni backfill**; los gastos de octubre cargados por consola no se tocan.
- **Una fecha por compra** (no por ítem).
- **`fecha` opcional en reglas** (compatibilidad con clientes viejos), **obligatoria en la app**.
- **Sin dependencias nuevas**; **`subscribeGastos.js` sin cambios** (el fallback depende de no cambiar la query).

**Ingresos (ampliación 03/11/2026):**
- **Campo `fecha` (Timestamp)** en el alta de ingreso (mismo criterio: medianoche local, `max=hoy`).
- **Edit y delete nuevos** (`EditarIngresoModal`): monto, detalle, tipo/subtipo y `fecha` editables; `createdAt` nunca se envía. Conectado a Sueldo, Bandas, Freelance y Otros.
- **`subscribeIngresos` sin rango por `createdAt`**: trae todo y el período se filtra/ordena en cliente con `fechaEfectiva`. **Las transferencias de `/ingresos` no cambian.**
- **Reglas `ingresos`**: mismo esquema que `gastos` (`fecha` opcional con rango, `createdAt` inmutable, update/delete separados).
- **Sin tocar** `transferencias`, `fixed_expenses` ni `reintegros`.

---

## 2. Criterio de fecha (modelo)

| Caso | Comportamiento |
|---|---|
| Gasto nuevo (app 4.5-fecha) | `fecha` = Timestamp a **medianoche local** del día elegido; `createdAt` = `serverTimestamp()` (auditoría) |
| Ingreso nuevo (app 4.5-fecha) | Mismo criterio que el gasto: `fecha` a medianoche local + `createdAt` de auditoría |
| Documento histórico sin `fecha` (gasto o ingreso) | Se lee con **fallback a `createdAt`** — mismo comportamiento que antes del cambio |
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

### 3.6 Ingresos (ampliación 03/11/2026, commit `6c708ef`)

| Archivo | Cambio |
|---|---|
| `app/agregar/components/ingresos/hooks/useModoIngreso.js` | Estado `fecha` (`hoyISO`) + `setFecha` |
| `app/agregar/components/ingresos/sections/PasoDetalleIngreso.jsx` | `<input type="date" max={hoyISO()}>` (paso detalle) |
| `app/agregar/components/ModoIngreso.jsx` | `canSubmit` exige `fecha`; pasa `fechaISO` |
| `app/agregar/components/ingresos/helpers/submitIngreso.js` | `fecha: Timestamp.fromDate(fechaLocal(fechaISO))`; `createdAt: serverTimestamp()` intacto |
| `app/ingresos/services/subscribeIngresos.js` | **Se quitó el rango por `createdAt`** de la query de ingresos (`where usuario` + `orderBy createdAt`); el período se deriva en cliente. **Transferencias sin cambios** |
| `app/ingresos/hooks/useIngresos.js` | `ingresosMes` filtrado por `fechaEfectiva` y ordenado por `porFechaDesc`; secciones y `totalIngresos` derivan de `ingresosMes`; **nuevos** `editarIngreso`/`eliminarIngreso` + `editingIngreso` |
| `app/ingresos/components/EditarIngresoModal.jsx` (**nuevo**) | Modal de edición (patrón `EditarGastoModal`): monto, detalle, tipo/subtipo, **fecha**; `createdAt` nunca se envía; delete con confirmación |
| `app/ingresos/components/FilaIngreso.jsx` | Muestra `fechaEfectiva`; menú ⋯ / long-press con Editar y Eliminar; prop `compact` para Bandas |
| `app/ingresos/sections/{Sueldo,Bandas,Freelance,Otros}Section.jsx` | Reciben `onEdit`/`onDelete`; Bandas reutiliza `FilaIngreso` (compact) |
| `app/ingresos/page.jsx` | Estado `editingIngreso` + render del modal; acciones conectadas a las 4 secciones |

**Índices:** la query nueva (`usuario` == + `orderBy("createdAt")`) usa el **mismo índice compuesto** que la anterior (que además tenía rango); no se agrega ninguno.

---

## 4. Reglas — Paso 0 (CERRADO: sin delta) + enmienda 4.5-fecha

### 4.1 Paso 0 — diff consola vs repo

El usuario pegó el **texto completo de Firebase Console → Firestore → Rules** (03/11/2026). Resultado:

- **BLOQUE A (reglas vigentes) = copia del repo:** helpers, `groups`, `gastos`, `ingresos`, `transferencias`, `fixed_expenses`, `fixed_expense_entries`, `users` coinciden. **Sin delta ⇒ sin commit de sincronización.**
- **Único delta del repo: BLOQUE B (Reintegros)**, ya versionado como “PROPUESTO” y **no desplegado** — coincide con la advertencia de `ROADMAP.md` (Reintegros no se usa en Staging hasta el cierre de la Etapa 4).

**Hallazgo (corrige la premisa del pedido):** las reglas desplegadas **no** exigían `createdAt == request.time` en create ni `createdAt == resource.data.createdAt` en update. El bloque `gastos` solo validaba `usuario`/`tipo`/`groupId`; el update, solo el dueño. **No hay whitelist de campos** ⇒ `fecha` ya estaba permitida y la verificación funcional **no depende** del deploy de reglas.

### 4.2 Enmienda aplicada (decisión b, 03/11/2026)

Además de `fecha`, se formaliza la auditoría que el diseño asume (`createdAt` inmutable). El helper se llama **`fechaValida`** y lo comparten `gastos` e `ingresos`:

```js
function fechaValida(f) {
  return f is timestamp
    && f >= timestamp.date(2020, 1, 1)
    && f <= request.time + duration.value(1, 'd');
}
// gastos e ingresos:
// create:  fecha opcional + `createdAt == request.time`
// update:  `createdAt` inmutable (defensivo si el doc no lo tiene) + fecha válida
// delete:  regla separada (en un delete `request.resource` es null)
```

- **`fecha` opcional en reglas** (compatibilidad con clientes viejos); obligatoria en la app.
- **Update y delete separados:** leer `request.resource.data` en un delete denegaría el borrado.
- **Forma defensiva del update** (`!('createdAt' in resource.data) || …`): un documento histórico cargado por consola sin `createdAt` sigue siendo editable.
- **Sin whitelist de campos:** `tipo`/`groupId` siguen mutables (el modal permite personal↔compartido); `usuario`/`monto`/etc. también — **deuda preexistente** (§7), fuera del alcance de 4.5-fecha.
- **Header del BLOQUE A** actualizado con nota datada: la copia de consola quedó **verificada sin cambios** el 03/11/2026 y la enmienda es solo de `gastos`.

**Deploy:** pendiente, junto con el BLOQUE B en el cierre de la Etapa 4. Producción funciona sin este cambio (no hay whitelist de campos).

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

### 5.3 Reglas — nuevo `tests/rules/gastos.rules.test.mjs` (14/14)

Contra el `firestore.rules` del repo (mismo patrón que el archivo de Reintegros):

| # | Caso | Esperado |
|---|---|---|
| 1 | create con `fecha` de un mes anterior | allow |
| 2 | create **sin** `fecha` (cliente viejo) | allow |
| 3 | create con `fecha` de hoy (medianoche local) | allow |
| 4 | create con `fecha` string | deny |
| 5 | create con `fecha` anterior a 2020 | deny |
| 6 | create con `fecha` > `request.time + 1 día` | deny |
| 7 | create con `createdAt` explícito (≠ `request.time`) | deny |
| 8 | create con `usuario` ajeno | deny |
| 9 | create compartido con grupo del que soy miembro | allow |
| 10 | update propio: cambia `fecha`, `createdAt` intacto | allow |
| 11 | update que mueve `createdAt` | deny |
| 12 | update con `fecha` inválida | deny |
| 13 | update de un gasto ajeno | deny |
| 14 | **delete propio** (regresión de la separación update/delete) | allow |

### 5.4 Reglas de ingresos — nuevo `tests/rules/ingresos.rules.test.mjs` (13/13)

| # | Caso | Esperado |
|---|---|---|
| 1 | create con `fecha` de un mes anterior | allow |
| 2 | create **sin** `fecha` (cliente viejo) | allow |
| 3 | create con `fecha` de hoy (medianoche local) | allow |
| 4 | create con `fecha` string | deny |
| 5 | create con `fecha` anterior a 2020 | deny |
| 6 | create con `fecha` > `request.time + 1 día` | deny |
| 7 | create con `createdAt` explícito (≠ `request.time`) | deny |
| 8 | create con `usuario` ajeno | deny |
| 9 | update propio: cambia `fecha`, `createdAt` intacto | allow |
| 10 | update que mueve `createdAt` | deny |
| 11 | update con `fecha` inválida | deny |
| 12 | update de un ingreso ajeno | deny |
| 13 | **delete propio** (regresión de la separación update/delete) | allow |

`npm run test:rules` usa `node --test --test-concurrency=1 tests/rules/`: los tres archivos inicializan el emulador y se pisarían con `clearFirestore`/ruleset en paralelo. Total: **44 (Reintegros) + 14 (gastos) + 13 (ingresos) = 71**.

---

## 6. Gates (03/11/2026)

| Gate | Resultado |
|---|---|
| `npm run test:gastos` | **8/8** (fail 0) |
| `npm run harness:reintegros` | **57/57** (fail 0, exit 0) — incluye el fix de H29 |
| `npm run test:rules` | **71/71** (fail 0) — 44 de Reintegros + 14 de `gastos` + 13 de `ingresos` (4.5-fecha) |
| `npm run lint` | baseline exacta 4 (`useIngresos.js:39`, `GroupContext.jsx:17`, `HomeHeader.jsx:28`, `page.js:10`), **0 nuevos** |
| `npm run build` | `✓ Compiled successfully`, 10 páginas, exit 0 |
| Escrituras en Firestore real | **0** (todo local; sin push) |

---

## 7. Compatibilidad y datos

- **Sin migración.** Los documentos sin `fecha` (gastos **e ingresos**) se leen por `createdAt`: comportamiento idéntico al anterior.
- **Gastos de octubre cargados por consola:** si tienen `createdAt` de octubre, se ven por fallback; si el lote se cargó también con `fecha` (recomendado), quedan canónicos desde el origen.
- **Cliente viejo / PWA en caché:** sigue creando sin `fecha` (reglas lo permiten) y aparece por `createdAt`. Un cliente viejo de `/ingresos` seguía consultando por rango de `createdAt`: al no desplegarse el cambio de query, ese cliente **no se ve afectado** (la app nueva no depende de la query).
- **`REQUIERE_VALIDACIÓN_FIRESTORE` (read-only, no bloqueante):** contar documentos de `gastos` e `ingresos` sin `fecha` **y** sin `createdAt` (serían invisibles antes y después; el fix no puede inventarles fecha).
- **Deuda preexistente (no se corrige acá):** en producción, el update de `gastos`/`ingresos` solo valida el dueño; `usuario`, `tipo`, `groupId`, `monto` y el resto siguen siendo mutables. La enmienda de 4.5-fecha protege **solo** `createdAt` y el tipo/rango de `fecha`. Un endurecimiento por campo (whitelist) corresponde al gate de seguridad de la etapa, no a esta subetapa.
- **Ingresos: CRUD cerrado.** La deuda “el módulo de ingresos no tiene CRUD” (registrada el 30/09/2026) queda **resuelta** por `6c708ef` (edit + delete). La deuda de `subscribeIngresos` sin `onError` **no** se toca (sigue fuera de alcance).

---

## 8. Contrato para la Etapa 5 (5.1)

`balanceDelMes(mes, uid)` **debe** derivar el período con el mismo criterio, **tanto para gastos como para ingresos**: `fecha`, con **fallback a `createdAt`**.

**No puede resolverse con `where("fecha", ">=", inicio)`**: ese query **excluye los documentos sin `fecha`** (el fallback se rompe a nivel de query, no de filtro). Opciones válidas para 5.1:

1. filtrar en cliente como hacen hoy `/gastos` e `/ingresos` (traer y filtrar), o
2. introducir `periodo: "YYYY-MM"` **con backfill** en ese momento (decisión de 5.1, no de esta subetapa).

Documentado en `ROADMAP.md` (Etapa 5), `context/dominio.md` (§3.1) y `context/arquitectura.md`.

---

## 9. Verificación funcional local (aprobada por el usuario, 03/11/2026)

Entorno: emuladores **Firestore + Auth** (`--project finanzas-app-1c5f6`), `npm run seed:emulator` (usuarios + grupo + fixture) y un seed **temporal fuera del repo** con dos documentos **legacy sin `fecha`** (`gastos/legacy-gasto-oct` $5.000 · `createdAt` 15/10/2026; `ingresos/legacy-ingreso-oct` $20.000 · `createdAt` 20/10/2026). Dev server con `.env.development.local` (`NEXT_PUBLIC_USE_EMULATOR=true`) y aviso `[EMULADOR]` confirmado en el log. **0 escrituras al proyecto real.**

| # | Caso probado | Resultado |
|---|---|---|
| a | Alta de **gasto** con fecha de octubre estando en noviembre → aparece en octubre, **no** en noviembre, suma en el total de octubre | **PASS** |
| b | Alta de **ingreso** con fecha de octubre → aparece en octubre y suma; no en noviembre | **PASS** |
| c | **Editar un gasto** y moverlo de mes → se mueve de sección y de total | **PASS** |
| d | **Editar un ingreso** y moverlo de mes → se mueve de sección y de total | **PASS** |
| e | **Borrar un ingreso** → desaparece y el total baja | **PASS** |
| f | **Legacy sin `fecha`** (gasto $5.000 e ingreso $20.000) visibles en octubre por fallback; no en noviembre | **PASS** |
| g | **Selector de mes** octubre ↔ noviembre sin mezclar filas ni totales | **PASS** |

**Aprobación:** el usuario validó los 7 casos en Local. No se pusheó ni se desplegó nada.

---

## 10. Cierre (03/11/2026)

- [x] Código + tests + gates locales (gastos `9d350d2`; reglas gastos `bbd3345`; ingresos `6c708ef`).
- [x] Docs de apertura (HANDOFF §0/§4, PROPUESTA §1.6, AGENTS, ROADMAP).
- [x] `context/dominio.md`, `context/arquitectura.md`, `context/MAPA-APPFINANCIERA.md`.
- [x] **Paso 0 / reglas** — sin delta; enmienda de `gastos` (`bbd3345`) e `ingresos` (`6c708ef`) + 27 tests (71/71).
- [x] **Verificación funcional local** — 7/7 casos, aprobada por el usuario (§9).
- [x] Entrada datada en `ROADMAP.md` §Histórico (este commit).
- [x] **Push a Staging + verificación en Staging: DIFERIDO al cierre de la Etapa 4** — no es un pendiente bloqueante de 4.5-fecha. Motivo: se hará **junto con el BLOQUE B (Reintegros) y el deploy de reglas**, que hoy no están desplegados; adelantar el push no aportaría validación nueva (la verificación funcional ya se hizo en Local sobre los mismos emuladores).

**Pendientes que quedan (ambos al cierre de la Etapa 4):**
1. Push a `staging` + verificación en Staging de gastos + ingresos (junto con el BLOQUE B).
2. Deploy de reglas (`gastos`/`ingresos` + BLOQUE B).

**Siguiente:** 4.5 (retiro de Transferencias), última del núcleo, sin cambios en su alcance.
