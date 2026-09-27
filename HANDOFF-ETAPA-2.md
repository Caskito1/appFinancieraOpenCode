# HANDOFF — Etapa 2: Correcciones y limpieza (AppFinanciera)

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Origen:** Organizador Personal — Etapas 0 y 1 cerradas (Etapa 1: 25/09/2026, commit `78e1461`).
**Fuente de contexto:** `REPORT-ETAPA-0.md` · `PROPUESTA-ETAPA-1.md` (incl. decisión 6.1–6.5, D1–D10) · `context/{MAPA,dominio,arquitectura}.md` · `ROADMAP.md`.

> **Naturaleza de este documento: PLANIFICACIÓN, no autorización de implementación.**
> Aprobado por el usuario como estructura candidata de Etapa 2 (25/09/2026). El alcance y el
> contenido de cada subetapa se definen y aprueban por separado, en orden, antes de implementar.

## 0. Estado de las subetapas (actualizado 25/09/2026)

| Subetapa | Estado | Commit | Validación |
|---|---|---|---|
| **2.1 — Taxonomía fijos unificada + "Otros"** | ✅ **CERRADA** | `b46b570` (Producción) | Local (build + 27 invariantes) · Staging (funcional) · Producción (funcional) |
| 2.2 — Totales del mes con gastos fijos | 🟡 **PENDIENTE — definición funcional CERRADA (25/09/2026), no implementada**; plan en `PROPUESTA-2.2.md` | — | — |
| 2.3 · 2.4 · 2.5 · 2.6 | Sin empezar | — | — |

**2.1 — qué se hizo (resumen):** en `lib/fixedExpensesTaxonomia.js` (canónico) se agregó
"Otros" al catálogo **personal** (`id: otros`) y al mapa **compartidos** (`id: otros_compartido`),
ambos `nombre: "Otros"`, `icon: "📦"`, `frecuencia: "mensual"`; y se eliminó `lib/temp.js`
(duplicado sin importadores). Disney+ permanece **personal** (6.3). Los ids son distintos por diseño:
el hook clasifica compartido por `!!GASTOS_FIJOS_COMPARTIDOS_MAP[expenseId]`
(`useFixedExpenses.js:207,248`), de modo que un mismo `id` en ambas taxonomías habría escrito
un entry personal con `groupId` y `participantes` (doble conteo en `BalanceMesCard` y deuda
falsa). **Producción quedó en `b46b570`.** 2.2 **NO** fue iniciada ni modificada.

## 1. Contexto y regla de oro

AppFinanciera está **en producción con datos reales**. La Etapa 2 NO se implementa como un
bloque grande: se divide en **subetapas pequeñas, independientes y verificables**.

Flujo obligatorio para TODA subetapa:
1. planificación → 2. implementación → 3. prueba LOCAL → 4. revisión funcional del usuario →
5. STAGING → 6. revisión funcional del usuario → 7. aprobación explícita → 8. merge a
PRODUCCIÓN → 9. verificación en producción → 10. cierre de la subetapa → 11. recién la siguiente.

**Regla fundamental:** ningún cambio pasa de Local→Staging→Producción sin aprobación explícita
del usuario tras la verificación correspondiente. No se agrupan cambios funcionalmente
independientes.

Base de datos validada read-only (v3.1, 25/09): `fixed_expenses` 100 % esquema activo (0 legacy,
0 híbridos) · `transferencias` y `productos` ausentes · `users` 4 (2 uid / 2 iud) · `groups.
members` 2 uids válidos, identificación mixta · índices de patrones reales OK.

## 2. Análisis por candidato (evidencia archivo:línea, revisado 25/09/2026)

### D1 — Legado de gastos fijos (esquema B)
- **Archivos:** `app/agregar/components/ModoGastosFijos.jsx` (+ import `agregar/page.jsx:11`, branch `:149-151`, botón comentado `:82-93`), `gastos-fijos/hooks/useFixedExpense.js`, `gastos-fijos/helpers/fixedExpenseHelpers.js` (escribe esquema B: nombre/compartido/monto/balanceado/saldoPendiente…), `gastos-fijos/helpers/fixedExpensesConfig.js` (disney compartido), `gastos-fijos/sections/{PasoTipo,PasoDetalle,PasoResumen}.jsx`.
- **Comportamiento:** solo alcanzable si se descomentara el botón; escribiría esquema B en `fixed_expenses`. Hoy **inerte** (bundleado pero inalcanzable).
- **Dependencias:** ninguna funcional activa (`useFixedExpenses` activo lee desde `@/lib/fixedExpensesTaxonomia`).
- **Riesgo:** medio bajo — requiere verificar que nada más importe esos archivos antes de retirarlos. 0 datos legacy que migrar.
- **Aislable:** sí.
- **Prueba LOCAL:** build + registro normal de un gasto fijo (flujo activo) + activar/registrar personal en `/gastos-fijos`.
- **STAGING:** igual, con datos de staging.
- **PROD:** verificar `/gastos-fijos` y `/gastos` intactos tras merge.
- **Evidencia de cierre:** `grep` 0 referencias, build OK, flujo de gastos fijos operativo.

### D3 — Totales del mes con gastos fijos (`useGastos`) — ✅ **DEFINICIÓN FUNCIONAL CERRADA (25/09/2026)**
- **Archivo:** `app/gastos/hooks/useGastos.js` (`fixedCompartidos` `:93-98`, `totalFixed` `:110-114`, `totalGastos` `:120`).
- **Comportamiento observado (sigue vigente, sin corregir):** hoy suma `montoTotal/2` de TODAS las entries con `groupId`, sin mirar estado. Una entry `pendiente_pago` (nadie pagó) **infla el mes**. También `fixedCompartidos`/`montoPersonal` sin leer estados.
- **ESTADO: NO IMPLEMENTAR todavía — definición cerrada, pendiente de ejecución.** Regla acordada: los totales de `/gastos` incluyen **solo gastos fijos efectivamente pagados**, con criterio **`paidByUid`** (no `estado`: `saldado` es balance, y `pagado_hasta` se calcula antes de verificar el pago en `useFixedExpenses.js:120-121`). Total del mes = personal pagado 100% / compartido pagado 50%. Total real = ambos 100%. Impago no entra en ninguno. Saldar **no** altera los totales.
- **Plan completo, sandbox pendiente, auditoría read-only y gate previo:** `PROPUESTA-2.2.md`.
- **Alcance:** solo lectura/cálculo; **no toca históricos ni estructura de datos.**

### D8/D9 — Taxonomía de gastos fijos unificada + "Otros" — ✅ **RESUELTO EN 2.1** (`b46b570`)
- **Archivo canónico:** `lib/fixedExpensesTaxonomia.js` (GASTOS_FIJOS_PERSONALES_CATALOGO y COMPARTIDOS_MAP). Uso activo verificado en `useFixedExpenses.js:11-15` (gastos-fijos).
- **Cambios (hechos):** "Otros" agregado al catálogo **personal** (`id: otros`) y a los **compartidos** (`id: otros_compartido`), ambos `Otros`/📦/mensual (decisión 6.4). Disney ya es **PERSONAL** en canónico (6.3) — sin cambio. **`lib/temp.js` eliminado** (0 importadores verificados 3 veces).
- **Hallazgo de implementación (resuelto por diseño):** los ids son distintos a propósito. `registrarGasto`/`registrarPago` deducen "compartido" por presencia en el mapa compartido, sin recibir la categoría; con un `id` único en ambas taxonomías un entry personal se escribía con `groupId` + `participantes` (doble conteo y deuda falsa). No hizo falta tocar `useFixedExpenses.js`.
- **Riesgo:** bajo. **Aislable:** sí. **Producción:** `b46b570`, verificada funcionalmente.
- **Nota de alcance:** el compartido "Otros" **no** tiene flujo "＋ Agregar" (aparece directo en la sección de compartidos, igual que los otros 5). El "＋ Agregar" solo existe para personales.

### P4 — Ingresos: bug de bandas + sección "Otros"
- **Bug ids bandas:** `app/ingresos/components/FilaIngreso.jsx:1-13` (TIPO_LABEL usa `la_ventolera`/`la_imbailable`/`tapelao`) vs `app/agregar/components/ingresos/hooks/useModoIngreso.js:7-20` (BANDAS con ids `laventolera`/`laimbailable`/`tapelao`; eso es lo que se guarda). `PasoTipoIngreso.jsx:3-5` importa BANDAS de useModoIngreso. **Fix:** una sola fuente de ids (conservar los guardados: `laventolera`/`laimbailable`); alinear el mapa de etiquetas de **lectura** (históricos intactos).
- **Sección visual "Otros":** `app/ingresos/page.jsx:75-97` filtra solo sueldo/banda/freelance; el ingreso tipo "otros" (botón existe en alta) **no tiene sección** → invisible. Agregar una sección (patrón FreelanceSection + FilaIngreso).
- **Archivos:** `FilaIngreso.jsx`, `ingresos/page.jsx`, y sección nueva (patrón existente). `lib/ingresos.js` (TIPOS_INGRESO/BANDAS, sin importadores) es la fuente redundante.
- **Riesgo:** bajo. **Aislable:** sí (bug y sección pueden ir juntos, misma área).
- **Prueba LOCAL:** guardar ingreso banda (La Ventolera) → etiqueta correcta; guardar ingreso "otros" → visible en `/ingresos`.
- **Evidencia de cierre:** los 3 subtipos de banda etiquetan bien; "otros" aparece sumado y listado.

### Robustez — RouteGuard / AuthContext
- **Archivos:** `app/components/layout/RouteGuard.jsx:13,41-45` (lee `loading` de `useAuth`) · `lib/AuthContext.jsx:20` (expone solo `{ user }`, inicial `undefined`).
- **Comportamiento:** `loading` es `undefined` → nunca hay pantalla de carga; con `user=undefined` inicial, en mount se dispara `router.replace("/login")` en rutas protegidas (redirección prematura / posible parpadeo) antes de resolver la sesión.
- **Cambio:** exponer estado de carga real en AuthContext (o manejar `undefined`) y mantener el comportamiento rutas protegidas/login.
- **Riesgo:** medio (toca login/redirección — probar refresh en rutas protegidas, login y logout).
- **Aislable:** sí.
- **STAGING/PROD:** prueba manual de sesión en cada ambiente.

### Código muerto / deuda técnica (revisado archivo por archivo, 25/09/2026)
| Archivo | ¿Muerto? | Referencias | Riesgo eliminarlo | ¿Etapa 2? | ¿Posterior? |
|---|---|---|---|---|---|
| `lib/temp.js` | Sí | 0 | Cero | **Hecho en 2.1** (eliminado) | — |
| `lib/ingresos.js` | Sí | 0 | Cero | Sí | — |
| `app/gastos/helpers/gastosCalculations.js` | Sí | 0 | Cero | Sí | — |
| `app/agregar/.../compra/helpers/carritoHelpers.js` | Sí | 0 | Cero | Sí | — |
| `app/gastos-fijos/services/fixedExpensesService.jsx` | Sí | 0 | Cero | Sí | — |
| `app/gastos/sections/Transferenciassections.jsx` | Sí | 0 | Cero | Sí | — |
| `app/gastos/sections/EmptyState.jsx` + `app/components/ui/EmptyState.jsx` | Sí (duplicados) | 0 | Cero | Sí | — |
| `app/ingresos/components/Acordeon.jsx` | Sí (duplicado) | 0 | Cero | Sí | — |
| `export storage` en `lib/firebase.js` | Sí | 0 | Bajo | Sí | — |
| `origenCompra` (`submitCompra.js:74`) | Solo escritura, 0 lecturas | — | Bajo | Sí (dejar de escribir) | — |
| `TransferenciasIngresosSection` (import `ingresos/page.jsx:14` + JSX comentado `:99-111`) | Import muerto | — | Medio | **NO** | Etapa 3 |
| Consultas `transferencias` (`subscribeGastos.js:81-95`, `useIngresos.js:95-106`) | Semántica heredada | Colección ausente | Medio | **NO** | Etapa 3 |
| `ModoTransferencia` (agregar) + `submitTransferencia.jsx` | Inerte (botón comentado) | — | — | **NO** | Etapa 3 |

### Hallazgos `uid`/`iud` y `groups.members` (Etapa 1: no bloqueantes)
- **Impacto actual:** ningún flujo ACTIVO resuelve displayName por doc `users` (`useFixedExpenses` usa `grupo.members` solo para el `otroUid` como id crudo, `useFixedExpenses.js:265`). **Sin bug funcional hoy.**
- **Decisión:** no tocar en Etapa 2. **Sin migración.** Permanecen como **deuda de diseño posterior** (tocar el modelo de identificación exigiría migración de datos).
- Solo se documenta para que ninguna subetapa asuma identificaciones.

## 3. Propuesta de alcance (aprobada)

- **Imprescindible para el mínimo funcional:** D8/D9 (taxonomía + "Otros" fijos) — ✅ **cerrado en 2.1** · D3 (totales correctos — **definición funcional cerrada**, ver §5; pendiente de ejecución, plan en `PROPUESTA-2.2.md`) · P4-bug bandas · P4-sección "Otros" (ingresos).
- **Correcciones convenientes:** D1 (retirar flujo legacy, hoy inerte) · Robustez RouteGuard/AuthContext.
- **Limpieza técnica (cero comportamiento):** archivos sin referencias (tabla §2), `storage`, `origenCompra`.
- **Deuda que puede esperar:** `uid/iud` + `groups.members` (sin bug) · flujo y consultas de **transferencias** e import/JSX de `TransferenciasIngresosSection` → **Etapa 3** (recuperaciones/reintegros) · semántica transferencia→ingreso → **Etapa 3** · D2 50/50→N participantes (Etapa 4).
- **Fuera de Etapa 2:** recuperaciones/reintegros (E3) · migraciones/históricos · productos custom/merge (sin masa) · múltiples grupos/tarjeta (E4).

## 4. Estructura de subetapas (candidata, aprobada)

- **2.1 — Taxonomía fijos unificada + "Otros"** (D8/D9; eliminó `temp.js`). ✅ **CERRADA 25/09/2026** — commit `b46b570` en Staging, Staging y Producción. Sin dependencias. Riesgo bajo.
- **2.2 — Totales del mes con gastos fijos** (D3). 🟡 **PENDIENTE, NO BLOQUEADA POR DEFINICIÓN:** la definición funcional está **cerrada** (25/09/2026) y el plan completo está en `PROPUESTA-2.2.md`. La implementación **no está aprobada**. Orden de ejecución: sandbox (2 usuarios de test + grupo `TEST 2.2`, **aún no creados**) → auditoría Firestore read-only (gate) → implementación → build+lint → prueba funcional → aprobación. Riesgo bajo.
- **2.3 — Ingresos: ids de bandas + sección "Otros"** (P4). Independiente. Riesgo bajo.
- **2.4 — Robustez de sesión/redirección** (RouteGuard/AuthContext). Riesgo medio.
- **2.5 — Retirar flujo legacy de gastos fijos** (D1). Requiere 2.1 consolidada (canónica fija). Riesgo medio bajo.
- **2.6 — Limpieza de código muerto** (archivos + `storage` + `origenCompra`). Riesgo cero/bajo.

Orden lógico por dependencias y riesgo: 2.1 (base) → 2.5 (necesita 2.1); 2.2, 2.3 y 2.4 son
independientes y pueden planificarse en cualquier orden. Cada 2.x respeta el flujo de §1.
**No hay subetapa 2.7 en Etapa 2** (transferencias quedan para Etapa 3).

## 5. Definición funcional de 2.2 (cerrada 25/09/2026)

**2.2 ya no está bloqueada por falta de definición.** La regla funcional quedó acordada:

- **Total del mes** (`/gastos`): personal **efectivamente pagado** → 100%; compartido **efectivamente pagado** → mi parte (50%); fijo registrado **impago** → **no entra**.
- **Total real** (`/gastos`): personal y compartido **efectivamente pagados** → 100% del monto; fijo impago → **no entra**.
- **Pagado ≠ saldado:** *pagado* = el gasto ocurrió y suma a los totales; *saldado* = se resolvió el balance y **no** modifica los totales. Ejemplo de referencia (compartido de $100.000): registrada/nadie paga → $0/$0; paga el otro → $50.000/$100.000 con $50.000 de deuda; al saldar → **$50.000/$100.000 sin cambio** y balance $0.
- **Criterio técnico:** `paidByUid`. **No usar `estado`** — `saldado` es balance, y `pagado_hasta` se calcula **antes** de verificar el pago (`useFixedExpenses.js:120-121`), con `pagoHasta` seteable al registrar con `paidByUid: null`.
- **Sin cambios en:** 50/50, anuales (sin prorrateo), gastos diarios, `getEstado`, `/gastos-fijos`.

**Pendiente previo a implementar:** sandbox de pruebas (2 usuarios de test + grupo `TEST 2.2`, **no creados**) y **auditoría Firestore read-only** sobre `fixed_expense_entries` como **gate**: si hay entries **sin** `paidByUid` → STOP y redefinir criterio; si `paidByUid` ausente = 0 → implementar.

**Estado actual de referencia:** `useGastos.js:110-120` sigue sumando `montoTotal/2` (compartido) o `montoTotal` (personal) **sin mirar si fue pagado**. **2.1 no modificó este comportamiento y 2.2 no lo modificó todavía.**

Detalle completo (código previsto, casos de prueba, fuera de alcance y flujo de 12 pasos): `PROPUESTA-2.2.md`.

## 6. Restricciones

No implementar las subetapas pendientes sin su propia planificación y aprobación · no modificar
Firestore · no migrar datos · no agrupar cambios independientes · no crear
`PROPUESTA-ETAPA-2.md` todavía.

**Transferencias (Etapa 3):** no tocar ahora `ModoTransferencia`, `submitTransferencia`,
consultas de `transferencias`, import/JSX de `TransferenciasIngresosSection` ni la semántica
transferencia→ingreso. Solo quedan documentadas como pendientes para Etapa 3.

Este HANDOFF solo aprueba la **estructura de subetapas**. Cada 2.x necesita su propia
planificación, aprobación y verificación antes de ejecutarse. **2.1 ya se ejecutó completa
(Local → Staging → Producción → verificación) y está cerrada.**