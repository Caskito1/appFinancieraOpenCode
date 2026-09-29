# PROPUESTA — Subetapa 2.2: Totales del mes con gastos fijos

> **Naturaleza: PLANIFICACIÓN. La definición funcional está cerrada, el gate histórico fue ejecutado y APROBADO, y la implementación fue autorizada por el usuario el 29/09/2026.**
> Documento redactado al cerrar la sesión del 25/09/2026, actualizado el 29/09/2026 con el criterio definitivo `esPagado` y el resultado del gate.

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.2 de la Etapa 2 · **Hallazgo origen:** D3 (`HANDOFF-ETAPA-2.md` §2)
**Fuentes de contexto:** `HANDOFF-ETAPA-2.md` · `context/dominio.md` §3.3 · `context/arquitectura.md` · `context/MAPA-APPFINANCIERA.md`
**Decisión funcional del usuario:** 25/09/2026

## 0. Estado actual

| Ítem | Estado |
|---|---|
| Plan funcional de 2.2 | ✅ **DEFINIDO** |
| Definición funcional | ✅ **CERRADA** (25/09/2026) |
| Criterio técnico `esPagado` | ✅ **CERRADO** (29/09/2026) |
| Label definitivo | ✅ **CERRADO** (29/09/2026) |
| Aprobación de implementación | ✅ **APROBADA** (29/09/2026) |
| Implementación | ✅ **EJECUTADA** (29/09/2026) |
| Código | ✅ 2 archivos, 3 bloques |
| Firestore | ✅ SIN CAMBIOS (auditoría solo lectura) |
| Usuarios de testing | ✅ CREADOS y **CONSERVADOS** deliberadamente (ver §5.1) |
| Grupo `groups/TEST-2-2` | ✅ CREADO y **CONSERVADO**; datos temporales eliminados (§5.1) |
| Auditoría read-only | ✅ **EJECUTADA** — 34 entries, 0 inconsistentes |
| Gate histórico | ✅ **PASS** (29/09/2026) |
| Build + lint | ✅ **OK** |
| Prueba funcional en sandbox | ✅ **EJECUTADA — 6/6 PASS** (§7.1) |
| Limpieza del sandbox | ✅ **EJECUTADA Y VERIFICADA** — 40 → 34 entries, 0 sandbox (§5.1) |
| Mejora UI header `/gastos-fijos` (2.8) | ✅ **EJECUTADA y validada visualmente**, pendiente de commit |
| Commits de 2.2 | ✅ NINGUNO |
| Push de 2.2 | ✅ NINGUNO |
| Producción | ✅ SIN CAMBIOS |

## 1. Definición funcional (cerrada)

`/gastos` tiene dos conceptos distintos, y ambos se calculan hoy sin mirar si el fijo fue pagado.

### 1.1 Total del mes — "cuánto gasto me corresponde a mí"

- Gasto personal **efectivamente pagado** → 100%.
- Gasto compartido **efectivamente pagado** → mi parte, hoy 50%.
- Gasto fijo **registrado pero impago** → **no entra**.

### 1.2 Total real — "cuánto se gastó realmente entre los dos"

- Gasto personal **efectivamente pagado** → 100%.
- Gasto compartido **efectivamente pagado** → 100% del monto.
- Gasto fijo **registrado pero impago** → **no entra**.

### 1.3 Pagado ≠ saldado (distinción fundamental)

- **Pagado** = el gasto ocurrió → **entra a los totales**.
- **Saldado** = se resolvió el balance/deuda entre nosotros → **no modifica los totales**.

Ejemplo de referencia (compartido de $100.000):

| Paso | Estado | Total mío | Total real | Balance |
|---|---|---|---|---|
| 1. Registrada, nadie pagó | `pendiente_pago` | **$0** | **$0** | — |
| 2. La otra persona paga | `pendiente_saldar` | **$50.000** | **$100.000** | yo le debo $50.000 |
| 3. Le transfiero los $50.000 | `saldado` | **$50.000** (sin cambio) | **$100.000** (sin cambio) | $0 |

⇒ **`saldado` nunca debe ser el criterio** para decidir si un gasto entra o sale de los totales.

## 2. Criterio técnico: `esPagado` (no usar `estado`)

**Decisión definitiva (29/09/2026): el criterio de inclusión es `esPagado`.**

```js
const esPagado = (e) =>
  !!e.paidByUid ||
  (!!e.pagoHasta && e.pagoHasta > e.periodo);
```

Es decir: **pagado, o anual con período de pago vigente**.

### 2.1 Por qué `estado` no sirve

1. **`saldado` está excluido por definición** (ver 1.3): representa balance, no pago.
2. **`pagado_hasta` se calcula antes de verificar el pago.** `getEstado` (`app/gastos-fijos/hooks/useFixedExpenses.js:120-121`) evalúa `pagoHasta > periodo` **antes** del `!paidByUid`.

### 2.2 Por qué `paidByUid` solo tampoco alcanza

`registrarGasto` (`useFixedExpenses.js:201-244`) escribe, al **registrar** la factura y también al **actualizar** un existente:

```js
paidByUid: null,
participantes: [],
estado: "pendiente_pago",
```

⇒ Un anual que figura **"Al día ✓"** en `/gastos-fijos` puede tener `paidByUid = null`, porque registrar o extender el período **resetea** el campo. Con un criterio `!!paidByUid` esos anuales **dejarían de contabilizarse** aunque su cobertura siga vigente.

La segunda rama de `esPagado` existe exactamente para evitar eso: mientras `pagoHasta > periodo`, el anual **es** pagado a efectos de los totales, y `/gastos` queda **de acuerdo** con lo que `/gastos-fijos` ya muestra.

### 2.3 Consecuencia asumida

Registrar un anual con `pagoHasta` futuro lo hace **contar como pagado de inmediato**, aunque todavía no se haya pagado. Es el comportamiento pedido y es coherente con `getEstado`, que ya lo rotula "Al día ✓". No se cambia.

**Efecto lateral desired:** `saldarPendiente` / `saldarMes` (`:277-293`) **no tocan `paidByUid`** ⇒ la regla "saldar no altera los totales" se cumple por construcción, sin código adicional.

## 3. Alcance de código previsto (2 archivos, ~10 líneas)

### 3.1 `app/gastos/hooks/useGastos.js`

```js
// Total del mes / Total real: solo entra lo EFECTIVAMENTE PAGADO.
// Criterio = esPagado. NO usar `estado`: "saldado" es balance, no pago, y
// "pagado_hasta" se calcula antes de verificar el pago (useFixedExpenses.js:120-121).
// El anual vigente cuenta aunque paidByUid sea null (registrarGasto lo resetea).
const esPagado = (e) =>
  !!e.paidByUid ||
  (!!e.pagoHasta && e.pagoHasta > e.periodo);

const fixedPagadas = fixedEntries.filter(esPagado);

const totalFixedReal = fixedPagadas.reduce((a, e) => a + Number(e.montoTotal || 0), 0);
const totalFixed = fixedPagadas.reduce((a, e) => {
  const monto = Number(e.montoTotal || 0);
  return a + (e.groupId ? monto / 2 : monto);
}, 0);
```

Reglas:
- Personal pagado → 100% en ambos totales.
- Compartido pagado → 50% en Total del mes, 100% en Total real.
- Impago → no entra en ninguno.
- `fixedCompartidos` y `fixedPersonales` **NO se modifican**: los impagos **siguen apareciendo en la lista**.
- `totalGastos` (`:120`) no se toca: ya suma `totalFixed`.
- **No tocar gastos diarios** (`totalPersonales`, `totalGruposUsuario`).
- **No cambiar el 50/50.** **No prorratear anuales.**

### 3.2 `app/gastos/sections/GastosFijosSection.jsx`

```js
const esPagado = (entry) =>
  !!entry.paidByUid ||
  (!!entry.pagoHasta && entry.pagoHasta > entry.periodo);

function estadoVisible(entry) {
  if (!esPagado(entry)) return "pendiente_pago";
  return entry.pagoHasta && entry.pagoHasta > entry.periodo
    ? "pagado_hasta"
    : entry.estado;
}
```

`FilaFijo` (`:11`) pasa a usar `estadoVisible(entry)` en lugar del `entry.estado` crudo.
Y `ESTADO_CONFIG.pendiente_pago.label` pasa de `"Pendiente"` a `"Registrado · Pendiente de pago"`.

**Labels definitivos (cerrados 29/09/2026):**

| Situación | `esPagado` | Label |
|---|---|---|
| Registrado y sin pagar, sin `pagoHasta` vigente | `false` | `Registrado · Pendiente de pago` |
| Anual con `pagoHasta > periodo` | `true` | `Al día ✓` |
| Pagado (`paidByUid`), resto de casos | `true` | estado crudo (`Sin saldar` / `Saldado ✓`) |

**Invariante:** `esPagado(e) === true` ⇒ **nunca** se muestra "Pendiente".
Y a la inversa: label de pendiente ⇒ `esPagado(e) === false` ⇒ no suma a ningún total.
**La etiqueta y el número cuentan lo mismo.**

Motivo: hoy `FilaFijo` usa el `entry.estado` crudo (`GastosFijosSection.jsx:11`), que nunca vale `"pagado_hasta"` (es un estado *derivado*). Por eso la entrada `pagado_hasta` de `ESTADO_CONFIG` era **código muerto**: un anual pagado con cobertura vigente se rotulaba "Pendiente" mientras **sí** sumaba al total.

Usa datos que **ya están en la entry** (`paidByUid`, `pagoHasta`, `periodo` — este último se escribe en `useFixedExpenses.js:218` y además se consulta por igualdad en `subscribeFixedExpenses.js:20,33`, así que siempre coincide con el mes visible).

**Nota de layout:** el nuevo label es más largo que `"Pendiente"`. La fila es `flex justify-between` con el bloque derecho en `flex-shrink-0` (`GastosFijosSection.jsx:18`), así que el nombre es lo que cede espacio. A verificar visualmente en sandbox; si molesta, el ajuste es agregar `truncate`/`min-w-0` al `<p>` del nombre, sin tocar el resto.

**Solo para `/gastos`.** No tocar `getEstado` ni `/gastos-fijos`.

**`esPagado` queda duplicado en los 2 archivos** por decisión explícita del usuario (29/09/2026): no se extrae a `gastosCalculations.js` en esta etapa, para mantener el alcance de 2.2 en los 2 archivos definidos. Si alguna vez divergen, hay que sincronizarlos.

## 4. Fuera de alcance (no tocar en 2.2)

- **`BalanceMesCard`** y la evolución del panel de balance de `/gastos-fijos` — salvo el bloque `Personal` de §7.4, aprobado como cierre de 2.2.
- La separación explícita de **pagado / pendiente / responsabilidad / balance** (decisión posterior, subetapa aparte).
- `getEstado` y `/gastos-fijos` en general.
- Prorrateo de anuales.
- Modelo 50/50.
- Gastos diarios.
- Lógica de transferencias.
- Migraciones de Firestore.
- Corrección histórica de documentos.
- Divergencia actual entre `/gastos` y `/gastos-fijos` para meses futuros de un anual.
- Creación automática de usuarios/grupos.
- Separación futura de Firebase entre Staging y Producción.

## 5. Sandbox de pruebas — EJECUTADO

**Staging y Producción usan actualmente la misma base Firebase** (ver §8). La prueba se ejecutó sobre un sandbox **dentro de la misma base**, aislado por dos usuarios de testing y un grupo exclusivo.

La app **no tiene registro de usuarios** (`context/arquitectura.md:24`) ni creación de grupos desde la UI ⇒ la preparación fue **manual desde Firebase Console**.

Plan:

1. Firebase Console → **Authentication → Add user** ×2 (email + contraseña).
2. Copiar los 2 **UID reales** de Firebase Auth.
3. Firestore → colección `groups` → documento con ID `TEST-2-2` (creado con ID manual):
   ```
   name:    "TEST 2.2"
   members: [uidA, uidB]
   ```
   El campo es `name`, **no** `nombre` (`GroupSection.jsx:16`). El **ID del documento** es `groups/TEST-2-2`; el **valor** de `name` es `"TEST 2.2"` (con espacio). No son lo mismo.
4. **Nunca agregar un UID real al grupo de testing.** `useGastos.js:38` y `useFixedExpenses.js:37` usan `groups[0]`, y `getDocs` sin `orderBy` (`GroupContext.jsx:24-28`) no garantiza orden: si un usuario real quedara en 2 grupos, su `/gastos-fijos` podría apuntar al grupo de test.
5. Verificar aislamiento: el Test A debe ver el grupo `groups/TEST-2-2` y los usuarios reales **no** deben quedar asociados a ese grupo.

**Por qué aísla:** todas las queries filtran por `usuario` o `groupId` — `GroupContext.jsx:26` (`members array-contains uid`), `subscribeGastos.js:43-47` (personal por `usuario`) y `:61-65` (compartido por `groupId`), `subscribeFixedExpenses.js:17-36` (`usuario` / `groupId`). El grupo debe tener **exactamente 2 miembros** porque `useFixedExpenses.js:265` busca "el otro" como el único miembro distinto (`otroUid`), que es lo que hace funcionar el ejemplo de $100.000.

**Consecuencia:** los datos de prueba se escriben en la base real (Auth + Firestore). Se limpian al cierre de la prueba; ver §5.1.

### 5.1 Limpieza del sandbox — EJECUTADA Y VERIFICADA

Las **entradas temporales** de la prueba se eliminaron y la base real quedó verificada como intacta. **No se eliminó el andamiaje del sandbox**, para reutilizarlo en pruebas futuras.

| Métrica | Antes | Después |
|---|---|---|
| `fixed_expense_entries` total | 40 | **34** |
| Entradas de sandbox | 6 | **0** |
| Entradas reales | 34 | **34** ✅ |

**Eliminados (6 entradas):** las 5 creadas durante los 6 casos de prueba + el huérfano `fixed_expense_entries/NvZIq62l39BWigZW5KpA` (el `groupId: null` documentado en §7.2).

**Conservados deliberadamente:**

| Recurso | ID | Motivo |
|---|---|---|
| Usuario de prueba A | `doVj0bxHqjdtV2N88FuLiyaeCK12` | reutilizar el sandbox |
| Usuario de prueba B | `IJWQmtR1z2Z29xrGsXhMe9OAUtA2` | reutilizar el sandbox |
| Grupo | `groups/TEST-2-2` | reutilizar el sandbox |
| Config anual A | `fixed_expenses/TEST-2-2-drive-A` | reutilizar el sandbox |
| Config anual B | `fixed_expenses/TEST-2-2-drive-B` | reutilizar el sandbox |

**Estado de las 34 entradas reales tras la limpieza** (idéntico al gate de §6):

| Dimensión | Valor |
|---|---|
| Por estado | `saldado: 31` · `pendiente_pago: 3` |
| Por periodo | `2026-06: 10` · `2026-07: 8` · `2026-08: 9` · `2026-09: 7` |

⇒ **Ningún dato real fue alterado ni eliminado.** El conteo por estado y por periodo coincide exactamente con el gate histórico de §6.2, así que la prueba no modificó una sola entry real.

> **Verificación de integridad:** el filtro de clasificación fue `usuario ∈ {uidA, uidB}` **o** `groupId == "TEST-2-2"`. Como `reales` quedó en 34 (ni 35 ni 33), ninguna entry real classifies como sandbox y ninguna del sandbox quedó sin borrar.

## 6. Auditoría Firestore READ-ONLY — EJECUTADA 29/09/2026 · GATE PASS

Ejecutada desde **Firebase Console → Cloud Shell** (Node + `@google-cloud/firestore`, autenticación de la sesión del usuario). **Read-only estricto: solo `.get()`, sin escrituras, sin migraciones.** Imprime únicamente agregados: sin montos y sin exponer UIDs.

- Colección: **`fixed_expense_entries`**.

### 6.1 Criterio del gate (refinado 29/09/2026)

El gate original ("¿hay `paidByUid` ausente?") era demasiado grueso para el criterio `esPagado`: ahora hay entries sin `paidByUid` que **sí** cuentan (los anuales vigentes), así que su ausencia ya no indica problema por sí sola.

La señal de alarma real es la entry **inconsistente**: estado o participantes que dicen "pagado" sin `paidByUid`. `registrarPago` (`useFixedExpenses.js:246-274`) siempre escribe `paidByUid` + `participantes` + `estado` **juntos**, así que una entry con estado de pago y `paidByUid` nulo solo puede venir de una versión vieja de la app o de una edición manual.

```js
const PAGADO_ESTADOS = ["pendiente_saldar", "saldado"];

const esPagado = (d) =>
  !!d.paidByUid ||
  (!!d.pagoHasta && d.pagoHasta > d.periodo);

const inconsistente = (d) =>
  (d.paidByUid === null || !("paidByUid" in d)) &&
  (PAGADO_ESTADOS.includes(d.estado) || (d.participantes?.length ?? 0) > 0);
```

### 6.2 Resultado obtenido

```json
{
  "total": 34,
  "contadas_como_pagadas": 33,
  "IMPARES_estado_pagado_sin_paidByUid": 0,
  "paidByUid_ausente": 0,
  "paidByUid_null": 3,
  "pagoHasta_vigente_sin_pago": 2,
  "pagoHasta_vencido_sin_pago": 0,
  "impagos_pendiente_pago": 3,
  "compartidas": 18,
  "porEstado": { "saldado": 31, "pendiente_pago": 3 },
  "porPeriodo": { "2026-09": 7, "2026-07": 8, "2026-06": 10, "2026-08": 9 }
}
```

| Señal | Valor | Lectura |
|---|---|---|
| `IMPARES_estado_pagado_sin_paidByUid` | **0** | ✅ **ninguna entry inconsistente** |
| `paidByUid_ausente` | **0** | ✅ **sin datos heredados** → no se requiere migración |
| `paidByUid_null` | 3 | las 3 registradas y sin pagar |
| `pagoHasta_vigente_sin_pago` | 2 | 2 de esas 3 son **anuales con cobertura vigente** → cuentan por la 2ª rama de `esPagado` |
| `pagoHasta_vencido_sin_pago` | 0 | ningún anual vencido |
| `compartidas` | 18 | 16 personales · el 50/50 se ejercita |
| `porEstado` | `saldado: 31`, `pendiente_pago: 3` | **ningún `pendiente_saldar`**: los compartidos siempre terminaban saldados |
| `porPeriodo` | `2026-06` … `2026-09` | sin histórico anterior → alcance acotado a 4 meses |

Aritmética: 31 con `paidByUid` + 2 anuales = **33** de 34. **La diferencia es exactamente 1 entry**: la única registrada, sin `pagoHasta` y sin pagar. Es la que hoy se etiqueta "Pendiente" **y suma** a los dos totales — el bug.

### 6.3 Gate

| Resultado | Acción |
|---|---|
| `IMPARES_... > 0` | ⛔ **STOP.** Entries inconsistentes → redefinir el criterio antes de tocar código. |
| `IMPARES_... === 0` | ✅ Continuar con la implementación prevista (§3). |

⇒ **0 inconsistencies: PASS.** Autorizado por el usuario el 29/09/2026.

### 6.4 Efecto esperado sobre los datos reales

| Entries | Cambio en totales | Cambio de label |
|---|---|---|
| **1** (impaga, sin `pagoHasta`) | **deja de sumar** a Mi gasto total y Total real. Si es compartida: −`monto/2` y −`monto`. Si es personal: −`monto` en ambos. | → `Registrado · Pendiente de pago` |
| **2** (anuales vigentes) | **siguen sumando** (sin cambio) | `Pendiente` → `Al día ✓` |
| **31** (con `paidByUid`) | sin cambio | sin cambio |

> **Aclaración sobre las 3 `pendiente_pago`:** solo **1** de las 3 queda fuera de los totales. Las otras 2 tienen `pagoHasta > periodo`, y por la regla aprobada **son** pagadas a efectos de totales (`Mi gasto total`, `Total real`, `Al día ✓`). Es la lectura única compatible con la semántica de `esPagado`.

## 7. Verificación

**Estática:** `npm run build` + `npm run lint`.

**Runtime Local:** ejecutado. Requiere un `.env.local` con las 6 variables `NEXT_PUBLIC_FIREBASE_*` (`lib/firebase.js:7-12`). Sin ese archivo el build falla en prerender por `auth/invalid-api-key` — se confirmó que es un problema de **ambiente**, no de código, reproduciéndose igual sobre `HEAD` limpio (`b46b570`).

### 7.1 Prueba funcional en sandbox — 6/6 PASS

Ejecutada contra la app local (`npm run dev`) con el `.env.local` del proyecto, que el usuario confirmó apunta a la **misma base de producción**. Datos de prueba temporales y reales.

| # | Caso | Resultado observado |
|---|---|---|
| 1 | Compartido registrado, inicialmente no pagado | Expone una anomalía **preexistente** de `groupId: null` (§7.2). Re-registrado con el grupo cargado: funciona como compartido. |
| 2 | Compartido pagado por el usuario B | `/gastos-fijos`: Compartidos **$6.000** · Total compartido **$12.000**. `/gastos`: Total **$6.000** · Total real **$12.000**. → Un compartido pagado por uno de los dos **cuenta como cubierto** aunque el balance entre ambos todavía no esté saldado. |
| 3 | Usuario A salda su parte | El gasto pasa a **Saldado**. Los totales **no cambian**. **No se genera un gasto adicional.** → Saldar el balance entre usuarios **no duplica** el gasto. |
| 4 | Anual personal Drive **$12.000** con `Pago hasta` vigente hasta 2027, **sin `paidByUid`** | Se muestra **Al día**. `/gastos` incluye **$12.000**. Total **$18.000** · Total real **$24.000**. → `paidByUid == null` + `pagoHasta > periodo` se considera **cubierto** y participa de los totales. |
| 5 | Personal Otros **$1.000**, sin pago y sin `pagoHasta` | Sigue **visible** en `/gastos-fijos` con estado `Registrado · Pendiente de pago`. En `/gastos` **no** participa del total. → Un fijo registrado pero no cubierto **no impacta** los totales de 2.2. |
| 6 | Edición del anual Drive **extendiendo** `Pago hasta` | Se actualiza el detalle. `/gastos` **no suma** un gasto adicional. **Sin duplicación.** → Extender el período cubierto **no crea** un nuevo gasto. |

**Conclusión: 2.2 validada en runtime. PASS.**

### 7.2 Anomalía del caso 1 — preexistente, NO de 2.2

Primer intento de alta del compartido. El documento resultante (`fixed_expense_entries/NvZIq62l39BWigZW5KpA`, **ya eliminado en la limpieza de §5.1**):

| Campo | Valor |
|---|---|
| `fixedExpenseId` | `otros_compartido` |
| `groupId` | **`null` / ausente** |
| `paidByUid` | `null` |
| `estado` | `pendiente_pago` |
| `periodo` | `2026-09` |
| `montoTotal` | `100000` |

El documento apareció **incorrectamente como personal** en `/gastos`, porque todas las queries discriminan por `groupId` (`subscribeFixedExpenses.js:17-36`) o por `usuario` (`:55-64`), nunca por la taxonomía.

**Causa raíz (`useFixedExpenses.js`):**

1. `registrarGasto` calcula `groupId: esCompartido ? grupo?.id ?? null : null` (`:231`) a partir de `grupo = groups[0] ?? null` (`:43`).
2. `registrarGasto` valida `user`, `catalogoItem` y `montoFinal`, **pero no valida `grupo`**. Si `groups[0]` todavía no está disponible, degrada silenciosamente a `null` en vez de abortar.
3. Con `groupId: null` el entry queda **atascado de forma permanente**: la query de compartidos filtra `where("groupId","==",grupo.id)` y nunca lo devuelve ⇒ `getEntry(id, "compartido")` da `null` ⇒ `registrarPago` hace `if (!entry) return;` (`:256`) ⇒ **no-op**. En `/gastos-fijos` queda como `sin_registrar` **para siempre**.

**Relación con 2.2: NINGUNA.** El diff de 2.2 solo cambia qué se filtra en `totalFixed` / `totalFixedReal` y el label de la fila. **No escribe en Firestore ni toca `groupId`.** Es un problema **preexistente de integridad / condición de carrera en el alta de gastos compartidos**.

**Mejoras futuras — NO implementadas, NO dentro de 2.2:**

- **2.7-GUARD** — impedir registrar un compartido sin grupo: `if (esCompartido && !grupo?.id) return;` en `registrarGasto`. Requiere además que el `updateDoc` (`:238-246`) incluya `groupId`, porque **hoy no repara** un entry ya corrupto.
- **UX** — `otros` y `otros_compartido` comparten el `nombre: "Otros"` (`fixedExpensesTaxonomia.js:7,19`), indistinguibles en la UI salvo por la sección.
- **Flujo legacy inerte** — `/agregar` → Gasto fijo escribe en `fixed_expenses` con otro schema y **sin `activo`** (`fixedExpenseHelpers.js:9-71`), por lo que `useFixedExpenses.js:42-45` nunca lo lee. Ya previsto en **2.5 (D1)**.

### 7.3 Estado técnico del cierre de 2.2

| Ítem | Resultado |
|---|---|
| Build | ✅ **PASS** (9/9 rutas) |
| Lint | ✅ **0 problemas nuevos**; los 2 errores + 3 warnings restantes son **preexentes y ajenos a 2.2** |
| Fixtures lógicos | ✅ **24/24 PASS** |
| Firestore gate previo (§6) | ✅ **PASS** — 34 entries, 0 inconsistentes |
| Escrituras durante el gate read-only | ✅ **NINGUNA** — solo `.get()` |
| Escrituras durante la prueba runtime | ✅ **Sí**, contra datos sandbox temporales y reales |
| Limpieza del sandbox | ✅ **EJECUTADA Y VERIFICADA** — 40 → 34 entries, 0 sandbox, 34 reales intactos (§5.1). Andamiaje (2 usuarios, `groups/TEST-2-2`, 2 `fixed_expenses`) **conservado** a propósito |
| Commits / push | ⏳ **PENDIENTE** — ninguno |

**Archivos funcionales modificados por 2.2:**

- `AppFinanciera/app/gastos/hooks/useGastos.js`
- `AppFinanciera/app/gastos/sections/GastosFijosSection.jsx`

**Archivos modificados por la mejora de header (2.8, mismo lote de cierre):**

- `AppFinanciera/app/gastos-fijos/hooks/useFixedExpenses.js`
- `AppFinanciera/app/gastos-fijos/page.jsx`
- `AppFinanciera/app/gastos-fijos/sections/BalanceMesCard.jsx`

### 7.4 Mejora de header de `/gastos-fijos` (2.8) — IMPLEMENTADA

El bloque `Personal` de `BalanceMesCard` mostraba el total **registrado**, incluyendo pendientes. Se cambió a dos valores:

```
Personal: $12.000
Total registrado: $13.000
```

| Valor | Semántica |
|---|---|
| `Personal` | Suma de los fijos personales **cubiertos** según **exactamente** la misma regla `esPagado` de 2.2 (`paidByUid` presente **O** `pagoHasta > periodo`). Un anual con `pagoHasta` vigente cuenta como cubierto aunque `paidByUid` sea `null`. |
| `Total registrado` | Suma de **todos** los fijos personales registrados, cubiertos + pendientes. |

Caso real de la prueba: Drive anual **$12.000** cubierto por `pagoHasta` + Otros personal **$1.000** pendiente ⇒ `Personal: $12.000`, `Total registrado: $13.000`.

Implementación: `esPagado` duplicado en `useFixedExpenses.js` (misma decisión que en los 2 archivos de `/gastos`: no se extrae a un helper compartido) + `totalPersonalCubierto` derivado de `gastosPersonales[].entry`, que ya expone `paidByUid`, `pagoHasta`, `periodo` y `montoTotal`. **No se tocó `useGastos.js`** ni la lógica ya validada de `/gastos`. Los compartidos y el resto de `BalanceMesCard` quedan intactos.

## 8. Pendientes de ambiente (fuera del alcance inmediato de 2.2)

Verificado sobre el repo el 25/09/2026:

- **Staging y Producción usan la misma base Firebase.** El código **no separa nada**: no hay una sola línea que mire el ambiente.
- Toda la separación depende de **6 variables de entorno** `NEXT_PUBLIC_FIREBASE_*` (`lib/firebase.js:7-12`), **inlinadas en el bundle en build time**, sin valores por defecto.
- `getFirestore(app)` se llama **sin segundo argumento** (`lib/firebase.js:19`) ⇒ solo la base *default* del proyecto; no hay forma en código de apuntar a otra base.
- No existen `vercel.json`, `.firebaserc` ni `firestore.rules` en el repo. No hay `.env` en el historial de git (sin secretos filtrados).
- `main` y `staging` apuntan al **mismo commit** (`b46b570`); `origin/HEAD → main`.
- **Local no es reproducible** (ver §7).
- ⇒ Consecuencia: "validar en Staging" implica **escribir en la base real**. Una separación real de Firebase entre Staging y Producción queda como tarea de infraestructura, **no** como parte de 2.2.
- La documentación de este mapa de ambientes (proyectos, dominios autorizados) sigue **pendiente**: `REPORT-ETAPA-0.md:181` decidió dejar la infra fuera de los documentos.

## 9. Flujo de ejecución (12 pasos)

| # | Paso | Estado |
|---|---|---|
| 1 | Preparar el sandbox (§5) — manual, Firebase Console | ✅ **EJECUTADA** |
| 2 | Auditoría Firestore read-only (§6) | ✅ **EJECUTADA** |
| 3 | **Gate** (§6) | ✅ **PASS** (0 inconsistentes) |
| 4 | Aprobación explícita del plan | ✅ **APROBADA** 29/09/2026 |
| 5 | Documentación (§2, §3.1, §3.2, §6, este doc) | ✅ **HECHA** |
| 6 | Implementación en los 2 archivos (§3) | ✅ **HECHA** |
| 7 | `npm run build` + `npm run lint` + fixtures lógicos | ✅ **OK** |
| 8 | Prueba funcional en el sandbox — 6 casos (§7.1) | ✅ **PASS 6/6** |
| 9 | Revisión funcional del usuario | ✅ **HECHA** |
| 9b | Mejora de header `/gastos-fijos` (§7.4) | ✅ **HECHA + validada visualmente** |
| 9c | Limpieza del sandbox + verificación (§5.1) | ✅ **EJECUTADA Y VERIFICADA** (40 → 34, 0 sandbox) |
| 10 | Commit de 2.2 + 2.8 | ⏳ **PENDIENTE** (sin commit) |
| 11 | Merge a `main` + deploy a Producción | ⏳ **PENDIENTE** |
| 12 | Verificación con cuenta real y cierre de 2.2 | ⏳ **PENDIENTE** |

**En el paso 12:** los meses con facturas registradas y nunca pagadas **bajan** de total. Es el comportamiento pedido, y hay que revisarlo sobre los meses reales. Según §6.4, **una sola entry** real cambia de total.
