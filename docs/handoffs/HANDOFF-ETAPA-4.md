# HANDOFF — Etapa 4: Implementación de Reintegros (AppFinanciera)

> Preparado por Personal System (coordinación) — 15/10/2026.
> Documento de traspaso para el OpenCode de AppFinanciera. **Solo planificación: no implementa nada.**
> Resultado (materializado): `docs/propuestas/PROPUESTA-ETAPA-4.md` — el nombre previsto `PLAN-ETAPA-4.md` no se usó.
> La entrega de este HANDOFF al repo es una acción posterior, no automática (revisión del usuario previa).

## 0. Estado de coordinación (actualizado 30/10/2026)

- **Etapa 3 CERRADA (15/10/2026):** `PROPUESTA-ETAPA-3.md` aprobada (`e665e3d`); PO-1…PO-8 y DC-1…DC-8 incorporadas; P-1…P-9 y vacíos de PO-4 abiertos.
- **Etapa 4 EN IMPLEMENTACIÓN:** Ronda 1 y Ronda 2 aprobadas 15/10/2026 (este handoff); plan técnico aprobado como `PROPUESTA-ETAPA-4.md` (16/10/2026, `294bab9`/`e57f6f0`) con enmiendas 17/10/2026 (`0ed53ab`, `86aaf06`).
- **Subetapas CERRADAS** (todas en `staging` de `AppFinanciera/`, evidencia en `docs/evidencia/EVIDENCIA-4.0.md` … `EVIDENCIA-4.4-bis.md`): **4.0** 16/10 (`ff47291`, `63666f6`) · **4.1** 16/10 (`6519dda`, `2404140`) · **4.2** 17–19/10 (`74b9203`, `632dd65`, `5264d2e`, `41f8cb8`) · **4.3** 21–22/10 (`7d41d39`, `2e1ba5f`, `687d65b`, `7ae1021`, `280e817`, `8f2c7b6`).
- **4.3-bis (eliminar/condonar) CERRADA 25/10/2026** (commits `1de79c8`, `f0a66af`, `beddcf3` en `staging`; docs en el repo padre): helpers `eliminarEntrega`/`eliminarObligacion`/`condonar`, `modelo.js` (Set de activas), UI (menú ⋮ con hoja `MenuAccionesSheet` en `page.jsx` + `ConfirmarAccionModal`), harness 53/53. **Decisiones finales 24/10:** regla estricta de **Cerradas** (sin edición/eliminación, sin menú) y **D-9 opción B RETIRADA**; limitación conocida aceptada (un último pago erróneo que liquida no se corrige desde la app). Evidencia: `docs/evidencia/EVIDENCIA-4.3-bis.md`.
- **4.4-bis (bitácora) CERRADA 30/10/2026** (commit `d2be899` en `staging`; docs en el repo padre): **P-1 aprobada** — esquema canónico por tipo/entidad (3 capas, aditivo y tolerante) en `context/dominio.md` §5.3; cambios aditivos en `submitDevolucion` (`entregaId`, `monto`) y `submitReintegro` (`monto`, `sentido`); harness **57/57** (H44–H47), reglas **44/44** sin cambios, lint baseline 4, build OK; **enmienda datada** en `PROPUESTA-ETAPA-4.md` §1.6 (§3.5 → §3.6.b; `eventos.js` no existe). Limitación conocida documentada (evento sin acción posible por un participante; no altera saldos). **Siguiente: 4.5-fecha** (apertura 03/11/2026), después 4.5 (retiro de Transferencias). 4.4 queda **diferida** (absorbida por la Etapa 5). Evidencia: `docs/evidencia/EVIDENCIA-4.4-bis.md`.
- **4.5-fecha (CERRADA 03/11/2026, commits `9d350d2`/`bbd3345`/`6c708ef`):** subetapa propia **previa a 4.5** (no se reusa `4.5-bis`, cancelada el 30/10/2026). Alcance (**ampliado 03/11/2026**): campo **`fecha`** (Timestamp) en el **gasto diario** (alta modo único, alta modo compra y edición) **y en el ingreso diario** (alta + **edit/delete nuevos**, `EditarIngresoModal`); **período/mes derivado de `fecha` con fallback a `createdAt`** en ambos; `createdAt` queda como **auditoría inmutable**; `fecha` **opcional en reglas** (compatibilidad con clientes viejos) y **obligatoria en la app**; **una fecha por compra**; rango de reglas **2020-01-01 … `request.time + 1 día`**; **sin migración ni backfill** y sin tocar los documentos de octubre cargados por consola. **`subscribeGastos` y las transferencias de `/ingresos` sin cambios**; **`subscribeIngresos` deja de filtrar por `createdAt`** y el período se resuelve en cliente. **Paso 0:** diff consola vs repo a partir del **texto pegado de la consola** (no se autoriza Rules API con credenciales); si hay delta, **commit de sincronización previo** con el texto real y el delta documentado; los tests de reglas se escriben contra ese texto. **Contrato para la 5.1:** `balanceDelMes(mes, uid)` debe usar el mismo criterio de fecha y **no puede resolverlo con `where("fecha", …)`** (excluiría los documentos sin `fecha`). **Verificación funcional local aprobada por el usuario** (7/7: gasto e ingreso con fecha de octubre estando en noviembre, edit que mueve de mes en ambos, delete de ingreso, legacy sin `fecha` por fallback, selector de mes). **Staging y deploy de reglas DIFERIDOS al cierre de la Etapa 4** (junto con el BLOQUE B). Reglas, promoción y deploy se autorizan por separado. Evidencia: `docs/evidencia/EVIDENCIA-4.5-fecha.md`.
- **4.5 (retiro de Transferencias) CERRADA 03/11/2026** (commit `f4a1cd7` en `staging`; docs en el repo padre): retiro del 100 % del código legacy de Transferencias (§7.1 #1–#16) con las **6 condiciones de §7.4** cumplidas: **7 archivos eliminados** (`ModoTransferencia`, carpeta `transferencia/` completa, `Transferenciassections`, `FilaTransferencia`, `TransferenciasIngresosSection`, `gastosCalculations`), **7 editados** (`/agregar`, `subscribeGastos`, `useGastos`, `FilaGasto`, `subscribeIngresos`, `useIngresos`, `/ingresos`); **`origenCompra`, reglas de `transferencias` e índices sin cambios**. `subscribeGastos` sin query de transferencias (`totalQueries = 1 + n`); `subscribeIngresos` con una sola query; `totalGastos`/`totalIngresos` ya no incluyen transferencias (I-1). Gates: reglas **71/71**, `test:gastos` **8/8**, harness **57/57**, lint 4/0, build OK; greps 0 restos (3 coincidencias de prosa en Reintegros). **Verificación funcional local aprobada por el usuario** (totales idénticos con 0 transferencias, I-1 con el fixture, `/agregar` sin Transferencia, sin conteo en `/gastos`/`/ingresos`). Gate read-only del proyecto real **no ejecutable** (sesión CLI vencida) → `REQUIERE_VALIDACIÓN_FIRESTORE` para el conteo de `transferencias`. **Con esto el núcleo de la Etapa 4 queda completo.** Siguiente: **cierre de la Etapa 4** (push a Staging, verificación diferida de 4.5-fecha, deploy de reglas `gastos`/`ingresos` + BLOQUE B y promoción a `main`), con aprobaciones separadas. Evidencia: `docs/evidencia/EVIDENCIA-4.5.md`.
- Este handoff (fase de planificación, 15/10/2026) no autorizó por sí mismo código, dependencias, escrituras en Firestore, despliegues de reglas, commits ni push: cada subetapa se autorizó y cerró por separado.
- **Documentación esperada de la etapa (tipos y nombres):** `docs/handoffs/HANDOFF-ETAPA-4.md` (1) · `docs/propuestas/PROPUESTA-ETAPA-4.md` (1) · `docs/evidencia/EVIDENCIA-<subetapa>.md` por cada subetapa de la secuencia aprobada (4.0, 4.1, 4.2, 4.3, 4.3-bis, 4.4, 4.4-bis, **4.5-fecha**, 4.5). Sin REPORT de etapa (definición canónica en `AGENTS.md` §Tipos de documento).

## 1. Flujo de planificación y responsabilidades (aprobado 15/10/2026)

1. Personal System (Organizador) coordina las decisiones y prepara este `HANDOFF-ETAPA-4.md`.
2. El handoff se entrega al OpenCode de AppFinanciera.
3. Ese OpenCode analiza el handoff contra el diseño aprobado y el código existente, identifica inconsistencias y prepara el **plan técnico detallado** (`PROPUESTA-ETAPA-4.md`). **No implementa todavía.**
4. Revisión conjunta del plan; resolución de discrepancias.
5. El usuario **autoriza explícitamente** el plan de la subetapa 4.0.
6. Solo entonces comienza la implementación autorizada, con Local → Staging → Producción y sus aprobaciones.

El Organizador controla los estados y registra las decisiones; el OpenCode de AppFinanciera analiza y ejecuta el trabajo técnico autorizado.

## 2. Decisiones de la Ronda 1 — estructura (aprobadas; no reabrir)

- **R1-1 Orden:** `4.0 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5`, con 4.5 (retiro de Transferencias) al final del núcleo; **4.6 ELIMINADA (17/10/2026)** — el núcleo termina en 4.5 (enmienda y detalle en §4). Secuencia completa en §4.
- **R1-2 Alcance:** incluidas **4.3-bis** (eliminar/condonar) y **4.4-bis** (bitácora); sus detalles y criterios se definen en sus subetapas.
- **R1-3 Fuera del alcance inicial:** BottomNav y vinculación `gastoVinculadoId`. No se revoca PO-4 ni ninguna decisión funcional ya tomada.
- **R1-4 Herramientas de pruebas:** solo análisis y propuesta, sin instalar (ver D-1).
- **R1-5 Flujo de 6 pasos:** §1.

## 3. Decisiones de la Ronda 2 — técnicas de principio (aprobadas 15/10/2026; no reabrir)

| ID | Decisión | Alcance y límite |
|---|---|---|
| **D-1** | Herramientas: **Emulator Suite + `@firebase/rules-unit-testing` + un único runner** | **Sin instalar aún.** Configuración fina del runner ajustable por el plan con justificación. Aislamiento: pruebas solo contra emulador local (projectId `demo-*`, scripts vía `emulators:exec`); nada automatizado toca `finanzas-app-1c5f6` |
| **D-2** | Criterios del gate §8.5 (3.7, 3.11–3.15 incl.) | Aprobados **como objetivo de seguridad**, sujetos a revisión de las reglas exactas y sus dependencias en el plan técnico de 4.0 |
| **D-3** | Bitácora: subcolección `reintegros/{id}/eventos`, **create-only desde la aplicación**, sin edición ni borrado de eventos; tipos `creacion\|edicion\|eliminacion\|condonacion` × obligación/entrega | Reglas create-only dentro de 4.0; schema exacto del evento → plan de 4.4-bis |
| **D-4** | Constancias: **B — objetos embebidos** `condonacion: {…}` y `eliminacion: {…}` | Pago total sigue derivado (sin flag almacenado); nombres de campo → plan |
| **D-5** | Exclusión de eliminados: **campo ausente = activo**, filtro en cliente; fuera de listas y cálculos | Sin migraciones (colección nueva); R-2/T-2/T-3 sin cambio |
| **D-6** | Atomicidad: principio propuesto — transacciones con re-lectura, escritor único sobre `devuelto`, acople en reglas | El plan **debe demostrar** cómo transacciones + reglas mantienen `devuelto == Σ entregas no eliminadas`; **no asumir** que la transacción por sí sola garantiza la igualdad (T-1). Divergencia = bug report, nunca corrección silenciosa |
| **D-7** | Reconciliación: **prueba automatizada como criterio de done de 4.1 y 4.3** | Chequeo runtime opcional, a criterio del plan técnico |
| **D-8** | Matriz: **E1** (eliminar obligación: solo registrador) + **C1** (condonar: solo el acreedor según su vista; externo: solo registrador) + **(ii)** (editar: campos no financieros siempre, `monto` bloqueado con `devuelto > 0`; solo registrador) | Alimenta `firestore.rules` de 4.0 y la subetapa 4.3-bis |
| **D-9** | Congelaciones: principio aprobado — condonada → solo lectura + «Eliminar»; entregas congeladas; eliminada → inmutable | **CASO ABIERTO para el plan:** «pago recibido después de la condonación». **No** se aprueba por anticipado «eliminar y re-registrar»: debe comprobarse su compatibilidad con E1, C1 y la trazabilidad |
| **D-10** | Labels: acción **«Condonar»**; estado visible **«Condonada»** (variante aprobada del sello «Condonda» de §4.4 — aplica «Condonada») | UI de 4.3-bis |
| **D-11a** | Nueva subetapa **4.6 — Confirmación bilateral**, posterior a 4.5; **amplía el alcance inicial** porque PO-4 está decidida para la primera versión | BottomNav y vinculación de gastos siguen fuera de la Etapa 4 — **SUPERADA 17/10/2026: sin confirmación bilateral; 4.6 ELIMINADA (§4)** |
| **D-11b** | Guardrails PO-4: (1) la contraparte **ve** la obligación pendiente de confirmación; (2) **no se registran entregas** antes de confirmar; (3) el registrador **puede editar/eliminar** antes de confirmar; después rige la matriz D-8 | Estados, consultas, labels definitivos, reglas exactas y alternativa de confirmación tácita → plan técnico de 4.6 — **SIN OBJETO 17/10/2026**; los permisos que dejaba en pausa (pagos, editar monto, condonar, eliminar) quedan **confirmados** en `PROPUESTA-ETAPA-4.md` §11 fila 11 |

> **Separación obligatoria:** funcionales ya decididas (PO/DC) · principios técnicos aprobados (esta tabla) · detalles que valida el plan técnico (§5). Ninguna de las tres se mezcla ni se reabre.

> **Nota de nomenclatura (discrepancia documentada, 15/10/2026):** los identificadores **D-1…D-11 de este documento** son decisiones de la **Ronda 2 de planificación de la Etapa 4 (15/10/2026)**. **No** deben confundirse con los **D-1…D-8 de `PROPUESTA-ETAPA-3.md` §1.4** (decisiones funcionales incorporadas del HANDOFF §3), que comparten la misma sigla con otro significado. En caso de citar ambos documentos, cualquiera de los dos nombres debe ir acompañado de su fuente.

## 4. Secuencia de subetapas y mapa de pendientes

Secuencia aprobada por el usuario (15/10/2026):

**`4.0 → 4.1 → 4.2 → 4.3 → 4.3-bis → 4.4 → 4.4-bis → 4.5-fecha → 4.5`** *(enmiendas: 17/10/2026 **4.6 ELIMINADA** — era la última; 03/11/2026 se intercala **4.5-fecha** antes de 4.5; **sin renumeración**)* · **4.5 CERRADA 03/11/2026: núcleo de la Etapa 4 completo**

— intercala las bis tras su subetapa base para que **4.5 corra con el módulo completo** (criterio §14). **4.6, que iba al final (D-11a), fue eliminada el 17/10/2026** — sin confirmación bilateral, su núcleo quedó sin objeto (ver párrafo debajo de la tabla y `PROPUESTA-ETAPA-4.md` §11). El plan técnico **puede justificar un reordenamiento** (con su racional y sujeto a aprobación), pero **no puede modificar silenciosamente el alcance aprobado**.

| # | Subetapa | Pendientes que resuelve (decisión) |
|---|---|---|
| **4.0** | Gate de seguridad Firestore (G-Seg) | P-8 (D-2), reglas de P-1 (D-3), reglas de P-5 (D-8), herramientas (D-1) |
| **4.1** | Modelo y servicios | P-3 (D-4), P-4 (D-5), principio P-2 (D-6), P-9 (D-7); usa P-1 (D-3) |
| **4.2** | Alta de generación | — (PO-6/DC-5, PO-8, DC-4 ya decididos) |
| **4.3** | Devoluciones y consulta | verificación P-2/P-9 (D-6/D-7); corrección de entregas (PO-7) |
| **4.3-bis** | Eliminar/condonar | P-5 (D-8), P-6 (D-9 + caso abierto), P-7 (D-10), P-3 aplica (D-4) |
| **4.4** | Resumen mensual y agrupaciones | — (PO-1, PO-8 A+, DC-1 ya decididos) |
| **4.4-bis** | Bitácora | detalle P-1 (D-3) |
| **4.5-fecha** | Fecha del gasto **y del ingreso** diario (previa a 4.5) — **CERRADA 03/11/2026** | Fix operativo aprobado 03/11/2026: período derivado de `fecha` (fallback `createdAt`), `createdAt` como auditoría, edit/delete de ingresos; contrato de fecha para 5.1 |
| **4.5** | Retiro de Transferencias — **CERRADA 03/11/2026** | 6 condiciones de §7.4 cumplidas |
| **4.6** | ~~Confirmación bilateral (PO-4)~~ **ELIMINADA 17/10/2026** | Sin confirmación (decisión 17/10/2026): los vacíos de PO-4 quedan resueltos en `PROPUESTA-ETAPA-4.md` §11 (filas 7–11) |

> **Actualización 17/10/2026 (4.2 aprobada con ajustes):** UX de 4.2 (selector único «¿Con quién?», `movimientoInicial` derivado con casilla «Me entró dinero», `/reintegros` con balance Préstamos/Deudas, pestañas, acordeones y «Dinero del mes», botón «Reintentar», emulador local exclusivo + siembra + Emulator UI :4000). **Decisión de fondo: NO hay confirmación bilateral** (supersede PO-4 y D-11a/D-11b): la UI de 4.2 quita «Sin confirmar», las obligaciones de miembro **suman en el balance de ambas partes** y **4.6 queda ELIMINADA** (la secuencia termina en 4.5). Los cambios de reglas/helpers derivados (guarda de entregas, rama (g), H-c → moot, `confirmadaPor` prohibido en el alta, `SIN_CONFIRMAR` retirado de `submitDevolucion`) están **APLICADOS 17/10/2026** (diff y tests aprobados por el usuario; commit `5264d2e`; gates 20/20 y 44/44; las reglas que se desplieguen a Producción serán las posteriores a ese lote). Permisos (pagos, monto, condonar, eliminar) confirmados: `PROPUESTA-ETAPA-4.md` §11 fila 11. Fuente operativa: `docs/evidencia/EVIDENCIA-4.2.md` §9.

P-1…P-9 y los vacíos de PO-4: todos con decisión de principio; ninguno inventado, ninguno reabierto.

**Nota verificada sobre 4.6:** el «patrón de fijos» que §5.3 cita como referencia de UX de la confirmación **no existe como mecanismo en el código** (ni §11.1 describe una confirmación bilateral en fijos; `useFixedExpenses.js` solo tiene diálogos locales «Confirmar pago»/borrado). El diseño de 4.6 habría sido **nuevo, no una copia** *(sin objeto desde la eliminación del 17/10/2026)*.

## 5. Entregable esperado: `docs/propuestas/PROPUESTA-ETAPA-4.md` — producido y aprobado el 16/10/2026; la designación prevista `PLAN-ETAPA-4.md` no se usó

**Fuentes obligatorias:** `PROPUESTA-ETAPA-3.md` (§3, §3.2, §3.6, §4, §5.3, §7, §8.5, §12.6, §14) · código `AppFinanciera/` (solo lectura) · `HANDOFF-ETAPA-3.md` · `AGENTS.md` y `ROADMAP.md` del repo.

El plan debe contener, como mínimo:

1. Desglose por subetapa (4.0…4.6, incl. bis): alcance, archivos con ruta exacta a crear/modificar/eliminar, dependencias, criterios de done verificables, pruebas/harness y evidencia esperada.
2. `firestore.rules` propuesto — **copia exacta** de las reglas vigentes en consola + colecciones nuevas (`reintegros`, `reintegro_devoluciones`, `eventos`) —, expresiones que satisfacen D-2, D-3, D-6 y D-8, y el plan de verificación de equivalencia repo↔consola (hash/diff).
3. **Demostración exigida por D-6:** cómo transacciones + reglas mantienen la invariante, y qué la verifica (D-7). Sin afirmaciones no demostradas.
4. Resolución del **caso abierto D-9** (pago posterior a condonación) con análisis de compatibilidad E1/C1/trazabilidad; sin asumir «eliminar y re-registrar».
5. ~~Diseño detallado de **4.6** (estados, queries, UI, reglas, alternativa de confirmación tácita) para su aprobación en su momento.~~ **SIN OBJETO: 4.6 ELIMINADA el 17/10/2026 (§4).**
6. Propuesta de herramientas conforme **D-1** (qué, configuración, mantenimiento, aislamiento); verificar Java local ~~y la inexistencia actual de `firebase.json`/`firestore.rules`~~ → **SUPERADO: `firebase.json`, `firestore.rules` y `firestore.indexes.json` versionados en el repo desde 4.0 (`ff47291`)**.
7. Inconsistencias diseño↔código con evidencia `archivo:línea` (o «ninguna encontrada» explícito).
8. Riesgos: ~~R-4 durante la ventana sin confirmación (entre 4.3 y 4.6)~~ **SIN OBJETO (4.6 eliminada 17/10/2026)**; R-6 (escrituras `addDoc` sin timeout) y Staging/Producción comparten proyecto Firebase — **vigentes**.
9. Nada de implementación: este paso es solo plan.

## 6. Restricciones obligatorias para el destinatario

- Modo de trabajo: **análisis y planificación; no implementación.** `AppFinanciera/` intacto: sin editar código, `package.json`, configuración ni pruebas; sin refactors.
- Sin escrituras en Firestore; solo lectura durante la investigación.
- Sin instalación de dependencias; sin ejecutar deploys ni operaciones en Firebase.
- Sin commits ni push durante la producción del plan; el commit de `PROPUESTA-ETAPA-4.md` se autoriza en la revisión (paso 4).
- Toda divergencia entre diseño y código real se **documenta**, no se corrige.
- La implementación respetará Local → Staging → Producción → Verificación con aprobaciones; 4.0 requiere aprobación explícita y separada.

## 7. Criterio de finalización de esta fase de planificación

`PROPUESTA-ETAPA-4.md` producida con todo lo de §5 y entregada para revisión (paso 4). Solo tras resolver discrepancias y aprobar explícitamente el plan de 4.0 (paso 5) se habilita cualquier implementación (paso 6).
