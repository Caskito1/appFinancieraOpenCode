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
- Seguir el **flujo de ramas y despliegue** de la sección siguiente: nunca push directo a `main`; primero Staging y aprobación explícita antes de promover a Producción.
- Sin acceso a Firestore salvo decisión explícita del usuario (marcar lo que requiera datos reales como `REQUIERE_VALIDACIÓN_FIRESTORE`).

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
  - **CRUD incompleto:** no hay flujo para editar ni eliminar un ingreso existente, solo el alta (`app/agregar/components/ingresos/helpers/submitIngreso.js`). Un ingreso mal cargado no se corrige desde la app. Detalle en `PROPUESTA-2.3.md` §9.1 y `context/dominio.md` §3.4.
  - **Errores no manejados:** `subscribeIngresos.js` no maneja errores y solo emite cuando cargan ambas queries, así que una query fallida deja `/ingresos` en loading infinito. Fuera del alcance de 2.3. Detalle en `context/dominio.md` §3.4.
- Agregar productos faltantes.
- **Escrituras sin timeout en Firestore (preexistente, hallada el 08/10/2026):** en modo offline el botón queda en "Guardando…" indefinidamente (la Promise de `addDoc`/`updateDoc` no resuelve) y el backdrop del modal cierra dejando la escritura en cola, que se commitea al reconectar. Fuera del alcance de 2.7; candidato a 2.4 o deuda nueva.
- (Futuro) sección de balance/analytics.