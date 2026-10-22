# REPORT-ETAPA-0.md — Relevamiento + construcción del contexto interno

**Fecha:** 23/09/2026
**Etapa:** 0 (relevamiento + sistema de contexto). Read-only sobre la aplicación.
**Repo:** `~/Desktop/Proyectos Personales/opencode-AppFinanciera` (rama `master`). App en repo anidado `AppFinanciera/` (remote `Caskito1/organizador-app`).

---

## 1. Resumen ejecutivo

Se relevó íntegramente AppFinanciera (114 archivos `.js/.jsx` en `AppFinanciera/`, excluyendo `node_modules`/`.next`) y se construyó el sistema de contexto persistente en este repo: `context/MAPA-APPFINANCIERA.md`, `context/dominio.md`, `context/arquitectura.md`; `AGENTS.md` reescrito como AGENTS delgado; `ROADMAP.md` alineado a las etapas 0–4; `.opencode/agent/` evaluado y ajustado (`auditor` generalizado + nuevo `planificador`); `CONTEXTO-ETAPA3.md` marcado como semilla absorbida.

**Conclusiones principales:**

- La **Decisión funcional 1** (fórmula de `/gastos`) se cumple en código, pero con dos matices: "Tu parte" del grupo = lo que pagó el usuario (no "su parte" de la división), y un fijo compartido en `pendiente_pago` **igual suma su 50%** del mes.
- La **Decisión 7** (modelo no limitado a 50/50) **se incumple**: el 50/50 está hardcodeado en 3 lugares y `participantes` se asume de exactamente 2.
- La **Decisión 4** (reintegro ≠ ingreso) **no está implementada**: las transferencias recibidas suman como ingreso y las enviadas como gasto del mes, sin vínculo con el gasto original.
- Existe **doble esquema en `fixed_expenses`** (config activa `{expenseId, usuario, montoDefault, activo}` vs esquema legacy completo escrito por `fixedExpenseHelpers`) + **doble taxonomía** de fijos con discrepancias (Disney+ compartido vs personal).
- El **módulo de transferencias** está deshabilitado en la UI (`app/agregar/page.jsx:82-107`) pero la lógica y las lecturas siguen vivas en `/gastos` y `/ingresos`.
- Se confirmó **bug de visualización de ingresos de bandas (freelance)*: ids `laventolera`/`laimbailable` guardados (`useModoIngreso.js:9-19`) vs keys `la_ventolera`/`la_imbailable` buscadas (`FilaIngreso.jsx:6-12`).
- Hay **~15 archivos/fragmentos de código muerto** (sin importadores) listados en §4.
- `REPORT-02.md` cita rutas `organizador-app/...` que no existen: la ruta real es `AppFinanciera/`.
- Nada se modificó de la aplicación; no se pidió acceso a Firestore.

---

## 2. Qué se descubrió

### Estructura y módulos (detalle: `context/MAPA-APPFINANCIERA.md`)

- Stack: Next 16.2.4 (App Router, `--webpack`) + React 19.2.4 + Firebase 12.12.1 (Auth + Firestore + Storage importado sin uso) + Tailwind 4 + next-pwa. Sin typescript, sin tests, lint vía eslint.
- Páginas: `/` (redirect) · `/login` · `/home` (saludo + quick actions, sin datos financieros) · `/gastos` · `/gastos-fijos` · `/ingresos` · `/agregar` · `/pendientes` (sin acceso desde UI).
- Capas: `lib/` (contextos, firebase, taxonomías) → services (`app/*/services`) → hooks (`app/*/hooks`) → sections/components → pages.

### Colecciones Firestore (nombres y usos detectados en código)

| Colección | Lectura | Escritura |
|---|---|---|
| `gastos` | `subscribeGastos`, `useGastos` | `submitUnico`, `submitCompra`, `editarGasto`, `eliminarGasto` |
| `ingresos` | `subscribeIngresos`, `useIngresos` | `submitIngreso` |
| `transferencias` | `subscribeGastos`, `subscribeIngresos` | `submitTransferencia` (UI deshabilitada) |
| `fixed_expenses` | `useFixedExpenses` (config activo) | config `{expenseId, usuario, montoDefault, activo}` + esquema legacy (`fixedExpenseHelpers`, ModoGastosFijos) |
| `fixed_expense_entries` | `subscribeFixedExpenses`, `useFixedExpenses` | `useFixedExpenses` (registrar/pagar/saldar) |
| `groups` | `GroupContext`, `useModoTransferencia` | — |
| `users` | `useModoTransferencia` (`doc(db,"users",uid)`) | — |
| `productos` | — (solo referencia en comentario `taxonomia.js:4`) | — |

### Flujos end-to-end (detalle: `context/arquitectura.md` §"Flujos")

1. **Gasto único:** `/agregar` → ModoUnico → `useModoUnico` → `submitUnico` → `gastos` → `subscribeGastos` → `useGastos` → `/gastos`.
2. **Compra multi:** ModoCompra (carrito en memoria) → `submitCompra` (writeBatch, varios docs `gastos`).
3. **Gastos fijos (/gastos-fijos):** config en `fixed_expenses` (activo) + entries `fixed_expense_entries` por mes → estados (`sin_registrar`→`pendiente_pago`→`pendiente_saldar`→`saldado`/`pagado_hasta`). Balance neto solo sobre `pendiente_saldar`+`pagado_hasta`.
4. **Ingresos:** `useModoIngreso` → `submitIngreso` → `ingresos`; total = ingresos + transferencias recibidas.
5. **Transferencias (legacy):** `useModoTransferencia` lee `groups.members` + `users`; `submitTransferencia` escribe; UI deshabilitada pero lecturas activas.

---

## 3. Verificación de decisiones funcionales contra el código

Evidencia en `archivo:línea`.

| Decisión | Resultado | Evidencia |
|---|---|---|
| **1.** Fórmula `/gastos` (personales + tu parte compartidos + 50% fijos comp. + 100% fijos pers.) | **CUMPLE** con 2 matices | `useGastos.js:110-120,93-105,76,116-117` |
|   · matiz A: "tu parte" = lo pagado, no la parte teórica | #actual | `useGastos.js:87-89`, `GroupSection.jsx:18` |
|   · matiz B: fijos en `pendiente_pago` igual suman el 50% del mes | #problema | `useGastos.js:110-114`, `useFixedExpenses.js:222-224` |
| **2.** Compartidos diarios sin deuda/balance | **CUMPLE** | `submitUnico.js:57-66`, `submitCompra.js:59-69` (sin división); `GroupSection.jsx` (solo muestra) |
| **3.** Fijos compartidos: balance + historial | **CUMPLE** | `useFixedExpenses.js:156-160,277-293` (saldar conserva entries; estados distinguen histórico) |
| **4.** Recuperación/reintegro ≠ ingreso real | **NO IMPLEMENTADO** | no existe modelo de recuperaciones; `useIngresos.js:95-106` (recibidas → ingreso), `useGastos.js:65-74` (enviadas → gasto) |
| **5.** Tarjeta = módulo futuro | **CONFIRMADO; hoy modelado como fijo personal OCA o concepto "tarjeta" de transferencia** | `fixedExpensesTaxonomia.js:11`, `useModoTransferencia.jsx:27`, `submitTransferencia.jsx:21` |
| **6.** "Otros" debe existir | **PARCIAL** | gasto único `useModoUnico.js:43-53`; compra `useModoCompra.js:72-78`; ingreso registrable `PasoTipoIngreso.jsx:114-129` pero sin sección visual; fijos: **perdido** en `fixedExpensesTaxonomia.js:10-19` (presente solo en `temp.js:18`) |
| **7.** Modelo no limitado a 50/50 | **INCUMPLIDO** | `useFixedExpenses.js:175,264-265`; `useGastos.js:97,113` (montoTotal/2); `participantes` con 2 elementos fijos |
| **8.** Firestore sin acceso | **RESPETADO** | no se solicitó acceso; lectura solo sustantiva en código |
| **9.** Datos históricos no se modifican | **RESPETADO** | Etapa 0 es read-only |

---

## 4. Hallazgos clasificados

### `#problema` (afectan el modelo / comportamiento deseado)

| # | Hallazgo | Evidencia | Etapa |
|---|---|---|---|
| P1 | Transferencias recibidas suman como **ingreso**; enviadas como **gasto** del mes; sin vínculo con gasto original (reintegro no modelado) | `useIngresos.js:95-106`, `useGastos.js:65-74` | 3 |
| P2 | 50/50 hardcodeado en totales y registro; `participantes` = 2 fijos; no flexible | `useFixedExpenses.js:175,264-265`, `useGastos.js:97,113` | 1/4 |
| P3 | Fijo compartido en `pendiente_pago` suma el 50% del mes aunque nadie lo pagó | `useGastos.js:110-114`, `useFixedExpenses.js:222-224` | 2/3 |
| P4 | Bug visualización de ingresos de bandas (ids de subtipo inconsistentes) | `useModoIngreso.js:9-19` vs `FilaIngreso.jsx:6-12` | 2 |
| P5 | Ingreso "otros" se registra pero no tiene sección de visualización en `/ingresos` | `PasoTipoIngreso.jsx:114-129`, `useIngresos.js:63-83` | 2 |
| P6 | Gasto fijo "Otros" perdido en catálogo activo | `fixedExpensesTaxonomia.js:10-19` vs `temp.js:18` | 2 |
| P7 | Doble taxonomía de gastos fijos con discrepancia (Disney+ compartido vs personal) | `fixedExpensesConfig.js:72-76` vs `fixedExpensesTaxonomia.js:15` | 2 |
| P8 | Doble esquema en `fixed_expenses` (config activa vs legacy completo), riesgo de docs híbridos | `useFixedExpenses.js:180-189` vs `fixedExpenseHelpers.js:24-70` | 2 |
| P9 | `RouteGuard` espera `loading` de `useAuth` pero AuthContext no lo expone → redirección prematura posible | `RouteGuard.jsx:13` vs `AuthContext.jsx:20` | 2 |
| P10 | `subscribeIngresos`/`subscribeGastos` no manejan `onError` → loading infinito si falla el índice compuesto | `subscribeIngresos.js:82-92`, `subscribeGastos.js:30-40` | 2/3 |
| P11 | Desfase de zona horaria: `serverTimestamp()` (UTC) vs filtro de mes calculado en cliente | `dateHelpers.js:3-20`, `useGastos.js:50-59` | 2/3 |
| P12 | La app asume un solo grupo (`groups[0]`) | `useGastos.js:38`, `useFixedExpenses.js:37` | 4 |

### `#actual` (comportamiento real, no deseado de corregir aún)

| # | Hallazgo | Evidencia | Etapa |
|---|---|---|---|
| A1 | "Tu parte" del grupo = lo pagado por el usuario (semántica de visualización) | `GroupSection.jsx:18`, `useGastos.js:87-89` | 1/3 |
| A2 | Transferencias enviadas se muestran como gasto del mes con producto "Transferencia" | `useGastos.js:65-74` | 3 |
| A3 | Alta de transferencias y gastos fijos deshabilitada en UI pero código activo | `app/agregar/page.jsx:82-107` (botones comentados) vs lógica completa | 2 |
| A4 | Sección visual de transferencias recibidas en `/ingresos` comentada (el total sí las incluye) | `app/ingresos/page.jsx:99-111`, `useIngresos.js:95-106` | 2 |
| A5 | Home no muestra datos financieros (solo saludo + quick actions) | `app/home/page.jsx`, `useHomeData.js` | — |
| A6 | `REPORT-02.md` referencia rutas `organizador-app/...` inexistentes (real: `AppFinanciera/`) | `REPORT-02.md` vs tree | — |

### `#deseado` (confirmado como visión/requisito)

| # | Hallazgo | Fuente | Etapa |
|---|---|---|---|
| D1 | Módulo de recuperaciones/reintegros (pareja, amigo, familiar, externo); devolución ≠ ingreso | `CONTEXTO-ETAPA3.md` §7, §8 | 3 |
| D2 | Módulo propio de tarjeta; reutiliza modelo de recuperaciones | `CONTEXTO-ETAPA3.md` §8, Decisión 5 | 4 |
| D3 | Porcentajes configurables de fijos compartidos (50/50…70/30) con interfaz sencilla | `CONTEXTO-ETAPA3.md` §5, Decisión 7 | 1/4 |
| D4 | Configuración por grupo/usuario futura (dividir, mostrar balance, participantes) | `CONTEXTO-ETAPA3.md` §10 | 4 |

### `#propuesta` (acciones sugeridas por etapa)

| # | Propuesta | A qué hallazgo responde | Etapa |
|---|---|---|---|
| PR1 | Definir modelo conceptual de recuperaciones/reintegros (colección y estados) en el diseño | P1, D1 | 3 |
| PR2 | Mover el 50/50 a una configuración de división por gasto/participantes | P2 | 1 |
| PR3 | Considerar no sumar fijos `pendiente_pago` al total mensual (o registrar entrada sin monto) | P3 | 2 |
| PR4 | Unificar/eliminar catálogo duplicado de fijos y decidir Disney+ compartido vs personal | P7 | 2 |
| PR5 | Unificar esquema de `fixed_expenses` (elegir config activa; migrar/limpiar legacy) | P8 | 2 |
| PR6 | Limpiar código muerto listado en §5 de este report | — | 2 |
| PR7 | Exponer `loading` en AuthContext o alinear RouteGuard | P9 | 2 |
| PR8 | Agregar `onError` a suscripciones y estado de error/retry | P10 | 2 |

### Código muerto / legado (verificado sin importadores)

| Archivo / símbolo | Nota |
|---|---|
| `lib/temp.js` | Copia de taxonomía de fijos + "Otros"; sin importadores |
| `lib/ingresos.js` | `TIPOS_INGRESO`/`BANDAS`; sin importadores (el módulo ingreso usa `useModoIngreso.js`) |
| `app/gastos/helpers/gastosCalculations.js` | Sin importadores |
| `app/gastos/services/../fixedExpensesService.jsx` | Legacy `fixed_expenses` (compartido/fecha); sin importadores |
| `app/agregar/components/compra/helpers/carritoHelpers.js` | Duplicaría lógica de `useModoCompra`; sin importadores |
| `app/gastos/sections/Transferenciassections.jsx` | Sin importadores (componente con la UI de transferencias en `/gastos`) |
| `app/gastos/sections/EmptyState.jsx` y `app/components/ui/EmptyState.jsx` | Sin importadores |
| `app/ingresos/components/Acordeon.jsx` | Importa `lucide-react` (NO es dependencia); sin importadores; si se usara rompería el build |
| `lib/taxonomia.js` → `CONTEXTO_ICONS` (L19), `getUnidadProducto` (L391), `getAllProductosBase` (L401) | Sin consumidores |
| `lib/firebase.js` → `storage`/`getStorage` (L4, L20) | Exportado pero nunca usado |
| `submitCompra.js:74` `origenCompra: true` | Campo escrito, jamás leído |

---

## 5. `REQUIERE_VALIDACIÓN_FIRESTORE`

Sin acceso a Firestore en esta etapa. Los siguientes no pueden resolverse con código y requerirían inspección read-only:

1. **Índices compuestos:** ¿existen los índices requeridos por `ingresos` (`usuario`+`createdAt`), `gastos` (`usuario`+`tipo`+`createdAt`, `groupId`+`tipo`+`createdAt`), `transferencias` (`groupId`+`createdAt`, `paraUid`+`createdAt`), `fixed_expense_entries` (`usuario`+`periodo`, `groupId`+`periodo`)? Sin ellos las suscripciones fallan → loading infinito.
2. **Estructura real de `fixed_expenses`:** ¿cuántos docs son config activa vs esquema legacy (`compartido`/`fecha`/`balanceado`)? Riesgo de datos híbridos.
3. **Docs `ingresos`:** ¿existen docs con `subtipo` `laventolera`/`laimbailable` vs `la_ventolera`/`la_imbailable` (y docs `freelance` con `subtipo: null`)? Define el impacto del bug P4.
4. **Colección `transferencias`:** ¿cuántos docs existen y con qué `concepto`/`groupId`? Determine VIP para limpieza/legacy (P1/A3).
5. **`users`/`groups`:** ¿los docs `users` tienen `displayName`/`email`? ¿`groups.members` reference uids válidos? (lectura `useModoTransferencia.jsx:42-67`).
6. **Existencia de la colección `productos`:** mencionada en comentario `taxonomia.js:4`; ¿existe y con qué dócs?
7. **Fechas reales: `createdAt`** — formato (`Timestamp` vs string) y zona (UTC vs client), para evaluar desplazamientos de borde de mes en los totales.
8. **Reglas de Firestore:** no consultables desde el repo; necesarias para evaluar seguridad/escrituras.

> Si el usuario otorga acceso **read-only** en una etapa posterior, estos ítems deben verificarse antes de rediseñar el modelo.

---

## 6. Estructura de contexto creada

Se adoptó la estructura propuesta por `HANDOFF-ETAPA-0-MAPA-CONTEXTO.md` con ajuste mínimo (no se sumó documentación adicional por más código):

| Archivo | Rol | Justificación |
|---|---|---|
| `context/MAPA-APPFINANCIERA.md` | Puerta de entrada: qué es, estructura, módulos, colecciones, índices, estado/deuda técnica | Necesaria como índice de conocimiento |
| `context/dominio.md` | Modelo funcional (vocabulario, reglas, decisiones 1-9, diferencias actual vs deseado) | Necesaria: separa negocio de implementación; absorbe `CONTEXTO-ETAPA3.md` |
| `context/arquitectura.md` | Cómo funciona técnicamente (stack, layers, flujos, esquemas, riesgos) | Necesaria para cualquier modificación técnica |
| `AGENTS.md` | AGENTS delgado: qué leer antes de trabajar + reglas | Reescrito pequeño, apunta a `context/` |
| `ROADMAP.md` | Etapas 0–4 alineadas + decisiones cerradas | Reescrito; reemplaza el esquema "Stage 2/3/4" |
| `.opencode/agent/auditor.md` | Ajustado: auditoría read-only genérica → `REPORT-*.md` | Reutilizable en cualquier etapa |
| `.opencode/agent/planificador.md` | Nuevo: propuesta de diseño read-only → `PROPUESTA-<etapa>.md` | Justificado: etapas 1–3 requieren diseño previo a implementar |
| `CONTEXTO-ETAPA3.md` | Marcado como semilla absorbida | No se elimina (decisión del usuario); conserva historial |
| `REPORT-ETAPA-0.md` | Este documento | Entregable de la etapa |

**Por qué no se agregaron más documentos:** el relevamiento no reveló una capa adicional (infraestructura/deploy no versionado, integraciones, datos de configuración) que justifique documentos separados. El trio mapa/dominio/arquitectura cubre el conocimiento real.

---

## 7. Evaluación de agentes `.opencode/`

Se evaluaron las posibilidades propuestas (`planificador`, `implementador`, `revisor`, `auditor`):

| Agente | ¿Creado/ajustado? | Justificación |
|---|---|---|
| `auditor` | **Ajustado** (era "Etapa 2/REPORT-02.md" → ahora read-only genérico → `REPORT-*.md`) | Las auditorías read-only seguirán siendo necesarias en etapas futuras (p. ej. verificación tras implementación) |
| `planificador` | **Creado** | Las etapas 1–3 exigen el ciclo LEER→ANALIZAR→DISEÑAR→PROPONER antes de tocar código; un subagente aislado read-only que produce `PROPUESTA-<etapa>.md` aporta valor real sin riesgo |
| `implementador` | **NO creado** | No hay implementación aprobada aún; crearlo ahora sería especulativo. Se evaluará cuando exista un HANDOFF de implementación aprobado |
| `revisor` | **NO creado** | Similar: sin diffs/código de etapa en curso no aporta. Se evaluará con la primera implementación |

Regla aplicada: **crear solo los justificados y explicar el porqué**; no se agregaron agentes especulativos.

---

## 8. Preguntas abiertas (requieren decisión humana; no se plantean las ya respondidas por HANDOFF/CONTEXTO-ETAPA3)

1. **Futuro de la colección `transferencias`:** dado que es legacy y deshabilitada en UI, ¿limpiar la lógica migrando lecturas, o conservarla temporalmente por compatibilidad histórica? (afecta Etapa 2 y la corrección semántica P1).
2. **Progresión de etapas:** el HANDOFF pide no avanzar sin orden. El Organizador decide el orden Etapa 1→2→3; esta Etapa 0 sugiere que algunos hallazgos de Etapa 2 (código muerto, singles, esquema fijos) podrían requerir la Etapa 1 (modelo) antes de decidir migraciones.
3. **Acceso read-only a Firestore** para resolver la lista §5 antes del diseño de Etapa 1/3 (decisión del usuario, como contempla `CONTEXTO-ETAPA3.md` §12).

---

## 9. Estado del repo tras la etapa

**Rama `master` — commit de la capa de contexto:**

- `context/` (nuevo): `MAPA-APPFINANCIERA.md`, `dominio.md`, `arquitectura.md`.
- `AGENTS.md` (modificado): reescrito como AGENTS delgado.
- `ROADMAP.md` (modificado): alineado a etapas 0–4.
- `.opencode/agent/auditor.md` (modificado) y `.opencode/agent/planificador.md` (nuevo).
- `CONTEXTO-ETAPA3.md` (modificado): marcado como semilla absorbida.
- `REPORT-ETAPA-0.md` (nuevo): este documento.

**NO se tocó `AppFinanciera/`** (repo anidado, ignorado por el `.gitignore` padre). No se pide acceso a Firestore.

**Verificación de esquema:**
- READ-ONLY respetado: no se ejecutó ninguna escritura sobre la aplicación; solo comandos de inspección (`git log/status`, lectura).
- Fuente de estados/git: `master` al día con los archivos de contexto; `AppFinanciera/` con su propio historial (`2c7b0b5`) intacto.

---

## Cierre

Entregado. **Me quedo a la espera.** El Organizador evalúa, el usuario decide el siguiente HANDOFF (Etapa 1). No se continúa por cuenta propia.