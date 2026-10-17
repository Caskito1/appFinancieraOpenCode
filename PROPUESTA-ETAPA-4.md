# PROPUESTA — Etapa 4: Plan técnico de implementación de Reintegros (AppFinanciera)

> **Naturaleza: PLANIFICACIÓN / PLAN TÉCNICO (Etapa 4). NO implementa nada.** Entregable
> producido el **15/10/2026** conforme a `HANDOFF-ETAPA-4.md` §5 (9 requisitos mínimos) y §6
> (restricciones). El handoff lo denominaba `PLAN-ETAPA-4.md`; **el usuario ordenó nombrarlo
> `PROPUESTA-ETAPA-4.md`** (15/10/2026), en la raíz del repo padre, siguiendo el precedente de
> `PROPUESTA-ETAPA-3.md` (decisión de ubicación también del usuario, igual que en la Etapa 3).
> **La implementación (subetapas 4.0…4.5; 4.6 ELIMINADA 17/10/2026 — §11) requiere aprobación
> explícita y separada del usuario;
> la subetapa 4.0 exige aprobación propia (paso 5, HANDOFF §1).** `AppFinanciera/` no fue
> modificado; sin acceso a Firestore; sin instalación de dependencias; sin commits ni push.
>
> **Regla rectora del módulo (decisión cerrada, Etapa 3): un reintegro NO es un ingreso.**
> Vocabulario de usuario canónico: **«Reintegros»**. Fuente del diseño funcional:
> `PROPUESTA-ETAPA-3.md` (aprobada, `e665e3d`); fuente de los principios técnicos de la Ronda 2:
> `HANDOFF-ETAPA-4.md` §3 (D-1…D-11, aprobadas 15/10/2026; **no reabiertas**).
>
> **Base de código verificada:** `AppFinanciera/` en `10ab576` (limpio, `main` == `origin/main`),
> verificado el 15/10/2026. Todos los `file:línea` de este documento se comprobaron contra ese
> commit (§7).
>
> **Nota de nomenclatura (obligatoria al citar):** los **D-1…D-11** usados aquí son las
> decisiones de la **Ronda 2 de planificación de la Etapa 4** (`HANDOFF-ETAPA-4.md` §3). **No**
> confundir con los **D-1…D-8 funcionales** de `PROPUESTA-ETAPA-3.md` §1.4 (heredados del
> HANDOFF de la Etapa 3). Al citar ambos documentos, cada nombre lleva su fuente.
>
> **Revisión 16/10/2026 — corrección documental autorizada por el usuario:** hallazgos 1–6
> del borrador de reglas (precedencia, sintaxis de (e), constancias falsificables, rama (g),
> C1 externo, lecturas de devoluciones) + congelaciones D-9 server-side + resoluciones del
> usuario (D-9 opción B; stock de pendientes; runner `node:test`; evento `confirmacion`
> postergado a 4.6; suite 3.1–3.22). Registro detallado en **§10**. **Sin cambios** en las
> decisiones D-1…D-11 del handoff ni en la secuencia. **Sigue sin autorizar: implementación,
> instalación de herramientas ni deploys.**

---

## 1. Desglose por subetapa (4.0…4.5, incl. bis; 4.6 ELIMINADA 17/10/2026)

**Secuencia aprobada (15/10/2026, R1-1/R1-2) con la enmienda del 17/10/2026:**

`4.0 → 4.1 → 4.2 → 4.3 → 4.3-bis → 4.4 → 4.4-bis → 4.5`

**4.6 ELIMINADA (decisión del usuario, 17/10/2026)** — su núcleo, la confirmación
bilateral, quedó sin objeto (§11 filas 7–9). **No se renumera**: era la última de
la secuencia. Justificación del orden restante: 4.0 es prerrequisito de seguridad
de toda escritura (§8.5 de la PROPUESTA); las bis tras su base permiten que 4.5
corra con el módulo completo (criterio §14 de la PROPUESTA). **No se propone
reordenamiento.**
Cada subetapa sigue el flujo `AGENTS.md`: Local → `staging` → aprobación → `main` (solo
fast-forward) → verificación. Ninguna inicia sin su aprobación explícita.

### 1.0 Subetapa 4.0 — Gate de seguridad Firestore (G-Seg)

| | |
|---|---|
| **Alcance** | Ejecutar el gate de `PROPUESTA-ETAPA-3.md` §8.5 con los criterios aprobados por **D-2** (3.7 y 3.11–3.15 incluidos). Versionar `firestore.rules` + `firebase.json`; reglas de `eventos` **create-only** (**D-3**); matriz **E1/C1/(ii)** de **D-8** expresada en reglas; herramientas conforme **D-1** (§6 de este documento). **Sin PASS no se habilita ninguna escritura del módulo.** |
| **Archivos a crear** (en `AppFinanciera/`, solo cuando 4.0 esté aprobada e implementada) | `firestore.rules` — Bloque A = **copia exacta** de las reglas vigentes en consola (`REQUIERE_VALIDACIÓN_FIRESTORE`: no consultables desde el repo; el archivo **no existe hoy** en el repo — N-4) + Bloque B = reglas propuestas de las colecciones nuevas (texto completo en §2 de este documento) · `firebase.json` (config emuladores + referencia a reglas/índices; **no existe hoy** — N-4) · `firestore.indexes.json` (índice de R1': `reintegros` `participantes` array_contains + `createdAt` desc — riesgo R-2) · `tests/rules/reintegros.rules.test.mjs` (suite `@firebase/rules-unit-testing` de 3.1–3.22, §2.4) · edición de `package.json`: devDeps `firebase-tools` + `@firebase/rules-unit-testing` y scripts `test:rules` (§6) |
| **Dependencias** | Aprobación de la Etapa 4 + **aprobación específica de 4.0** (paso 5) + **instalación de Java (JRE 11+) por el usuario** — NO instalado al verificar el 15/10/2026 (N-1): **re-verificar el entorno al autorizar 4.0** y **presentar al usuario el diff exacto de `package.json`/scripts antes de instalar** nada |
| **Done verificable** | (1) `firestore.rules` en repo con Bloque A íntegro y Bloque B completo; (2) evidencia de **equivalencia repo↔consola** (SHA-256 de ambos textos + backup del texto vigente para restauración; §2.3); (3) `npm run test:rules` → **22/22 PASS** (3.1–3.22, §2.4; **run real archivado — no se declara PASS sin evidencia**); (4) evidencia archivada + **aprobación expresa del usuario**; (5) despliegue de reglas a Producción **solo** tras aprobación, con ventana de mantenimiento y el flujo `AGENTS.md` (afecta a Staging y Producción a la vez: mismo proyecto `finanzas-app-1c5f6`) |
| **Evidencia esperada** | Archivo de resultados PASS/FAIL por caso; hashes registrados; commit de 4.0; nota de aprobación |

### 1.1 Subetapa 4.1 — Modelo y servicios

| | |
|---|---|
| **Alcance** | Colecciones `reintegros` + `reintegro_devoluciones` (esquemas §3 de este documento, según `PROPUESTA-ETAPA-3.md` §3.2 y D-4/D-5); suscripción R1'/D1; hook de cálculo (estados derivados, indicadores, entradas/salidas); helper de bitácora `eventos.js` (D-3); helpers transaccionales base (`submitReintegro`, `submitDevolucion` — P-2/D-6); **sin UI visible** (cálculos verificables por harness). Consta de constancias por **D-4** (objetos embebidos, nombres de campo en §3.4). |
| **Archivos a crear** | `app/reintegros/page.jsx` (stub mínimo de sandbox, sin navegación) · `app/reintegros/hooks/useReintegros.js` · `app/reintegros/services/subscribeReintegros.js` · `app/reintegros/services/eventos.js` · `app/agregar/components/reintegros/helpers/submitReintegro.js` · `app/agregar/components/reintegros/helpers/submitDevolucion.js` |
| **Dependencias** | **4.0 PASS** (sin escrituras sin gate) + aprobación del plan de 4.1 |
| **Done verificable** | Harness local (§1.9 + casos 1–10 de `PROPUESTA-ETAPA-3.md` §14.1): saldos parcial/completo/liquidado/condonado; sentido espejo; indicadores (incl. «Devoluciones realizadas» por `realizadoPorUid`); entradas/salidas con `movimientoInicial`/`fechaPago`; **reconciliación `devuelto == Σ entregas no eliminadas` (D-7, criterio de done)**; prueba de partición de indicadores (I-8); edición de monto con guarda `monto >= devuelto`; `build` OK; `lint` 0 nuevos; **0 escrituras en el proyecto real** (todo contra emulador) |
| **Evidencia esperada** | Run de harness con resultados; evidencia de reconciliación |

### 1.2 Subetapa 4.2 — Alta de generación

| | |
|---|---|
| **Alcance** | `ReintegroModal` (alta de obligación en **un paso**, ambos sentidos; **un SOLO selector «¿Con quién?»** con la unión de miembros de todos los grupos + «Persona externa»; **groupId deducido**: 1 grupo compartido → ese; varios → picker «¿En qué grupo?»; externa → null) + hook del modal + `submitReintegro` (rid único por apertura; montos enteros; timeout de UI con bloqueo de campos y redirect montado-guarded); **`movimientoInicial` DERIVADO — decisión del usuario 17/10/2026, reemplaza «precargado con texto anti-doble-captura»**: `por_cobrar` → `salida`; `por_devolver` → `ninguno` por defecto con casilla «Me entró dinero (efectivo o transferencia)» → `entrada`; nota «los reintegros van por fuera de Gastos e Ingresos»; monto con tope de 12 dígitos; nombre de contraparte miembro **solo de doc `users/` existente** (null si no, `canSubmit` lo exige). Botón «Reintegro» en `/agregar` con **render condicional**; redirect a `/reintegros`. **`/reintegros` — decisión del usuario 17/10/2026, reemplaza la página stub:** balance de stock **Préstamos/Deudas** (cantidad, total y pendiente sobre abiertas; PO-1, sin filtro de mes), **pestañas Activos/Saldados**, **acordeones** Préstamos/Deudas (patrón `/gastos`) y sección colapsable **«Dinero del mes»** (entradas/salidas **solo lectura** con selector de mes, rotulada «No incluido en Gastos/Ingresos»); **sin acciones**: pagar/editar = 4.3, condonar/eliminar = 4.3-bis. **Sin etiqueta «Sin confirmar» — decisión del usuario 17/10/2026: el otro miembro NO confirma las deudas (4.6 eliminada); las obligaciones de miembro cuentan en el balance de ambas partes y se presentan como cualquier otra.** Entorno: **emulador local exclusivo** (flag `NEXT_PUBLIC_USE_EMULATOR` con guarda doble en `lib/firebase.js`) + siembra `scripts/seed-emulator.mjs` (guarda de host: `FIRESTORE_EMULATOR_HOST` obligatorio **y** solo `127.0.0.1`/`localhost`) + Emulator UI en :4000. Reintento de suscripción acotado (solo `unavailable`, máx. 5) + botón **«Reintentar»** manual. Sin cambios en `/home` (el botón de navegación llega con 4.3, cuando la página es usable). |
| **Archivos a crear** | `app/agregar/components/reintegros/ReintegroModal.jsx` · `app/agregar/components/reintegros/hooks/useReintegroModal.js` (resolución de nombres R-5 patrón `useModoTransferencia`, pero **nombre usable solo de doc existente**, sin fallback de uid) · `app/reintegros/page.jsx` (ya no el stub de 4.1: página con balance, pestañas, acordeones y «Dinero del mes») · `scripts/seed-emulator.mjs` (+ script npm `seed:emulator`) · `.env.development.local` (gitignored, flag del emulador) |
| **Archivos a editar** | `app/agregar/page.jsx` — sección/botón «Reintegro» + render del modal con **render condicional** (`ModoIngreso`; **sin tocar** los bloques de Transferencias: eso es 4.5) · `app/reintegros/hooks/useReintegros.js` (reintento acotado + `reintentar()`) · `lib/firebase.js` (conexión a emuladores + aviso en consola) · `firebase.json` (Emulator UI :4000) · `package.json` (+script `seed:emulator`) |
| **Dependencias** | 4.1 |
| **Done verificable** | Alta por modal verificada en Local/Staging: **un paso** con selector único «¿Con quién?»; ambos sentidos; contraparte miembro (`participantes` = 2 uids) y externa (1 uid + nombre libre); `movimientoInicial` **derivado** correcto (incl. casilla «Me entró dinero»); `submitReintegro` atómico (obligación + evento `creacion`); redirect a `/reintegros`; `/reintegros` legible con balance de stock, pestañas, acordeones y «Dinero del mes», **sin etiqueta «Sin confirmar»** (las obligaciones de miembro suman en ambos balances); botón «Reintentar» visible tras agotar los reintentos automáticos; siembra + emuladores locales con UI en :4000; build/lint OK |
| **Evidencia esperada** | Prueba funcional del usuario en Local + PASS en Staging |

### 1.3 Subetapa 4.3 — Devoluciones y consulta de pendientes

| | |
|---|---|
| **Alcance** | `DevolucionModal` (monto acotado al saldo; «Saldar deuda» precarga saldo exacto; `fechaPago` editable; selector «¿Quién pagó?» con precarga del deudor I-8 y aviso ante tercero) + `submitDevolucion` transaccional (valida `importe <= monto − devuelto`; concurrencia; sin red: falla sin cola); página `/reintegros` completa (header, pestañas Pendientes/Cerrados, `FilaReintegro` con entregas y acciones Agregar pago/Saldar deuda); edición de entrega (saldo resultante, PO-7) y edición de obligación (guarda `monto >= devuelto`, D-8(ii)); entrada «Ver reintegros» en `/home`. |
| **Archivos a crear** | `app/reintegros/components/DevolucionModal.jsx` · `app/reintegros/components/FilaReintegro.jsx` · `app/reintegros/components/EditarReintegroModal.jsx` · `app/reintegros/sections/ReintegrosHeader.jsx` · `app/reintegros/sections/PendientesSection.jsx` · `app/reintegros/sections/CerradosSection.jsx` · `app/agregar/components/reintegros/helpers/editarEntrega.js` (**ampliación justificada del inventario §10.A de la PROPUESTA: PO-7 exige editar o eliminar; el editar necesita helper propio transaccional**) · `app/agregar/components/reintegros/helpers/editarObligacion.js` |
| **Archivos a editar** | `app/reintegros/page.jsx` (página completa) · `app/home/helpers/quickActions.js` (entrada «Ver reintegros», `path: "/reintegros"`, habilitada — patrón de las existentes en `:6-37`) |
| **Dependencias** | 4.2 |
| **Done verificable** | Parcial baja saldo y sigue en Pendientes; completa liquida y migra a Cerrados; sobrepago rechazado (form + transacción); doble escritura simultánea: solo una gana; sin red: mensaje y sin cola; atribución por pagador (I-8); edición de entrega valida saldo resultante; **reconciliación `devuelto` tras alta/edición/eliminación (D-7)**; historial visible; build/lint OK |
| **Evidencia esperada** | Harness (casos 2–8, 10 de §14.1) + prueba funcional en Local/Staging |

### 1.4 Subetapa 4.3-bis — Eliminar y condonar

| | |
|---|---|
| **Alcance** | Helpers transaccionales `eliminarEntrega` / `eliminarObligacion` / `condonar` (rollback total; rechazo de registros ya eliminados I-11); constancias (D-4, §3.4); matriz **D-8** completa en UI (E1: eliminar obligación solo registrador; C1: condonar solo el acreedor según su vista, externo solo registrador; (ii): edición solo registrador); congelaciones (condonada → solo lectura + «Eliminar», entregas congeladas; eliminada → inmutable); labels **D-10** (acción «Condonar», sello «Condonada»); flujo resolutivo de **D-9** (§4 de este documento: opción B **elegida por el usuario
16/10/2026**, pendiente de la aprobación de esta subetapa); acción visible **exclusivamente «Eliminar»** (DC-6, nunca «Anular», sin borrado físico). |
| **Archivos a crear** | `app/agregar/components/reintegros/helpers/eliminarEntrega.js` · `eliminarObligacion.js` · `condonar.js` |
| **Archivos a editar** | `FilaReintegro.jsx` (acciones Eliminar/Condonar + confirmaciones + sellos) · `DevolucionModal.jsx` (estado congelado) · `useReintegros.js` (estado derivado `condonado` con prioridad, §3.3 de la PROPUESTA Etapa 3) |
| **Dependencias** | 4.3 + **aprobación de 4.3-bis** — la resolución D-9 ya está **elegida: opción B (16/10/2026, §4.2)**; su implementación no avanza sin la aprobación propia de la subetapa (§4) |
| **Done verificable** | Casos 11–14 de §14.1: eliminar entrega atómica y reabre liquidación; doble eliminación rechazada; eliminar obligación conserva entregas + ambas constancias; condonación sin entrega/`devuelto`/caja; registro eliminado inmutable; permisos E1/C1/(ii) verificados (emulador + UI); build/lint OK |
| **Evidencia esperada** | Harness + prueba funcional con ambas cuentas reales en Staging |

### 1.5 Subetapa 4.4 — Resumen mensual y agrupaciones

| | |
|---|---|
| **Alcance** | `ResumenMesCard` con los indicadores de §6.2 de la PROPUESTA Etapa 3 (Generado por recuperar, Deuda generada, Devoluciones recibidas/realizadas, Pendiente de cobro/devolución **globales** — PO-1) + pie Entradas/Salidas de reintegros (PO-8 A+); selector de mes **solo dentro de la card y solo para flujos**; lista agrupada por mes de `createdAt` (Pendientes y Cerrados, orden desc); **sin acordeones** en `/ingresos` y `/gastos` (DC-1); `totalIngresos`/`totalGastos` intactos (I-1/I-9). |
| **Archivos a crear** | `app/reintegros/sections/ResumenMesCard.jsx` |
| **Archivos a editar** | `app/reintegros/page.jsx` · `useReintegros.js` (indicadores + agrupación) · `ReintegrosHeader.jsx` (solo si necesita coordinación con la card) |
| **Dependencias** | 4.3 |
| **Done verificable** | Los 4 indicadores mínimos + Deuda generada, por separado; stock global etiquetado; entradas/salidas del mes del selector; grupos por `createdAt`; mes sin operaciones en cero; `totalIngresos`/`totalGastos` sin cambios (harness PO-8 de §12.2 de la PROPUESTA Etapa 3: −2.000 / −3.000 / +3.000 / 0); build/lint OK |
| **Evidencia esperada** | Harness de indicadores + revisión visual en Staging |

### 1.6 Subetapa 4.4-bis — Bitácora (detalle y verificación)

| | |
|---|---|
| **Alcance** | Esquema **exacto del evento** — fuente: `PROPUESTA-ETAPA-3.md` §3.5 (D-3 lo delega al plan; la referencia previa a «§3.5 de este documento» no existía y se corrige); verificación de que **toda** acción (alta, edición, devolución, editar entrega, eliminar entrega, eliminar obligación, condonar) escribe su evento — y la de **confirmación** de 4.6, **una vez aprobada la extensión de tipos `['confirmacion']` con esa subetapa** (§2.5: en 4.0 la lista es la cerrada de D-3); verificación de rollback (evento huérfano = fallo; el acople acción↔evento es de harness, no de reglas — §3.5); reglas create-only ya desplegadas en 4.0 (criterio 3.14). **Sin vista de bitácora en v1.** *(Decisión 17/10/2026: sin confirmación bilateral → la extensión de tipos `['confirmacion']` queda **sin objeto**; la lista se mantiene cerrada en los 4 tipos de D-3 — §11 filas 7/10.)* |
| **Archivos a editar** | `eventos.js` (si el schema exige ajuste fino) · helpers que escriben eventos (completar cobertura) |
| **Dependencias** | 4.1 (servicio) + 4.3-bis (acciones de eliminación/condonación) |
| **Done verificable** | Caso 15 de §14.1: create-only (update/delete rechazados en emulador); cada acción emite exactamente un evento; rollback deja eventos consistentes; harness PASS |
| **Evidencia esperada** | Harness de bitácora |

### 1.7 Subetapa 4.5 — Retiro de Transferencias (paso separado)

| | |
|---|---|
| **Alcance** | §7.1 #1–#16 de la PROPUESTA Etapa 3, **previo cumplimiento de las 6 condiciones de §7.4**: (1) diff revisado archivo por archivo; (2) greps `transferenc\|Transferenc` sobre `*.{js,jsx}` al momento del retiro; (3) totales de `/gastos` e `/ingresos` sin cambios indebidos (con colección vacía deberían ser idénticos); (4) `build` OK, `lint` 0 nuevos, greps 0 restos, prueba funcional de `/gastos`+`/ingresos`+`/agregar`; (5) I-1 verificado (Reintegros no suma como ingreso ni gasto); (6) **aprobación explícita del usuario antes de las eliminaciones**. **#17 (`origenCompra`, `submitCompra.js:74`) NO se toca** (decisión 2.6 #2 cerrada). |
| **Archivos a editar** | `app/agregar/page.jsx` (#1–#3: import, botón comentado :8, :79-91, render :133-135) · `app/gastos/services/subscribeGastos.js` (#7: `transferenciasMap` :26-28, `totalQueries` :32, query :80-95) · `app/gastos/hooks/useGastos.js` (#8: estado :18, filas sintéticas :65-76, merge :76-80) · `app/ingresos/services/subscribeIngresos.js` (#9: query :50-72, dualidad `emitIfReady` :78-92) · `app/ingresos/hooks/useIngresos.js` (#10: estado :22-25, suma :103-114, return :135) · `app/ingresos/page.jsx` (#11: import :15, conteo :67-73, JSX comentado :110-122) · `app/gastos/components/FilaGasto.jsx` (#15: ramas :21-24, :37, :63, :82) |
| **Archivos a eliminar** | `app/agregar/components/ModoTransferencia.jsx` · `app/agregar/components/transferencia/` (completa: hook + helper) · `app/gastos/sections/Transferenciassections.jsx` · `app/gastos/components/FilaTransferencia.jsx` · `app/ingresos/sections/TransferenciasIngresosSection.jsx` · `app/gastos/helpers/gastosCalculations.js` |
| **Dependencias** | **4.4-bis** (la secuencia aprobada corre 4.5 tras 4.4-bis: «módulo completo» = incl. bitácora; §4 R1-1/R1-2 — la dependencia previa decía «4.4» y se corrige aquí para reflejar la secuencia) |
| **Done verificable** | Las 6 condiciones cumplidas y checklist firmado; greps 0 restos; build/lint OK; totales correctos; I-1 verificado; PASS en Staging y verificación en Producción |
| **Evidencia esperada** | Checklist + greps + diff revisado + verificación en Producción |

### 1.8 Subetapa 4.6 — Confirmación bilateral (PO-4, D-11a/D-11b) — **[ELIMINADA 17/10/2026]**

> > **❌ ELIMINADA — decisión del usuario 17/10/2026:** no hay confirmación bilateral (el
> > otro miembro NO confirma las deudas). El alcance, archivos, dependencias y «done» de
> > esta subetapa quedan **sin objeto**; la secuencia termina en 4.5 (§1). El cuerpo de la
> > tabla se conserva **solo como registro histórico**. Lo que sobrevive: los permisos que
> > resolvía (pagos, editar monto, condonar, eliminar) → **§11 fila 11 (confirmados)**;
> > los cambios de reglas asociados → **§11 fila 10 (registrados, NO ejecutados)**.

Diseño detallado completo en **§5** de este documento (estados, queries, reglas, UI, alternativa
tácita). Alcance mínimo: alta crea obligación «pendiente de confirmación» cuando la contraparte
tiene usuario; la contraparte **la ve** (D-11b.1) y la **confirma**; **no se registran entregas
antes de confirmar** (D-11b.2, app + reglas); el **registrador puede editar/eliminar antes de
confirmar** (D-11b.3); después de confirmar rige la matriz D-8. Externos: auto-confirmadas.
BottomNav y `gastoVinculadoId` **siguen fuera** de la Etapa 4.

| | |
|---|---|
| **Archivos a crear** | `app/agregar/components/reintegros/helpers/confirmarObligacion.js` |
| **Archivos a editar** | `submitReintegro.js` (alta con `confirmadaPor: null` si `contraparteUid != null`; externo auto-confirmado) · `FilaReintegro.jsx` (badge «Pendiente de confirmación» + acción «Confirmar» para la contraparte) · `useReintegros.js` (separación pendientes-de-confirmación vs activos confirmados; exclusión del stock — §5.3) · `DevolucionModal.jsx` (bloqueo pre-confirmación) · `firestore.rules` (edición de 4.6: guarda de (e) `confirmadaPor != null` + extensión de tipos `['confirmacion']` en `eventos` — §2.5; la rama (g) ya existe en el texto de 4.0) · suite de reglas (casos «+4.6») |
| **Dependencias** | 4.5 + **aprobación del diseño de §5** en su momento |
| **Done verificable** | Obligación pendiente visible para ambas partes; entregas bloqueadas (UI y reglas) hasta confirmar; registrador edita/elimina pre-confirmación; contraparte confirma (una sola vez, unidireccional); post-confirmación rige D-8; externos sin paso extra; **stock: los pendientes NO suman en «Pendiente de cobro/devolución» ni en Generado/Deuda generada del resumen — solo badge en lista (decisión aprobada 16/10/2026, §5.3); la confirmación no crea ingreso ni devolución**; evento `confirmacion` emitido una vez aprobada la extensión de tipos (§2.5); harness + «+4.6» PASS; build/lint OK |
| **Evidencia esperada** | Harness bilateral con dos cuentas + evidencia de reglas en emulador |

### 1.9 Harness unificado (referencia para todas las subetapas)

Runner local único (§6): `npm run test:rules` (reglas, emulador) y `npm run harness:reintegros`
(propuesto: scripts `node --test` contra el emulador de Firestore para la lógica del módulo —
detallado en §6.4). Patrón de evidencia heredado de 2.2/2.7: run completo con resultados por
caso, archivado en la conversación de cierre de cada subetapa. Ningún harness corre contra
`finanzas-app-1c5f6`.

---

## 2. `firestore.rules` propuesto

### 2.1 Advertencia de alcance

- Firestore tiene **un único conjunto de reglas por proyecto**: lo que se despliegue afecta a
  Staging **y** Producción a la vez (`AGENTS.md`). El despliegue real es un paso de 4.0 con
  aprobación explícita y flujo completo.
- Este plan **no conoce** las reglas vigentes en consola (sin acceso a Firestore):
  `REQUIERE_VALIDACIÓN_FIRESTORE`. El texto de abajo es el **Bloque B completo** (colecciones
  nuevas) y la **estructura exacta** del archivo final, con el Bloque A como campo a rellenar
  en 4.0 con la copia de consola, sin modificarlo.

### 2.2 Estructura del archivo final (`AppFinanciera/firestore.rules`)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ═══════════════════════════════════════════════════════════════════
    // BLOQUE A — Reglas vigentes en consola (COPIA EXACTA, SIN EDICIONES)
    // REQUIERE_VALIDACIÓN_FIRESTORE: se obtiene de Firebase Console →
    // Firestore → Rules en 4.0 y se pega aquí íntegro. Cubre las colecciones
    // existentes: gastos, ingresos, fixed_expenses, fixed_expense_entries,
    // groups, users, transferencias, productos. Este plan NO las redacta.
    // (Si la consola muestra las reglas por defecto de Firebase — lectura/
    // escritura autenticada amplia — se documenta como tal y se decide en 4.0
    // si se endurecen; esa decisión excede este plan y requiere aprobación.)
    // ═══════════════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════════════
    // BLOQUE B — Colecciones nuevas del módulo Reintegros (PROPUESTO)
    // Satisface: D-2 (no-inflación: fuera del alcance de estas reglas está
    // gastos/ingresos, que no se tocan), D-3 (eventos create-only), D-6
    // (acople transacción↔reglas), D-8 (matriz E1/C1/(ii)), D-9/D-10
    // (constancias, congelaciones), 4.6 (confirmación, §2.5).
    // ═══════════════════════════════════════════════════════════════════

    function auth()   { return request.auth != null; }
    function uid()    { return request.auth.uid; }

    function obl(rid) {
      return get(/databases/$(database)/documents/reintegros/$(rid)).data;
    }
    function oblAfter(rid) {
      return getAfter(/databases/$(database)/documents/reintegros/$(rid)).data;
    }
    function dev(did) {
      return get(/databases/$(database)/documents/reintegro_devoluciones/$(did)).data;
    }

    function esParticipante(rid) {
      return auth() && uid() in obl(rid).participantes;
    }

    // C1 (D-8): solo el ACREEDOR según su vista condona.
    // EXTERNO (contraparteUid == null): solo el registrador — D-8 lo dice
    // explícitamente y la lógica de espejo no aplica (no hay segunda parte
    // en la app). Miembro: espejo según sentido (el que adelantó / la otra
    // parte cuando el registrador es el deudor).
    function esAcreedor(rid) {
      return obl(rid).contraparteUid == null
        ? obl(rid).registradoPor == uid()                  // externo: solo registrador
        : (obl(rid).registradoPor == uid()
             ? obl(rid).sentido == 'por_cobrar'            // miembro: el que adelantó
             : (uid() in obl(rid).participantes
                && obl(rid).sentido == 'por_devolver'));   // contraparte acreedora
    }

    // E1 (D-8): solo el REGISTRADOR elimina la obligación.
    function esRegistrador(rid) {
      return auth() && obl(rid).registradoPor == uid();
    }

    // ─── reintegros ────────────────────────────────────────────────────
    match /reintegros/{rid} {

      // Lectura: las dos partes (R1' del cliente; aquí la garantía server-side).
      allow get, list: if esParticipante(rid);

      // Alta (4.2): firmada por el propio registrador; sin entregas ni
      // constancias aún. Coherencia participantes ↔ contraparte exigida
      // (externo: 1 uid — §1.2; miembro: 2 uids distintos).
      allow create: if auth()
        && request.resource.data.registradoPor == uid()
        && request.resource.data.registradoPorNombre is string
        && uid() in request.resource.data.participantes
        // GRUPO EXPLÍCITO (hallazgo 1): la precedencia &&/|| no debe partir
        // la condición — un contraparteUid string no puede esquivar nada.
        && (request.resource.data.contraparteUid == null
            ? request.resource.data.participantes.size() == 1
            : (request.resource.data.contraparteUid is string
               && request.resource.data.participantes.size() == 2
               && request.resource.data.contraparteUid
                  in request.resource.data.participantes
               && request.resource.data.contraparteUid != uid()))
        && request.resource.data.contraparteNombre is string
        && request.resource.data.sentido in ['por_cobrar', 'por_devolver']
        && request.resource.data.monto is number
        && request.resource.data.monto > 0
        && request.resource.data.devuelto == 0
        && request.resource.data.movimientoInicial in ['ninguno', 'salida', 'entrada']
        && request.resource.data.concepto is string
        && request.resource.data.concepto.size() > 0
        && request.resource.data.gastoVinculadoId == null   // reservado en v1
        // Sin constancias al nacer (nadie 'ya condonó/ya eliminó' un doc nuevo):
        && !('condonacion' in request.resource.data)
        && !('eliminacion' in request.resource.data)
        // 4.6 (§2.5): null = pendiente de confirmación si hay contraparte con uid
        && ('confirmadaPor' in request.resource.data
            ? (request.resource.data.contraparteUid != null
               && request.resource.data.confirmadaPor == null)
            : request.resource.data.contraparteUid == null);

      allow delete: if false;   // Criterio 3.7: sin borrado físico, NUNCA.

      allow update: if auth() && esParticipante(rid)
        // 3.5 — campos de identidad inmutables:
        && request.resource.data.registradoPor == resource.data.registradoPor
        && request.resource.data.contraparteUid == resource.data.contraparteUid
        && request.resource.data.participantes == resource.data.participantes
        && request.resource.data.createdAt == resource.data.createdAt
        // I-11 / 3.13 — un registro eliminado es inmutable (guard GLOBAL):
        && !('eliminacion' in resource.data)
        && (
          // (a) Devolución (transacción de submitDevolucion): sube devuelto
          // dentro de [0, monto] y NO toca ningún otro campo (diff/hasOnly).
          // El acople EXACTO lo impone la regla de creación de la entrega
          // (criterio 3.8): sin el update acompañante, esa creación falla.
          // Solo sobre ACTIVA: condonada ⇒ congelada (D-9: solo lectura).
          ( request.resource.data.diff(resource.data).affectedKeys()
              .hasOnly(['devuelto'])
            && request.resource.data.devuelto > resource.data.devuelto
            && request.resource.data.devuelto <= request.resource.data.monto
            && resource.data.get('condonacion', null) == null
          )
          // (b) Eliminar entrega (lado de la obligación): baja devuelto
          // exactamente el monto de la entrega; el acople exacto lo impone
          // la regla de update de la entrega (criterio 3.8': getAfter(obl)
          // == get(obl) − get(entrega).monto). Solo sobre ACTIVA
          // (D-9: entregas congeladas en una condonada).
          || ( request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['devuelto'])
               && request.resource.data.devuelto < resource.data.devuelto
               && request.resource.data.devuelto >= 0
               && resource.data.get('condonacion', null) == null
             )
          // (c) Editar monto de la obligación (solo registrador, D-8(ii):
          // monto bloqueado con devuelto > 0; transaccional en la app).
          // Solo toca `monto`; solo sobre ACTIVA.
          || ( esRegistrador(rid)
               && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['monto'])
               && request.resource.data.monto != resource.data.monto
               && request.resource.data.monto > 0
               && request.resource.data.monto >= request.resource.data.devuelto
               && resource.data.devuelto == 0
               && request.resource.data.devuelto == 0
               && resource.data.get('condonacion', null) == null
             )
          // (d) Edición de campos NO financieros (D-8(ii): siempre; solo
          // registrador). Única rama 'libre': montos, acumulador,
          // constancias, confirmación y gastoVinculadoId quedan intactos;
          // solo sobre ACTIVA (condonada ⇒ solo lectura; eliminada ya cae
          // en la guard global).
          || ( esRegistrador(rid)
               && request.resource.data.monto == resource.data.monto
               && request.resource.data.devuelto == resource.data.devuelto
               && request.resource.data.get('condonacion', null)
                  == resource.data.get('condonacion', null)
               && request.resource.data.get('eliminacion', null)
                  == resource.data.get('eliminacion', null)
               && request.resource.data.get('confirmadaPor', null)
                  == resource.data.get('confirmadaPor', null)
               && request.resource.data.get('confirmadaAt', null)
                  == resource.data.get('confirmadaAt', null)
               && request.resource.data.gastoVinculadoId == null
               && resource.data.get('condonacion', null) == null
             )
          // (e) Condonación (C1, D-8): UNA SOLA VEZ (sin condonación previa)
          // y solo el acreedor (esAcreedor — incluye el caso externo). Única
          // transición autorizada que AGREGA `condonacion`: hasOnly impide
          // mover devuelto (I-12), monto o cualquier otro campo. Corrige el
          // hueco donde una edición ordinaria podía forjar la constancia.
          || ( resource.data.get('condonacion', null) == null
               && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['condonacion'])
               && request.resource.data.get('condonacion', null) != null
               && esAcreedor(rid)
               && request.resource.data.condonacion.condonadaPor == uid()
             )
          // (f) Eliminar obligación (E1): UNA SOLA VEZ; solo registrador.
          // Única transición autorizada que AGREGA `eliminacion`. Es la ÚNICA
          // rama permitida sobre una obligación CONDONADA — así D-9 opción B
          // (elegida 16/10/2026) sigue posible: conserva ambas constancias
          // (I-4/I-10), monto, devuelto y confirmación intactos; sin
          // reactivación silenciosa (no existe rama que quite constancias).
          || ( esRegistrador(rid)
               && resource.data.get('eliminacion', null) == null
               && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['eliminacion'])
               && request.resource.data.get('eliminacion', null) != null
               && request.resource.data.eliminacion.eliminadaPor == uid()
             )
          // (g) 4.6 — Confirmación (§2.5): UNA SOLA VEZ (null → uid), solo
          // la contraparte (≠ registrador), con contraparte miembro, y SOLO
          // cambian los dos campos de confirmación (demás congelados).
          // `confirmadaAt` debe escribirse con serverTimestamp(): se exige
          // igual a request.time (no se admite hora forjada por el cliente).
          || ( resource.data.contraparteUid != null
               && uid() != resource.data.registradoPor
               && resource.data.get('confirmadaPor', null) == null
               && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['confirmadaPor', 'confirmadaAt'])
               && request.resource.data.confirmadaPor == uid()
               && request.resource.data.confirmadaAt == request.time
             )
        );

      // ─── subcolección: eventos (bitácora, D-3) ──────────────────────
      match /eventos/{eid} {
        allow get, list: if esParticipante(rid);
        allow create: if auth()
          // Solo participantes de ESTA obligación pueden escribir su bitácora:
          && esParticipante(rid)
          && request.resource.data.registradoPor == uid()
          && request.resource.data.tipo in
               ['creacion', 'edicion', 'eliminacion', 'condonacion']
               // 'confirmacion' NO va aquí: D-3 aprobó estos 4 tipos. La
               // extensión se propone y se aprueba con 4.6 (§2.5) y entra
               // con la edición de reglas de esa subetapa — sin ampliar en
               // silencio el esquema en 4.0.
          && request.resource.data.entidad in ['obligacion', 'entrega'];
        allow update, delete: if false;   // 3.14: create-only
      }
    }

    // ─── reintegro_devoluciones ────────────────────────────────────────
    match /reintegro_devoluciones/{did} {

      // Lectura SOLO por get individual (hallazgo 6 corregido): la app
      // resuelve ids visibles vía la query D1 sobre `reintegros` y hace
      // get por cada id (volumen v1 bajo, ≤30 por R-3). `list` queda
      // deshabilitado: Firestore NO puede evaluar un filtro where(reintegroId)
      // dentro de reglas, así que un list habilitado expondría entregas
      // ajenas a cualquier autenticado. (La versión anterior usaba
      // request.resource.data —inexistente en lecturas— y habilitaba
      // `list` contradictoriamente con su propia nota; ambas cosas
      // eliminadas.)
      allow get: if auth() && esParticipante(resource.data.reintegroId);
      allow list: if false;

      // Alta de entrega (4.3, criterio 3.8 — ACOPLE D-6):
      allow create: if auth()
        && request.resource.data.reintegroId is string
        && esParticipante(request.resource.data.reintegroId)
        && request.resource.data.monto is number
        && request.resource.data.monto > 0
        && request.resource.data.registradoPor == uid()
        && request.resource.data.fechaPago != null
        && !('eliminacion' in request.resource.data)
        // OBLIGACIÓN ACTIVA (D-9, decisión 16/10/2026): ninguna entrega
        // ordinaria sobre condonada (entregas congeladas) ni sobre
        // eliminada (inmutable). Primera barrera explícita; el acople de
        // abajo es la segunda (el padre congelado ni siquiera aceptaría el
        // delta).
        && obl(request.resource.data.reintegroId)
             .get('condonacion', null) == null
        && obl(request.resource.data.reintegroId)
             .get('eliminacion', null) == null
        // 4.6 (§2.5): sin entregas antes de confirmar — GRUPO EXPLÍCITO
        // (hallazgo 1): la precedencia no debe partir la condición.
        && (oblAfter(request.resource.data.reintegroId)
              .get('confirmadaPor', null) != null
            || obl(request.resource.data.reintegroId).contraparteUid == null)
        // ACOPLE (3.8): el acumulador debe subir exactamente el monto escrito,
        // sin exceder el monto de la obligación — un cliente malicioso no
        // puede crear una entrega desincronizada:
        && oblAfter(request.resource.data.reintegroId).devuelto
             == obl(request.resource.data.reintegroId).devuelto
                + request.resource.data.monto
        && oblAfter(request.resource.data.reintegroId).devuelto
             <= oblAfter(request.resource.data.reintegroId).monto;

      allow delete: if false;   // 3.7: sin borrado físico, NUNCA.

      // Update permitido SOLO como eliminación lógica (PO-7/DC-6) o corrección
      // de monto, siempre acoplada al doc de la obligación:
      allow update: if auth()
        && esParticipante(resource.data.reintegroId)
        && !('eliminacion' in resource.data)          // I-11: eliminada es inmutable
        && resource.data.reintegroId == request.resource.data.reintegroId
        && resource.data.registradoPor == request.resource.data.registradoPor
        // OBLIGACIÓN ACTIVA (D-9): sobre condonada/eliminada ninguna
        // entrega se toca (además el acople del padre lo rechazaría).
        && obl(resource.data.reintegroId).get('condonacion', null) == null
        && obl(resource.data.reintegroId).get('eliminacion', null) == null
        && (
          // (i) Eliminación lógica de la entrega + recálculo acoplado.
          // hasOnly: SOLO se agrega `eliminacion` (un cliente no puede
          // colar otros campos; monto intacto por definición del diff):
          ( request.resource.data.diff(resource.data).affectedKeys()
              .hasOnly(['eliminacion'])
            && request.resource.data.get('eliminacion', null) != null
            && request.resource.data.eliminacion.eliminadaPor == uid()
            && oblAfter(resource.data.reintegroId).devuelto
                 == obl(resource.data.reintegroId).devuelto - resource.data.monto
            && oblAfter(resource.data.reintegroId).devuelto >= 0
          )
          // (ii) Edición de monto (PO-7: saldo resultante, sin sobrepago).
          // hasOnly: SOLO cambia `monto`:
          || ( request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['monto'])
               && request.resource.data.monto > 0
               && request.resource.data.monto != resource.data.monto
               && oblAfter(resource.data.reintegroId).devuelto
                    == obl(resource.data.reintegroId).devuelto
                       - resource.data.monto
                       + request.resource.data.monto
               && oblAfter(resource.data.reintegroId).devuelto
                    <= oblAfter(resource.data.reintegroId).monto
             )
        );
    }
  }
}
```

> **Notas de redacción (parte del plan):** (1) el operador `get(key, default)` de reglas se
> usa como defensa para campos ausentes (D-5: campo ausente = activo); (2) la precedencia de
> operadores está **ya explícita con paréntesis** en los dos puntos donde `&&`/`||` se
> mezclaban (create de `reintegros` y de entregas — hallazgo 1); (3) las listas de
> `affectedKeys().hasOnly([...])` son el **acoplamiento exacto** app↔reglas: los helpers solo
> pueden escribir esos campos — un campo extra provoca un **rechazo visible** (no un hueco);
> (4) la redacción es exhaustiva pero **se validará sintácticamente contra el emulador en 4.0**
> antes de cualquier despliegue (paréntesis, `diff`, ternarios); (5) criterios 3.9/3.10
> (positivas) y 3.11/3.12/3.13/3.15 quedan cubiertos por las ramas anteriores y se prueban en
> la suite, junto con los refuerzos 3.16–3.22 (§2.4).

### 2.2.1 Transiciones permitidas (análisis por rama — hallazgo 3)

Cada transición fue analizada por separado (no se aplicó una guarda mecánica idéntica).
Constantes de lectura: **constancias** = `condonacion`/`eliminacion`; **confirmación** =
`confirmadaPor`/`confirmadaAt`.

| Rama | Transición permitida | Constancias | Confirmación | Estado del doc | Quién |
|---|---|---|---|---|---|
| **(a)** | `devuelto` ↑ dentro de `[0, monto]` | intactas (`hasOnly`) | intacta (`hasOnly`) | **activa** (no condonada) | participante |
| **(b)** | `devuelto` ↓ exacto (borrar entrega) | intactas (`hasOnly`) | intacta (`hasOnly`) | **activa** | participante |
| **(c)** | `monto` nuevo (≥ devuelto; `devuelto == 0`) | intactas (`hasOnly`) | intacta (`hasOnly`) | **activa** | registrador |
| **(d)** | campos no financieros | intactas (explícito) | intacta (explícito) | **activa** | registrador |
| **(e)** | **+ condonacion**, una sola vez | solo agrega `condonacion`; jamás `eliminacion` | intacta (`hasOnly`) | sin condonar | acreedor (C1, incl. externo) |
| **(f)** | **+ eliminacion**, una sola vez | solo agrega `eliminacion`; conserva `condonacion` | intacta (`hasOnly`) | activa **o condonada** (D-9 opción B) | registrador (E1) |
| **(g)** | `confirmadaPor` `null → uid` + `confirmadaAt` | intactas (`hasOnly`) | **únicos campos cambiados** | sin confirmar, contraparte miembro | contraparte ≠ registrador |
| — | doc **eliminado** ⇒ inmutable (guard global, rama alguna) | — | — | eliminada | nadie |

**Congelaciones server-side (D-9) — ahora explícitas, no derivadas del form:**

1. **Condonada ⇒ solo lectura + «Eliminar»:** las ramas (a)–(d) y (g) exigen
   `condonacion == null` en el origen; solo (f) opera sobre una condonada. La
   eliminación lógica de la condonada (opción B, elegida 16/10/2026) **sigue posible**.
2. **Entregas congeladas:** `create` y `update` de entregas exigen la obligación activa
   (1ª barrera); el acople con el padre congelado es la 2ª barrera.
3. **Sin reactivación silenciosa:** (e)/(f) son *one-shot*; (d) no toca constancias; no
   existe rama que quite `condonacion`/`eliminacion`; el doc eliminado cae en la guard
   global.
4. **Sin forjar constancias:** (d)/(a)/(b)/(c) congelan las constancias; solo (e)/(f) las
   agregan, con sus permisos (C1/E1) y una sola vez (hallazgo 3 cerrado).

### 2.3 Verificación de equivalencia repo↔consola (plan)

1. **Backup previo:** en 4.0, el usuario copia desde Consola → Firestore → Rules el texto
   vigente y se registra con su **SHA-256** — ese texto es el **plan de restauración**
   (rollback) si algo sale mal.
2. Se pega íntegro en el Bloque A de `firestore.rules` del repo.
3. Se calcula **SHA-256** de (a) el texto pegado y (b) el texto mostrado en consola
   (o diff literal si la consola lo permite); ambos hashes se registran en la evidencia.
4. **Repaso del conjunto COMPLETO** (Bloque A + Bloque B) por el usuario — no solo las
   reglas del módulo nuevo: cualquier efecto no previsto sobre colecciones existentes
   se resuelve antes de continuar.
5. Cualquier divergencia ⇒ se detiene y se resuelve antes de cualquier despliegue.
6. El despliegue (`firebase deploy --only firestore:rules`) se ejecuta **solo** tras PASS
   del emulador + aprobación explícita, por el flujo `AGENTS.md`. Se recomienda una
   **ventana de mantenimiento** (Staging y Producción comparten proyecto: el cambio es
   único e inmediato para ambos).
7. **Restauración:** ante cualquier problema, se re-despliega el texto del backup del
   paso 1 (mismo proceso y misma aprobación). Sin backup registrado no hay despliegue.

### 2.4 Suite de reglas (3.1–3.22)

`tests/rules/reintegros.rules.test.mjs` con `@firebase/rules-unit-testing`, emulador de
Firestore, `projectId demo-*`.

**Sobre los números:** 3.1–3.15 son los criterios del gate §8.5 (D-2: 3.7 y 3.11–3.15
aprobados; el resto ya figuraban en el gate). **3.16–3.22 son tests de refuerzo añadidos
por este plan** para las reglas corregidas (§2.2): verifican comportamientos, no crean
criterios nuevos ni modifican D-2. **Ningún caso se da por aprobado sin un run real en
el emulador con evidencia archivada.** Los casos propios del flujo de 4.6 permanecen en
la fila **«+4.6»** (ámbito de esa subetapa).

| # | Caso |
|---|---|
| 3.1 | No autenticado: sin lectura ni escritura en ambas colecciones |
| 3.2 | Usuario ajeno: sin lectura de `reintegros` ni de sus entregas; sin escritura |
| 3.3 | `registradoPor ≠ request.auth.uid` en create: rechazado |
| 3.4 | Entrega sobre `reintegroId` ajeno: rechazada |
| 3.5 | Mutación de `contraparteUid`/`registradoPor`/`participantes`: rechazada |
| 3.6 | Cambio de `monto` con `devuelto > 0`: rechazado |
| 3.7 | `deleteDoc` de obligación o entrega: **rechazado siempre** |
| 3.8 | Acople devolución↔obligación (`getAfter`): creación sin update acompañante o con delta incorrecto ⇒ rechazada; con delta exacto y `devuelto ≤ monto` ⇒ aceptada |
| 3.9 | Positiva: ambas partes legítimas leen y escriben (alta + devolución transaccional en emulador) |
| 3.10 | Externo (`contraparteUid: null`): solo el registrador lee/escribe |
| 3.11 | No-participante: sin escritura (alta entrega, edición, eliminación, condonación) |
| 3.12 | Doble eliminación: el segundo update sobre doc ya eliminado ⇒ rechazado |
| 3.13 | Edición de registro eliminado: rechazada |
| 3.14 | Bitácora: `update`/`delete` sobre `eventos` rechazados; create solo con `registradoPor == auth.uid` **y** de participante |
| 3.15 | Condonación (C1, miembro): acreedor según vista puede; deudor y externo-tercero no; sin crear entrega ni mover `devuelto` |
| **3.16** | **Coherencia participantes↔contraparte en create** (hallazgo previo §1): (a) `contraparteUid` string no ∈ `participantes` ⇒ rechazado; (b) externo con `size ≠ 1` ⇒ rechazado; (c) miembro con `size ≠ 2` o `contraparteUid == uid` ⇒ rechazado; positivas: alta externa y miembro válidas ⇒ aceptadas |
| **3.17** | **Regresión de precedencia** (hallazgo 1): create con campo previo inválido (p. ej. `monto < 0`) y `contraparteUid` string ⇒ **rechazado** (el grupo no se parte); create válido con `contraparteUid` string ⇒ aceptado |
| **3.18** | **Entregas sobre doc congelado** (D-9): creación de entrega sobre obligación **condonada** ⇒ rechazada; sobre **eliminada** ⇒ rechazada; edición/eliminación de entrega de esas obligaciones ⇒ rechazada (positiva: sobre activa ⇒ aceptada, ya en 3.9) |
| **3.19** | **Integridad de constancias en escritura ordinaria** (hallazgo 3): (a) rama (d) agregando `condonacion` sin ser acreedor ⇒ rechazado; (b) ramas (a)/(b)/(c) agregando `eliminacion` ⇒ rechazadas; (c) quitar o alterar constancia existente por cualquier rama que no sea (e)/(f) ⇒ rechazado; (d) create de obligación con constancia ya incluida ⇒ rechazado |
| **3.20** | **Transición de confirmación a nivel de reglas** (esbozo §2.5, presente desde el texto de 4.0): (a) update que además altera `monto`/`devuelto`/constancias ⇒ rechazado; (b) confirmación por el propio registrador ⇒ rechazada; (c) des-confirmación (`uid → null`) ⇒ rechazada; (d) positiva: contraparte, `null → uid` con `confirmadaAt == request.time` ⇒ aceptada |
| **3.21** | **Condonación de obligación EXTERNA (C1 externo)**: externa `por_devolver` condonada por el registrador ⇒ **aceptada** (hallazgo 5; antes quedaba imposible); externa `por_cobrar` por el registrador ⇒ aceptada; por un tercero ⇒ rechazada |
| **3.22** | **Lecturas de entregas**: `get` de entrega por no-participante ⇒ rechazado; `list` sobre `reintegro_devoluciones` ⇒ **rechazado** (solo get por id) |
| **+4.6** | **(tras 4.6 — flujo completo, fuera de este conteo):** alta con contraparte nace pendiente; ambas partes la **ven** con badge; entregas bloqueadas en UI **y** reglas hasta confirmar; solo la contraparte confirma (una vez); registrador edita/elimina pre-confirmación; post-confirmación rige D-8; registro con tipo `'confirmacion'` (una vez aprobada la extensión de tipos, §2.5); externos auto-confirmados sin paso extra; guarda nueva de (e): condonación pre-confirmación rechazada |

**Total esperado en 4.0: 22/22 PASS (3.1–3.22).** El «+4.6» se suma al llegar 4.6. Un
FAIL no se maquilla ni se pospone: se diagnostica antes de cualquier despliegue.

### 2.5 Reglas de 4.6 (transición de confirmación) — **[SUPERADO 17/10/2026]**

> > **⚠ SUPERADO — 17/10/2026 (4.6 eliminada, sin confirmación).** Registro histórico. Los
> > textos afectados se modifican en el **primer paso de la próxima sesión — el lote de
> > reglas previo a 4.3**, **siempre con diff y tests para aprobación del usuario** (las
> > reglas que se desplieguen a Producción serán **las posteriores a ese lote**): guarda de
> > entregas `confirmadaPor != null || contraparteUid == null` · rama (g) · condición H-c de
> > la rama (c) (pasa a moot) · condición de `confirmadaPor` en el `create` · suite (3.9
> > parcial, 3.20, 3.25). **No ejecutar sin aprobación** (§11 filas 10–11).

Ya esbozadas en §2.2 (rama create con `confirmadaPor` y rama update (g)):

- **Alta con contraparte uid:** `confirmadaPor == null` (pendiente).
- **Alta externa:** sin campo o auto-confirmada (`confirmadaPor == registradoPor`) — decisión
  de implementación de 4.6: se propone **ausencia del campo para externos** (coherente con
  D-5 «ausente = …», aquí: «ausente = externo/auto-confirmada») y `null` solo como
  estado explícito «pendiente».
- **Confirmación:** update únicamente `confirmadaPor: null → uid()` + `confirmadaAt`
  (**serverTimestamp()**: la rama (g) exige `confirmadaAt == request.time`) y **solo**
  cuando `uid() != registradoPor && contraparteUid != null` — la regla (g) tal como quedó
  redactada en §2.2 **ya incluye** esas condiciones (hallazgo 4 cerrado: además congela
  monto, devuelto, constancias y el resto vía `hasOnly`).
- **Sin des-confirmación:** no hay rama que vacíe `confirmadaPor` (3.20(c)).
- **Entregas:** create exige `confirmadaPor != null` (o externo).
- **Aprobación del evento `confirmacion`:** la lista de tipos del create de `eventos`
  quedó en los 4 tipos de **D-3** (§2.2). La extensión por `['confirmacion']` **se
  propone, se prueba y se aprueba dentro del alcance de 4.6**, junto con la edición de
  `firestore.rules` de esa subetapa (§1.8) — hasta entonces, emitir un evento de ese
  tipo sería rechazado por reglas (3.14), y es el comportamiento deseado.
- **Guarda de 4.6 sobre (e):** la condonación pre-confirmación queda bloqueada añadiendo
  `confirmadaPor != null` a la rama (e) en la edición de reglas de 4.6 (§5.2); el caso
  se prueba en «+4.6», no en 3.1–3.22.
- **Eficacia desde 4.0:** la rama (g) puede desplegarse en 4.0 sin efecto funcional (la
  app aún no escribe esos campos; un participante ≠ registrador podría auto-setear
  `confirmadaPor`, pero la app de v1 no lo lee ni lo usa y ningún otro campo se altera).
  Su **estructura** ya se cubre en 3.20; el **flujo** completo es de 4.6.

---

## 3. Demostración exigida por D-6 (transacciones + reglas → invariante)

**Invariante funcional requerida (T-1 / I-3):** `devuelto == Σ de entregas NO eliminadas` de
la obligación, y `saldo = monto − devuelto ≥ 0` en todo camino válido de la app.

**Lo que NO se afirma:** que «las transacciones por sí solas garanticen la igualdad». El SDK
web de Firestore **no admite queries dentro de `Transaction.get`** (solo `DocumentReference`):
la transacción **no puede recomputar la Σ** y compararla. Cualquier demostración que dependa
de esa recomputación es inválida. Tampoco las **rules** pueden agregar (Σ de una colección):
la igualdad **no es verificable como agregado** ni en transacción ni en reglas. Tampoco se
afirma que «compilar las reglas» o «correr una suite parcial» constituyan evidencia: **D-6
se da por demostrado solo con la evidencia completa de §3.4** — si falta, el punto queda
**bloqueado** (§3.5) y se presentan alternativas, sin resolverlo por suposición.

### 3.1 Argumento de la demostración (por construcción)

La igualdad se mantiene porque **todo camino de escritura que altera el conjunto de entregas
no eliminadas altera `devuelto` en la misma operación atómica**, y **las reglas rechazan
cualquier escritura que no lleve el delta exacto**:

| Operación | Transacción (app) | Regla (server) | Efecto sobre la igualdad |
|---|---|---|---|
| **Alta de entrega** (`submitDevolucion`) | `tx.get(obl)` → valida `importe ≤ monto − devuelto` → `tx.set(entrega)` + `tx.update(obl, {devuelto: devuelto+importe})` | Criterio **3.8**: `getAfter(obl).devuelto == get(obl).devuelto + entrega.monto` **y** `getAfter(obl).devuelto ≤ getAfter(obl).monto` **y** `entrega.monto > 0` | La entrega no puede existir sin su delta en `devuelto`. Un cliente que solo cree la entrega (sin el update) **falla la regla**. |
| **Eliminar entrega** (`eliminarEntrega`) | `tx.get(entrega)+tx.get(obl)` → valida no-eliminada/obl activa → marca `eliminacion` + `devuelto = devuelto_leído − entrega.monto` (recálculo **sobre el estado leído**, no resta ciega) | Criterio **3.8'** (rama (i) de update de entrega): `getAfter(obl).devuelto == get(obl).devuelto − entrega.monto` y `≥ 0` | El doc entregado no puede marcarse eliminado sin bajar `devuelto` exactamente su monto. |
| **Editar monto de entrega** (`editarEntrega`) | `tx.get` ambos → valida saldo resultante → update entrega + `devuelto' = devuelto − monto_viejo + monto_nuevo` | Rama (ii): acople idéntico con el delta | Ídem. |
| **Edición de monto de obligación** (`editarObligacion`) | `tx.get(obl)` → `monto > 0 && monto >= devuelto` → update | Rama (c): `devuelto == 0` y `monto >= devuelto` server-side | No puede bajar el monto bajo lo devuelto. |
| **Condonación** (`condonar`) | `tx`: set `condonacion` + evento; **`devuelto` intacto** | Rama (e) + I-12 (3.15): condonación sin tocar `devuelto` | La igualdad no se altera (no hay entrega nueva). |
| **Eliminar obligación** | `tx`: marca + constancia + evento; doc y entregas conservados | Rama (f) + E1; `devuelto` intacto | Sin cambios en la igualdad de la obligación (sale de vistas, permanece en BD). |

**Escritor único (principio D-6):** `devuelto` solo lo escriben los helpers transaccionales
del módulo (`submitDevolucion`, `eliminarEntrega`, `editarEntrega`). No hay segundo camino
(lección de fijos: doble origen de verdad = inconsistencias en 2.2/2.9). La app no expone
`updateDoc` genérico sobre `reintegros`.

**Cobertura de clientes maliciosos o rotos:** un cliente que intente (i) crear entrega sin
update, (ii) update sin entrega, (iii) deltas distintos, (iv) eliminaciones dobles, o
(v) escrituras directas sobre `devuelto` fuera de los shapes permitidos, **es rechazado por
las reglas** (§2.2). Queda un residuo: un cliente podría escribir **dos operaciones válidas
en momentos distintos** que, en un instante intermedio, dejen `devuelto` desfasado respecto
de la Σ (p. ej., crear entrega con acople válido — en ese instante ambos coinciden; el
desfasamiento solo ocurriría si un camino alterara la Σ de entregas **sin** pasar por las
ramas acopladas — cubierto porque **toda** mutación de entregas está en esas ramas). El
**check final** es la reconciliación (3.2).

### 3.2 Verificación runtime (D-7): prueba de reconciliación

- **Qué:** `assertDevueltoConsistente(rid)`: lee la obligación y **todas** sus entregas
  (query por `reintegroId`), suma las no eliminadas, compara con `devuelto`. Diferencia ⇒
  **bug report** (nunca corrección silenciosa; T-1).
- **Dónde:** (1) **criterio de done automatizado** de 4.1 y 4.3 (tras cada secuencia del
  harness: alta, devoluciones, edición, eliminación); (2) **chequeo runtime opcional** en
  `useReintegros.js` (después de cargar: en desarrollo, `console.warn` si difiere; en
  producción, silencioso — decisión del plan: **warn solo en `NODE_ENV !== "production"`**,
  costo cero en prod, sin UI nueva).
- **Límite honesto:** la reconciliación es **post-hoc** (no impide la escritura inválida; eso
  lo hacen las reglas). Su valor es detectar bugs de la app y escrituras externas.

### 3.3 Concurrencia

Dos transacciones simultáneas sobre la misma obligación: Firestore serializa por optimistic
locking en los docs leídos; la perdedora **relee y falla la validación** (`importe > saldo`
tras el commit ajeno) ⇒ aborta sin escribir. Message: *«El saldo cambió; revisá el importe e
intentá de nuevo.»* (caso 5 del harness).

### 3.4 Evidencia mínima exigida para afirmar «D-6 demostrado»

Nada de lo anterior cuenta como evidencia por sí solo. La afirmación exige **todas** estas
piezas, archivadas, en 4.1 y 4.3:

1. **Suite de reglas 22/22 PASS** (§2.4), incluyendo los adversariales de cliente roto:
   3.8 (entrega sin update / delta incorrecto), 3.11 (escritura ajena) y 3.19 (constancias
   forjadas por rama ordinaria) — esto cubre: (i) crear entrega sin update, (ii) update sin
   entrega, (iii) deltas distintos, (iv) eliminaciones dobles, (v) escritura directa de
   `devuelto` fuera de los shapes permitidos y (vi) colado de campos extra en cualquier rama.
2. **Harness del módulo con reconciliación** (§3.2) tras **cada** secuencia: alta, devolución
   parcial, devolución completa, edición de entrega, eliminación de entrega, eliminación de
   obligación, condonación — con `assertDevueltoConsistente` en cero diferencias.
3. **Registro de escritores:** grep de evidencia `file:línea` mostrando que `devuelto` solo
   lo escriben `submitDevolucion` / `eliminarEntrega` / `editarEntrega` (escritor único,
   §3.1) y que **ningún** `updateDoc` genérico sobre `reintegros` existe fuera de los
   helpers.
4. **Cobertura de caminos:** verificación de que toda mutación del conjunto de entregas cae
   en una rama acoplada (§2.2.1) — cualquier rama nueva descubierta sin acople = bloqueo.

Si cualquiera falla o falta: **D-6 no está demostrado**; se documenta el hueco y se
presentan alternativas antes de seguir (§3.5).

### 3.5 Limitaciones, casos no cubiertos y disparadores de reconsideración

**Limitaciones conocidas (aceptadas y documentadas, no resueltas):**

- **Verificación post-hoc:** la reconciliación detecta la divergencia; no la impide. La
  impedancia la dan transacciones + reglas. Es así por diseño (D-7) y se declara.
- **Residuo de dos operaciones válidas en momentos distintos:** dos escrituras legítimas
  consecutivas pasan reglas por separado; en un instante intermedio `devuelto` refleja el
  estado anterior — que **coincide** con la Σ hasta ese momento (cada operación lleva su
  delta). La ventana solo se vuelve problemática si existiera una ruta que altere la Σ sin
  su delta; esa ruta **no existe en el diseño** (§2.2.1) y el punto 3. de §3.4 vigila que
  siga sin existir.
- **Bitácora no acoplada a reglas:** las reglas garantizan create-only y autoría de
  participante, pero **no** exigen que un evento acompañe a una acción concreta — un
  participante puede escribir un evento huérfano válido. La detección es por harness y
  revisión (§1.6), no por reglas. Corregirlo exigiría `getAfter` por acción, complejidad
  que este plan no asume.
- **Campos fuera de `hasOnly`:** si un helper de la app escribe un campo no listado, la
  escritura **falla visiblemente** (disponible, no silencioso). Es una limitación de
  mantenimiento: cambiar un shape exige actualizar reglas y suite en el mismo cambio.
- **Σ no agregable en servidor:** ninguna garantía de igualdad en el momento de leer,
  solo al escribir (ya cubierto) + reconciliación al cargar.

**Si aparece (cualquiera de estas):** un escritor alternativo de `devuelto` fuera de los
tres helpers (grep negativo en §3.4.3), una rama de escritura que altere entregas sin
acople, o la necesidad de **garantía agregada en tiempo real** (p. ej. invariantes de
cartera multi-usuario consultados por terceros) ⇒ **se bloquea el punto D-6, se retoma el
diseño y se presentan alternativas** (servidor confiable Cloud Functions/Cloud Run con
transacción de servidor, u otro mecanismo) **antes** de implementar. Si el emulador muestra
que alguna rama de §2.2 no cierra como se afirma aquí, mismo procedimiento: bloqueo +
alternativas, sin suponer.

---

## 4. Caso abierto D-9: pago recibido después de la condonación

**Contexto (principios aprobados, no reabiertos):** condonada ⇒ congelada (solo lectura +
«Eliminar»); entregas congeladas; eliminada ⇒ inmutable (D-9). Condonación ≠ pago (I-12).
La app **no** registra dinero recibido que no sea una entrega (reintegro ≠ ingreso).

**El caso:** la obligación está `condonada` y la contraparte (o un tercero) paga igualmente.
¿Se registra? ¿Cómo, sin violar las congelaciones aprobadas?

### 4.1 Análisis de opciones

| Opción | Descripción | Compatible con E1 | Compatible con C1 | Trazabilidad | Veredicto |
|---|---|---|---|---|---|
| **A — No registrar en la app** | El dinero se maneja fuera; la obligación permanece `condonada`; el hecho queda en la bitácora solo si el usuario escribe un evento manual (no existe esa acción; simplemente no se registra nada) | ✓ (no usa E1) | ✓ (no toca la constancia) | La constancia de condonación permanece **exacta** (se perdonó y el perdón fue real); el pago posterior **no queda trazado en la app** | Válida y **trivial**; costo: la app no refleja el dinero recuperado; el «excedente de caja» manual del usuario sí lo reflejaría si cuenta la plata |
| **B — «Eliminar» lógico + re-registrar** | (1) `eliminarObligacion` sobre la condonada (E1: **solo registrador**; conserva constancia de condonación + constancia de eliminación + eventos — I-4/I-10); (2) `submitReintegro` de una obligación nueva que representa la realidad actual (ej. mismo concepto/contraparte, `movimientoInicial` según corresponda); (3) `submitDevolucion` completa inmediata ⇒ `liquidado`. Referencia textual en `detalle` («pago posterior a condonación de {rid}») + eventos de bitácora en ambos docs encadenan la historia | ✓ — **usa** E1: el eliminador es el registrador. **Tensión documentada:** si el condonador fue la contraparte (C1: acreedor en espejo), el registrador (lado deudor) ejecuta la eliminación del registro perdonado por el acreedor. Eso **no** viola C1 (la constancia de quién condonó se preserva; C1 solo gobierna **quién condona**, no quién elimina — E1 gobierna eso) | ✓ (la condonación historical queda intacta) | ✓ fuerte: ambas constancias + eventos + referencia textual; **sin borrado físico ni en cascada** | **ELEGIDA por el usuario (16/10/2026)** — ver §4.2/§4.3. Riesgo residual: coordinación (solo el registrador puede eliminar); duplicado visual breve |
| **C — Des-condonar (quitar la constancia)** | Revertir `condonacion` y continuar | ✗ — pisaría la constancia de C1 | ✗ — el condonador perdió su hecho registrado | ✗ — destruye un hecho | **Descartada**: viola congelaciones aprobadas (D-9) e I-4 |
| **D — Registrar entrega sobre la condonada** | `submitDevolucion` normal | ✓ | — | ✓ | **Descartada**: viola «entregas congeladas» (D-9) |

### 4.2 Resolución elegida por el usuario: opción B

**Opción B — ELEGIDA POR EL USUARIO (16/10/2026) como resolución de D-9.** No es solo
una recomendación del plan; pero **tampoco autoriza implementación**: 4.3-bis la aplica
solo con su propia aprobación y el flujo de AGENTS.md. Términos exactos:

1. **Acción visible única en la UI de la fila condonada:** ya existe «Eliminar» (D-9). No se
   agrega una acción nueva «Recibir pago». El flujo documentado (copy en la confirmación de
   eliminación de una condonada) es: *«Esta deuda fue condonada. ¿Eliminar el registro para
   registrar el pago recibido como un nuevo reintegro? La condonación se conserva en el
   historial.»*
2. **Tras eliminar:** el usuario usa el alta estándar (4.2) + devolución completa (4.3). La
   app **no** automatiza el paso 2 (cambio mínimo; evita acoplar dos operaciones distintas en
   un mecanismo nuevo).
3. **Trazabilidad:** eventos `eliminacion` (doc viejo, con `motivo` opcional precargado
   «Pago posterior a condonación») + `creacion` (doc nuevo, con la referencia en `detalle`) +
   `creacion`/liquidación de la entrega. Ambas constancias permanecen juntas en el doc viejo
   (I-4 actualizada: sin borrado físico).
4. **Límite:** si el condonador es la contraparte y el registrador no coopera, no hay flujo
   (A queda como fallback). Documentado, no «resuelto» en silencio.

**Estado:** **resolución elegida (16/10/2026)**; documentada en §4.3. 4.3-bis no la
implementa sin su aprobación explícita (paso 5 del flujo).

### 4.3 Consecuencias funcionales de la opción B (documentadas)

1. **Doc viejo (condonada + eliminada):** sale de listas y cálculos por D-5 (campo
   ausente = activo no aplica aquí: la constancia de eliminación lo saca de vistas),
   **permanece en la base** con ambas constancias (`condonacion` + `eliminacion`),
   sus eventos y su histórico de entregas intactas — I-4/I-10 sin borrado físico. Queda
   **inmutable** (guard global: rama alguna lo actualiza).
2. **Doc nuevo:** es la obligación vigente. El usuario lo crea con el alta estándar (4.2)
   y registra las devoluciones reales con 4.3. **La app NO automatiza la reconstrucción**
   (cambio mínimo; no acopla alta + devolución en un mecanismo nuevo).
3. **Anti-duplicación/confusión:** la única acción visible sobre la condonada es
   «Eliminar», con el copy de §4.2.1 que explica el motivo («…para registrar el pago
   recibido como un nuevo reintegro; la condonación se conserva en el historial»). Riesgo
   residual aceptado: **duplicado visual breve** si el usuario lee mal o hace dos veces
   el flujo — DC-4: sin avisos automáticos de duplicados; se mitiga con el copy.
4. **Entregas del doc viejo:** se congelan como histórico; **no migran ni suman** al doc
   nuevo. El dinero realmente cobrado se registra como nuevas entregas del doc nuevo.
5. **Trazabilidad encadenada:** eventos `eliminacion` (viejo, `motivo` opcional
   «Pago posterior a condonación») + `creacion` (nuevo, referencia textual en `detalle`)
   + eventos de la entrega; ambas constancias juntas en el doc viejo.
6. **Reglas:** una entrega ordinaria sobre condonada o eliminada queda **rechazada**
   (3.18) — el caso no puede colarse por la app ni por un cliente directo.
7. **Fallback A:** si el condonador fue la contraparte y el registrador no coopera, no
   hay flujo posible (solo el registrador puede ejecutar (f)); queda documentado: el
   dinero se maneja fuera de la app. No se resuelve en silencio.

---

## 5. Diseño detallado de 4.6 — Confirmación bilateral (PO-4; D-11a/D-11b) — **[SUPERADO 17/10/2026]**

> > **⚠ SUPERADO — 17/10/2026 (4.6 eliminada).** Registro histórico. En particular:
> > §5.3 (exclusión de pendientes de confirmación del stock, decisión 16/10/2026) queda
> > **sin objeto** — no hay estado «pendiente de confirmación» y **todo cuenta en el
> > balance de ambas partes**; §5.4 (ventana R-4 entre 4.3 y 4.6) queda obsoleta — **R-4
> > vuelve a mitigarse solo con convención de uso** (§11 filas 7–9).

> Nota verificada (`HANDOFF-ETAPA-4.md` §4): el «patrón de fijos» citado como referencia de
> UX **no existe como mecanismo** en el código (`useFixedExpenses.js:270-317` solo tiene
> `updateDoc` inmediato; `PagarModal.jsx:35,133` es un diálogo local «Confirmar pago»). Este
> diseño es **nuevo**, no una copia.

### 5.1 Estados y modelo

- **Campo nuevo en `reintegros`:** `confirmadaPor: uid | null` (+ derivar `confirmadaAt` al
  confirmar; se propone almacenar `confirmadaAt: Timestamp` junto con el uid — hecho no
  derivable, auditable).
- **Alta con contraparte miembro:** `confirmadaPor: null` → estado visible **«Pendiente de
  confirmación»**.
- **Alta con externo:** sin campo (auto-confirmada; §2.5). Sin paso extra de UX.
- El estado **no** se almacena como enum (lección 2.2): el estado de confirmación se deriva
  de `confirmadaPor`; los estados financieros (pendiente/parcial/liquidado/condonado) siguen
  derivándose igual. **Interacción:** una obligación pendiente de confirmación tiene
  `devuelto == 0` por construcción (sin entregas posibles) ⇒ estado financiero «pendiente»
  + sello de confirmación orthogonal.

### 5.2 Flujo

1. **Alta (4.2):** `submitReintegro` crea con `confirmadaPor: null` si `contraparteUid != null`.
2. **Visibilidad (D-11b.1):** R1' (`participantes array-contains`) **ya incluye** a la
   contraparte ⇒ **sin cambios de query**. La fila aparece en **Pendientes** con badge
   «Pendiente de confirmación» para ambos.
3. **Bloqueo de entregas (D-11b.2):** `FilaReintegro` oculta «Agregar pago»/«Saldar deuda»
   (o las muestra deshabilitadas con tooltip «Esperando confirmación de {nombre}»);
   `DevolucionModal` no abre; **y** las reglas rechazan `create` de entrega sobre obligación
   con `confirmadaPor == null` (§2.5). Doble barrera (UI + server).
4. **Confirmación:** acción **«Confirmar»** visible **solo para la contraparte**
   (`uid != registradoPor`). Transacción simple (o `updateDoc` + evento): set
   `confirmadaPor: uid`, `confirmadaAt: serverTimestamp()` + evento `confirmacion`
   (**tipo por aprobarse con 4.6** — la lista cerrada de D-3 no lo incluye, §2.5).
   **Unidireccional e irrepetible** (regla (g)).
   - **¿Rechazar?** **No está en D-11b** (solo habla de confirmar). El plan **no inventa**
     una acción «Rechazar»: si la contraparte no está de acuerdo, el registrador **elimina**
     su registro (pre-confirmación, D-11b.3) y conversan fuera de la app. Dejar registrado:
     «rechazo» queda como evolución futura si el uso real lo pide.
5. **Pre-confirmación — permisos (D-11b.3):**
   - **Registrador:** puede **editar** (concepto, detalle, monto con guarda `devuelto==0`,
     movimientoInicial) y **«Eliminar»** (lógica, con constancia). Acciones 4.3-bis
     disponibles también acá.
   - **Contraparte:** **solo** ve y confirma (no edita, no elimina, no condona — la
     condonación post-confirmación rige C1; pre-confirmación no hay deuda acordada que
     perdonar).
   - **Condonación pre-confirmación:** **bloqueada** (UI + regla: rama (e) exige doc
     confirmado — se añade `confirmadaPor != null` en esa rama al implementar 4.6).
6. **Post-confirmación:** rige la matriz **D-8** completa (editar: (ii) solo registrador,
   monto bloqueado con `devuelto > 0`; eliminar: E1; condonar: C1; entregas: ambas partes
   por PO-5).

### 5.3 Indicadores y stock (decisión APROBADA por el usuario, 16/10/2026)

**Las obligaciones pendientes de confirmación NO entran en «Pendiente de cobro/devolución»**
(stock financiero) ni en Generado/Deuda generada del resumen (4.4): una deuda no acordada
distorsionaría el stock. Se muestran **solo en la lista** con su badge «Pendiente de
confirmación» — **no desaparecen ni se presentan como confirmadas.** La confirmación
bilateral es lo que incorpora la obligación al resumen financiero. Rationale: D-11b.1
exige **ver** la obligación; no exige **contarla**; y confirmar no crea ingreso ni
devolución (regla rectora: un reintegro no es un ingreso). Es **criterio de aceptación
de 4.6** (§1.8) y se prueba en su harness. La exclusión es solo de stock/resumen: la
fila con su badge permanece visible en la lista.

### 5.4 Ventana R-4 (entre 4.3 y 4.6)

Hasta 4.6, rige la **convención de uso** documentada (solo quien adelantó registra;
`PROPUESTA-ETAPA-3.md` §5.3) como mitigación del doble registro. Riesgo aceptado y
documentado (§8).

### 5.5 Alternativa de confirmación tácita (para aprobación en su momento)

Si el paso explícito resulta moleto en el uso real: **confirmación tácita al primer evento
bilateral posterior** (p. ej., la primera entrega registrada por la contraparte confirma
implícitamente). **No se propone para la primera versión de 4.6** (viola D-11b.2 — entregas
antes de confirmar — salvo que se rediseñe el guardrail); queda documentada como evolución,
con su costo: habilitaría entregas pre-confirmación con lo cual el guardrail 2 se perdería.

### 5.6 Archivos y reglas

Listados en §1.8. Reglas: §2.5. Harness adicional de 4.6: alta pendiente → visión espejo →
bloqueo de entrega (UI y regla) → confirmación por contraparte → flujo normal; rechazo de
confirmación por el propio registrador; rechazo de doble confirmación; externos sin paso.

---

## 6. Propuesta de herramientas (D-1)

**Decisión aprobada (D-1, no reabrir):** Emulator Suite + `@firebase/rules-unit-testing` +
un único runner; **sin instalar aún**; configuración fina ajustable por el plan con
justificación; aislamiento total de `finanzas-app-1c5f6`. Esta sección fija la configuración.

### 6.1 Componentes

| Componente | Rol | Versión propuesta | Justificación |
|---|---|---|---|
| `firebase-tools` (devDep) | Emuladores + deploy de reglas | `^14` (la vigente al implementar) | Único soporte oficial de `emulators:exec`; se invoca vía npm script (sin instalación global obligatoria) |
| `@firebase/rules-unit-testing` (devDep) | Suite de reglas | `^3` | Estándar del ecosistema; API `initializeTestEnvironment` con `projectId demo-*` |
| **`node:test`** (runner, built-in) | Ejecutar tests de reglas y harness del módulo | Node **20.11.1** (ya instalado; verificado) | **Cero dependencias nuevas**: el repo no tiene framework de pruebas (`package.json:18-23`); añadir vitest/jest contradice el criterio de cambio mínimo. `node --test` cubre aserciones, runs y reporte. **Alternativa documentada:** `vitest` — se elegiría si se quisiera watch-mode o matchers; coste: +2 devDeps. El runner es sustituible sin tocar el código de las pruebas (D-1: «configuración fina ajustable»). **Dirección aceptada por el usuario (16/10/2026); instalación efectiva solo al aprobar 4.0** |
| **Java JRE 11+** | Requisito del emulador de Firestore | Instalación **por el usuario** | **NO estaba instalado** (verificado 15/10/2026, §7 N-1): **re-verificar el entorno al autorizar 4.0** (puede haber cambiado). El emulador de Firestore lo exige. Sin él, 4.0 no puede correr localmente. **Prerrequisito humano, bloqueante de la implementación de 4.0** |

### 6.2 Configuración (`firebase.json` propuesto)

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 },
    "ui": { "enabled": false },
    "singleProjectMode": true
  }
}
```

### 6.3 Scripts (`package.json`, al implementar 4.0)

```json
"test:rules": "firebase emulators:exec --only firestore --project demo-finanzas \"node --test tests/rules/\"",
"harness:reintegros": "firebase emulators:exec --only firestore --project demo-finanzas \"node --test tests/harness/\""
```

### 6.4 Aislamiento (inquebrantable)

- `--project demo-finanzas`: el SDK y los emuladores **solo** hablan con el emulador local
  (`FIRESTORE_EMULATOR_HOST` lo fija `emulators:exec`). Los IDs `demo-*` impiden que un
  client SDK mal configurado toque un proyecto real (el SDK los trata como emulador).
- **Ningún** script, test o harness apunta a `finanzas-app-1c5f6`. Las credenciales reales no
  se usan en tests (el emulador autentica users falsos vía `testEnv.authenticate()`).
- Sin CI en el repo (verificado): los runs son **locales**, bajo el mismo criterio de
  evidencia que los harness de 2.2/2.7.
- Staging y Producción comparten proyecto (§8): el emulador es el **único** entorno donde
  probar reglas sin tocar producción.

### 6.5 Mantenimiento

Dos devDeps y una config declarativa. Actualizaciones: puntuales, con el repo. Si el runner
se migra a vitest después, solo cambia el invocador (`node --test` → `vitest run`); las
pruebas usan la API de `rules-unit-testing`, no la del runner.

---

## 7. Inconsistencias diseño↔código (verificadas el 15/10/2026 contra `10ab576`)

### 7.1 Claims de `PROPUESTA-ETAPA-3.md` — todos verificados, **sin discrepancias que bloqueen**

| Claim (PROPUESTA) | Verificado en código | Estado |
|---|---|---|
| `useIngresos.js:93-118` total incluye transferencias; suma `:103-114` | Total en `:93-118`; reduce de transferencias `:103-109`; retorno `:111-114` | ✓ exacto |
| `useGastos.js:65-76` filas sintéticas; `:126`/`:130` totales | Map `:65-74`; merge `:76-80`; `totalPersonales` `:126`; `totalGastos` `:130` | ✓ |
| `useGastos` no expone `transferencias` (`:146-165`) | Return `:146-165` sin esa clave | ✓ |
| `subscribeGastos.js:26-38,60-96`, `totalQueries :32` | `transferenciasMap :26-28`; `totalQueries = 1 + groupIds.length * 2` en `:32`; bloque grupo+query `:60-96` | ✓ |
| `subscribeIngresos.js:50-72,76-125`, dualidad `emitIfReady` | Query `:50-72`; flags `:78-92`; snapshot dual `:111-125` | ✓ |
| `agregar/page.jsx:8,79-91,133-135` | Import vivo `:8`; botón comentado `:79-91`; render inalcanzable `:133-135` | ✓ |
| `ingresos/page.jsx:15,67-73,110-122` | Import `:15`; conteo con `transferenciasRecibidas.length` `:67-73`; JSX comentado `:110-122` | ✓ |
| `FilaGasto.jsx:21-24,37,63,82` | Subtítulo `:21-24`; `esTransferencia :37`; condiciones de menú `:63` y `:82` | ✓ |
| `quickActions.js` sin entrada Reintegros | Entradas: ingresos, gastos, fijos + 3 deshabilitadas | ✓ |
| `submitTransferencia.jsx:18` único escritor; `submitCompra.js:74` `origenCompra` | `:18` `addDoc(transferencias)`; `:74` `origenCompra: true` | ✓ |
| 6 targets de 4.5 existen | `ModoTransferencia.jsx`, `transferencia/`, `Transferenciassections.jsx`, `FilaTransferencia.jsx`, `TransferenciasIngresosSection.jsx`, `gastosCalculations.js` — presentes | ✓ |
| 0 código de `reintegro*` | Grep 0 coincidencias en `AppFinanciera/` | ✓ |
| `useFixedExpenses.js:270-317` sin confirmación bilateral | `registrarPago :270-299` = `updateDoc` inmediato; `saldarPendiente :301-307`; `PagarModal` diálogo local | ✓ (confirma la nota del HANDOFF) |
| `package.json` sin framework de pruebas | Solo eslint/tailwind/next/react/firebase | ✓ |

### 7.2 Hallazgos nuevos (diseño↔entorno; registrados, no corregidos)

| ID | Hallazgo | Evidencia | Acción en la Etapa 4 |
|---|---|---|---|
| **N-1** | **Java no instalado** en la máquina de desarrollo | `java -version` → comando no encontrado; sin JRE en `Program Files\Java`, `(x86)\Java` ni `LOCALAPPDATA` | **Bloquea la implementación de 4.0** (no la planificación). Instalación por el usuario (§6.1) |
| **N-2** | **`firebase-tools` no instalado** (ni global ni local) | `Get-Command firebase` vacío; ausente de `package.json` | Se agrega como devDep **al implementar** 4.0 (D-1: sin instalar aún) |
| **N-3** | Índice compuesto de R1' no existe (la colección misma no existe) | Colecciones `reintegros*` ausentes | Crear/pre-aprobar en 4.0 (`firestore.indexes.json` + riesgo R-2) |
| **N-4** | **`firestore.rules` y `firebase.json` no existen** en `AppFinanciera/` (verificado 16/10/2026: glob sin resultados; requisito de `HANDOFF-ETAPA-4.md` §5.6) | Ausencia en la raíz de `AppFinanciera/` | Las reglas vigentes **solo están en la consola**: 4.0 las recupera al Bloque A (§2.2) con backup + SHA-256 (§2.3). `firebase.json` se crea en 4.0 |

### 7.3 Deriva menor en documentos de `context/` (deuda documental, **sin acción** en la Etapa 4)

| Doc | Cita | Real (`10ab576`) |
|---|---|---|
| `context/arquitectura.md:44` | JSX comentado en `page.jsx:99-111` | `:110-122` |
| `context/MAPA-APPFINANCIERA.md:105` | `useIngresos.js:95-106` | `:103-109` (suma) / `:93-118` (total) |
| `context/MAPA-APPFINANCIERA.md:108` | botón en `page.jsx:82-107` | `:79-91` |

Ninguna afecta decisiones; se listan por rigor (metodología: hallazgos clasificados). **No se
corrigen en esta etapa** (context docs ≠ alcance aprobado de la Etapa 4).

---

## 8. Riesgos de la Etapa 4

| ID | Riesgo | Ventana / impacto | Mitigación en el plan |
|---|---|---|---|
| **R-4** | Doble registro de la misma obligación real | **Entre 4.3 y 4.6** (sin confirmación): si ambos registran, hay dos docs | Convención de uso documentada (§5.4); DC-4: sin avisos de duplicados; 4.6 cierra con confirmación bilateral; R-4 no se elimina hasta 4.6 |
| **R-6** | Escrituras `addDoc`/`updateDoc` sin timeout (deuda preexistente, `AGENTS.md`) | Botón «Guardando…» infinito en offline; cola que se commitea al reconectar | El módulo **no hereda** el mecanismo: todas sus escrituras son `runTransaction` (sin cola; fallan con «No hay conexión»). `submitReintegro` también transaccional (P-2). La deuda compartida de la app **sigue fuera de alcance** |
| **R-2** | Índice R1' inexistente ⇒ `loading` infinito | 4.1 | `firestore.indexes.json` en 4.0; verificación estilo gate previa |
| **R-N1** | Java ausente (hallazgo N-1) | Implementación de 4.0 bloqueada | Prerrequisito humano explícito; no hay alternativa que no toque el proyecto real |
| **R-Compartido** | Staging y Producción comparten `finanzas-app-1c5f6` | Despliegue de reglas afecta ambos | Emulador como único entorno de prueba de reglas; deploy de reglas = paso de producción con aprobación (§2.3) |
| **R-5** | Resolución frágil de miembros `uid`/`iud` | Contraparte mal resuelta en alta | Copiar fallback de `useModoTransferencia.jsx:52-67`; sin reparar el dato |
| **R-3** | Límite `in` (30) de Firestore en D1 | >30 obligaciones visibles | Trocear en batches de 30 en el service; saldo no depende de D1 (sale de `devuelto`) |

---

## 9. Declaración de no-implementación y siguiente paso

- Este documento **solo planifica**: no modifica `AppFinanciera/`, no instala dependencias,
  no escribe en Firestore, no despliega reglas, no hace commits ni push.
- La implementación comienza **únicamente** cuando el usuario **apruebe explícitamente el
  plan de la subetapa 4.0** (paso 5 de `HANDOFF-ETAPA-4.md` §1), tras la revisión conjunta
  de este documento (paso 4; el commit de este archivo se autoriza en esa revisión).
- Cada subetapa posterior requiere su propia aprobación y respeta
  Local → Staging → Producción con verificación (`AGENTS.md`).

**Decisiones de este plan ya resueltas por el usuario (16/10/2026):**

1. ✅ **D-9 → opción B** (eliminar lógico + re-registrar; §4.2/§4.3). Elegida; la
   implementación sigue dependiendo de la aprobación de 4.3-bis.
2. ✅ **Exclusión de pendientes de confirmación del stock financiero** en 4.6 (§5.3) —
   criterio de aceptación y prueba de esa subetapa.
3. ✅ **Runner `node:test`** como dirección técnica (§6.1) — instalación efectiva solo al
   aprobar 4.0, con presentación previa del diff de dependencias.
4. ✅ **Corrección de los hallazgos 1–6** del borrador de reglas (§2.2/§2.2.1/§10).

**Siguen pendientes de aprobación/explicitación del usuario:**

- (a) **Aprobación expresa del plan corregido** y después de la subetapa **4.0** (paso 5).
- (b) **Schema exacto del evento** (detalle de implementación en 4.4-bis, fuente:
  `PROPUESTA-ETAPA-3.md` §3.5, conforme D-3).
- (c) **Extensión de tipos `['confirmacion']`** en `eventos` — se aprueba con 4.6 (§2.5).
- (d) **Diseño completo de 4.6** (§5) en su momento, incluida la guarda de (e).
- (e) Instalación de herramientas (D-1) y Java: presentación → aprobación → instalar.

---

## 10. Registro de correcciones (16/10/2026)

Corrección documental autorizada por el usuario — **solo este archivo** (sin tocar
`AppFinanciera/`, sin instalar dependencias, sin acceder a Firestore, sin commits ni push).
Qué cambió y dónde:

| # | Hallazgo / pedido | Corrección aplicada | Dónde |
|---|---|---|---|
| **1** | Precedencia `&&`/`||` rota en dos `create` | Grupos con paréntesis explícitos; caso de regresión **3.17** | §2.2 (create de `reintegros` y de entregas), §2.2.1 (2), §2.4 |
| **2** | Rama (e) con sintaxis rota y comentario corrupto | (e) reescrita con apertura correcta y comentario íntegro | §2.2 |
| **3** | Constancias falsificables vía ramas ordinarias (d)/(b)/(c) y en `create` | Transiciones analizadas **por rama** (tabla §2.2.1); `hasOnly` por rama; solo (e)/(f) agregan constancias; `create` sin constancias; caso **3.19** | §2.2, §2.2.1, §2.4 |
| **4** | Rama (g) sin congelar el resto del doc; sin `uid != registradoPor` | `hasOnly(['confirmadaPor','confirmadaAt'])`; `confirmadaAt == request.time`; contraparte ≠ registrador; caso **3.20** | §2.2, §2.4, §2.5 |
| **5** | `esAcreedor` no cubría «externo: solo registrador» (D-8) | Función con rama externa explícita; caso **3.21** | §2.2, §2.4 |
| **6** | Lecturas de `reintegro_devoluciones` con `request.resource.data` + `list` contradictorio | Solo `get` por participante; `list: if false`; caso **3.22** | §2.2 |
| **7** | Congelaciones D-9 dependían del form (nota (2) incorrecta) | Guards **server-side**: (a)–(d)/(g) exigen obligación activa; create y update de entregas exigen activa; (f) es la única rama permitida sobre condonada; caso **3.18** | §2.2, §2.2.1, §2.4 |
| **8** | Evento `confirmacion` embebido en 4.0 + create de `eventos` sin check de participante | Lista = 4 tipos cerrados de D-3; extensión a 4.6; **`esParticipante(rid)` añadido** (corrección adicional: antes cualquier autenticado podía escribir en la bitácora ajena) | §2.2, §2.5, §1.6 |
| **9** | D-9 sin estado ni consecuencias | Opción B **elegida (16/10/2026)** + nueva §4.3 de consecuencias funcionales | §4.2, §4.3 |
| **10** | Stock de pendientes: decisión pendiente | **Aprobada (16/10/2026)** + criterio de aceptación/prueba en 4.6 | §5.3, §1.8 |
| **11** | Dependencia de 4.5 decía «4.4» | → **4.4-bis** (secuencia aprobada, módulo completo) | §1.7 |
| **12** | Verificación pedida por handoff §5.6 | **N-4**: `firestore.rules`/`firebase.json` inexistentes (16/10/2026) | §7.2, §1.0 |
| **13** | Rollback y repaso de reglas | Backup + SHA-256 previo, repaso del **conjunto completo**, ventana de mantenimiento, procedimiento de restauración | §2.3, §1.0 |
| **14** | D-6 no podía declararse sin evidencia | **§3.4** evidencia mínima exigida + **§3.5** límites, casos no cubiertos y disparadores de bloqueo/alternativas | §3 |
| **15** | Suite: casos y conteos | **3.16–3.22** añadidos, «+4.6» diferenciado, total **22/22**, sin declarar PASS sin run real | §1.0, §2.4 |
| **16** | Typos y texto corrupto | «elegiria»→«elegiría»; «distorsería»→«distorsionaría»; `se写下`→redacción nueva; referencia rota «§3.5 de este documento» → `PROPUESTA-ETAPA-3.md` §3.5 | §6.1, §5.3, §2.2, §1.6 |
| **17** | Java re-verificable | Re-verificación al autorizar 4.0 + presentación del diff de `package.json`/scripts antes de instalar | §1.0, §6.1 |

**No se reabrió ninguna decisión D-1…D-11** del handoff; la secuencia
`4.0 → 4.1 → 4.2 → 4.3 → 4.3-bis → 4.4 → 4.4-bis → 4.5 → 4.6` no cambió
*(en la sesión del 16/10; la eliminación de 4.6 llega con §11, el 17/10/2026)*.

---

## 11. Decisiones del usuario (17/10/2026, cierre de 4.2)

Enmiendas al desglose (§1), a 4.2 (§1.2), a 4.4-bis (§1.6), a 4.6 (§1.8/§2.5/§5) y a la
secuencia, resueltas por el usuario el **17/10/2026** al aprobar la subetapa 4.2 con ajustes.

| # | Decisión | Dónde reemplaza / afecta |
|---|---|---|
| 1 | Un SOLO selector «¿Con quién?» (unión de miembros de todos los grupos + externa); groupId deducido, con picker «¿En qué grupo?» solo si hay varios compartidos | §1.2 Alcance |
| 2 | `movimientoInicial` **derivado** + casilla «Me entró dinero»; sin selector manual ni texto anti-doble-captura | §1.2 Alcance |
| 3 | `/reintegros` con balance de stock Préstamos/Deudas, pestañas Activos/Saldados y acordeones (estética /gastos) | §1.2 Alcance |
| 4 | Sección «Dinero del mes» (solo lectura, con selector de mes) | §1.2; **§1.5 — 4.4 absorbe «Dinero del mes» dentro de `ResumenMesCard` (sin selector duplicado)** |
| 5 | Reintentos de suscripción acotados (solo `unavailable`, máx. 5) + botón «Reintentar» | §1.2 Alcance |
| 6 | Entorno de 4.2: emulador local exclusivo (flag con guarda doble) + siembra (con guarda de host local) + Emulator UI en :4000 | §1.2 (Alcance/Archivos) |
| 7 | **Sin confirmación bilateral: el otro miembro NO confirma las deudas** — supersede **PO-4** (decidida 14/10/2026, `PROPUESTA-ETAPA-3.md` §5.3; ese documento **no se modifica**: registro histórico) y **D-11a/D-11b** del HANDOFF | §1.6, §1.8, §2.5, §5 |
| 8 | UI de 4.2: quitar «Sin confirmar» de las filas de `/reintegros`; las obligaciones de miembro **cuentan en el balance de ambas partes** | §1.2 Alcance |
| 9 | **4.6 ELIMINADA 17/10/2026** (sin renumerar: era la última). La secuencia termina en **4.5** | §1 (secuencia), §1.8, §5, HANDOFF §4 |
| 10 | Efectos **registrados, NO ejecutados** — el **primer paso de la próxima sesión, antes de 4.3**, es el lote de reglas que retira la confirmación, **con diff y tests para aprobación del usuario** (las reglas que se desplieguen a Producción serán **las posteriores a ese lote**): guarda de entregas `confirmadaPor != null \|\| contraparteUid == null`, rama (g) + test 3.20, H-c de la rama (c) → moot + test 3.25, `confirmadaPor` en el alta (create) + tests 3.9/3.40 y el shape H1/1a/1b del harness, chequeo `SIN_CONFIRMAR` en `submitDevolucion` + caso H3b; la extensión `['confirmacion']` en `eventos` queda **sin objeto** | §2.2, §2.4, §2.5 |
| 11 | **Permisos — CONFIRMADOS por el usuario (17/10/2026):** (a) **pagos: por cualquiera de los dos** (implementación efectiva tras el lote de reglas de la fila 10); (b) **monto: editable solo por el registrador, con `devuelto == 0`** (rama (c) vigente, menos la condición H-c que pasa a moot); (c) **condonar y eliminar: como están hoy hasta 4.3-bis** (C1/E1 de D-8). **Consecuencia registrada de sin confirmación:** la contraparte **no puede aceptar, rechazar ni ocultar** una obligación que le crea el registrador, y **no se le avisa si el registrador edita el monto** (la edición queda solo en la bitácora) — **vinculado con H-e** (`EVIDENCIA-4.0.md` §6): sin confirmación la contraparte no tiene ningún veto sobre la obligación impuesta; **H-e sigue PENDIENTE ABIERTO** y debe resolverse antes de abrir la app al público | Lote de reglas (fila 10) · 4.3 / 4.3-bis |

*Esta §11 no reabre las decisiones D-1…D-11 restantes del HANDOFF (D-11a/D-11b quedan
supersedas por las filas 7 y 9). Fuente operativa de la cierre: `AppFinanciera/EVIDENCIA-4.2.md` §9.*

---

*Fin del documento. Etapa 4 — plan técnico de implementación de Reintegros. Producido
15/10/2026 conforme a `HANDOFF-ETAPA-4.md` §5; **corregido el 16/10/2026** (§10, autorización
del usuario); **enmendado el 17/10/2026** (§11, decisiones de cierre de 4.2 — incluye la
eliminación de 4.6). Base de código al producirlo: `10ab576`. Este documento no implementa,
no modifica código ni datos, y no autoriza deploys.*
