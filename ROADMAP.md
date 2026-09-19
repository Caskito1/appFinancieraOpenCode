# Roadmap - AppFinanciera

Roadmap operativo de este repositorio. Fuente global del sistema: `personal-system\context\finanzas.md` (sección *Roadmap financiero*). La fuente de decisión y estado está en el Vault de Obsidian (`03-Programacion/Proyectos Personales\Indice de Proyectos.md` y la nota del proyecto).

## Objetivo

Alcanzar el **mínimo funcional** necesario para que Finanzas del Organizador pueda LEER → ANALIZAR → PROPONER con datos reales y validar el sistema. NO es terminar la aplicación como producto.

> El cierre de Finanzas no equivale al cierre de AppFinanciera. El objetivo actual es el mínimo funcional; una vez alcanzado y validado con datos reales, Finanzas puede considerarse cerrada aunque la aplicación conserve funcionalidades futuras por desarrollar. El endpoint y la automatización tampoco son el "final" de la aplicación: son una posible etapa posterior del sistema de integración.

## Etapas

1. **Etapa 2 — Auditoría (próxima):** revisar cómo registra la app gastos, tarjeta, ingresos y cómo calcula totales y balances; identificar dónde se distorsiona el resultado con **gastos de terceros y reintegros** (ej. parte de la tarjeta que paga la pareja). Entregable: `REPORT-02.md`.
2. **Etapa 3 — Diseño:** proponer el cambio mínimo para distinguir ingreso real / gasto propio / gasto de terceros (adelanto) / reintegro / dinero a recuperar, y su efecto en gastos, ingresos, balance, deuda pendiente y reportes. No implementar.
3. **Etapa 4 — Implementación:** solo después de aprobar el diseño (Etapa 3).

## Fuera de alcance de estas etapas

- Terminar todas las funcionalidades de la aplicación.
- Endpoint / API.
- Automatización de transferencia de datos al Organizador.
- Integración automática con Obsidian/Planner.
- Etapa 7 de automatización del roadmap financiero global.

La obtención de datos para Finanzas puede ser manual al inicio. Lo importante es que los datos existan, sean confiables y puedan ser utilizados por el Organizador.

## Después del mínimo funcional

1. Dejar Finanzas en **observación** durante un período real (~1 mes).
2. Acumular datos reales y generar los resúmenes financieros en Obsidian.
3. Revisar/analizar y comprobar que el modelo y los datos sirven.
4. Corregir únicamente si aparece un problema real.
5. Tras esa validación, decidir si se continúa con AppFinanciera o se avanza con otra parte del Organizador/proyectos.

## Backlog futuro de la aplicación (NO es trabajo aprobado)

Funcionalidades propias futuras (estadísticas de gastos, visualizaciones, mejoras de UX u otros módulos) son **ejemplos conceptuales**: quedan como backlog de la aplicación y se deciden posteriormente, sin incorporarlas al alcance de estas etapas salvo que sean necesarias para alcanzar el mínimo funcional.

## Pendientes conocidos (contexto)

- Los ingresos freelance no se ven correctamente en la vista de ingresos.
- Agregar productos faltantes.
- (Futuro) sección de balance/analytics.