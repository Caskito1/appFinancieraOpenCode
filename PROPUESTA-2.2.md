# PROPUESTA — Subetapa 2.2: Totales del mes con gastos fijos

> **Naturaleza: PLANIFICACIÓN. La definición funcional está cerrada; la implementación NO está aprobada ni iniciada.**
> Documento redactado al cerrar la sesión del 25/09/2026, sin tocar código, Firestore, staging ni producción.

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.2 de la Etapa 2 · **Hallazgo origen:** D3 (`HANDOFF-ETAPA-2.md` §2)
**Fuentes de contexto:** `HANDOFF-ETAPA-2.md` · `context/dominio.md` §3.3 · `context/arquitectura.md` · `context/MAPA-APPFINANCIERA.md`
**Decisión funcional del usuario:** 25/09/2026

## 0. Estado actual

| Ítem | Estado |
|---|---|
| Plan funcional de 2.2 | ✅ **DEFINIDO** |
| Definición funcional | ✅ **CERRADA** (25/09/2026) |
| Implementación | ⛔ **NO INICIADA** |
| Aprobación de implementación | ⛔ **NO APROBADA** |
| Código | ✅ SIN CAMBIOS |
| Firestore | ✅ SIN CAMBIOS |
| Usuarios de testing | ⏳ **NO CREADOS** |
| Grupo `TEST 2.2` | ⏳ **NO CREADO** |
| Auditoría read-only | ⏳ **NO EJECUTADA** |
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

## 2. Criterio técnico: `paidByUid` (no usar `estado`)

**Decisión: el criterio de inclusión es `!!e.paidByUid`.**

Por qué `estado` no sirve, verificado sobre el código:

1. **`saldado` está excluido por definición** (ver 1.3): representa balance, no pago.
2. **`pagado_hasta` se calcula antes de verificar el pago.** `getEstado` (`app/gastos-fijos/hooks/useFixedExpenses.js:120-121`) evalúa `pagoHasta > periodo` **antes** del `!paidByUid`.
3. Y **`pagoHasta` se setea al registrar la factura**, con `paidByUid: null` (`registrarGasto` `useFixedExpenses.js:201-229`; el modal lo ofrece en `PagarModal.jsx:14,25`).

⇒ Un anual registrado y **nadie pagado** calcularía `pagado_hasta` ("Al día ✓") y entraría al total. Por eso el filtro va sobre el **campo crudo**, no sobre el estado calculado.

**Efecto lateral desired:** `saldarPendiente` / `saldarMes` (`:277-293`) **no tocan `paidByUid`** ⇒ la regla "saldar no altera los totales" se cumple por construcción, sin código adicional.

## 3. Alcance de código previsto (2 archivos, ~10 líneas)

### 3.1 `app/gastos/hooks/useGastos.js`

```js
// Total del mes / Total real: solo entra lo EFECTIVAMENTE PAGADO.
// Criterio = paidByUid. NO usar `estado`: "saldado" es balance, no pago, y
// "pagado_hasta" se calcula antes de verificar el pago (useFixedExpenses.js:120-121).
const fixedPagadas = fixedEntries.filter((e) => !!e.paidByUid);

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
function estadoVisible(entry) {
  if (!entry.paidByUid) return "pendiente_pago";
  if (entry.pagoHasta && entry.pagoHasta > entry.periodo) return "pagado_hasta";
  return entry.estado;
}
```

Objetivo: impago → "Pendiente" · pagado con `pagoHasta > periodo` → "Al día ✓" · resto → el estado existente.
Usa datos que **ya están en la entry** (`paidByUid`, `pagoHasta`, `periodo` — este último se escribe en `useFixedExpenses.js:218`).

Motivo: hoy `FilaFijo` usa el `entry.estado` crudo (`GastosFijosSection.jsx:11`), así que un anual pagado se rotula "Pendiente" mientras **sí suma** al total. Con este helper, **toda fila marcada "Pendiente" queda fuera de los totales y toda fila con estado de pago suma**: la etiqueta y el número cuentan lo mismo.

**Solo para `/gastos`.** No tocar `getEstado` ni `/gastos-fijos`.

## 4. Fuera de alcance (no tocar en 2.2)

- `getEstado` y `/gastos-fijos`.
- Prorrateo de anuales.
- Modelo 50/50.
- Gastos diarios.
- Lógica de transferencias.
- Migraciones de Firestore.
- Corrección histórica de documentos.
- Divergencia actual entre `/gastos` y `/gastos-fijos`.
- Creación automática de usuarios/grupos.
- Separación futura de Firebase entre Staging y Producción.

## 5. Sandbox de pruebas — PREPARACIÓN PENDIENTE

**Staging y Producción usan actualmente la misma base Firebase** (ver §8). Por eso, antes de la prueba funcional se prepara un sandbox **dentro de la misma base**, aislado por dos usuarios de testing y un grupo exclusivo.

**Todavía NO está creado.** La app **no tiene registro de usuarios** (`context/arquitectura.md:24`) ni creación de grupos desde la UI ⇒ la preparación es **manual desde Firebase Console**.

Plan:

1. Firebase Console → **Authentication → Add user** ×2 (email + contraseña).
2. Copiar los 2 **UID reales** de Firebase Auth.
3. Firestore → colección `groups` → **documento nuevo con ID automático**:
   ```
   name:    "TEST 2.2"
   members: [uidA, uidB]
   ```
   El campo es `name`, **no** `nombre` (`GroupSection.jsx:16`).
4. **Nunca agregar un UID real al grupo de testing.** `useGastos.js:38` y `useFixedExpenses.js:37` usan `groups[0]`, y `getDocs` sin `orderBy` (`GroupContext.jsx:24-28`) no garantiza orden: si un usuario real quedara en 2 grupos, su `/gastos-fijos` podría apuntar al grupo de test.
5. Verificar aislamiento: el Test A debe ver el grupo `TEST 2.2` y los usuarios reales **no** deben quedar asociados a ese grupo.

**Por qué aísla:** todas las queries filtran por `usuario` o `groupId` — `GroupContext.jsx:26` (`members array-contains uid`), `subscribeGastos.js:43-47` (personal por `usuario`) y `:61-65` (compartido por `groupId`), `subscribeFixedExpenses.js:17-36` (`usuario` / `groupId`). El grupo debe tener **exactamente 2 miembros** porque `useFixedExpenses.js:265` busca "el otro" como el único miembro distinto (`otroUid`), que es lo que hace funcionar el ejemplo de $100.000.

**Consecuencia:** los datos de prueba quedan en la base real (Auth + Firestore) hasta que se decida la limpieza.

## 6. Auditoría Firestore READ-ONLY — PENDIENTE, ES EL GATE

Se ejecuta **después de preparar el sandbox y antes de implementar código**.

- Colección: **`fixed_expense_entries`**.
- Produce **solo agregados**: sin montos y sin exponer UIDs.
- Es **estrictamente read-only**: sin escrituras, sin migraciones.

Agregados requeridos:

- total de entries
- `paidByUid === null`
- **`paidByUid` ausente** (campo inexistente)
- `pagoHasta` seteado pero sin `paidByUid` (la trampa de `pagado_hasta`)
- compartidas (`groupId`)
- distribución por `estado`
- distribución por `periodo`

Script (Cloud Shell, mismo service account read-only de la validación previa — `context/MAPA-APPFINANCIERA.md:97`):

```js
const { Firestore } = require("@google-cloud/firestore");
const db = new Firestore({ projectId: "TU_PROJECT_ID" });

(async () => {
  const docs = (await db.collection("fixed_expense_entries").get())
    .docs.map(d => d.data());

  const cuenta = (f) => docs.filter(f).length;
  const reparto = (k) => docs.reduce((a, d) => {
    const key = d[k] ?? "(sin valor)";
    a[key] = (a[key] || 0) + 1;
    return a;
  }, {});

  console.log(JSON.stringify({
    total: docs.length,
    paidByUid_es_null:   cuenta(d => d.paidByUid === null),
    paidByUid_AUSENTE:   cuenta(d => !("paidByUid" in d)),
    pagoHasta_sin_pago:  cuenta(d => d.pagoHasta && !d.paidByUid),
    compartidas:         cuenta(d => !!d.groupId),
    porEstado:  reparto("estado"),
    porPeriodo: reparto("periodo"),
  }, null, 2));
})();
```

### Gate

| Resultado | Acción |
|---|---|
| `paidByUid_AUSENTE > 0` | ⛔ **STOP.** Esas entries salient de todos los meses ya cerrados → **redefinir el criterio** antes de tocar código. |
| `paidByUid_AUSENTE === 0` | ✅ Continuar con la implementación prevista (§3). |

## 7. Verificación prevista

**Estática:** `npm run build` + `npm run lint`.

**Runtime Local: fuera de alcance.** Esta máquina no tiene `.env` reproducible (`.env*` está ignorado en `AppFinanciera/.gitignore:34` y no hay ningún archivo `.env` en disco), por lo que el paso Local del flujo de `HANDOFF-ETAPA-2.md` §1 no es ejecutable hoy.

**Prueba funcional: en el sandbox (§5).**

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Registrar fijo compartido de $100.000, **nadie paga** | Total del mes **$0** · Total real **$0** · fila **Pendiente** |
| 2 | El otro usuario paga $100.000 | Total del mes **$50.000** · Total real **$100.000** · el principal **debe $50.000** |
| 3 | **Saldar** | Total del mes **sigue $50.000** · Total real **sigue $100.000** · balance **$0** → prueba que `saldado` no controla los totales |
| 4 | Registrar **anual** con `pagoHasta` futuro, **sin pago** | Etiqueta **Pendiente** · **no** aparece como "Al día" · **no** entra en los totales |
| 5 | Registrar gasto fijo **personal** sin pagar | Total del mes **$0** · **no** entra en Total real |

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

1. Preparar el sandbox (§5) — manual, Firebase Console.
2. Auditoría Firestore read-only (§6).
3. **Gate** (§6).
4. Implementación (§3).
5. `npm run build` + `npm run lint`.
6. Prueba funcional en el sandbox — 5 casos (§7).
7. Revisión funcional del usuario.
8. **Aprobación explícita.**
9. Merge a `main`.
10. Deploy a Producción.
11. Verificación con cuenta real.
12. Cierre de 2.2.

**En el paso 11:** los meses con facturas registradas y nunca pagadas **bajan** de total. Es el comportamiento pedido, y hay que revisarlo sobre los meses reales.
