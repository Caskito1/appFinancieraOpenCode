# HANDOFF — Etapa 2: Correcciones y limpieza (AppFinanciera)

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Origen:** Organizador Personal — Etapas 0 y 1 cerradas (Etapa 1: 25/09/2026, commit `78e1461`).
**Fuente de contexto:** `REPORT-ETAPA-0.md` · `PROPUESTA-ETAPA-1.md` (incl. decisión 6.1–6.5, D1–D10) · `context/{MAPA,dominio,arquitectura}.md` · `ROADMAP.md`.

> **Naturaleza de este documento: PLANIFICACIÓN, no autorización de implementación.**
> Aprobado por el usuario como estructura candidata de Etapa 2 (25/09/2026). El alcance y el
> contenido de cada subetapa se definen y aprueban por separado, en orden, antes de implementar.

## 0. Estado de las subetapas (actualizado 30/09/2026)
| Subetapa | Estado | Commit | Validación |
|---|---|---|---|
| **2.1 — Taxonomía fijos unificada + "Otros"** | ✅ **CERRADA** | `b46b570` | Local (build + 27 invariantes) · Staging (funcional) · Producción (funcional) |
| **2.2 — Totales del mes con gastos fijos** | ✅ **CERRADA** (30/09/2026) | `119cc4a` | Local (build + fixtures 24/24) · **Producción: PASS** (cuenta real, 30/09/2026) |
| 2.3 — Ingresos: labels de bandas + sección "Otros" | 🟡 **EN STAGING, validada — falta promover a `main`** (30/09/2026) | `7d71fb5` | **Gate PASS** · `build` OK · `lint` 0 nuevos · **Local 8/8 PASS** · **Staging PASS** |
| 2.4 · 2.5 · 2.6 | Sin empezar | — | — |
| 2.7 — Guard de integridad `groupId` (surgió de la validación de 2.2) | ⏳ **NO IMPLEMENTADA** — pendiente de aprobación | — | — |
| 2.8 — Header `Personal` / `Total registrado` en `/gastos-fijos` | ✅ **CERRADA** (30/09/2026) | `66ba009` | **Producción: PASS** (bloque `Personal` con los dos valores, verificado por el usuario) |

> **2.2 y 2.8 están commiteadas, deployadas y verificadas en Producción.** No queda nada pendiente de ellas, y **no se vuelve a tocar ni a redeployar**. `main` == `staging` == Producción == `66ba009` (alineación del 30/09/2026 en `PROPUESTA-2.2.md` §10.1). El deploy a Producción es **automático** desde `main` (integración Git de Vercel): no hay `vercel.json` ni CI en el repo.

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

### D3 — Totales del mes con gastos fijos (`useGastos`) — ✅ **DEFINICIÓN CERRADA · IMPLEMENTADA · CERRADA (30/09/2026)**
- **Archivo:** `app/gastos/hooks/useGastos.js` (`fixedCompartidos` `:93-98`, `totalFixed` `:110-114`, `totalGastos` `:120`) y `app/gastos/sections/GastosFijosSection.jsx` (labels).
- **Comportamiento observado (CORREGIDO el 29/09/2026):** antes suma `montoTotal/2` de TODAS las entries con `groupId`, sin mirar estado; una entry `pendiente_pago` (nadie pagó) **inflaba el mes**.
- **Regla implementada:** los totales de `/gastos` incluyen **solo gastos fijos con `esPagado === true`**, donde `esPagado = !!e.paidByUid || (!!e.pagoHasta && e.pagoHasta > e.periodo)` (nunca `estado`: `saldado` es balance, y `pagado_hasta` se calcula antes de verificar el pago en `useFixedExpenses.js:120-121`). Total del mes = personal pagado 100% / compartido pagado 50%. Total real = ambos 100%. Impago no entra en ninguno. Saldar **no** altera los totales. `esPagado` **duplicado** en los 2 archivos por decisión de alcance.
- **Labels:** registrado y sin pagar → `Registrado · Pendiente de pago` · anual vigente → `Al día ✓` · pagado → estado crudo. Invariante: lo que suma, nunca dice "Pendiente".
- **Gate previo: PASS** (34 entries, 0 inconsistentes, 0 sin `paidByUid`). Build + lint OK.
- **Commits:** `119cc4a` (2.2) y `66ba009` (2.8), ambos sobre `main`, pusheados el 29/09/2026 y **deployados automáticamente a Producción** (Vercel, integración Git desde `main`).
- **Verificación en Producción: PASS (30/09/2026, cuenta real).** El único fijo real impago dejó de sumar **tanto** en `Total` como en `Total real`, y `/gastos-fijos` muestra el bloque `Personal` con los dos valores (cubierto / `Total registrado`).
- **Prueba runtime en sandbox: 6/6 PASS (29/09/2026).** Casos verificados: (1) compartido registrado sin pago, con una **anomalía preexistente de `groupId: null`** documentada abajo; (2) compartido pagado por el usuario B ⇒ `Compartidos $6.000` / `Total compartido $12.000`, `/gastos` Total `$6.000` / Total real `$12.000`; (3) saldar ⇒ pasa a **Saldado**, totales **sin cambio**, **sin gasto adicional**; (4) anual personal Drive `$12.000` con `Pago hasta` vigente y **sin `paidByUid`** ⇒ **Al día**, Total `$18.000` / Total real `$24.000`; (5) personal Otros `$1.000` sin pago ni `pagoHasta` ⇒ visible, `Registrado · Pendiente de pago`, **fuera** de los totales; (6) extender el `Pago hasta` del anual ⇒ actualiza el detalle **sin** sumar un gasto nuevo.
- **Anomalía del caso 1 — preexistente, NO de 2.2 (→ 2.7):** el primer alta del compartido dejó el doc `NvZIq62l39BWigZW5KpA` con `fixedExpenseId: otros_compartido` + **`groupId: null`** + `estado: pendiente_pago`, y apareció **como personal** en `/gastos`. **Ya fue eliminado en la limpieza del sandbox**; se conserva el registro porque el **defecto de código sigue vigente**. Causa: `registrarGasto` (`useFixedExpenses.js:231`) deriva `groupId` de `groups[0]` **sin validar que exista** (`:43`), y el `updateDoc` (`:238-246`) **no incluye `groupId`**, así que no repara un entry corrupto. 2.2 **no** escribe en Firestore ni toca `groupId` ⇒ **relación nula**. **Guard propuesto: `if (esCompartido && !grupo?.id) return;`. NO implementado, NO dentro de 2.2.**
- **Plan completo y detalle del gate:** `PROPUESTA-2.2.md`.
- **Alcance:** solo lectura/cálculo; **no toca históricos ni estructura de datos.**

### D8/D9 — Taxonomía de gastos fijos unificada + "Otros" — ✅ **RESUELTO EN 2.1** (`b46b570`)
- **Archivo canónico:** `lib/fixedExpensesTaxonomia.js` (GASTOS_FIJOS_PERSONALES_CATALOGO y COMPARTIDOS_MAP). Uso activo verificado en `useFixedExpenses.js:11-15` (gastos-fijos).
- **Cambios (hechos):** "Otros" agregado al catálogo **personal** (`id: otros`) y a los **compartidos** (`id: otros_compartido`), ambos `Otros`/📦/mensual (decisión 6.4). Disney ya es **PERSONAL** en canónico (6.3) — sin cambio. **`lib/temp.js` eliminado** (0 importadores verificados 3 veces).
- **Hallazgo de implementación (resuelto por diseño):** los ids son distintos a propósito. `registrarGasto`/`registrarPago` deducen "compartido" por presencia en el mapa compartido, sin recibir la categoría; con un `id` único en ambas taxonomías un entry personal se escribía con `groupId` + `participantes` (doble conteo y deuda falsa). No hizo falta tocar `useFixedExpenses.js`.
- **Riesgo:** bajo. **Aislable:** sí. **Producción:** `b46b570`, verificada funcionalmente.
- **Nota de alcance:** el compartido "Otros" **no** tiene flujo "＋ Agregar" (aparece directo en la sección de compartidos, igual que los otros 5). El "＋ Agregar" solo existe para personales.

### P4 — Ingresos: bug de bandas + sección "Otros" — 🟡 **IMPLEMENTADA EN LOCAL (30/09/2026)**, falta promoción
- **Bug ids bandas:** `app/ingresos/components/FilaIngreso.jsx:1-13` (TIPO_LABEL usa `la_ventolera`/`la_imbailable`/`tapelao`) vs `app/agregar/components/ingresos/hooks/useModoIngreso.js:7-20` (BANDAS con ids `laventolera`/`laimbailable`/`tapelao`; eso es lo que se guarda). `PasoTipoIngreso.jsx:3-5` importa BANDAS de useModoIngreso. **Fix:** una sola fuente de ids (conservar los guardados: `laventolera`/`laimbailable`); alinear el mapa de etiquetas de **lectura** (históricos intactos).
  - **Corrección del diagnóstico (30/09/2026):** el bug **visible** (headers "Laventolera"/"Laimbailable") **no estaba en `FilaIngreso`**, sino en `BandasSection.jsx:10-11,60`, que agrupaba y renderizaba el id crudo con `capitalize`. `TIPO_LABEL` era **código inalcanzable** (`FilaIngreso` solo lo usan `SueldoSection` y `FreelanceSection`, ambas con `subtipo: null`), así que arreglarlo no arreglaba nada visible. **Resuelto** importando `BANDAS` para el label en `BandasSection` y **eliminando** `TIPO_LABEL`.
- **Sección visual "Otros":** `app/ingresos/page.jsx:75-97` filtra solo sueldo/banda/freelance; el ingreso tipo "otros" (botón existe en alta) **no tiene sección** → invisible. Agregar una sección (patrón FreelanceSection + FilaIngreso).
  - **Causa raíz (hallazgo del 30/09/2026):** `subscribeIngresos.js:30-48` **no filtra por `tipo`**, así que los ingresos de "otros" ya venían en `ingresos` y **ya sumaban** en `totalIngresos`: eran *contados pero invisibles*. Por eso agregar la sección **no mueve ni un peso** del total.
  - **Resuelto:** `OtrosSection.jsx` nuevo (con `empty`), `ingresosOtros` en `useIngresos.js` + `otros: true` en `openSections`, y `ingresosOtros.length` en `totalTransacciones` de `page.jsx`.
- **Archivos:** `BandasSection.jsx`, `FilaIngreso.jsx`, `useIngresos.js`, `OtrosSection.jsx` (nuevo), `page.jsx`. `lib/ingresos.js` (TIPOS_INGRESO/BANDAS, sin importadores) es la fuente redundante.
- **Riesgo:** bajo. **Aislable:** sí (bug y sección pueden ir juntos, misma área).
- **Prueba LOCAL:** **solo lectura, sin crear datos** (decisión del usuario) — se usaron los datos reales que confirmó el gate (9 bandas + 5 `otros` + freelance con detalle). **0 escrituras en Firestore, 0 limpieza pendiente.**
- **Evidencia de cierre:** ✅ **cerrada en Local (8/8)** y ✅ **cerrada en Staging**. Falta promover a `main` y verificar en Producción.
- **Deuda registrada, NO implementada:** ingresos **sin edición ni borrado** (§9.1 de `PROPUESTA-2.3.md`).

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
- **2.2 — Totales del mes con gastos fijos** (D3). ✅ **CERRADA 30/09/2026** — commit `119cc4a`. Definición funcional **cerrada** (25/09/2026), criterio técnico `esPagado` y labels **cerrados** (29/09/2026), **gate histórico PASS** (34 entries, 0 inconsistentes), **prueba funcional en sandbox 6/6 PASS**, **deployada a Producción** y **verificada en Producción con cuenta real** (el único fijo impago dejó de sumar en `Total` y en `Total real`). Plan y detalle en `PROPUESTA-2.2.md`. Riesgo bajo.
- **2.3 — Ingresos: ids de bandas + sección "Otros"** (P4). Independiente. Riesgo bajo. 🟡 **EN STAGING, VALIDADA (30/09/2026) — falta promover a `main`.** **Gate read-only PASS** (`idsLegacy = 0` ⇒ fix 100 % lado lectura, **sin alias ni migración**; 5 `laventolera`, 3 `laimbailable`, 1 `tapelao`, **5 `otros`**). Commit **`7d71fb5`** (5 archivos, +72/−28, solo bajo `app/ingresos/`), subido **solo a `staging`** por fast-forward limpio (0 merges) con `git push origin main:staging`, **sin tocar `origin/main`**. **Validada 8/8 en Local y PASS en Staging**, con **0 escrituras en Firestore**. `origin/main` = `66ba009` (Producción **sin** 2.3); `origin/staging` = `7d71fb5`. Plan y detalle en `PROPUESTA-2.3.md`.
- **2.4 — Robustez de sesión/redirección** (RouteGuard/AuthContext). Riesgo medio.
- **2.5 — Retirar flujo legacy de gastos fijos** (D1). Requiere 2.1 consolidada (canónica fija). Riesgo medio bajo.
- **2.6 — Limpieza de código muerto** (archivos + `storage` + `origenCompra`). Riesgo cero/bajo.
- **2.7 — Guard de integridad `groupId` en el alta de compartidos** (surgió de la validación runtime de 2.2, §2 D3). ⏳ **NO IMPLEMENTADA — requiere aprobación propia.** Archivos: `app/gastos-fijos/hooks/useFixedExpenses.js`. Riesgo bajo.
- **2.8 — Header `Personal` cubierto / `Total registrado` en `/gastos-fijos`** (surgió de la validación runtime de 2.2). ✅ **CERRADA 30/09/2026** — commit `66ba009`, deployada y verificada en Producción. Archivos: `app/gastos-fijos/hooks/useFixedExpenses.js`, `app/gastos-fijos/page.jsx`, `app/gastos-fijos/sections/BalanceMesCard.jsx`.

Orden lógico por dependencias y riesgo: 2.1 (base) → 2.5 (necesita 2.1); 2.2, 2.3, 2.4 y 2.7 son
independientes y pueden planificarse en cualquier orden. Cada 2.x respeta el flujo de §1.
Las transferencias continúan fuera de Etapa 2 (van a Etapa 3).

## 5. Definición funcional de 2.2 (cerrada 25/09/2026 · ampliada 29/09/2026)

**2.2 ya no está bloqueada por falta de definición.** La regla funcional quedó acordada:

- **Total del mes** (`/gastos`): personal **efectivamente pagado** → 100%; compartido **efectivamente pagado** → mi parte (50%); fijo registrado **impago** → **no entra**.
- **Total real** (`/gastos`): personal y compartido **efectivamente pagados** → 100% del monto; fijo impago → **no entra**.
- **Pagado ≠ saldado:** *pagado* = el gasto ocurrió y suma a los totales; *saldado* = se resolvió el balance y **no** modifica los totales. Ejemplo de referencia (compartido de $100.000): registrada/nadie paga → $0/$0; paga el otro → $50.000/$100.000 con $50.000 de deuda; al saldar → **$50.000/$100.000 sin cambio** y balance $0.
- **Criterio técnico definitivo (29/09/2026) — `esPagado`:**

  ```js
  const esPagado = (e) => !!e.paidByUid || (!!e.pagoHasta && e.pagoHasta > e.periodo);
  ```

  Es decir **pagado, o anual con período de pago vigente**. **Nunca usar `estado`:** `saldado` es balance, y `pagado_hasta` se calcula **antes** de verificar el pago (`useFixedExpenses.js:120-121`).
  La segunda rama es obligatoria porque `registrarGasto` (`useFixedExpenses.js:201-244`) resetea `paidByUid: null` al registrar **y al actualizar** un anual: sin ella, un anual que figura "Al día ✓" dejaría de contabilizarse.
  **Consecuencia asumida:** registrar un anual con `pagoHasta` futuro lo hace contar como pagado de inmediato. Es lo pedido y coincide con `getEstado`.
- **Labels en `/gastos` (definitivos 29/09/2026):** registrado y sin pagar → `Registrado · Pendiente de pago` · anual con `pagoHasta > periodo` → `Al día ✓` · pagado → estado crudo (`Sin saldar` / `Saldado ✓`).
  **Invariante:** `esPagado(e) === true` ⇒ nunca "Pendiente"; y toda fila "Pendiente" ⇒ queda fuera de ambos totales.
- **Duplicación aceptada:** `esPagado` queda **duplicado** en `useGastos.js` y `GastosFijosSection.jsx` por decisión explícita del usuario, para no ampliar el alcance a un tercer archivo. Si divergen, hay que sincronizarlos. La mejora 2.8 del header de `/gastos-fijos` agrega una **tercera copia** en `useFixedExpenses.js`, por la misma regla de no extraer un helper compartido.
- **Sin cambios en:** 50/50, anuales (sin prorrateo), gastos diarios, `getEstado`, la lógica de `/gastos-fijos`, y `BalanceMesCard` **salvo el bloque `Personal`** aprobado como 2.8 en el cierre.

**Gate histórico: EJECUTADO y PASS (29/09/2026).** Auditoría read-only desde Cloud Shell sobre `fixed_expense_entries`: **34 entries**, `paidByUid` ausente = **0**, `pagoHasta` vigente sin pago = 2, `pagoHasta` vencido = 0, compartidas = 18, `pendiente_pago` = 3, y **0 entries inconsistentes** (estado o participantes de pago sin `paidByUid`) ⇒ **no se requiere migración ni redefinición de criterio**. Efecto esperado: **1 sola entry** real deja de sumar; las 2 anuales vigentes siguen sumando y pasan a `Al día ✓`; las otras 31 no cambian. Detalle y script en `PROPUESTA-2.2.md` §6.

**Prueba runtime: EJECUTADA y PASS (29/09/2026), 6/6 casos** sobre la app local con el `.env.local` del proyecto (misma base Firebase que Producción, ver `PROPUESTA-2.2.md` §8). **Sí hubo escrituras**, contra datos de sandbox temporales y reales. El **gate read-only no escribió nada** (solo `.get()`). Fixtures lógicos 24/24. Build 9/9. Lint: 0 problemas nuevos (persisten 2 errores + 3 warnings preexistentes ajenos a 2.2). Informe completo en `PROPUESTA-2.2.md` §7.1–7.3.

**Limpieza del sandbox: EJECUTADA y VERIFICADA (29/09/2026).** Se eliminaron las **6 `fixed_expense_entries` temporales**, incluido el huérfano `NvZIq62l39BWigZW5KpA`. Conteo verificado: `fixed_expense_entries` **40 → 34**, sandbox **6 → 0**, reales **34 → 34**. Estado real posterior: `saldado: 31` · `pendiente_pago: 3`; por periodo `2026-06: 10` · `2026-07: 8` · `2026-08: 9` · `2026-09: 7` — **idéntico al gate histórico**, luego ninguna entry real fue alterada. **Se conservaron a propósito** los 2 usuarios de prueba (`doVj0bxHqjdtV2N88FuLiyaeCK12`, `IJWQmtR1z2Z29xrGsXhMe9OAUtA2`), el grupo `groups/TEST-2-2` y las configs `fixed_expenses/TEST-2-2-drive-A` / `TEST-2-2-drive-B`, para reutilizar el andamiaje en pruebas futuras. Detalle en `PROPUESTA-2.2.md` §5.1.

**Pendiente: NADA.** Revisión del usuario, commits (`119cc4a` + `66ba009`), push, deploy a Producción y verificación en Producción **ya ejecutados** (30/09/2026). La limpieza de datos temporales también.

**Commits, deploy y alineación de ambientes (30/09/2026).** `119cc4a` (2.2) y `66ba009` (2.8) se commitearon sobre `main` el 29/09/2026 ~18:07 y se pushearon. El deploy a Producción es **automático** (integración Git de Vercel; no hay `vercel.json` ni CI en el repo). **No hubo merge desde `staging`.** Tras el deploy, `staging` quedó atrasada en `b46b570` mientras `main` y Producción estaban en `66ba009` — es decir, **Staging corría 2.1 solamente** — y se corrigió con un **fast-forward puro** (`git merge --ff-only main` sobre `staging`, `b46b570 → 66ba009`, **0 commits de merge**, 5 archivos, +48/−5, **cero escrituras a Firestore**). Ahora `main == staging == Producción == 66ba009`. Detalle y garantías en `PROPUESTA-2.2.md` §10.1.

**Verificación en Producción: PASS (30/09/2026, cuenta real).** (1) `/gastos`: el único fijo real impago dejó de sumar **tanto** en `Total` como en `Total real`. (2) `/gastos-fijos`: el bloque `Personal` muestra los **dos** valores (cubierto / `Total registrado`). Con esto se cierra el paso 12 del flujo de 12 pasos y **2.2 queda cerrada**.

**2.8 — header de `/gastos-fijos` (CERRADA 30/09/2026, commit `66ba009`):** el bloque `Personal` de `BalanceMesCard` muestra dos valores. `Personal` = fijos personales **cubiertos** por la **misma** `esPagado` de 2.2 (un anual con `pagoHasta` vigente cuenta aunque `paidByUid` sea `null`); `Total registrado` = todos los personales registrados, cubiertos + pendientes. **Validado primero en local** (`Personal: $12.000` · `Total registrado: $13.000` con Drive anual `$12.000` cubierto + Otros personal `$1.000` pendiente) y **después verificado en Producción** (30/09/2026): los dos valores se muestran correctamente. **Compartidos sin cambios.** El resto de `BalanceMesCard` y `useGastos.js` **no** se tocaron.

Detalle completo (código, casos de prueba, fuera de alcance y flujo de 12 pasos): `PROPUESTA-2.2.md`.

## 6. Restricciones

No implementar las subetapas pendientes sin su propia planificación y aprobación · no modificar
Firestore · no migrar datos · no agrupar cambios independientes · no crear
`PROPUESTA-ETAPA-2.md` todavía.

**Transferencias (Etapa 3):** no tocar ahora `ModoTransferencia`, `submitTransferencia`,
consultas de `transferencias`, import/JSX de `TransferenciasIngresosSection` ni la semántica
transferencia→ingreso. Solo quedan documentadas como pendientes para Etapa 3.

Este HANDOFF solo aprueba la **estructura de subetapas**. Cada 2.x necesita su propia
planificación, aprobación y verificación antes de ejecutarse. **2.1, 2.2 y 2.8 están cerradas**
(Local → Staging → Producción → verificación). **2.3 está commiteada (`7d71fb5`), validada en
Local (8/8) y en Staging**, y **falta su promoción a `main` + verificación en Producción**: su
plan y detalle están en `PROPUESTA-2.3.md`.

> **Estado de ambientes al 30/09/2026:** `origin/main` = `66ba009` (Producción, sin 2.3) · `origin/staging` = `7d71fb5` (con 2.3). Que `staging` esté un commit adelante de `main` es el estado esperado hasta que se apruebe la promoción, **no una desalineación**.

**Deuda funcional registrada el 30/09/2026, NO implementada:** el módulo de ingresos **no tiene
flujo para editar ni para eliminar** un ingreso existente (solo el alta). Un ingreso mal cargado
no se corrige desde la app. **Fuera del alcance de 2.3** por decisión explícita del usuario;
queda pendiente de una etapa posterior, sin subetapa asignada. Detalle en `PROPUESTA-2.3.md` §9.1.