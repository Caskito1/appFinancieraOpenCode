# HANDOFF — Etapa 0: Relevamiento + construcción del contexto interno (AppFinanciera)

**Repo objetivo:** `C:\Users\Usuario\Desktop\Proyectos Personales\AppFinanciera`
**Remitente:** Organizador Personal (personal-system) — planifica y coordina.
**Recipiente:** OpenCode del repo de AppFinanciera. Debes poder trabajar sin que te expliquen la aplicación: tu contexto está en este repo y lo construís en esta etapa.

## Contexto

- `REPORT-02.md` (auditoría Etapa 2, read-only) ya existe en el repo: es base de partida, no verdad absoluta.
- `CONTEXTO-ETAPA3.md` existe en el repo: contiene decisiones funcionales acordadas por el usuario; es la semilla del contexto funcional (se integra a `context/dominio.md`).
- El esquema anterior ("Stage 3 = diseño") queda reemplazado por el siguiente roadmap de etapas 0–4.
- Principio del Organizador: **el Organizador planifica y coordina; el OpenCode de cada proyecto conserva y utiliza su propio conocimiento técnico** para ejecutar autónomamente futuras planificaciones.

## Objetivo

Comprender completamente AppFinanciera (código y comportamiento real) y convertir ese conocimiento en un **sistema de contexto técnico/funcional persistente dentro de este repo**, de modo que esta instancia pueda ejecutar futuros HANDOFF de forma autónoma y consistente.

Esta etapa tiene dos resultados:

- **Resultado A — Conocimiento:** descubrir cómo funciona realmente la aplicación.
- **Resultado B — Sistema de contexto:** convertir ese conocimiento en documentación y configuración persistente (`context/`, `AGENTS.md` actualizado, `.opencode/`, `ROADMAP.md`).

**NO es implementación de funcionalidades.**

## Roadmap (para registrar/reflejar en `ROADMAP.md`)

- **Etapa 0** (esta): relevamiento + contexto interno.
- **Etapa 1**: base estructural (modelos de gastos, gastos compartidos, gastos fijos, balances, preparación para porcentajes configurables, relaciones usuarios/grupos, modelo de recuperaciones/reintegros, compatibilidad futura con tarjeta, otras decisiones estructurales).
- **Etapa 2**: correcciones y limpieza (solo lo que la Etapa 0 justifique: código obsoleto, transferencias antiguas, código muerto, bugs, taxonomías, `Otros`, robustez, schemas/types, inconsistencias).
- **Etapa 3**: nuevas funcionalidades financieras (dinero a recuperar, reintegros, adelantos, liquidación de saldos, personas externas, integración futura con tarjeta). **Regla fundamental: reintegro/recuperación ≠ ingreso.**
- **Etapa 4**: evolución general del producto (múltiples grupos, configuración por grupo, porcentajes configurables, configuración general, módulo de tarjeta, estadísticas, productos, UX, aplicación para terceros).

No avanzar más allá de la Etapa 0 sin orden explícita.

## Decisiones funcionales conocidas (cerradas por el usuario)

1. **`/gastos`**: conservar el comportamiento actual como referencia deseada — `total mensual = gastos personales + parte del usuario de gastos compartidos diarios + 50% de gastos fijos compartidos + 100% de gastos fijos personales`. `/gastos` = visualización general; `/gastos-fijos` = administrador/detalle de gastos fijos. Si el código real no coincide, documentar la inconsistencia; **NO corregir**.
2. **Gastos compartidos diarios**: compartidos a nivel registro/visualización, **NO generan deuda ni balance** (intencional para el uso actual). No convertir retroactivamente en deudas.
3. **Gastos fijos compartidos**: sí generan balance entre participantes; puede acumularse y liquidarse (balance vuelve a cero) pero **el historial permanece**. Distinguir histórico vs balance pendiente.
4. **Recuperaciones**: representan **dinero adelantado pendiente de recuperar**; pueden involucrar pareja, miembro del grupo, amigo, familiar o persona externa. El dinero recibido para cancelar reduce/cancela el saldo y **no es ingreso real**.
5. **Tarjeta**: será un módulo futuro propio; el modelo de recuperaciones debe poder utilizarse posteriormente desde ese módulo.
6. **`Otros`**: debe seguir existiendo y funcionando; no es prioridad actual.
7. **Porcentajes de fijos compartidos**: hoy 50/50; el modelo no debe quedar limitado a 50/50 (modelo flexible, interfaz sencilla).
8. **Firestore**: sin acceso por ahora; solo lectura si se justifica después.
9. **Datos históricos**: NO se modifican en esta etapa.

## Alcance del relevamiento (mínimo)

1. Estructura completa del repositorio.
2. Páginas/rutas.
3. Componentes.
4. Hooks.
5. Services.
6. Helpers.
7. Contexts.
8. Lógica importante.
9. Colecciones Firestore (desde el código: nombres, usos).
10. Estructura de documentos/campos.
11. Lecturas y escrituras por archivo.
12. Relaciones entre entidades.
13. Flujos end-to-end (usuario → formulario → función → Firestore → cálculo → visualización).
14. Dependencias.
15. Duplicación.
16. Código legado.
17. Código muerto.
18. Limitaciones.
19. Inconsistencias.
20. Riesgos arquitectónicos.
21. Oportunidades de optimización.
22. Comportamientos dependientes de la implementación.
23. Diferencias entre comportamiento actual y comportamiento funcional deseado.

Nivel de análisis objetivo (cuando sea posible):

`archivo → componente/función → página → colección → propósito → consumidor → estado`

## Estructura de contexto propuesta (punto de partida justificable)

```
AppFinanciera/
├── AGENTS.md
├── ROADMAP.md
├── context/
│   ├── MAPA-APPFINANCIERA.md
│   ├── arquitectura.md
│   ├── dominio.md
│   └── ...
├── .opencode/
│   └── agent/
├── HANDOFF-*.md
└── REPORT-*.md
```

- **`MAPA-APPFINANCIERA.md`** — puerta de entrada al conocimiento de la aplicación: qué es; estructura general; módulos; páginas; componentes; datos; relaciones; dónde está cada cosa; estado actual; referencias al resto del contexto.
- **`context/arquitectura.md`** — cómo funciona técnicamente (si corresponde): Next.js; Firebase; Firestore; autenticación; servicios; hooks; contexts; patrones; dependencias; decisiones técnicas.
- **`context/dominio.md`** — comportamiento funcional separado del detalle de implementación: gasto personal; gasto compartido diario; gasto fijo; gasto fijo compartido; balance; recuperación; reintegro; ingreso; tarjeta futura; qué genera balance; qué no genera balance.

**No asumir que estos tres archivos son suficientes.** Si el relevamiento demuestra que otra estructura es mejor, proponerla con justificación.

## Documentación esperada

- `context/`: crear/estructurar los documentos. Integrar `CONTEXTO-ETAPA3.md` en `context/dominio.md` (+ aportes al mapa y a arquitectura). **No eliminar `CONTEXTO-ETAPA3.md`**: la decisión de eliminar/renombrar es del usuario (podés marcarlo como semilla absorbida).
- `ROADMAP.md`: alinear a las etapas 0–4.
- `AGENTS.md`: reescribir como **AGENTS delgado** que explique: cómo trabaja opencode en este repo; qué leer antes de trabajar (`context/MAPA-APPFINANCIERA.md`, `context/dominio.md`, y `context/arquitectura.md` según la tarea, `ROADMAP.md`, el HANDOFF correspondiente); y que las decisiones funcionales documentadas en `context/` son la fuente de contexto para cualquier modificación.
- `.opencode/`: evaluar qué agentes aportan valor real. Posibilidades iniciales a evaluar (sin limitarse): `planificador`, `implementador`, `revisor`, `auditor`. **Crear solo los justificados** y explicar el porqué de cada uno en el REPORT.
- `HANDOFF`/`REPORT` propios de la etapa.

## Clasificación de hallazgos

Etiquetar cada hallazgo con: `#actual` | `#deseado` | `#problema` | `#propuesta`, y cuando corresponda indicar la etapa futura a la que apunta (Etapa 1, 2, 3 o 4).

Esto es importante para no confundir *"así funciona actualmente"* con *"así debería funcionar"*.

## Restricciones (read-only sobre la aplicación)

**NO modificar:** lógica de negocio; componentes; páginas; Firestore; datos; comportamiento de la aplicación; producción; staging; historial.

**SÍ se puede construir/modificar** (parte explícita del sistema de contexto): `context/MAPA-APPFINANCIERA.md`; otros documentos dentro de `context/`; `AGENTS.md`; `.opencode/agent/`; `ROADMAP.md`; documentación técnica necesaria; `HANDOFF`/`REPORT` propios de la etapa.

La Etapa 0 **no implementa funcionalidades de la aplicación**.

## Firestore

**No solicitar acceso a Firestore inicialmente.** Primero realizar el relevamiento del código.

Si aparece una pregunta que no puede resolverse mediante el repositorio y requiere datos reales, documentarla explícitamente como `REQUIERE_VALIDACIÓN_FIRESTORE`, explicando: qué pregunta se quiere responder; qué datos serían necesarios; por qué no puede resolverse con el código. Después el usuario evalúa si otorga acceso read-only.

## Metodología

- Antes de escribir contexto, leer en orden: `AGENTS.md` actual → `REPORT-02.md` → `CONTEXTO-ETAPA3.md` → `ROADMAP.md` → código (lectura sistemática por página, colección y flujo).
- Documentar a medida que se releva; **no "arreglar" nada encontrado**: clasificar y continuar.
- Verificar las decisiones funcionales (sección "Decisiones funcionales") contra el código (`archivo:línea`) y reportar cuáles se cumplen, cuáles no y cuáles no se pudieron verificar.

## Criterios de finalización

- `context/` con `MAPA-APPFINANCIERA.md` + `arquitectura.md` + `dominio.md` (o estructura justificada).
- `AGENTS.md` delgado actualizado y apuntando al contexto.
- `ROADMAP.md` reflejando las etapas 0–4.
- `.opencode/`: evaluación de agentes (creados solo los justificados).
- Hallazgos clasificados con etiquetas + etapa futura.
- `REPORT-ETAPA-0.md` entregado.

## Formato esperado del REPORT (`REPORT-ETAPA-0.md`)

1. Resumen ejecutivo.
2. Qué se descubrió (estructura, páginas, colecciones, flujos) — resumen + referencia a `context/`.
3. Verificación de las decisiones funcionales contra el código (con evidencia `archivo:línea`).
4. Hallazgos clasificados por etiqueta y etapa.
5. Lista `REQUIERE_VALIDACIÓN_FIRESTORE` (si existe).
6. Estructura de contexto creada (y justificación si difiere de la propuesta).
7. Evaluación de agentes (roles propuestos y por qué).
8. Preguntas abiertas que requieren decisión humana (solo las imprescindibles).
9. Estado del repo tras la etapa (archivos creados/modificados).

## Preguntas abiertas

No plantear preguntas que ya estén respondidas por este HANDOFF o por `CONTEXTO-ETAPA3.md`. Solo marcar como pregunta abierta aquello que **realmente requiera decisión humana** y no pueda resolverse con código ni contexto.

## Cierre

Entregar `REPORT-ETAPA-0.md` y **quedarse a la espera**. El Organizador evalúa, el usuario decide, y recién entonces se entrega el próximo HANDOFF (Etapa 1). **No continuar por cuenta propia a otra etapa.**