# HANDOFF — Etapa 3: Diseño del modelo de Reintegros (AppFinanciera)

> Preparado por Personal System (coordinación) — 10/10/2026.
> Documento de traspaso para el OpenCode de AppFinanciera. **Solo diseño: no implementa nada.**
> Resultado esperado: `PROPUESTA-ETAPA-3.md` en el repo de AppFinanciera.
> La entrega de este HANDOFF al repo de AppFinanciera es una acción posterior, no automática.

## 0. Estado de coordinación (actualizado 11/10/2026)

- **Etapa 2 CERRADA el 11/10/2026** — las 9 subetapas cerradas (2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9). Últimos cierres: **2.5** (`3216095`, retiro del flujo legacy de gastos fijos) y **2.6** (`10ab576`, limpieza de código muerto), ambos verificados en Producción por el usuario. `main` == `staging` == Producción == **`10ab576`**.
- **2.5 y 2.6 cerradas**; no bloqueaban este diseño (decisión del 30/09/2026), y ahora la Etapa 2 no tiene subetapas abiertas.
- Etapas 3–4 no iniciadas. Este HANDOFF abre únicamente el **diseño**.
- **La Etapa 4 (implementación) requiere aprobación explícita y separada del usuario; no está autorizada por este documento.**

## 1. Contexto y división de responsabilidades

Personal System define el problema de negocio, las decisiones aprobadas y las restricciones. El OpenCode de AppFinanciera estudia el código y el modelo real, y produce el diseño técnico. El Organizador no conoce el detalle técnico; el repo no redefine decisiones de negocio.

## 2. Problema y objetivo

AppFinanciera debe representar **dinero adelantado y su recuperación**, en ambos sentidos (el usuario cobra o devuelve), sin que las devoluciones infleen ingresos ni los adelantos infleen gastos. Hoy ese caso de uso está mal representado por el flujo legacy de Transferencias (§5) y no existe el concepto de deuda/cobro pendiente (`context/dominio.md` §§5–7 y §12, decisión D4).

Regla rectora ya cerrada: **un reintegro no es un ingreso.**

## 3. Decisiones de negocio aprobadas (no reabrir)

### 3.1 Vocabulario
- **Reintegro**: nombre canónico de cada operación. **Reintegros**: nombre funcional de la sección y de la interfaz.
- El diseño puede proponer una convención técnica interna distinta si la justifica, pero debe conservar «Reintegros» como vocabulario de usuario.

### 3.2 Reglas financieras
- Un reintegro no es un ingreso.
- Una devolución **reduce** el saldo pendiente de la deuda correspondiente. Ejemplo: se adelantan $1.000 y se reciben $500 → quedan $500 por recuperar.
- Misma lógica en sentido inverso cuando el usuario debe devolver dinero a otra persona.
- Devoluciones recibidas o realizadas **no inflan** los totales de ingresos ni de gastos.
- El diseño define: qué operaciones generan saldo, cuáles lo reducen y cómo se liquida una deuda.
- Al liquidar, el balance vuelve a cero pero **el historial permanece** (mismo criterio ya cerrado para fijos compartidos).

### 3.3 Contrapartes y visibilidad
- El modelo contempla desde la primera versión: **pareja, miembros del grupo, amistades, familiares y personas externas**.
- Contrapartes **con usuario en la aplicación**: el diseño propone qué información ve cada usuario y cómo se respetan datos personales y permisos.
- Contrapartes **sin usuario**: el registro se administra y es visible únicamente para quien usa la app. No se presupone que un externo tenga cuenta ni creación automática de cuentas.

### 3.4 Alcance de la implementación futura (Etapa 4): modelo + UI mínima para uso real
1. Registrar un gasto extraordinario que genere dinero a recuperar o una deuda que el usuario deba devolver.
2. Registrar devoluciones parciales o completas.
3. Consultar saldos pendientes y liquidarlos.
4. Mostrar un **resumen mensual de Reintegros en el balance**, que evalúa como mínimo y por separado:
   - gastos u operaciones que generan dinero por recuperar;
   - devoluciones recibidas;
   - devoluciones realizadas;
   - saldos pendientes de cobro y de devolución.

El diseño puede proponer terminología de indicadores más clara, pero debe conservar estas distinciones contables.

### 3.5 Reglas generales vigentes que el modelo debe respetar
- Gasto diario compartido ≠ deuda; no convertir retroactivamente.
- Reintegro/recuperación ≠ ingreso.
- Separar: gastos personales, compartidos diarios, fijos personales, fijos compartidos, ingresos reales y, ahora, reintegros (`context/dominio.md` §10).

## 4. Evidencia de partida

Personal System leyó, al preparar este documento:
- `context/dominio.md` (§2 tipos de movimiento; §§5–7; §12 D4)
- `CONTEXTO-ETAPA3.md` (§7 gastos extraordinarios/dinero a recuperar; §9 transferencias actuales; §§15–16)
- `PROPUESTA-2.3.md` (§9 — "Etapa 3: `TransferenciasIngresosSection` y `totalIngresos` suma transferencias recibidas como ingreso"; §9.1 ingresos sin CRUD)
- `HANDOFF-ETAPA-2.md` (definiciones de 2.5 y 2.6) y `ROADMAP.md` (estado de subetapas)

Hechos documentados que sostienen el problema (el repo debe re-verificarlos sobre el código actual al diseñar):
- Reintegros no implementados; transferencias recibidas suman como ingreso (`useIngresos.js`) y las enviadas como gasto (`useGastos.js`).
- Alta de transferencias deshabilitada en la UI (`app/agregar/page.jsx`), lecturas de balance activas.

## 5. Transferencias legacy: decisión y límites

**Decisión aprobada:** el flujo funcional de Transferencias será **sustituido por Reintegros** dentro de la futura Etapa 4.

**Dato aportado por el usuario (no verificado técnicamente):** el flujo legacy nunca se utilizó formalmente en Producción. Tratarlo como afirmación a comprobar, no como hecho.

La propuesta deberá:
1. Localizar el botón, las pantallas, las funciones, el modelo de datos y las lecturas de balance asociadas a Transferencias.
2. Verificar si existen **registros reales y dependencias** (gate read-only Firestore, patrón ya usado en el proyecto) antes de recomendar borrar o migrar algo.
3. Explicar cómo evitar que el flujo antiguo infle los totales de ingresos o gastos.
4. Proponer el **retiro del acceso y del flujo** cuando se implemente Reintegros.
5. Recomendar qué hacer con código, registros y referencias, **diferenciando claramente cada caso**.
6. **No** dar por autorizada la eliminación de datos, la migración destructiva ni la modificación de registros históricos: todo caso de ese tipo requiere decisión y autorización explícitas adicionales.

## 6. Coordinación con 2.5 y 2.6 — ✅ RESUELTA (ambas cerradas el 11/10/2026)

**Resultado real (registrado el 11/10/2026):** la 2.5 y la 2.6 se ejecutaron **antes** del diseño, como esta sección preveía. La sugerencia de §6 (excluir `transferencias` del alcance de 2.6) **se siguió**: 2.6 limpió código muerto sin tocar el área de Transferencias. Además, por decisión explícita del usuario quedaron **conservados** y disponibles para este diseño:

- **`app/gastos/helpers/gastosCalculations.js`** — sin importadores, pero contiene balances de Transferencias (`calcularTotalIngresos`, `calcularNeto`); evaluación en la Etapa 3.
- **`origenCompra`** en `submitCompra.js:74` — escritura sin lectores en la app; posible uso externo no verificable sin Firestore.
- **`Transferenciassections.jsx`** — 0 importadores verificados, conservado por exclusión de área (Etapas 3/4).

El área Transferencias permanece **íntegra** (UI, consultas, balances). La verificación read-only de uso histórico sigue siendo paso previo obligatorio del diseño (§5).

## 7. Entregable esperado: `PROPUESTA-ETAPA-3.md` (repo AppFinanciera)

1. Problema y objetivos del modelo.
2. Evidencia consultada, con rutas y secciones exactas.
3. Modelo conceptual de entidades, relaciones, estados y saldos.
4. Reglas de negocio para gastos extraordinarios, adelantos, devoluciones parciales, devoluciones completas y liquidaciones.
5. Tratamiento de los casos en que el usuario debe cobrar y en que debe devolver.
6. Reglas de balance mensual y separación de ingresos, gastos y reintegros.
7. Tratamiento de Transferencias legacy: registros existentes y lecturas históricas (§5).
8. Contrapartes con y sin usuario: permisos y visibilidad.
9. Propuesta de UI mínima para uso real (los cuatro puntos de §3.4).
10. Cambios mínimos por archivo o módulo, con justificación; sin refactor general.
11. Interacciones con gastos fijos, gastos compartidos, pagos parciales y lo que el repo demuestre. *Adyacente y fuera de alcance salvo interacción real: deuda de CRUD de ingresos (`PROPUESTA-2.3.md` §9.1).*
12. Riesgos, casos límite, decisiones aún abiertas y alternativas cuando corresponda.
13. Criterios verificables de cierre del diseño.
14. Candidatos de subetapas para la implementación futura (Etapa 4), pequeños y verificables, con dependencias explícitas.
15. Recomendación fundamentada sobre cómo coordinar 2.5, 2.6 y la Etapa 4 (§6).

## 8. Restricciones obligatorias para el destinatario

- Modo de trabajo: **análisis y diseño; no implementación**.
- No editar código, reglas, configuración ni pruebas; no ejecutar refactors.
- No escribir ni modificar datos de Firestore; **solo lectura** durante la investigación.
- No migrar, borrar ni reescribir datos históricos.
- No implementar el modelo ni la UI; no retirar todavía el flujo de Transferencias.
- No hacer commit ni push.
- La futura implementación respetará Local → Staging → verificación → Producción con sus aprobaciones; la Etapa 4 requerirá aprobación explícita y separada del usuario.

## 9. Criterio de finalización del diseño

La Etapa 3 se da por cerrada cuando `PROPUESTA-ETAPA-3.md` esté producida y el usuario haya aprobado el diseño en la conversación de cierre (Organizador + usuario). Solo entonces se registrará el cierre en `context/AppFinanciera.md` y `context/finanzas.md`, y podrá planificarse la Etapa 4.
