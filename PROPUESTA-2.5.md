# PROPUESTA — Subetapa 2.5: Retiro del flujo legacy de gastos fijos (D1)

> **Naturaleza: SUBETAPA CERRADA (11/10/2026).** Implementada en `feat/2.5-retiro-flujo-legacy-fijos`
> (`3216095`), publicada en la Preview de Vercel de la rama (**PASS usuario**), promovida a `staging`
> por fast-forward (**PASS usuario**), promovida a `main` por fast-forward con aprobación explícita
> (deploy automático a Producción) y **validada en Producción por el usuario (11/10/2026)**.
> `main` == `staging` == Producción == `3216095`. No queda nada pendiente de 2.5.

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.5 de la Etapa 2 · **Origen:** candidato D1 — legado de gastos fijos (esquema B) (`HANDOFF-ETAPA-2.md` §2)
**Archivos:** **8** — 7 eliminados + `app/agregar/page.jsx` editado. **−705 / +0**. Firestore: **0 toques**.

## 0. Estado actual

| Ítem | Estado |
|---|---|
| Alcance | ✅ **DEFINIDO Y APROBADO** — plan presentado y BUILD autorizado con 8 condiciones (11/10/2026) |
| Rama de trabajo | ✅ `feat/2.5-retiro-flujo-legacy-fijos` creada desde `1716a19` (= `main` == `staging` al momento de arrancar) |
| Implementación | ✅ **COMMITEADA** `3216095` — 8 archivos, −705/0 |
| Grep de regresión | ✅ **0 referencias** a `ModoGastosFijos`, `useFixedExpense`, `fixedExpenseHelpers`, `fixedExpensesConfig`, `gastos-fijos/{hooks,helpers,sections}` |
| `build` | ✅ **OK 9/9** |
| `lint` | ✅ **0 problemas nuevos** (2 errores + 2 warnings preexistentes; el warning de `ModoGastosFijos.jsx` desapareció con el borrado) |
| Prueba funcional Local (usuario) | ✅ **PASS** (11/10/2026, solo lectura) |
| Preview Vercel (rama) | ✅ **PASS** (usuario) |
| Promoción a `staging` | ✅ FF `1716a19..3216095` — **PASS en Staging** (usuario) |
| Promoción a `main` / Producción | ✅ FF `1716a19..3216095` con aprobación explícita — deploy automático |
| Verificación en Producción | ✅ **PASS** (11/10/2026, usuario) |
| Firestore | ⛔ **SIN CAMBIOS — 0 escrituras** |
| Estado de ambientes | ✅ **ALINEADOS**: `origin/main` == `origin/staging` == **`3216095`** |
| Cierre | ✅ **CERRADA** (11/10/2026) — flujo completo Local → Preview → Staging → Producción → verificación |

## 1. Diagnóstico (candidato D1, verificado sobre el código al planificar)

El flujo de alta de gastos fijos "esquema B" seguía **bundleado pero inalcanzable**:
- Botón "Gasto fijo" **comentado** en `app/agregar/page.jsx:82-93`; el único `setModo("gastos-fijos")` vivía ahí ⇒ el modo era inalcanzable.
- Render condicional `{modo === "gastos-fijos" && <ModoGastosFijos …>}` en `:149-151`, solo activable desde ese modo.
- `submitFixedExpense` (`fixedExpenseHelpers.js`) escribía **esquema B** vía `addDoc` en `fixed_expenses` — nunca ejecutado en la práctica. **0 datos legacy que migrar** (Etapa 0 + cierre de 2.1).
- El flujo **activo** de fijos (`app/gastos-fijos/hooks/useFixedExpenses.js` plural + `lib/fixedExpensesTaxonomia.js`) **no importaba ninguno de los archivos legacy** (verificado por grep en ambos sentidos).

## 2. Cambio implementado

**Eliminados (carpeta completa `app/agregar/components/gastos-fijos/` + componente):**
| Archivo | Líneas |
|---|---|
| `app/agregar/components/ModoGastosFijos.jsx` | 206 |
| `…/gastos-fijos/hooks/useFixedExpense.js` | 82 |
| `…/gastos-fijos/helpers/fixedExpenseHelpers.js` | 71 (writer esquema B) |
| `…/gastos-fijos/helpers/fixedExpensesConfig.js` | 79 |
| `…/gastos-fijos/sections/PasoTipo.jsx` | 42 |
| `…/gastos-fijos/sections/PasoDetalle.jsx` | 105 |
| `…/gastos-fijos/sections/PasoResumen.jsx` | 100 |

**Editado `app/agregar/page.jsx` (3 bloques, los únicos):** import de `ModoGastosFijos`, botón comentado "Gastos fijos", y render condicional del modo. **El bloque Transferencias (import, botón comentado, render) quedó intacto** — verificado en el diff.

**Componentes UI compartidos (`StepBar`, `BackBtn`, `SectionLabel`, `SectionBtn`):** verificado que **tienen otros importadores activos** antes de borrar — sin huérfanos nuevos.

## 3. Verificación

- Grep 0 refs · `build` 9/9 · `lint` 0 nuevos · diff revisado: 8 archivos, −705/0, sin archivos adicionales.
- Prueba funcional Local y en Staging/Producción por el usuario (solo lectura): `/agregar` sin "Gasto fijo", `/gastos-fijos` y `/gastos` intactos.
- **Firestore:** 0 escrituras; el código eliminado era inalcanzable (corrección 100 % limpieza, sin gate de datos necesario).

## 4. Fuera de alcance (confirmado)

2.6 (código muerto: `storage`, `origenCompra`, duplicados…) · Transferencias en cualquier forma (intactas: import, botón, render, consultas y balances) · datos de `fixed_expenses` · refactor de `page.jsx`.

## 5. Cierre

`3216095` pusheado a `staging` (FF) y promovido a `main` (FF, aprobación explícita); deploy automático a Producción; **verificado por el usuario (11/10/2026)**. `main` == `staging` == Producción == `3216095`. **2.5 queda cerrada.**
