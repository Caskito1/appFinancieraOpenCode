# HANDOFF-02 — Auditoría de AppFinanciera

Orden de trabajo para la **Etapa 2** del roadmap. Leer antes: `AGENTS.md` y `ROADMAP.md`.

## Objetivo

Revisar cómo registra la aplicación gastos, tarjeta e ingresos, y cómo calcula totales y balances. Identificar dónde se **distorsiona el resultado** cuando hay gastos de terceros y reintegros (por ejemplo, parte de la tarjeta que paga la pareja). El fin es alcanzar el **mínimo funcional** para que Finanzas pueda operar con datos reales y alimentar el análisis del Organizador. No se busca terminar la aplicación.

## Reglas

- **Solo lectura:** no modificar código ni datos.
- No inventar datos financieros.
- Citar cada hallazgo con `archivo:línea`.
- Si falta información para auditar algo, registrarlo en **preguntas abiertas** en lugar de asumirlo.

## Qué revisar

- Flujo de registro de gastos, ingresos y tarjeta (modelos, formularios, persistencia).
- Cómo se calculan totales y balances (funciones/módulos de cálculo).
- Cómo se representan y tratan actualmente los gastos de terceros, adelantos y reintegros, si es que se registran.
- Dónde se distorsiona el resultado con esos casos.
- Verificar durante la revisión los pendientes conocidos: ingresos freelance en la vista de ingresos; productos faltantes.

## Entregable

`REPORT-02.md` en la raíz del repo, con este formato:

1. **Resumen ejecutivo** (3–5 bullets).
2. **Mapa de la app** - stack, carpetas, entidades/modelos, flujo de datos (con referencias a archivos).
3. **Hallazgos** - lista; cada uno: qué se encontró, dónde (`archivo:línea`) y por qué distorsiona el resultado.
4. **Preguntas abiertas** - información faltante o decisiones que requieren al usuario.
5. **Recomendaciones de diseño a alto nivel** - sin implementar nada.

No modificar código en esta etapa.