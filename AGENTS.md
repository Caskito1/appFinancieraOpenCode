# AGENTS.md - AppFinanciera

Aplicación de finanzas personales (Next.js 16 + React 19 + Firebase). La aplicación vive en el repo anidado `AppFinanciera/` (repo git propio, ignorado por este repo padre).

## Cómo trabaja opencode en este repo

1. **Leer antes de trabajar**, según la tarea:
   - `context/MAPA-APPFINANCIERA.md` — puerta de entrada: módulos, páginas, colecciones, dónde está cada cosa.
   - `context/dominio.md` — modelo funcional y comportamiento de negocio (qué genera balance, qué es ingreso, recuperaciones, etc.).
   - `context/arquitectura.md` — detalle técnico (stack, firestore, servicios, hooks, patrones).
   - `ROADMAP.md` — etapas 0–4 y objetivo actual.
   - `docs/handoffs/HANDOFF-*.md` — el de la etapa en curso, como fuente de la tarea. Documentos de trabajo en `docs/`: `handoffs/` · `propuestas/` · `reportes/` · `evidencia/`.
2. Las **decisiones funcionales** documentadas en `context/dominio.md` son la fuente de contexto para cualquier modificación.
3. Los hallazgos se clasifican (`#actual | #deseado | #problema | #propuesta`) + etapa futura. No confundir "así funciona hoy" con "así debería funcionar".
4. **Estado de etapas (03/11/2026):** Etapa 0 CERRADA (ver histórico 23/09/2026) · **Etapa 1 CERRADA (25/09/2026, commit `78e1461`; cierre en `docs/handoffs/HANDOFF-ETAPA-2.md` y `docs/propuestas/PROPUESTA-ETAPA-1.md` — sin EVIDENCIA propia)** · Etapa 2 CERRADA (11/10/2026) · Etapa 3 CERRADA (diseño, 15/10/2026) · **Etapa 4 EN CURSO — Reintegros:** subetapas 4.0–4.4-bis cerradas · **4.3-bis CERRADA (25/10/2026, commits `1de79c8`/`f0a66af`/`beddcf3`)** con regla estricta de Cerradas y D-9 opción B retirada · **4.4-bis CERRADA (30/10/2026, commit `d2be899`)** — bitácora con esquema canónico (`context/dominio.md` §5.3). **4.5-fecha CERRADA (03/11/2026, commits `9d350d2`/`bbd3345`/`6c708ef`)**: `fecha` del gasto **y del ingreso** diario con fallback a `createdAt`, edit/delete de ingresos, reglas y verificación funcional local aprobada; contrato de fecha para la 5.1. **4.5 CERRADA (03/11/2026, commit `f4a1cd7`)** — retiro de Transferencias: **núcleo de la Etapa 4 completo**. **Pendiente: cierre de la Etapa 4** (push a Staging, verificación diferida de 4.5-fecha, deploy de reglas `gastos`/`ingresos` + BLOQUE B y promoción a `main`), con aprobaciones separadas. **4.4 diferida (absorbida por la Etapa 5)**. La promoción a `main` queda hasta el cierre de la Etapa 4 (antes del deploy: comparar las reglas con las desplegadas hoy). Detalle: `ROADMAP.md` (histórico) · secuencia: `docs/handoffs/HANDOFF-ETAPA-4.md` §4 · plan: `docs/propuestas/PROPUESTA-ETAPA-4.md` · evidencia: `docs/evidencia/EVIDENCIA-4.0.md` … `EVIDENCIA-4.4-bis.md` · `EVIDENCIA-4.5-fecha.md` · `EVIDENCIA-4.5.md`.

## Reglas

- Auditar antes de diseñar, diseñar antes de implementar.
- No refactorizar innecesariamente: buscar el cambio mínimo.
- No asumir estructura de datos: la propuesta sale de cómo funciona la app hoy.
- No implementar cambios sin aprobación explícita del usuario.
- No inventar datos financieros.
- No modificar `AppFinanciera/` fuera de una etapa aprobada; la Etapa 0 es read-only sobre la aplicación.
- Seguir el **flujo de ramas y despliegue** de la sección siguiente: nunca push directo a `main`; primero Staging y aprobación explícita antes de promover a Producción.
- Sin acceso a Firestore salvo decisión explícita del usuario (marcar lo que requiera datos reales como `REQUIERE_VALIDACIÓN_FIRESTORE`).

## Tipos de documento (normalizados 22/10/2026)

Definición canónica de los documentos de trabajo de este repo. Tanto quien escribe como quien audita (MANTENIMIENTO de personal-system) comparan contra esta tabla: patrón de nombre y ruta exactos, no interpretaciones.

| Tipo | Patrón de nombre | Ruta exacta | Cantidad | Autor | Inmutabilidad |
|---|---|---|---|---|---|
| HANDOFF | `HANDOFF-ETAPA-<N>.md` | `docs/handoffs/` | 1 por etapa | Organizador (personal-system) | §0 actualizable al cierre de subetapas; resto histórico inmutable |
| PROPUESTA | `PROPUESTA-ETAPA-<N>.md` | `docs/propuestas/` | 1 por etapa | OpenCode de AppFinanciera (planificador) | Inmutable tras aprobación; solo enmienda datada explícita |
| EVIDENCIA | `EVIDENCIA-<subetapa>.md` (p. ej. `EVIDENCIA-4.3-bis.md`) | `docs/evidencia/` | 1 por subetapa | OpenCode que implementó la subetapa | Se cierra en su sección de cierre; correcciones solo en el commit que las origina |
| REPORT | `REPORT-<tema>.md` | `docs/reportes/` | 1 por auditoría read-only (no forma parte del ciclo de etapa) | agente auditor | Inmutable |

Reglas:

- **Tipos no listados no se crean.** Si una etapa necesita un tipo nuevo, se registra aquí primero (en el mismo commit de su primer uso, con nota datada).
- El **cierre de etapa no genera REPORT**: el cierre documental es el checklist de la sección siguiente.
- Todo **HANDOFF de etapa nueva declara en §0** su «Documentación esperada (tipos y nombres)».
- **Excepciones de legado (no se replican):** `HANDOFF-02.md`, `REPORT-02.md`, `PROPUESTA-2.2.md`…`PROPUESTA-2.6.md` (una por subetapa, estilo previo), `CONTEXTO-ETAPA3.md` (histórico en `docs/reportes/`).

## Cierre de subetapas — checklist de documentación (aprobado 22/10/2026; enmienda 22/10/2026: evidencia en el repo padre)

Al cerrar cada subetapa, actualizar en la **misma sesión de cierre**:

1. `docs/evidencia/EVIDENCIA-<subetapa>.md` (repo padre) — sección de cierre + gates + commit; cita el hash del commit de código. Se commitea en el repo padre **inmediatamente después** del commit de código en `AppFinanciera/staging` (repos distintos ⇒ no puede ser el mismo commit).
2. `ROADMAP.md` §Histórico — entrada datada con commit (estilo de las existentes).
3. Solo si la subetapa tocó su materia: `context/dominio.md` · `context/arquitectura.md` · `context/MAPA-APPFINANCIERA.md`.
4. Solo si cambió estado global/reglas: `docs/handoffs/HANDOFF-<etapa>.md` §0 · `AGENTS.md`.

Reglas del checklist:

- **(a)** Si una decisión cambia después de documentarla, el doc se corrige **en el mismo commit que el código**.
- **(b)** Si se agrega o mueve un documento, se actualiza el índice de docs (lista 1 de §«Cómo trabaja» y `ROADMAP.md`).
- **(c)** Al cierre de cada etapa se refrescan los archivos del Proyecto en Claude: `AGENTS.md`, `ROADMAP.md`, `context/dominio.md`, el `HANDOFF` y la `PROPUESTA`/`EVIDENCIA` vigentes.
- **(d)** El cierre usa exclusivamente los tipos normalizados (§Tipos de documento); si apareció una excepción o tipo nuevo, quedó registrado en §Tipos de documento en esta misma sesión.
- No editar post-cierre `PROPUESTA-*`/`REPORT-*` (histórico inmutable), salvo acotación explícita.

## Flujo de ramas y despliegue (obligatorio para todo cambio de código)

Ramas (`AppFinanciera`, repo propio): **`main` = Producción** · **`staging` = pre-producción**.
Vercel (integración Git, sin `vercel.json` ni CI en el repo): **cada push a `main` despliega Producción automáticamente** y **`staging` genera deployments de Preview separados** — Production Branch = `main` y Preview de `staging` **verificados en el dashboard por el usuario (08/10/2026)**.
⚠️ **Staging y Producción comparten el mismo proyecto Firebase** (`finanzas-app-1c5f6`): probar en Staging valida código, no datos aislados.

Procedimiento para cada tarea de código (incluidas correcciones pequeñas):
1. Desarrollo y verificación en **Local** (build, lint, gates/harness según aplique).
2. **Commit sobre `staging` o rama de trabajo** — nunca push inicial a `main`.
3. `git push origin staging` y verificación de que el despliegue corresponde al commit.
4. Revisión funcional del usuario en Staging.
5. **Aprobación explícita** del usuario para promover (sin ella, no se promueve).
6. Promoción: `git push origin staging:main` solo si es fast-forward (`git merge-base --is-ancestor origin/staging origin/main`).
7. Verificación en Producción de que el deploy corresponde al commit promovido.
8. Detenerse: sin deploys, merges, commits ni operaciones fuera de la autorización vigente.

Reglas duras:
- **Prohibido `git push ...main` sin la aprobación del paso 5**: ese push es un deploy a Producción.
- Si el flujo real de ramas/Vercel no garantiza la separación (p. ej. `staging` sin Preview), **detenerse y proponer la corrección antes de publicar código**.
- Repo padre de documentación y repo de la aplicación permanecen separados: docs en el padre, código en `AppFinanciera/`.

## Pendientes conocidos (contexto)

- **Deuda del módulo de ingresos** (no son bugs resueltos; ninguna tiene subetapa asignada):
  - **CRUD incompleto:** no hay flujo para editar ni eliminar un ingreso existente, solo el alta (`app/agregar/components/ingresos/helpers/submitIngreso.js`). Un ingreso mal cargado no se corrige desde la app. Detalle en `docs/propuestas/PROPUESTA-2.3.md` §9.1 y `context/dominio.md` §3.4.
  - **Errores no manejados:** `subscribeIngresos.js` no maneja errores y solo emite cuando cargan ambas queries, así que una query fallida deja `/ingresos` en loading infinito. Fuera del alcance de 2.3. Detalle en `context/dominio.md` §3.4.
- Agregar productos faltantes.
- **Limitación conocida de Reintegros (aceptada en 4.3-bis, 24/10/2026):** un último pago erróneo que liquida una obligación no se puede corregir desde la app (Cerradas sin edición/eliminación y sin eliminar la obligación liquidada); camino previsto: re-registro estándar como obligación nueva. Detalle: `context/dominio.md` §5.2.
- **Escrituras sin timeout en Firestore (preexistente, hallada el 08/10/2026):** en modo offline el botón queda en "Guardando…" indefinidamente (la Promise de `addDoc`/`updateDoc` no resuelve) y el backdrop del modal cierra dejando la escritura en cola, que se commitea al reconectar. Fuera del alcance de 2.7 y de 2.4 (2.4 cerrada el 10/10/2026 sin este tema); queda como deuda pendiente de subetapa asignada.
- (Futuro) sección de balance/analytics.