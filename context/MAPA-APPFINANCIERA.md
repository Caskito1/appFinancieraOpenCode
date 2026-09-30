# MAPA-APPFINANCIERA.md

Puerta de entrada al conocimiento técnico-funcional de **AppFinanciera**. Estos archivos describen cómo funciona la aplicación **hoy** (comportamiento real verificado sobre el código el 23/09/2026), no cómo debería funcionar.

Leer este documento primero. Profundizar con `context/arquitectura.md` (cómo funciona técnicamente) y `context/dominio.md` (qué significa cada concepto de negocio). Para planificación de etapas: `ROADMAP.md`. Para el contexto funcional de origen: `CONTEXTO-ETAPA3.md` (semilla absorbida por `context/dominio.md`).

## Qué es

- **AppFinanciera** es una aplicación de finanzas personales utilizada de forma real por **dos personas** (una pareja), cada una con su cuenta, para registrar ingresos, gastos, gastos fijos y gastos compartidos, y visualizar totales y balances.
- Visión futura: convertirse en una app general para otras personas (grupos, tarjeta, estadísticas, configuración). Es visión, no alcance actual.
- Stack: **Next.js 16 (App Router) + React 19 + Firebase (Auth, Firestore) + Tailwind 4 + PWA**.
- El código vive en el repo anidado `AppFinanciera/` (repo git propio, remote `Caskito1/organizador-app`, ignorado por el `.gitignore` del repo padre).

## Estructura general

```
AppFinanciera/                           → aplicación (repo git propio)
├── lib/
│   ├── firebase.js                      → init Firebase (auth, db, storage sin usar)
│   ├── AuthContext.jsx                  → contexto de sesión ({ user })
│   ├── GroupContext.jsx                 → contexto de grupos (lista + loading)
│   ├── taxonomia.js                     → catálogo de productos/categorías gastos
│   ├── fixedExpensesTaxonomia.js        → catálogo de gastos fijos (modelo activo, incluye "Otros")
│   ├── fixedExpensesConfig.js           → configuración legacy de gastos fijos (usado por ModoGastosFijos)
│   └── ingresos.js                      → TIPOS_INGRESO / BANDAS (sin importadores)
├── app/
│   ├── layout.jsx, page.jsx             → layout raíz y redirección
│   ├── globals.css / manifest.json      → estilos + manifiesto PWA
│   ├── login/                           → autenticación por email/password (Appshell + card)
│   ├── home/                            → Dashboard: resumen del mes, secciones por grupo
│   ├── gastos/                          → vista de gastos (general)
│   ├── gastos-fijos/                    → administrador/detalle de gastos fijos
│   ├── ingresos/                        → vista de ingresos
│   ├── agregar/                         → registro de movimientos (gasto único, compra, ingreso, transferencia, gasto fijo)
│   ├── pendientes/                      → (ruta existente, botón deshabilitado en UI)
│   └── components/                      → Appshell, BottomNav, RouteGuard
└── next.config.mjs / jsconfig.json      → config Next + alias @/* → ./
```

## Módulos / rutas

| Ruta | Módulo | Estado |
|---|---|---|
| `/` | Redirección | → `/home` (usuario logueado) o `/login` |
| `/login` | Autenticación | Activo (email/password) |
| `/home` | Pantalla de inicio (saludo, quick actions) | Activo |
| `/gastos` | Gastos del mes (personales, por grupo, fijos) + total | Activo |
| `/gastos-fijos` | Administrador de gastos fijos (detalle, estados, balance) | Activo |
| `/ingresos` | Ingresos del mes (sueldo, bandas, freelance) + total (incluye transferencias recibidas, cuya sección está comentada) | Activo (con bug freelance) |
| `/agregar` | Registro de movimientos | Activo (transferencias y gastos fijos **deshabilitados en UI**) |
| `/pendientes` | Ruta existente | Botón deshabilitado (sin acceso desde la UI) |

## Colecciones Firestore (verificado desde el código)

| Colección | Uso | Escritura | Lectura clave |
|---|---|---|---|
| `gastos` | Gastos diarios (personales y compartidos) | `submitUnico`, `submitCompra`, `editarGasto`, `eliminarGasto`, `useModoUnico`, `useModoCompra` | `subscribeGastos`, `useGastos` |
| `ingresos` | Ingresos registrados (sueldo/banda/freelance) | `submitIngreso`, `useModoIngreso` | `subscribeIngresos`, `useIngresos` |
| `transferencias` | Transferencias entre miembros (legacy/deshabilitado en UI) — **colección ausente en Firestore** (validado 25/09/2026): **código legacy sin datos** | `submitTransferencia`, `useModoTransferencia` | `subscribeGastos`, `subscribeIngresos` |
| `fixed_expenses` | Gastos fijos — **datos actuales 100 % esquema activo** (`{expenseId, usuario, montoDefault, activo}`, validado 25/09/2026); esquema legacy **solo en código** (`fixedExpenseHelpers`/`submitFixedExpense`, ModoGastosFijos deshabilitado en UI) | `useFixedExpenses` (config), `fixedExpenseHelpers` (legacy) | `useFixedExpenses` (config activo) |
| `fixed_expense_entries` | Entradas mensuales de gastos fijos (modelo ACTIVO de /gastos-fijos) | `useFixedExpenses` (registrar/saldar/dispensa) | `subscribeFixedExpenses`, `useFixedExpenses` |
| `groups` | Grupos (1 solo grupo hoy) | — (solo lectura) | `GroupContext`, `useModoTransferencia` |
| `users` | Usuarios del grupo | — (solo lectura) | `useModoTransferencia` — **inconsistencia documentada: campo `uid`/`iud` según doc (hallazgo posterior)** |
| `productos` | Productos custom — **colección ausente en Firestore** (validado 25/09/2026) | — | reclamada por `taxonomia.js:4` (referencia, sin merge) |

### Estado Firestore — validado read-only 25/09/2026 (script `validacion-ae.sh` v3.1)

Ejecutado desde Cloud Shell con Service Account `firestore-validacion-readonly` (custom role + IAM condition sobre `(default)`), vía **Firestore REST read-only**. Sin escrituras, sin índices, sin reglas, sin migraciones. Detalle completo en `PROPUESTA-ETAPA-1.md` §4.2.

- **Conteos:** `gastos` **408** · `fixed_expense_entries` **34** · `ingresos` **15** · `users` **4** · `groups` **1** · `fixed_expenses` **9** · `transferencias` **ausente** · `productos` **ausente**.
- **`fixed_expenses`:** 100 % esquema activo (`expenseId, usuario, activo, montoDefault, createdAt`); `activo=true` 9/9; **7 `expenseId`** (candombe, celular, disney, drive, fondo_solidaridad, oca, spotify); **0 legacy · 0 híbridos** en Firestore. El esquema legacy existe solo en código.
- **Índices:** los **5 patrones reales** de consulta devolvieron **HTTP 200** (ingresos `usuario`+`createdAt` rango+orderBy; gastos `usuario`+`tipo`+orderBy y `groupId`+`tipo`+orderBy; entries `usuario`/`groupId`+`periodo`). Solo patrones reales evaluados, no todos los posibles. Riesgo de loading infinito para esos patrones: descartado.
- **`users` (hallazgo):** 2 docs con campo `uid`, 2 con `iud`, `uid==iud`=0 → **para diseño/implementación posterior** (no bloqueante).
- **`groups.members` (hallazgo):** 2 uids (1 = users docId, 1 = `users.uid`), **0 sin match** → identificación mixta → **para diseño/implementación posterior** (no bloqueante).
- **`transferencias` y `productos`:** colecciones **ausentes**; sin documentos que migrar.

### Esquema resumido de documentos

**`gastos`**: `{ usuario, tipo: "personal"|"compartido", monto, detalle, categoria, grupo, productoId?, origenCompra?, createdAt: serverTimestamp() }`
**`ingresos`**: `{ usuario, tipo: "sueldo"|"banda"|"freelance", monto, subtipo?, detalle?, createdAt: serverTimestamp() }`
**`transferencias`**: `{ deUid, paraUid, paraNombre, monto, concepto: "alquiler"|"tarjeta"|"otros", detalle?, createdAt, groupId }`
**`fixed_expenses`** (config ACTIVA): `{ expenseId, usuario, montoDefault?, activo, createdAt }`
**`fixed_expenses`** (LEGACY, solo ModoGastosFijos deshabilitado): `{ nombre, compartido, monto, fecha?, balanceado, saldoPendiente, ... }`
**`fixed_expense_entries`** (activo): `{ fixedExpenseId, nombre, periodo, montoTotal, vencimiento?, pagoHasta?, paidByUid?, paidByNombre?, usuario, groupId?, participantes[], estado: "sin_registrar"|"pendiente_pago"|"pendiente_saldar"|"saldado"|"pagado_hasta", createdAt: serverTimestamp() }`
**`groups`**: `{ id, name, members: [uid], ... }`
**`users`**: `{ uid, displayName?, email?, ... }` — variación real: campo `iud` en lugar de `uid` en parte de los docs (hallazgo, 25/09/2026)

## Dónde está cada cosa (índice rápido)

| Qué | Dónde |
|---|---|
| Totales de gastos / fórmula del mes | `app/gastos/hooks/useGastos.js` |
| Fórmula total mensual | `app/gastos/hooks/useGastos.js:110-120` |
| Balance de gastos fijos compartidos | `app/gastos-fijos/hooks/useFixedExpenses.js` |
| Puntaje/destino 50/50 | `useFixedExpenses.js:264-265`, `useGastos.js:97,113` |
| Cálculo de ingresos totales | `app/ingresos/hooks/useIngresos.js:85-110` |
| Suscripciones Firestore | `app/{gastos,gastos-fijos,ingresos}/services/*` |
| Registro de movimientos | `app/agregar/components/{unico,compra,ingresos,transferencia,gastos-fijos}/helpers/*.js` + `hooks/*.js` |
| Catálogos / taxonomías | `lib/taxonomia.js`, `lib/fixedExpensesTaxonomia.js` (canónico), `app/agregar/components/gastos-fijos/helpers/fixedExpensesConfig.js` (legacy) |
| Sesión y grupos | `lib/AuthContext.jsx`, `lib/GroupContext.jsx` |
| Protección de rutas | `app/components/layout/RouteGuard.jsx` (inconsistencia `loading` con AuthContext) |
| Queries de mes | `app/gastos/helpers/dateHelpers.js` (`getMonthRange`) |
| Edición/borrado de gastos | `app/gastos/components/EditarGastoModal.jsx`, `useGastos.js:128-134` |

## Estado actual / deuda técnica relevante (detalle en REPORT-ETAPA-0.md)

- **Reintegros/recuperaciones no existen como concepto**: transferencias recibidas suman como **ingreso**; enviadas como **gasto personal del mes** (`useIngresos.js:95-106`, `useGastos.js:65-74`). Contradice el modelo deseado (reintegro ≠ ingreso).
- **50/50 hardcodeado** en totales y registro de fijos compartidos; `participantes` asumidos en 2.
- **Gastos fijos con doble modelo** (en **código**: esquema activo + helper legacy; en **Firestore**: solo esquema activo — legacy sin documentos, validado 25/09/2026).
- **Módulo de transferencias deshabilitado en UI** (`app/agregar/page.jsx:82-107`) pero lógica y lecturas activas.
- **Bug de visualización de ingresos freelance/bandas — DIAGNÓSTICO CORREGIDO (30/09/2026) y resuelto en 2.3 (Local).** La versión anterior de esta línea decía que el bug estaba en `FilaIngreso.jsx` (keys `la_ventolera`/`la_imbailable` vs `laventolera`/`laimbailable`): **ese desajuste existe pero era código inalcanzable**, porque `FilaIngreso` solo lo usan `SueldoSection` y `FreelanceSection` y ambas reciben `subtipo: null`. El bug **visible** (headers "Laventolera"/"Laimbailable") estaba en `BandasSection.jsx:10-11,60`, que agrupaba y renderizaba el id crudo.
- **El módulo de ingresos no tiene edición ni borrado** (deuda funcional registrada el 30/09/2026): solo existe el alta (`submitIngreso.js`). No hay ningún `updateDoc`/`deleteDoc` sobre `ingresos`; el único `deleteDoc` de la app es de gastos (`useGastos.js:143`). Un ingreso mal cargado **no se corrige desde la app**. **No implementado**; pendiente de etapa posterior (`PROPUESTA-2.3.md` §9.1).
- **Código muerto significativo** (ingresos.js, gastosCalculations.js, fixedExpensesService.jsx, carritoHelpers.js, Transferenciassections.jsx, EmptyState.jsx, Acordeon.jsx, storage de firebase.js, helpers de taxonomia, `origenCompra`). `lib/temp.js` se eliminó en 2.1.
- **RouteGuard espera `loading` que AuthContext no expone** (`RouteGuard.jsx:13` vs `AuthContext.jsx`).
- `REPORT-02.md` cita rutas `organizador-app/...` inexistentes; el código real está en `AppFinanciera/`.

## Decisiones funcionales acordadas (resumen — detalle en context/dominio.md)

1. `/gastos`: comportamiento actual como referencia deseada (`/gastos-fijos` = administrador). NO corregir divergencias.
2. Gastos compartidos diarios: **no generan balance**.
3. Gastos fijos compartidos: **sí generan balance**; historial permanece.
4. Recuperación/reintegro ≠ ingreso real.
5. Tarjeta: futuro, no implementada.
6. `Otros`: debe seguir existiendo.
7. Porcentajes fijos: hoy 50/50, modelo no limitado a 50/50.
8. Firestore: acceso read-only autorizado y **ejecutado el 25/09/2026** (Service Account + REST, script `validacion-ae.sh` v3.1); **sin escrituras**.
9. Históricos: no se modifican.
10. `transferencias`: **fuera del modelo funcional** (6.1 cerrada); colección ausente en Firestore.
11. Gastos fijos: **Disney+ = PERSONAL** (6.3, decisión cerrada).
12. "Otros" disponible en gastos fijos **personales y compartidos** (6.4, decisión cerrada). **Implementada en 2.1** (25/09/2026): personal `otros` y compartido `otros_compartido`, ambos `Otros` 📦 mensual.

## Convenciones del repo

- Alias `@/*` → raíz de `AppFinanciera/` (`jsconfig.json`).
- Todos los componentes de página y hooks son **client components** (`"use client"`).
- Taxonomías en `lib/`; lógica de UI en `app/*/sections|components`; hooks de datos junto a cada módulo.
- Imports de UI en su mayoría relativos o vía alias `@/lib`, `@/components`.
- `next.config.mjs` + PWA: `register: true`; entorno `NODE_ENV=development` desactiva el SW.