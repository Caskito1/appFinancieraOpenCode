# HANDOFF — Etapa 4: Implementación de Reintegros (AppFinanciera)

> Preparado por Personal System (coordinación) — 15/10/2026.
> Documento de traspaso para el OpenCode de AppFinanciera. **Solo planificación: no implementa nada.**
> Resultado esperado: `PLAN-ETAPA-4.md` en la raíz del repo de AppFinanciera.
> La entrega de este HANDOFF al repo es una acción posterior, no automática (revisión del usuario previa).

## 0. Estado de coordinación (15/10/2026)

- **Etapa 3 CERRADA (15/10/2026):** `PROPUESTA-ETAPA-3.md` aprobada (`e665e3d`); PO-1…PO-8 y DC-1…DC-8 incorporadas; P-1…P-9 y vacíos de PO-4 abiertos.
- **Etapa 4 EN PLANIFICACIÓN:** Ronda 1 (estructura) y Ronda 2 (decisiones técnicas de principio) aprobadas por el usuario el 15/10/2026. Este handoff las transporta.
- **Implementación NO autorizada:** ninguna subetapa está aprobada; la subetapa 4.0 requiere aprobación explícita del usuario (paso 5, §1).
- Este documento no autoriza: código, dependencias, escrituras en Firestore, despliegues de reglas, commits ni push.

## 1. Flujo de planificación y responsabilidades (aprobado 15/10/2026)

1. Personal System (Organizador) coordina las decisiones y prepara este `HANDOFF-ETAPA-4.md`.
2. El handoff se entrega al OpenCode de AppFinanciera.
3. Ese OpenCode analiza el handoff contra el diseño aprobado y el código existente, identifica inconsistencias y prepara el **plan técnico detallado** (`PLAN-ETAPA-4.md`). **No implementa todavía.**
4. Revisión conjunta del plan; resolución de discrepancias.
5. El usuario **autoriza explícitamente** el plan de la subetapa 4.0.
6. Solo entonces comienza la implementación autorizada, con Local → Staging → Producción y sus aprobaciones.

El Organizador controla los estados y registra las decisiones; el OpenCode de AppFinanciera analiza y ejecuta el trabajo técnico autorizado.

## 2. Decisiones de la Ronda 1 — estructura (aprobadas; no reabrir)

- **R1-1 Orden:** `4.0 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5`, con 4.5 (retiro de Transferencias) al final del núcleo; **4.6 posterior a 4.5** (D-11a). Secuencia completa en §4.
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
| **D-11a** | Nueva subetapa **4.6 — Confirmación bilateral**, posterior a 4.5; **amplía el alcance inicial** porque PO-4 está decidida para la primera versión | BottomNav y vinculación de gastos siguen fuera de la Etapa 4 |
| **D-11b** | Guardrails PO-4: (1) la contraparte **ve** la obligación pendiente de confirmación; (2) **no se registran entregas** antes de confirmar; (3) el registrador **puede editar/eliminar** antes de confirmar; después rige la matriz D-8 | Estados, consultas, labels definitivos, reglas exactas y alternativa de confirmación tácita → plan técnico de 4.6 |

> **Separación obligatoria:** funcionales ya decididas (PO/DC) · principios técnicos aprobados (esta tabla) · detalles que valida el plan técnico (§5). Ninguna de las tres se mezcla ni se reabre.

> **Nota de nomenclatura (discrepancia documentada, 15/10/2026):** los identificadores **D-1…D-11 de este documento** son decisiones de la **Ronda 2 de planificación de la Etapa 4 (15/10/2026)**. **No** deben confundirse con los **D-1…D-8 de `PROPUESTA-ETAPA-3.md` §1.4** (decisiones funcionales incorporadas del HANDOFF §3), que comparten la misma sigla con otro significado. En caso de citar ambos documentos, cualquiera de los dos nombres debe ir acompañado de su fuente.

## 4. Secuencia de subetapas y mapa de pendientes

Secuencia aprobada por el usuario (15/10/2026):

**`4.0 → 4.1 → 4.2 → 4.3 → 4.3-bis → 4.4 → 4.4-bis → 4.5 → 4.6`**

— intercala las bis tras su subetapa base para que **4.5 corra con el módulo completo** (criterio §14) y **4.6 quede al final** (D-11a). El plan técnico **puede justificar un reordenamiento** (con su racional y sujeto a aprobación), pero **no puede modificar silenciosamente el alcance aprobado**.

| # | Subetapa | Pendientes que resuelve (decisión) |
|---|---|---|
| **4.0** | Gate de seguridad Firestore (G-Seg) | P-8 (D-2), reglas de P-1 (D-3), reglas de P-5 (D-8), herramientas (D-1) |
| **4.1** | Modelo y servicios | P-3 (D-4), P-4 (D-5), principio P-2 (D-6), P-9 (D-7); usa P-1 (D-3) |
| **4.2** | Alta de generación | — (PO-6/DC-5, PO-8, DC-4 ya decididos) |
| **4.3** | Devoluciones y consulta | verificación P-2/P-9 (D-6/D-7); corrección de entregas (PO-7) |
| **4.3-bis** | Eliminar/condonar | P-5 (D-8), P-6 (D-9 + caso abierto), P-7 (D-10), P-3 aplica (D-4) |
| **4.4** | Resumen mensual y agrupaciones | — (PO-1, PO-8 A+, DC-1 ya decididos) |
| **4.4-bis** | Bitácora | detalle P-1 (D-3) |
| **4.5** | Retiro de Transferencias | 6 condiciones de §7.4 (ya fijadas) |
| **4.6** | Confirmación bilateral (PO-4) | vacíos de PO-4 (D-11a, D-11b + diseño detallado) |

P-1…P-9 y los vacíos de PO-4: todos con decisión de principio; ninguno inventado, ninguno reabierto.

**Nota verificada sobre 4.6:** el «patrón de fijos» que §5.3 cita como referencia de UX de la confirmación **no existe como mecanismo en el código** (ni §11.1 describe una confirmación bilateral en fijos; `useFixedExpenses.js` solo tiene diálogos locales «Confirmar pago»/borrado). El diseño de 4.6 será **nuevo, no una copia**.

## 5. Entregable esperado: `PLAN-ETAPA-4.md` (raíz del repo)

**Fuentes obligatorias:** `PROPUESTA-ETAPA-3.md` (§3, §3.2, §3.6, §4, §5.3, §7, §8.5, §12.6, §14) · código `AppFinanciera/` (solo lectura) · `HANDOFF-ETAPA-3.md` · `AGENTS.md` y `ROADMAP.md` del repo.

El plan debe contener, como mínimo:

1. Desglose por subetapa (4.0…4.6, incl. bis): alcance, archivos con ruta exacta a crear/modificar/eliminar, dependencias, criterios de done verificables, pruebas/harness y evidencia esperada.
2. `firestore.rules` propuesto — **copia exacta** de las reglas vigentes en consola + colecciones nuevas (`reintegros`, `reintegro_devoluciones`, `eventos`) —, expresiones que satisfacen D-2, D-3, D-6 y D-8, y el plan de verificación de equivalencia repo↔consola (hash/diff).
3. **Demostración exigida por D-6:** cómo transacciones + reglas mantienen la invariante, y qué la verifica (D-7). Sin afirmaciones no demostradas.
4. Resolución del **caso abierto D-9** (pago posterior a condonación) con análisis de compatibilidad E1/C1/trazabilidad; sin asumir «eliminar y re-registrar».
5. Diseño detallado de **4.6** (estados, queries, UI, reglas, alternativa de confirmación tácita) para su aprobación en su momento.
6. Propuesta de herramientas conforme **D-1** (qué, configuración, mantenimiento, aislamiento); verificar Java local y la inexistencia actual de `firebase.json`/`firestore.rules`.
7. Inconsistencias diseño↔código con evidencia `archivo:línea` (o «ninguna encontrada» explícito).
8. Riesgos: R-4 durante la ventana sin confirmación (entre 4.3 y 4.6), R-6 (escrituras `addDoc` sin timeout), Staging y Producción comparten proyecto Firebase.
9. Nada de implementación: este paso es solo plan.

## 6. Restricciones obligatorias para el destinatario

- Modo de trabajo: **análisis y planificación; no implementación.** `AppFinanciera/` intacto: sin editar código, `package.json`, configuración ni pruebas; sin refactors.
- Sin escrituras en Firestore; solo lectura durante la investigación.
- Sin instalación de dependencias; sin ejecutar deploys ni operaciones en Firebase.
- Sin commits ni push durante la producción del plan; el commit de `PLAN-ETAPA-4.md` se autoriza en la revisión (paso 4).
- Toda divergencia entre diseño y código real se **documenta**, no se corrige.
- La implementación respetará Local → Staging → Producción → Verificación con aprobaciones; 4.0 requiere aprobación explícita y separada.

## 7. Criterio de finalización de esta fase de planificación

`PLAN-ETAPA-4.md` producida con todo lo de §5 y entregada para revisión (paso 4). Solo tras resolver discrepancias y aprobar explícitamente el plan de 4.0 (paso 5) se habilita cualquier implementación (paso 6).
