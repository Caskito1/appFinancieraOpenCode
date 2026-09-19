# AGENTS.md - AppFinanciera

Aplicación de finanzas personales (Next.js + Firebase).

## Reglas

- Auditar antes de diseñar, diseñar antes de implementar.
- No refactorizar innecesariamente: buscar el cambio mínimo.
- No asumir estructura de datos: la propuesta sale de cómo funciona la app hoy.
- No implementar cambios sin aprobación explícita del usuario.
- No inventar datos financieros.

## Contexto del roadmap (fuente completa: personal-system/context/finanzas.md)

- **Objetivo actual:** alcanzar el **mínimo funcional** para que Finanzas pueda operar con datos reales y alimentar el análisis del Organizador (LEER → ANALIZAR → PROPONER). **El cierre de Finanzas no equivale al cierre de AppFinanciera:** las funcionalidades futuras propias de la aplicación (estadísticas, visualizaciones, mejoras de UX, etc., solo ejemplos conceptuales) quedan como backlog de la aplicación y se deciden posteriormente. El endpoint y la automatización no son el "final" de la app: son una posible etapa posterior del sistema de integración.
- **Etapa 2 — AUDITORÍA (objetivo actual):** revisar cómo registra gastos, tarjeta, ingresos y cómo calcula totales/balances; identificar dónde se distorsiona el resultado cuando hay gastos de terceros y reintegros (ej. parte de la tarjeta que paga la pareja).
- **Etapa 3 — DISEÑO (después):** proponer el cambio mínimo para distinguir: ingreso real / gasto propio / gasto de terceros (adelanto) / reintegro / dinero a recuperar; su efecto en gastos, ingresos, balance, deuda pendiente y reportes.
- **Etapa 4 — IMPLEMENTACIÓN:** solo tras aprobar el diseño.
- No forma parte de esta(s) etapa(s): Excel, Obsidian, automatización, endpoint, y las funcionalidades futuras propias de la aplicación.

## Pendientes conocidos (contexto)

- Los ingresos freelance no se ven correctamente en la vista de ingresos.
- Agregar productos faltantes.
- (Futuro) sección de balance/analytics.