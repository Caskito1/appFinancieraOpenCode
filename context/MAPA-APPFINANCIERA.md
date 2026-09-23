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
│   ├── fixedExpensesTaxonomia.js        → catálogo de gastos fijos (modelo activo)
│   ├── fixedExpensesConfig.js           → configuración legacy de gastos fijos (usado por ModoGastosFijos)
│   ├── temp.js                          → COPIA de taxonomía fijos + "Otros" (sin importadores)
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
| `transferencias` | Transferencias entre miembros (legacy/deshabilitado en UI pero leído) | `submitTransferencia`, `useModoTransferencia` | `subscribeGastos`, `subscribeIngresos` |
| `fixed_expenses` | Gastos fijos — **dos esquemas**: config activo del usuario (`{expenseId, usuario, montoDefault, activo}` via `useFixedExpenses`) + esquema legado de gastos (`fixedExpenseHelpers`/`submitFixedExpense`, usado por ModoGastosFijos, deshabilitado en UI) | `useFixedExpenses` (config), `fixedExpenseHelpers` (legacy) | `useFixedExpenses` (config activo) |
| `fixed_expense_entries` | Entradas mensuales de gastos fijos (modelo ACTIVO de /gastos-fijos) | `useFixedExpenses` (registrar/saldar/dispensa) | `subscribeFixedExpenses`, `useFixedExpenses` |
| `groups` | Grupos (1 solo grupo hoy) | — (solo lectura) | `GroupContext`, `useModoTransferencia` |
| `users` | Usuarios del grupo | — (solo lectura) | `useModoTransferencia` |
| `productos` | Productos custom | — | reclamada por `taxonomia.js:4` (referencia, sin merge en Firestore) |

### Esquema resumido de documentos

**`gastos`**: `{ usuario, tipo: "personal"|"compartido", monto, detalle, categoria, grupo, productoId?, origenCompra?, createdAt: serverTimestamp() }`
**`ingresos`**: `{ usuario, tipo: "sueldo"|"banda"|"freelance", monto, subtipo?, detalle?, createdAt: serverTimestamp() }`
**`transferencias`**: `{ deUid, paraUid, paraNombre, monto, concepto: "alquiler"|"tarjeta"|"otros", detalle?, createdAt, groupId }`
**`fixed_expenses`** (config ACTIVA): `{ expenseId, usuario, montoDefault?, activo, createdAt }`
**`fixed_expenses`** (LEGACY, solo ModoGastosFijos deshabilitado): `{ nombre, compartido, monto, fecha?, balanceado, saldoPendiente, ... }`
**`fixed_expense_entries`** (activo): `{ fixedExpenseId, nombre, periodo, montoTotal, vencimiento?, pagoHasta?, paidByUid?, paidByNombre?, usuario, groupId?, participantes[], estado: "sin_registrar"|"pendiente_pago"|"pendiente_saldar"|"saldado"|"pagado_hasta", createdAt: serverTimestamp() }`
**`groups`**: `{ id, name, members: [uid], ... }`
**`users`**: `{ uid, displayName?, email?, ... }`

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
| Catálogos / taxonomías | `lib/taxonomia.js`, `lib/fixedExpensesTaxonomia.js`, `app/agregar/components/gastos-fijos/helpers/fixedExpensesConfig.js`, `lib/temp.js` |
| Sesión y grupos | `lib/AuthContext.jsx`, `lib/GroupContext.jsx` |
| Protección de rutas | `app/components/layout/RouteGuard.jsx` (inconsistencia `loading` con AuthContext) |
| Queries de mes | `app/gastos/helpers/dateHelpers.js` (`getMonthRange`) |
| Edición/borrado de gastos | `app/gastos/components/EditarGastoModal.jsx`, `useGastos.js:128-134` |

## Estado actual / deuda técnica relevante (detalle en REPORT-ETAPA-0.md)

- **Reintegros/recuperaciones no existen como concepto**: transferencias recibidas suman como **ingreso**; enviadas como **gasto personal del mes** (`useIngresos.js:95-106`, `useGastos.js:65-74`). Contradice el modelo deseado (reintegro ≠ ingreso).
- **50/50 hardcodeado** en totales y registro de fijos compartidos; `participantes` asumidos en 2.
- **Gastos fijos con doble modelo** (dos esquemas en `fixed_expenses` + `fixed_expense_entries` como esquema activo).
- **Módulo de transferencias deshabilitado en UI** (`app/agregar/page.jsx:82-107`) pero lógica y lecturas activas.
- **Bug de visualización de ingresos freelance/bandas** (`FilaIngreso.jsx` busca keys `la_ventolera`/`la_imbailable` mientras `useModoIngreso.js` guarda `laventolera`/`laimbailable`).
- **Código muerto significativo** (temp.js, ingresos.js, gastosCalculations.js, fixedExpensesService.jsx, carritoHelpers.js, Transferenciassections.jsx, EmptyState.jsx, Acordeon.jsx, storage de firebase.js, helpers de taxonomia, `origenCompra`).
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
8. Firestore: sin acceso por ahora.
9. Históricos: no se modifican.

## Convenciones del repo

- Alias `@/*` → raíz de `AppFinanciera/` (`jsconfig.json`).
- Todos los componentes de página y hooks son **client components** (`"use client"`).
- Taxonomías en `lib/`; lógica de UI en `app/*/sections|components`; hooks de datos junto a cada módulo.
- Imports de UI en su mayoría relativos o vía alias `@/lib`, `@/components`.
- `next.config.mjs` + PWA: `register: true`; entorno `NODE_ENV=development` desactiva el SW.