# Roadmap - AppFinanciera

Roadmap operativo de este repositorio, alineado a las etapas 0–4 definidas en `HANDOFF-ETAPA-0-MAPA-CONTEXTO.md`. Fuente global del sistema: `personal-system\context\finanzas.md` (sección *Roadmap financiero*). La fuente de decisión y estado está en el Vault de Obsidian.

## Objetivo

Alcanzar el **mínimo funcional** necesario para que Finanzas del Organizador pueda LEER → ANALIZAR → PROPONER con datos reales y validar el sistema. **NO es terminar la aplicación como producto.**

> El cierre de Finanzas no equivale al cierre de AppFinanciera. El objetivo actual es el mínimo funcional; el endpoint y la automatización no son el "final" de la aplicación: son una posible etapa posterior del sistema de integración.

## Etapas (0–4)

- **Etapa 0 — Relevamiento + contexto interno (realizada / en curso):** comprender AppFinanciera (código y comportamiento real) y construir el sistema de contexto persistente (`context/`, `AGENTS.md`, `.opencode/`, `ROADMAP.md`). Entregable: `REPORT-ETAPA-0.md`. **NO implementa funcionalidades.** (read-only sobre la aplicación)
- **Etapa 1 — Base estructural:** modelos de gastos, gastos compartidos, gastos fijos, balances, preparación para porcentajes configurables, relaciones usuarios/grupos, modelo de recuperaciones/reintegros, compatibilidad futura con tarjeta, otras decisiones estructurales. **Diseño/estructura.**
- **Etapa 2 — Correcciones y limpieza (en curso):** solo lo que la Etapa 0 justifique — código obsoleto, transferencias antiguas, código muerto, bugs (incluido freelance/bandas), taxonomías, `Otros`, robustez, schemas/types, inconsistencias. **2.1 (taxonomía de gastos fijos + "Otros") cerrada el 25/09/2026** (`b46b570`). **2.2 (totales del mes con gastos fijos) y 2.8 (header `Personal` cubierto / `Total registrado`) CERRADAS el 30/09/2026** (`119cc4a` + `66ba009`): criterio `esPagado = !!paidByUid || (pagoHasta > periodo)` y labels `Registrado · Pendiente de pago` / `Al día ✓`, **gate histórico PASS** (34 entries, 0 inconsistentes), build+lint OK, **prueba runtime 6/6 PASS**, **deployadas a Producción y verificadas con cuenta real** (el único fijo impago dejó de sumar en `Total` y `Total real`; el header muestra los dos valores). `main` == `staging` == Producción == `66ba009` (alineación del 30/09/2026, `PROPUESTA-2.2.md` §10). Ningún cambio de 2.2/2.8 queda pendiente. **En curso: 2.3** (ingresos: labels de bandas + sección "Otros"), plan en `PROPUESTA-2.3.md`: **gate read-only PASS** (30/09/2026, `idsLegacy = 0` ⇒ fix 100 % lado lectura, sin alias ni migración; 5 `laventolera`, 3 `laimbailable`, 1 `tapelao`, **5 `otros`**, 0 huérfanos). Implementada el 30/09/2026 en 5 archivos (+72/−28, solo bajo `app/ingresos/`), **build OK (9/9)** y **lint con 0 problemas nuevos** (2 errores + 3 warnings preexistentes, verificados contra `HEAD`). Validación **solo lectura** (decisión del usuario: no crear datos de prueba ⇒ **0 escrituras en Firestore**). Commit **`7d71fb5`**, **validada 8/8 en Local y PASS en Staging**, y **promovida a `main` por fast-forward limpio** (0 merges; deploy automático por integración Git de Vercel). **`origin/main` == `origin/staging` == `7d71fb5`** — alineación correcta, sin el incidente de desalineación de 2.2. **Falta solo la verificación funcional del usuario en Producción.**
- **Pendiente aprobado, no implementado — 2.7-GUARD (integridad de `groupId`):** `registrarGasto` (`app/gastos-fijos/hooks/useFixedExpenses.js:231`) escribe `groupId: esCompartido ? grupo?.id ?? null : null` **sin validar que exista grupo**; si `groups[0]` todavía no está cargado degrada a `null` y el entry queda atascado (nunca lo devuelve la query de compartidos, y `registrarPago` no puede cobrarlo). Además el `updateDoc` (`useFixedExpenses.js:238-246`) no incluye `groupId`, por lo que **no repara** un entry ya corrupto. **Problema preexistente, NO causado por 2.2.** Mejora propuesta: `if (esCompartido && !grupo?.id) return;` + incluir `groupId` en el update. **No implementar sin aprobación explícita.**
- **Pendiente registrado, NO implementado — ingresos sin CRUD (detectado 30/09/2026 en la revisión de 2.3):** el módulo de ingresos **no tiene flujo para editar ni para eliminar** un ingreso existente; solo el alta (`app/agregar/components/ingresos/helpers/submitIngreso.js`). No hay ningún `updateDoc`/`deleteDoc` sobre la colección `ingresos` en todo el código (el único `deleteDoc` de la app es de gastos, `app/gastos/hooks/useGastos.js:143`, y `/gastos` además tiene `EditarGastoModal.jsx`). **Consecuencia:** un ingreso mal cargado no se corrige desde la app, requiere intervención manual sobre Firestore. **Fuera del alcance de 2.3 por decisión explícita del usuario**; sin subetapa asignada. Detalle en `PROPUESTA-2.3.md` §9.1 y `context/dominio.md` §12.
- **Etapa 3 — Nuevas funcionalidades financieras:** dinero a recuperar, reintegros, adelantos, liquidación de saldos, personas externas, integración futura con tarjeta. **Regla fundamental: reintegro/recuperación ≠ ingreso.**
- **Etapa 4 — Evolución general del producto:** múltiples grupos, configuración por grupo, porcentajes configurables, configuración general, módulo de tarjeta, estadísticas, productos, UX, aplicación para terceros.

**No avanzar más allá de la etapa en curso sin orden explícita.** Cada etapa sigue: LEER → ANALIZAR → DISEÑAR → PROPONER → el usuario decide → planificar → el usuario aprueba → ejecutar.

## Decisiones funcionales cerradas (fuente: context/dominio.md)

1. `/gastos`: comportamiento actual como referencia deseada; `/gastos-fijos` = administrador. NO corregir divergencias sin decisión.
2. Gastos compartidos diarios: **no generan deuda ni balance**.
3. Gastos fijos compartidos: **sí generan balance**; el balance puede liquidarse pero **el historial permanece**.
4. Recuperaciones/reintegros: **no son ingreso real**; categoría conceptual propia.
5. Tarjeta: **módulo futuro**; el modelo de recuperaciones debe poder usarse desde ahí.
6. `Otros`: debe seguir existiendo y funcionando. **Restaurado en gastos fijos en 2.1** (personal `otros`, compartido `otros_compartido`).
7. Porcentajes de fijos compartidos: hoy 50/50; el modelo **no debe quedar limitado a 50/50** (modelo flexible, interfaz sencilla).
8. Firestore: **sin acceso por ahora** (solo lectura si se justifica).
9. Datos históricos: **no se modifican** en esta etapa.

## Metodología de trabajo

- Auditar antes de diseñar, diseñar antes de implementar.
- Cambio mínimo; no refactorizar innecesariamente.
- Hallazgos clasificados (`#actual | #deseado | #problema | #propuesta`) + etapa futura.
- Toda modificación sigue: **Local → Staging → Producción → Verificación**. No modificar producción directamente.
- Lo que requiera datos reales y no pueda resolverse con código se marca `REQUIERE_VALIDACIÓN_FIRESTORE`.

## Fuera de alcance de estas etapas

- Terminar todas las funcionalidades de la aplicación.
- Endpoint / API / automatización de transferencia de datos al Organizador.
- Integración automática con Obsidian/Planner.
- Etapas de automatización del roadmap financiero global.

La obtención de datos para Finanzas puede ser manual al inicio. Lo importante es que los datos existan, sean confiables y puedan ser utilizados por el Organizador.

## Después del mínimo funcional

1. Dejar Finanzas en **observación** durante un período real (~1 mes).
2. Acumular datos reales y generar los resúmenes financieros en Obsidian.
3. Revisar/analizar y comprobar que el modelo y los datos sirven.
4. Corregir únicamente si aparece un problema real.
5. Tras esa validación, decidir si se continúa con AppFinanciera o se avanza con otra parte del Organizador/proyectos.

## Backlog futuro de la aplicación (NO es trabajo aprobado)

Funcionalidades propias futuras (estadísticas de gastos, visualizaciones, mejoras de UX u otros módulos) son **ejemplos conceptuales**: quedan como backlog de la aplicación y se deciden posteriormente, sin incorporarlas al alcance de estas etapas salvo que sean necesarias para alcanzar el mínimo funcional.

## Histórico de cambios

- **30/09/2026 — Etapa 2 / 2.3 (PROMOVIDA A PRODUCCIÓN, falta verificación):** `ingresos` deja de tener ingresos contados pero invisibles: se agrega la sección `Otros` (con `empty`) y los `otros` entran en el conteo "N ingresos"; `BandasSection.jsx` muestra el label real de cada banda tomando `BANDAS` de `useModoIngreso` (los ids canónicos **no** cambian, el fix es 100 % lado lectura); `FilaIngreso` deja de imprimir el `detalle` dos veces (el `TIPO_LABEL` muerto fue eliminado). **Gate read-only PASS**: `idsLegacy = 0`, 0 subtipos sin label, 0 documentos sin `tipo`/`usuario`, 0 montos no numéricos, y 5 ingresos reales de tipo `otros`. **Causa raíz de "invisible":** `subscribeIngresos.js` no filtra por `tipo`, así que esos documentos ya sumaban en `totalIngresos`. Por eso **`totalIngresos` no se modificó** (`useIngresos.js:85-110` intacto). Validación **solo lectura**, sin crear datos de prueba: **0 escrituras en Firestore**. Commit `7d71fb5`: **validada 8/8 en Local** y **PASS en Staging**, luego **promovida a `main` por fast-forward limpio** (0 merges, deploy automático desde `main`). `origin/main` == `origin/staging` == `7d71fb5`; las cuatro subetapas (2.1/2.2/2.8/2.3) siguen en la historia lineal de `origin/main`. **Pendiente:** verificación funcional en Producción. **Nueva deuda registrada (no implementada):** ingresos sin edición ni borrado.
- **30/09/2026 — Etapa 2 / 2.2 y 2.8 (CERRADAS):** `119cc4a` (2.2) y `66ba009` (2.8) commiteados sobre `main` el 29/09/2026 ~18:07, pusheados y **deployados automáticamente a Producción** (integración Git de Vercel; no hay `vercel.json` ni CI en el repo). **Verificación en Producción PASS** (cuenta real): el único fijo real impago dejó de sumar en `Total` y en `Total real`, y `/gastos-fijos` muestra el bloque `Personal` con los dos valores. Se detectó y corrigió que **`staging` había quedado atrasada** en `b46b570` (corría 2.1 solamente) mientras `main` y Producción estaban en `66ba009`: alineación por **fast-forward puro** (`git merge --ff-only main`, 0 commits de merge, 5 archivos, +48/−5, **cero escrituras a Firestore**). Ahora `main == staging == Producción == 66ba009`. **Ninguna modificación ni redeploy de 2.2/2.8 queda pendiente.** Detalle en `PROPUESTA-2.2.md` §10.
- **25/09/2026 — Etapa 2 / 2.1 (cerrada):** taxonomía de gastos fijos unificada (`lib/fixedExpensesTaxonomia.js` como canónico) con **"Otros" en personales (`otros`) y compartidos (`otros_compartido`)**; `lib/temp.js` eliminado. Disney+ permanece **personal** (6.3). Validada en Local (build + 27 invariantes), Staging y Producción (funcional). Commit `b46b570`. Sin cambios en Firestore.
- **23/09/2026 — Etapa 0:** roadmap reescrito y alineado a las etapas 0–4 (antes estaba el esquema anterior "Stage 2/3/4"). El contexto técnico-funcional vive ahora en `context/` (`MAPA-APPFINANCIERA.md`, `dominio.md`, `arquitectura.md`). `REPORT-ETAPA-0.md` `REQUIERE_VALIDACIÓN_FIRESTORE` y hallazgos por revisar cuando se apruebe la Etapa 1.