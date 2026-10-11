# PROPUESTA — Subetapa 2.6: Limpieza de código muerto (sin Transferencias)

> **Naturaleza: SUBETAPA CERRADA (11/10/2026).** Implementada en `feat/2.6-codigo-muerto`
> (`10ab576`), publicada en la Preview de Vercel de la rama (**PASS usuario**), promovida a `staging`
> por fast-forward (**PASS usuario**), promovida a `main` por fast-forward con aprobación explícita
> (deploy automático a Producción) y **validada en Producción por el usuario (11/10/2026)**.
> `main` == `staging` == Producción == `10ab576`. **Con 2.6 cerrada, la Etapa 2 queda
> COMPLETAMENTE CERRADA (9/9 subetapas).** No queda nada pendiente de 2.6.

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.6 de la Etapa 2 · **Origen:** tabla de código muerto (`HANDOFF-ETAPA-2.md` §2), revisada archivo por archivo
**Archivos:** **7** — 6 eliminados + `lib/firebase.js` editado. **−330 / +0**. Firestore: **0 toques**.

## 0. Estado final

| Ítem | Estado |
|---|---|
| Alcance | ✅ **DEFINIDO Y APROBADO** — plan con evidencia por candidato; BUILD autorizado con lista blanca estricta y dos decisiones explícitas (11/10/2026) |
| Rama de trabajo | ✅ `feat/2.6-codigo-muerto` creada desde `3216095` (= `main` == `staging` al arrancar) |
| Implementación | ✅ **COMMITEADA** `10ab576` — 7 archivos, −330/0 |
| Greps de regresión | ✅ **0 restos** de `lib/ingresos`, `carritoHelpers`, `fixedExpensesService` (+ sus exports), `EmptyState`, `getStorage`, `TIPOS_INGRESO`; Acordeon en `ingresos/sections` → todos al canónico `gastos/components/Acordeon` |
| `build` | ✅ **OK 9/9** |
| `lint` | ✅ **0 problemas nuevos** (baseline exacto: 2 errores + 2 warnings preexistentes) |
| Prueba Local/Preview (usuario) | ✅ **PASS** (solo lectura; flujo de compra vía hook vivo, `/gastos-fijos`, `/gastos`, `/ingresos`, Transferencias intacta) |
| Promoción a `staging` | ✅ FF `3216095..10ab576` — **PASS en Staging** (usuario) |
| Promoción a `main` / Producción | ✅ FF `3216095..10ab576` con aprobación explícita — deploy automático |
| Verificación en Producción | ✅ **PASS** (11/10/2026, usuario) |
| Firestore | ⛔ **SIN CAMBIOS — 0 escrituras** |
| Estado de ambientes | ✅ **ALINEADOS**: `origin/main` == `origin/staging` == **`10ab576`** |
| Cierre | ✅ **CERRADA** (11/10/2026) — flujo completo Local → Preview → Staging → Producción → verificación |

## 1. Diagnóstico (candidatos revisados uno por uno sobre `3216095`)

La tabla de código muerto de `HANDOFF-ETAPA-2.md` §2 fue re-verificada con grep de importadores,
búsquedas de dynamic imports y revisión de duplicados:

| Candidato | Evidencia | Veredicto |
|---|---|---|
| `lib/ingresos.js` | `TIPOS_INGRESO`/`BANDAS` sin importadores; los `BANDAS` vivos están en `useModoIngreso.js` | Muerto |
| `carritoHelpers.js` | Sin ningún `import … carritoHelpers`; `toggleProducto`/`updateItem`/`removeItem` están implementados y consumidos desde `useModoCompra.js` | Muerto (copia huérfana) |
| `fixedExpensesService.jsx` | 0 importadores; el servicio vivo de fijos es `useFixedExpenses.js` (plural) | Muerto |
| `app/components/ui/EmptyState.jsx` | 0 importadores (grep global, sin `import()`/`dynamic()`) | Muerto |
| `app/gastos/sections/EmptyState.jsx` | 0 importadores | Muerto |
| `app/ingresos/components/Acordeon.jsx` | 0 importadores (los 8 usos de Acordeon apuntan al canónico `gastos/components/Acordeon`); importa `lucide-react`, ausente de `package.json` | Muerto (duplicado no idéntico) |
| `storage` en `lib/firebase.js` | 0 consumidores; única mención de `firebase/storage` en el repo | Muerto |
| `gastosCalculations.js` | 0 importadores, **PERO** contiene `calcularTotalIngresos`/`calcularNeto` (balances de Transferencias) | **CONSERVADO — decisión #1** |
| `origenCompra` (`submitCompra.js:74`) | Escritura sin lectores ni `where()` en la app; posible uso externo no verificable sin Firestore | **CONSERVADO — decisión #2** |

## 2. Decisiones explícitas del usuario (no reabrir)

1. **`gastosCalculations.js` se CONSERVA:** aunque sin importadores, su contenido es matemática de balances de Transferencias; queda reservado para su evaluación en la **Etapa 3** (Reintegros).
2. **`origenCompra` se CONSERVA:** no se quita la escritura en `submitCompra.js` ni se modifica el esquema; la ausencia de consumidores en la app no descarta usos externos (consola/scripts/Organizador). Retiro solo con confirmación posterior del usuario, en cambio aparte.

**Exclusión obligatoria respetada:** 0 toques sobre Transferencias (secciones, consultas, balances, `ModoTransferencia`, `submitTransferencia`, Acordeon canónico, `FilaIngreso`). `Transferenciassections.jsx` (0 importadores verificados) se **conservó** por pertenecer al área Transferencias — queda para Etapa 3/4.

## 3. Cambio implementado

**Eliminados (6):** `lib/ingresos.js` (24) · `agregar/components/compra/helpers/carritoHelpers.js` (77) · `gastos-fijos/services/fixedExpensesService.jsx` (110) · `components/ui/EmptyState.jsx` (18) · `gastos/sections/EmptyState.jsx` (9) · `ingresos/components/Acordeon.jsx` (90).

**Editado `lib/firebase.js`:** únicamente la importación de `getStorage` y `export const storage` (−2). `storageBucket` del config se conserva; `package.json` intacto.

**Total: −330/0, 7 archivos.** Ningún archivo fuera de la lista blanca aprobada.

## 4. Verificación

- Greps de regresión 0 restos · `build` 9/9 · `lint` baseline exacto (2 errores + 2 warnings, 0 nuevos) · diff revisado: exactamente los 7 archivos aprobados.
- Prueba funcional Local/Preview/Staging/Producción por el usuario en modo **solo lectura** (0 escrituras Firestore).

## 5. Fuera de alcance (confirmado)

Transferencias en cualquier forma · `gastosCalculations.js` · `origenCompra` · `submitCompra.js` · datos de Firestore · `package.json` · docs (cierre documental posterior).

## 6. Cierre

`10ab576` pusheado a `staging` (FF) y promovido a `main` (FF, aprobación explícita); deploy automático a Producción; **verificado por el usuario (11/10/2026)**. `main` == `staging` == Producción == `10ab576`. **2.6 queda cerrada y con ella la Etapa 2 completa.**
