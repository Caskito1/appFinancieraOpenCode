# context/dominio.md — Modelo funcional y comportamiento de negocio de AppFinanciera

Documento de **dominio**: qué representa cada cosa en la aplicación, independiente del detalle de implementación (para el detalle técnico ver `context/arquitectura.md`; para ubicar módulos ver `context/MAPA-APPFINANCIERA.md`).

> **Origen:** integra `CONTEXTO-ETAPA3.md` (documento de uso real y visión, 19/09/2026), las decisiones funcionales del `HANDOFF-ETAPA-0-MAPA-CONTEXTO.md` y la verificación sobre el código del 23/09/2026. Este archivo es la fuente de contexto funcional para cualquier modificación futura.

## 1. Principios rectores

1. **Separar "así funciona hoy" de "así debería funcionar".** Los hallazgos de comportamiento se etiquetan `#actual`, `#deseado`, `#problema` o `#propuesta`.
2. **Gasto diario compartido ≠ deuda.** El gasto compartido diario es un registro/historial visible para ambos; **no genera balance** (decisión intencional del uso actual de la pareja, no una obligación del modelo).
3. **Reintegro/recuperación ≠ ingreso.** El dinero recibido para cancelar dinero adelantado **no es ingreso real**.
4. **Modelo flexible, interfaz sencilla.** El modelo interno no debe quedar limitado a 50/50 aunque la interfaz muestre 50/50.
5. **La app debe representar la realidad financiera sin obligar a usar toda la complejidad disponible** (configuración futura opcional por grupo/usuario).
6. **El cierre de Finanzas (Organizador) no implica el cierre de AppFinanciera como producto.**

## 2. Tipos de movimiento (vocabulario del dominio)

| Tipo | ¿Genera balance? | Es ingreso real? | Definición |
|---|---|---|---|
| **Ingreso real** (`ingresos`) | No | **Sí** | Sueldo, bandas, freelance, otros. Entrada de dinero personal. |
| **Gasto personal** (`gastos`, `tipo="personal"`) | No | No | Gasto propio del usuario. |
| **Gasto compartido diario** (`gastos`, `tipo="compartido"`) | **No** | No | Gasto visible para ambos; registro/historial; NO deuda. |
| **Gasto fijo personal** (`fixed_expense_entries` sin grupo + `fixed_expenses` config) | No | No | Recurrente (alquiler comp. / suscripción pers.). Cuenta 100% al usuario. |
| **Gasto fijo compartido** (`fixed_expense_entries` con `groupId`) | **Sí** | No | Recurrente compartido (alquiler, luz, internet...). Acumula balance 50/50; se liquida; historial permanece. |
| **Transferencia** (`transferencias`) | No (modelo actual) | Depende hoy (ver #problema) | Legacy del intento anterior de pagos entre miembros. En desuso para la UI. |
| **Recuperación / Reintegro / adelanto / settlement** | — | **NO** | **Concepto futuro** (Etapa 3): dinero adelantado por otro (pareja, amigo, familiar, externo) y su devolución. No implementado. |
| **Tarjeta** | — | No | Módulo futuro (Etapa 4). Hoy la tarjeta se modela como gasto fijo personal (OCA) o transferencia con concepto "tarjeta". |

## 3. Comportamiento real verificado (por vista)

### 3.1 `/gastos` — total mensual (Decisión funcional 1)

**Fórmula deseada (acordada):** `total mensual = gastos personales + parte del usuario de gastos compartidos diarios + 50% de gastos fijos compartidos + 100% de gastos fijos personales`.

**Verificado en código** (`useGastos.js`):
- `totalPersonales` = personales + **transferencias enviadas** convertidas en "Transferencia" (`useGastos.js:76,116`).
- `totalGruposUsuario` = suma de **lo que el usuario pagó** en gastos compartidos diarios (no "su parte teórica"): `useGastos.js:87-89,117`.
- `totalFixed` = fijos `montoTotal / 2` si compartido, `montoTotal` si personal: `useGastos.js:110-114`.
- `totalGastos` = `totalPersonales + totalGruposUsuario + totalFixed` (`useGastos.js:120`).

→ **Cumple la fórmula** salvo dos matices (documentados como hallazgos):
- `#actual` "Tu parte" en la UI = lo que pagó el usuario, no "su parte" de la división (`GroupSection.jsx:18`).
- `#problema` ~~Un fijo compartido en estado `pendiente_pago` (nadie lo pagó) **igualmente suma su 50%** del mes~~ → **CORREGIDO en 2.2 (29/09/2026)**. Criterio de inclusión en los totales de `/gastos`: `esPagado = !!e.paidByUid || (!!e.pagoHasta && e.pagoHasta > e.periodo)`, **nunca `estado`**. La segunda rama es necesaria porque `registrarGasto` resetea `paidByUid: null` al registrar y al actualizar un anual (`useFixedExpenses.js:201-244`), y porque `getEstado` calcula `pagado_hasta` **antes** de verificar el pago (`useFixedExpenses.js:120-121`). Consecuencia asumida: registrar un anual con `pagoHasta` futuro lo hace contar como pagado al instante. Implementado en `useGastos.js` y `GastosFijosSection.jsx` (labels: `Registrado · Pendiente de pago` / `Al día ✓`). Gate read-only PASS: 34 entries, `paidByUid` ausente = 0, 0 inconsistentes ⇒ sin migración. **Prueba runtime en sandbox: 6/6 PASS** (29/09/2026), con escrituras sobre datos de sandbox temporales. **Sin commit.** Detalle: `PROPUESTA-2.2.md` §6–7.
- `#deseado` **Header de `/gastos-fijos` (2.8, implementado 29/09/2026 sin commit).** El bloque `Personal` de `BalanceMesCard` pasó a mostrar **dos** valores: `Personal` = suma de los fijos personales **cubiertos** por **exactamente la misma** `esPagado` de 2.2 — un anual con `pagoHasta > periodo` cuenta como cubierto aunque `paidByUid` sea `null` — y `Total registrado` = todos los personales registrados, cubiertos + pendientes. Caso real de la prueba: Drive anual $12.000 cubierto por `pagoHasta` + Otros personal $1.000 pendiente ⇒ `Personal: $12.000`, `Total registrado: $13.000` (**validado visualmente por el usuario el 29/09/2026**). **Intención:** que el número grande del header y los totales de `/gastos` cuenten **lo mismo**. Compartidos y resto de `BalanceMesCard` sin cambios; `useGastos.js` sin cambios.
- `#problema` **Integridad de `groupId` al dar de alta un fijo compartido (preexistente, NO de 2.2 → 2.7-GUARD, no implementado).** `registrarGasto` deriva `groupId: esCompartido ? grupo?.id ?? null : null` (`useFixedExpenses.js:231`) a partir de `grupo = groups[0] ?? null` (`:43`) **sin validar que el grupo exista**: valida `user`, `catalogoItem` y `montoFinal`, pero no `grupo`. Si `groups[0]` todavía no está cargado, degrada a `null` en vez de abortar. Consecuencias: el entry aparece como **personal** en `/gastos` (las queries discriminan por `groupId` o por `usuario`, nunca por taxonomía), y queda **atascado**: la query de compartidos filtra `where("groupId","==",grupo.id)` y nunca lo devuelve ⇒ `registrarPago` hace `if (!entry) return;` (`:256`) ⇒ no se puede cobrar. Además el `updateDoc` (`:238-246`) **no incluye `groupId`**, así que **no repara** un entry ya corrupto. **Invariante deseable: todo fijo compartido debe escribirse con `groupId != null`.** Guard propuesto `if (esCompartido && !grupo?.id) return;` — **no implementar sin aprobación explícita.** Deuda relacionada: `otros` y `otros_compartido` comparten `nombre: "Otros"`, por lo que son indistinguibles en la UI salvo por la sección.

### 3.2 Gastos compartidos diarios (Decisión funcional 2)

Cumplida: en escritura se guarda con `tipo="compartido"` + `groupId` sin división ni deuda (`submitUnico.js:57-66`; `submitCompra.js:59-69`). La visualización por grupo muestra total del grupo y "Tu parte" (= lo que pagó el usuario) (`useGastos.js:82-91`, `GroupSection.jsx`).

### 3.3 Gastos fijos compartidos (Decisión funcional 3)

Cumplida — el mecanismo:
1. Se registra la factura del mes (`registrarGasto` en `useFixedExpenses.js:201-244` → entry con `estado: "pendiente_pago"`, `paidByUid: null`, `participantes: []`).
2. Quien la pagó registra el pago (`registrarPago`, `useFixedExpenses.js:246-275`): setea `paidByUid`, `participantes = [{uid, corresponde: mitad, pagado: montoTotal}, {uid2, corresponde: mitad, pagado: 0}]`, `estado: "pendiente_saldar"`.
3. La otra parte paga (`saldarPendiente`/`saldarMes`, `useFixedExpenses.js:277-293`): participantes quedan `pagado = corresponde`, `estado: "saldado"`.
4. **El historial permanece** (no se borran las entries al saldar); el estado distingue `saldado` (histórico) vs `pendiente_saldar` (balance pendiente). `balanceNeto` solo suma gastos con `estado === "pendiente_saldar"` (o `pagado_hasta`) (`useFixedExpenses.js:156-160`).

Estados activos de una entry de fijo (`getEstado`, `useFixedExpenses.js:113-125`): `sin_registrar` | `pendiente_pago` | `pendiente_saldar` | `saldado` | `pagado_hasta`.

Cierre mensual: los balances se resuelven en el uso real; la app debe conservar el histórico aunque el balance termine en cero (respetado).

### 3.4 Ingresos (Decisión funcional 6 / bug freelance)

- Tipos: `sueldo`, `banda`, `freelance`, `otros` (`PasoTipoIngreso.jsx:18-129`, `useModoIngreso.js:62-67`).
- `totalIngresos` = ingresos del mes + **transferencias recibidas sumadas como ingreso** (`useIngresos.js:85-110`). La **sección visual de transferencias recibidas está comentada** (`app/ingresos/page.jsx:99-111`), pero el total igual las incluye.
- `#problema` **Bug freelance:** al tipo `banda` se le guarda `subtipo` con ids `laventolera`/`laimbailable` (`useModoIngreso.js:9-19`) pero la vista busca keys `la_ventolera`/`la_imbailable` (`FilaIngreso.jsx:6-12`), por lo que el ingreso se muestra con la etiqueta de `detalle` o "Ingreso" en lugar de la banda → visualización incorrecta de ingresos (pendiente conocido). → Etapa 2.
- `otros` es registrable (`PasoTipoIngreso.jsx:114-129`) y suma al total, **pero no tiene sección de visualización propia** en `/ingresos` (`useIngresos.js` solo agrupa sueldo/bandas/freelance). → Etapa 2.

## 4. Catálogos / taxonomías (estado actual)

| Catálogo | Archivo | Usado por | Notas |
|---|---|---|---|
| Contextos/categorías/productos de gastos | `lib/taxonomia.js` | `useModoUnico`, `useModoCompra` | Incluye "Otros" como producto `__otros__` (`useModoUnico.js:43-53`). |
| Gasto fijo compartido + personales (activo) | `lib/fixedExpensesTaxonomia.js` | `/gastos-fijos` (via `useFixedExpenses`) | Compartidos: alquiler, luz, gastos comunes, internet, tributos, **Otros** (`otros_compartido`). Personales: OCA, celular, Drive, fondo solidaridad, Disney+, Spotify, Candombe, **Otros** (`otros`). **Incluye "Otros" desde 2.1** (`fixedExpensesTaxonomia.js:1-23`). Disney+ = **personal** (6.3). |
| Gasto fijo (legacy alta) | `app/agregar/components/gastos-fijos/helpers/fixedExpensesConfig.js` | `useFixedExpense` (ModoGastosFijos, deshabilitado en UI) | Disney+ figura como **compartido** (`fixedExpensesConfig.js:72-76`), mientras la taxonomía activa lo tiene **personal** (`fixedExpensesTaxonomia.js:16`). |

**Hallazgos:**
- `#problema` ~~El gasto fijo **"Otros" se perdió** en el catálogo activo~~ → **RESUELTO en 2.1** (Etapa 2, 25/09/2026): "Otros" existe en el catálogo activo de personales (`otros`) y de compartidos (`otros_compartido`). Decisión funcional 6 cumplida también en gastos fijos.
- `#problema` Doble taxonomía de fijos con discrepancias (Disney compartido vs personal) — **parcialmente resuelto en 2.1**: la copia duplicada `lib/temp.js` fue eliminada (0 importadores verificados) y `fixedExpensesTaxonomia.js` queda como única taxonomía canónica. La discrepancia de Disney+ en el helper **legacy** sigue vigente → 2.5.
- `#deseado` La tarjeta (OCA) hoy es un fijo personal; cuando exista el módulo tarjeta (Etapa 4) el modelo debe reubicarse.

## 5. Recuperaciones / dinero a recuperar (Decisión funcional 4 y 5)

**No implementado.** Estado conceptual:
- Los reintegros hoy se registran como `transferencias`: las **recibidas suman como ingreso** (`useIngresos.js:95-106`) y las **enviadas como gasto del mes** (`useGastos.js:65-74`) — lo que **infla ingresos** y no reduce el gasto original.
- `#problema` No hay vínculo entre el gasto adelantado y su reintegro; no hay concepto de "deuda a recuperar". Contradice la regla del modelo: **reintegro/recuperación ≠ ingreso**.
- **Requisito futuro (Etapa 3):** módulo de **dinero a recuperar** aplicable a pareja, amigo, familiar, integrante del grupo o **persona externa**. La devolución reduce/cancela el saldo y **no es ingreso real**. Debe poder reutilizarse desde el módulo de tarjeta futuro.
- El nombre técnico definitivo aún no está decidido (recuperación / reintegro / adelanto / settlement / dinero a recuperar).

## 6. Transferencias (legacy)

- La colección/lógica `transferencias` es un **intento anterior** de modelar pagos entre miembros (`CONTEXTO-ETAPA3.md` §9).
- Actualmente: **no se utiliza** para la alta (botones deshabilitados en `app/agregar/page.jsx:82-107`), pero **se sigue leyendo** en `/gastos` (enviadas → gastos) y `/ingresos` (recibidas → ingresos).
- Conceptos de la UI (dead): `alquiler`, `tarjeta`, `otros` (`useModoTransferencia.jsx:25-29`).

## 7. Tarjeta (Decisión funcional 5)

- **No está implementada como módulo.** Uso real hoy: se usa la tarjeta → se revisan gastos → se determina la parte de la otra persona → **ajuste manual** (sin representación en la app).
- Modelado parcial/impreciso: OCA como gasto fijo personal (`fixedExpensesTaxonomia.js:12`) y/o transferencia con concepto "tarjeta" (`useModoTransferencia.jsx:27`, `submitTransferencia.jsx:21`).
- Futuro (Etapa 4): módulo propio — gastos con tarjeta, quién lo pagó, parte del otro, cuánto queda por recuperar, pagos/ajustes. **La devolución de la parte no es ingreso** (pertenece al modelo de recuperaciones).

## 8. Porcentajes de gastos fijos compartidos (Decisión funcional 7)

- Hoy: **50/50 hardcodeado** en `useFixedExpenses.js:175,264-265` (`montoTotal / 2`, `corresponde: mitad`) y en `useGastos.js:97,113`. `participantes` asumidos exactamente 2.
- `#deseado` El modelo interno debe **permitir otros porcentajes** (60/40, 70/30...) aunque la interfaz actual siga mostrando 50/50. → Etapa 1/4.

## 9. Configuración futura (visión de producto, no alcance actual)

Ideas (no implementar): sección "ruedita" de configuración del grupo/usuario → porcentajes de división, activar/desactivar balances en gastos diarios compartidos, editar gastos fijos, configurar participantes, reglas financieras del grupo. Posibilita que otros grupos usen distintas configs (60/40, balance activo, etc.). → Etapa 4.

## 10. Visualizador (reglas semánticas)

Lo que el visualizador debe respetar:
- **Gasto diario compartido ≠ deuda.**
- **Reintegro/recuperación ≠ ingreso.**
- Separa: gastos personales, compartidos diarios, fijos personales, fijos compartidos, ingresos reales.
- No generar deuda artificial ni convertir recuperaciones en ingresos.

## 11. Reglas del dato (verificadas)

- `createdAt: serverTimestamp()` en gastos, ingresos, transferencias, entries (`submitUnico.js:68`, `submitIngreso.js:43`, etc.).
- Los filtros de mes son **clientes** (rango local): `getMonthRange` (`dateHelpers.js:3-20`); las queries de ingresos restringen por rango de fechas (`subscribeIngresos.js:30-48`), las de gastos por rango client-side (`useGastos.js:50-59`).
- Historial: no se borra al saldar balances fijos.
- Grupos: la app asume `groups[0]` como grupo activo (`useGastos.js:38`, `useFixedExpenses.js:37`); `GroupContext` lee de Firestore.
- Config de fijos personales: `fixed_expenses` guarda **config activo** `{ expenseId, usuario, montoDefault, activo }` (`useFixedExpenses.js:180-189`). La misma colección también recibe **docs legacy** `{nombre, compartido, monto, fecha, balanceado, saldoPendiente}` escritos por `fixedExpenseHelpers` (ModoGastosFijos, UI deshabilitada).

## 12. Diferencias comportamiento actual vs deseado (resumen clasificado)

| # | Etiqueta | Diferencia | Etapa apunta |
|---|---|---|---|
| D1 | `#actual` | Fórmula total cumple, pero "tu parte" = lo pagado y fijos pendientes suman 50% | 1/3 |
| D4 | `#problema` | Transferencias recibidas como ingreso; enviadas como gasto; sin concepto recuperación | 3 |
| D5 | `#actual` | Tarjeta = fijo personal/transferencia; sin módulo | 4 |
| D6a | `#actual` | "Otros" existe en gastos (único y compra) e ingreso | 2 |
| D6b | `#problema` → resuelto 2.1 | ~~"Otros" perdido en taxonomía de gastos fijos~~ → presente en personal (`otros`) y compartido (`otros_compartido`) | — (cerrado 25/09/2026) |
| D6c | `#problema` | Ingreso "otros" se registra pero no se visualiza en sección | 2 |
| D7 | `#problema` | 50/50 hardcodeado; participantes=2 | 1/4 |
| Freelance | `#problema` | Bug visualización bandas (ids subtipo) | 2 |
| Fijos | `#problema` | Doble taxonomía **resuelta en 2.1** (se eliminó `lib/temp.js`); sigue el doble esquema en `fixed_expenses` (config activo vs legacy ModoGastosFijos) | 2.5 |
| Transferencias | `#problema` | Legacy leído pero alta deshabilitada | 2 |

Detalle completo con evidencia `archivo:línea`: `REPORT-ETAPA-0.md` (sección hallazgos).