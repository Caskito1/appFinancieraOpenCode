# AGENTS.md - AppFinanciera

Aplicación de finanzas personales (Next.js 16 + React 19 + Firebase). La aplicación vive en el repo anidado `AppFinanciera/` (repo git propio, ignorado por este repo padre).

## Cómo trabaja opencode en este repo

1. **Leer antes de trabajar**, según la tarea:
   - `context/MAPA-APPFINANCIERA.md` — puerta de entrada: módulos, páginas, colecciones, dónde está cada cosa.
   - `context/dominio.md` — modelo funcional y comportamiento de negocio (qué genera balance, qué es ingreso, recuperaciones, etc.).
   - `context/arquitectura.md` — detalle técnico (stack, firestore, servicios, hooks, patrones).
   - `ROADMAP.md` — etapas 0–4 y objetivo actual.
   - `HANDOFF-*.md` — el de la etapa en curso, como fuente de la tarea.
2. Las **decisiones funcionales** documentadas en `context/dominio.md` son la fuente de contexto para cualquier modificación.
3. Los hallazgos se clasifican (`#actual | #deseado | #problema | #propuesta`) + etapa futura. No confundir "así funciona hoy" con "así debería funcionar".

## Reglas

- Auditar antes de diseñar, diseñar antes de implementar.
- No refactorizar innecesariamente: buscar el cambio mínimo.
- No asumir estructura de datos: la propuesta sale de cómo funciona la app hoy.
- No implementar cambios sin aprobación explícita del usuario.
- No inventar datos financieros.
- No modificar `AppFinanciera/` fuera de una etapa aprobada; la Etapa 0 es read-only sobre la aplicación.
- No modificar producción directamente. Toda modificación sigue: Local → Staging → Producción → Verificación.
- Sin acceso a Firestore salvo decisión explícita del usuario (marcar lo que requiera datos reales como `REQUIERE_VALIDACIÓN_FIRESTORE`).

## Pendientes conocidos (contexto)

- Los ingresos freelance/bandas no se ven correctamente en la vista de ingresos (bug de ids de subtipo — ver `context/dominio.md` §3.4).
- Agregar productos faltantes.
- (Futuro) sección de balance/analytics.