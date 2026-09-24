# HANDOFF — Etapa 1: Base estructural (AppFinanciera)

**Repo objetivo:** `~/Desktop/Proyectos Personales/opencode-AppFinanciera` (la app vive en el repo anidado `AppFinanciera/`)
**Remitente:** Organizador Personal (`personal-system`) — planifica y coordina.
**Recipiente:** OpenCode del repo de AppFinanciera.

## Contexto

- **Etapa 0 CERRADA y revisada** por el Organizador (24/09/2026). Contexto interno construido y pusheado (`d0c6fec`); `personal-system` sincronizado.
- Evidencias en el repo: `REPORT-02.md` (auditoría, base de partida), `REPORT-ETAPA-0.md` (relevamiento completo + hallazgos clasificados + `REQUIERE_VALIDACIÓN_FIRESTORE`).
- Contexto disponible: `context/MAPA-APPFINANCIERA.md`, `context/dominio.md`, `context/arquitectura.md`, `AGENTS.md` (delgado), `ROADMAP.md` (etapas 0–4), agentes `auditor` (read-only → `REPORT-*.md`) y `planificador` (read-only → `PROPUESTA-<etapa>.md`).
- **NUEVO (decidido por el usuario): acceso a Firestore estrictamente READ-ONLY autorizado para la Etapa 1.** Condiciones en la sección **Firestore**.

## Objetivo

Producir la **propuesta de BASE ESTRUCTURAL** del modelo de datos (diseño/análisis) que sostenga el mínimo funcional de Finanzas. **La Etapa 1 es de diseño y estructura: NO implementa funcionalidades.** Entregable: `PROPUESTA-ETAPA-1.md`.

## Alcance de la propuesta

Con la evidencia de la Etapa 0 y las validaciones Firestore read-only:

1. **Modelo de datos propuesto por colección** (esquemas documento, campos, justificación), distinguiendo: estructural ahora / habilitante de Etapa 3 / futuro Etapa 4.
   - `gastos` (personales y compartidos diarios): mantener "diario compartido ≠ deuda".
   - `fixed_expenses` + `fixed_expense_entries`: **posicionarse sobre el doble esquema** (config activa `{expenseId,usuario,montoDefault,activo}` vs legacy `{nombre,compartido,monto,balanceado,...}`) y proponer el esquema único recomendado, **sin ejecutar migraciones**.
   - `grupos`/`users`: modelo de **relaciones usuarios/grupos** y validación de `groups.members` (refs reales).
   - `transferencias` (legacy): proponer una **posición** (conservar como legacy / migrar lectura / retirar) como insumo de la decisión del usuario. No decidir por él.
   - `productos`/catálogos: estructura del catálogo y coexistencia con las taxonomías (incl. "Otros" presente).
2. **Modelo de recuperaciones/reintegros** (concepto, estados, colección propuesta) **lista para Etapa 3**, cumpliendo la regla **reintegro/recuperación ≠ ingreso** y reutilizable por el futuro módulo de tarjeta. El nombre técnico definitivo es decisión del usuario; la propuesta propone uno.
3. **Porcentajes configurables (Decisión 7):** el modelo de participantes/división de fijos compartidos **no limitado a 50/50 ni a 2 participantes** (modelo flexible, interfaz sencilla que puede seguir mostrando 50/50).
4. **Compatibilidad con tarjeta futura (Decisión 5):** el modelo de recuperaciones debe poder usarse desde el módulo de tarjeta.
5. **Dependencias entre etapas:** listar qué correcciones/decisiones de Etapa 2 y funcionalidades de Etapa 3 quedan **habilitadas o bloqueadas** por estas decisiones estructurales (pregunta abierta §8.2 del REPORT).
6. **`Otros` (Decisión 6):** presente y funcional en el modelo.

## Firestore (condición READ-ONLY)

- **Autorizado:** acceso de **lectura** para el relevamiento del diseño. Se pueden ejecutar consultas/queries read-only (incl. conteos e inspección de campos y muestras).
- **Prohibido:** cualquier **escritura** (add/set/update/delete, batch), migraciones, copias, sanitización, creación/modificación de índices, cambios de reglas, ni acceso de administración/consola. Estrictamente lectura.
- **Validaciones prioritarias (lo que condiciona la base estructural):**
  1. **Índices compuestos / query patterns** — verificar por prueba de lectura si las queries actuales (`ingresos`, `gastos`, `transferencias`, `fixed_expense_entries`) fallarían por índice faltante. NO crear índices.
  2. **`fixed_expenses` real** — proporción config activa vs esquema legacy y existencia de docs híbridos (hallazgo P8).
  3. **`users`/`groups`** — campos reales y validez de `groups.members` como refs.
  4. **`productos`** — si existe la colección y con qué estructura (cuando corresponda).
- **Diferidos (validación posterior, Etapa 2/3):** `ingresos` subtipo (P4), datos de `transferencias`, `createdAt`/zona. Se marcan como **posteriores salvo que el diseño de Etapa 1 los necesite** para cerrarse; en ese caso se consultan read-only y se justifica.
- **Registro de evidencia:** todo lo validado en Firestore se documenta en `PROPUESTA-ETAPA-1.md` (colección, tipo de consulta, conteo/campos, conclusión). Lo que no se pudo validar se reporta con causa y como **"no validable"** si requirió permisos adicionales; en ese caso no se busca una alternativa invasiva.
- **Hallazgo de Firestore:** no se convierte automáticamente en cambio de contexto; solo si aporta conocimiento estructural real, con justificación.

## Restricciones (read-only sobre la aplicación)

**NO modificar:** lógica de negocio, componentes, páginas, datos, Firestore, producción, staging, historial, ni datos históricos.

**SÍ se puede construir/modificar (parte de la etapa):**
- `PROPUESTA-ETAPA-1.md` (entregable, formato abajo).
- Actualización justificada de `context/` si el relevamiento Firestore agrega conocimiento estructural real.
- `ROADMAP.md` (registro del avance de la etapa).
- HANDOFF/REPORT propios de la etapa.

**La Etapa 1 no implementa ni toca la app.** El diseño aprobado se ejecutará recién en etapas posteriores, con orden explícita.

## Metodología

1. Leer en orden: `AGENTS.md` → `REPORT-02.md` → `REPORT-ETAPA-0.md` → `context/MAPA-APPFINANCIERA.md` → `context/dominio.md` → `context/arquitectura.md` → `ROADMAP.md` → este HANDOFF.
2. Ejecutar las validaciones Firestore read-only del alcance priorizado.
3. LEER → ANALIZAR → VALIDAR → DISEÑAR → PROPONER. Clasificar todo hallazgo (`#actual | #deseado | #problema | #propuesta`) + etapa futura.
4. No asumir soluciones antes del relevamiento; respetar las decisiones funcionales cerradas; cambio mínimo; no inventar datos financieros.

## Formato esperado (`PROPUESTA-ETAPA-1.md`)

1. Resumen ejecutivo de la base estructural.
2. Modelo de datos propuesto por colección (esquema, campos, por qué; distinguiendo estructural / Etapa 3 / Etapa 4).
3. Decisiones de estructura: fijos (esquema recomendado), compartidos diarios, balances, porcentajes configurables, relaciones grupos/usuarios, transferencias (posición propuesta), recuperaciones (modelo conceptual), tarjeta (requisitos), "Otros".
4. Validación Firestore read-only: consultas realizadas, confirmaciones, límites/no validable, hallazgos nuevos clasificados.
5. Dependencias entre etapas y próximos pasos habilitados.
6. Preguntas abiertas (solo las que requieran decisión humana y no puedan responderse con evidencia).
7. Lo NO implementado y reglas respetadas.
8. Estado del repo tras la etapa.

## Cierre

Entregar `PROPUESTA-ETAPA-1.md` y **quedarse a la espera**. El Organizador evalúa, el usuario decide, y recién entonces se ordena la ejecución (Etapa 2/3 u otra orden). **No continuar por cuenta propia.**