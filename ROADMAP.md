# Roadmap - AppFinanciera

Roadmap operativo de este repositorio, alineado a las etapas 0–4 definidas en `HANDOFF-ETAPA-0-MAPA-CONTEXTO.md`. Fuente global del sistema: `personal-system\context\finanzas.md` (sección *Roadmap financiero*). La fuente de decisión y estado está en el Vault de Obsidian.

## Objetivo

Alcanzar el **mínimo funcional** necesario para que Finanzas del Organizador pueda LEER → ANALIZAR → PROPONER con datos reales y validar el sistema. **NO es terminar la aplicación como producto.**

> El cierre de Finanzas no equivale al cierre de AppFinanciera. El objetivo actual es el mínimo funcional; el endpoint y la automatización no son el "final" de la aplicación: son una posible etapa posterior del sistema de integración.

## Etapas (0–4)

- **Etapa 0 — Relevamiento + contexto interno (realizada / en curso):** comprender AppFinanciera (código y comportamiento real) y construir el sistema de contexto persistente (`context/`, `AGENTS.md`, `.opencode/`, `ROADMAP.md`). Entregable: `REPORT-ETAPA-0.md`. **NO implementa funcionalidades.** (read-only sobre la aplicación)
- **Etapa 1 — Base estructural:** modelos de gastos, gastos compartidos, gastos fijos, balances, preparación para porcentajes configurables, relaciones usuarios/grupos, modelo de recuperaciones/reintegros, compatibilidad futura con tarjeta, otras decisiones estructurales. **Diseño/estructura.**
- **Etapa 2 — Correcciones y limpieza (en curso):** solo lo que la Etapa 0 justifique — código obsoleto, transferencias antiguas, código muerto, bugs (incluido freelance/bandas), taxonomías, `Otros`, robustez, schemas/types, inconsistencias. **2.1 (taxonomía de gastos fijos + "Otros") cerrada el 25/09/2026** (`b46b570` en Producción). Siguiente pendiente: **2.2, con definición funcional cerrada (`PROPUESTA-2.2.md`) y pendiente de ejecución** (sandbox de pruebas + auditoría Firestore read-only como gate previo; implementación no aprobada).
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

- **25/09/2026 — Etapa 2 / 2.1 (cerrada):** taxonomía de gastos fijos unificada (`lib/fixedExpensesTaxonomia.js` como canónico) con **"Otros" en personales (`otros`) y compartidos (`otros_compartido`)**; `lib/temp.js` eliminado. Disney+ permanece **personal** (6.3). Validada en Local (build + 27 invariantes), Staging y Producción (funcional). Commit `b46b570`. **2.2 pendiente: bloqueada hasta definir la regla funcional de "pagado" y su reflejo en los totales.** Sin cambios en Firestore.
- **23/09/2026 — Etapa 0:** roadmap reescrito y alineado a las etapas 0–4 (antes estaba el esquema anterior "Stage 2/3/4"). El contexto técnico-funcional vive ahora en `context/` (`MAPA-APPFINANCIERA.md`, `dominio.md`, `arquitectura.md`). `REPORT-ETAPA-0.md` `REQUIERE_VALIDACIÓN_FIRESTORE` y hallazgos por revisar cuando se apruebe la Etapa 1.