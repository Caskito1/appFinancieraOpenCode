# PROPUESTA — Etapa 3: Diseño del modelo de Reintegros (AppFinanciera)

> **Naturaleza: DISEÑO / ANÁLISIS (Etapa 3). NO implementa nada.** Entregable producido el
> **13/10/2026** conforme a `HANDOFF-ETAPA-3.md` §7 (15 secciones obligatorias) y §8 (restricciones).
> **La implementación (Etapa 4) requiere aprobación explícita y separada del usuario; no está
> autorizada por este documento.** `AppFinanciera/` no fue modificado; sin acceso a Firestore;
> sin commits ni push. Único archivo creado: este (`PROPUESTA-ETAPA-3.md`, raíz del repo padre —
> el handoff mencionaba el repo de la app, pero `AppFinanciera/` es solo lectura en esta etapa
> por instrucción del usuario).
>
> **Regla rectora (decisión cerrada): un reintegro NO es un ingreso.** Devoluciones recibidas o
> realizadas no inflan ingresos ni gastos. Una devolución **reduce** el saldo pendiente de la
> deuda correspondiente (ambos sentidos). Al liquidar, el balance vuelve a cero pero **el
> historial permanece**. Vocabulario de usuario canónico: **«Reintegros»**.
>
> **Gate read-only de `transferencias` (ejecutado por el usuario, 13/10/2026): PASS — 0
> documentos, colección vacía/inexistente al momento de la consulta** (§2.3). Consiguiente
> veredicto operativo: **no hay registros que migrar ni borrar al retirar el flujo**.
>
> **Revisión focalizada (13/10/2026):** correcciones aplicadas sobre el borrador —
> **(A)** pagador vs registrador separados (`realizadoPorUid` ≠ `registradoPor`); **(B)**
> seguridad de Firestore como **gate obligatorio previo a las escrituras** (§8.5, subetapa
> 4.0); **(C)** sobrepago impedido en v1 con validación transaccional y reglas de concurrencia
> (§4.3); **(D)** PO-1…PO-6 redefinidas con alternativas, consecuencias y recomendación,
> **en ese momento todas PENDIENTE DE DECISIÓN DEL USUARIO** (§12.3) *(supersesión
> parcial: resueltas el 14/10/2026 — ver bloque "Resolución de decisiones")*; **(E)**
> ambigüedad "en el balance"
> respecto del handoff documentada, no resuelta en silencio (§6.3); **(F)** retiro de
> Transferencias como paso separado con 6 condiciones obligatorias (§7.4).
>
> **Revisión externa H-1…H-10 (aplicada, 13/10/2026):** correcciones de la revisión externa
> sobre la revisión focalizada — **(H-1)** acumulador `devuelto` en `reintegros` + transacción
> que lee solo el doc obligación (el SDK web **no admite queries en `Transaction.get`**);
> edición de monto también transaccional (`monto >= devuelto`); **(H-2)** invariante **I-8**
> pagador = deudor con asimetría documentada del pagador tercero + prueba de partición;
> **(H-3)** gate §8.5 con reglas versionadas, equivalencia repo↔desplegado, **Emulator Suite**
> (`@firebase/rules-unit-testing`) y criterio 3.8 de acople devolución↔obligación
> (`getAfter`); **(H-7)** comportamiento offline de la transacción (sin cola; espera/timeout
> y mensaje de sin conexión); **(H-9)** consecuencia contable explícita sobre `totalGastos`;
> **(H-10)** editorial. **Staging y Producción comparten proyecto Firebase** (`AGENTS.md`) —
> registrado en §8.5. **Estado actual de pendientes:** aplicados H-4 (campo
> `participantes`) y H-5 (campo `fechaPago`); decididas PO-2 (CONFIRMADO) y PO-8 (A+);
> *(actualizado 14/10/2026: PO-1, PO-3, PO-4, PO-5, PO-6 y PO-7 quedaron **decididas** y
> PO-8a **sin objeto** — ver bloque siguiente y §12.3)*.
>
> **Pasada de diseño — visión del usuario incorporada (13/10/2026, según el prompt):**
> **(V-1)** H-4 **APLICADO**: campo `participantes` (array) en `reintegros` con `groupId`
> opcional; v1 solo dos partes ven la obligación; gasto entre N personas = N reintegros
> (futuro, sin diseñar); queries unificadas por `array-contains` + rango de fecha (§3.2,
> §3.3). **(V-2)** H-5 **APLICADO**: campo `fechaPago` en `reintegro_devoluciones`; cada
> entrega atribuye el mes correcto (§3.2, §6.2). **(V-3)** PO-2 **CONFIRMADO (decidido por
> el usuario)**: botón "Reintegros" en `/home` como entrada de navegación; pestañas
> Pendientes (por defecto) / Cerrados en `/reintegros`; ~~acordeones del mes en `/ingresos`
> y `/gastos`~~ *(retirados por DC-1, 14/10/2026 — §9.7)* (§6.3, §9). **(V-4)** PO-8
> **DECIDIDO — Alternativa A+** (decidida por el
> usuario): totales puros + ~~acordeón informativo~~ *(retirado por DC-1)* + entradas/salidas
> de reintegros del mes;
> "excedente de caja" documentado solo como fórmula de referencia, **sin** línea calculada
> en pantalla (§6.2). **(V-5)** PO-7 quedó **sin resolver** en esa revisión (estado
> histórico: hoy está **DECIDIDA**, 14/10/2026, §12.3) como decisión pendiente con
> alternativas *(esta línea solo conserva el estado de la revisión V)*. **(V-6)** Enmienda
> del prompt:
> hoy **no existen** líneas de
> excedente en ninguna
> pantalla (se calcula manualmente); no se agregan líneas nuevas en pantallas existentes.
> Ninguna decisión tomada fuera de las aquí listadas. **Solo se modificó este documento.**
>
> **Resolución de decisiones — 14/10/2026 (según el prompt del usuario):**
> **PO-1 DECIDIDA** (lista = todos los activos, agrupados por mes de ingreso/`createdAt`,
> orden desc; sin filtro del mes visible; selector solo en la Card Resumen y solo para
> flujos; encabezado "Reintegros" sin mes); **PO-3 DECIDIDA** (sin sobrepagos); **PO-4
> DECIDIDA** (mantener confirmación bilateral, con vacíos de detalle documentados sin
> inventar — §5.3, §12.6); **PO-5 DECIDIDA** (ambas partes en su alcance gestionan
> entregas); **PO-6 DECIDIDA** (título texto libre); **PO-7 DECIDIDA** (corrección de
> entregas vía «Eliminar» lógico con constancia); **PO-8a SIN OBJETO** (acordeones
> retirados). **DC-1…DC-8 registradas** (§12.5): acordeones de `/ingresos` y `/gastos`
> **retirados** con nota de trazabilidad (§9.7); nomenclatura visible **exclusivamente
> «Eliminar»** (sin «Anular», sin borrado físico); motivos **opcionales**; **condonación
> dentro del alcance** de este diseño (§4.4); permisos de condonar/eliminar y estructura
> de campos de auditoría como **propuestas pendientes** (§3.6, §12.6).
>
> **Leyenda de evidencia (secciones nuevas o reescritas):**
> **[Dato actual]** = verificado sobre código/documentos, con `file:línea` ·
> **[Diseño propuesto — no implementado]** = propuesta técnica de esta Etapa 3 (no existe
> en la app: **sin** reglas, transacciones, bitácora ni pruebas ejecutadas) ·
> **[Pendiente de aprobación]** = no decidido por el usuario (etiqueta `#propuesta`).
>
> Estado de coordinación: **Etapa 2 CERRADA (11/10/2026)**; 2.5 y 2.6 cerradas y verificadas en
> Producción; `main` == `staging` == Producción == `10ab576` (§15).

---

## 1. Problema y objetivos del modelo

### 1.1 El problema

AppFinanciera debe representar **dinero adelantado y su recuperación**, en ambos sentidos (el
usuario cobra o devuelve), sin que las devoluciones inflen ingresos ni los adelantos inflen
gastos (`HANDOFF-ETAPA-3.md` §2; `context/dominio.md` §§5–7, §12 fila D4).

Hoy ese caso de uso está mal representado por el flujo **legacy de Transferencias** y no existe
el concepto de deuda/cobro pendiente:

- `#problema` **D4 (dominio §12):** transferencias **recibidas** suman como **ingreso**
  (`app/ingresos/hooks/useIngresos.js:93-118`, suma de transferencias en `:103-114`) y las
  **enviadas** como **gasto personal del mes** (`app/gastos/hooks/useGastos.js:65-76` + `:126,130`)
  — lo que **infla ingresos** (si hubiera datos) y **no reduce el gasto original**. **Hecho
  comprobado** sobre el código actual (§2.4).
- `#problema` No hay vínculo entre el gasto adelantado y su reintegro; no hay concepto de
  "deuda a recuperar" ni de "deuda a devolver"; no hay saldo pendiente ni liquidación
  (`context/dominio.md` §5).
- `#actual` El alta de transferencias está **deshabilitada en la UI** (botón comentado,
  `app/agregar/page.jsx:79-91`), pero el flujo completo existe en código y las **lecturas de
  balance siguen activas** (`subscribeGastos.js:80-95`, `subscribeIngresos.js:50-72`).
  **Hecho comprobado** (§2.4).
- **Efecto actual = 0:** el gate de §2.3 muestra la colección `transferencias` **vacía**, por lo
  que hoy **no hay inflación real de totales** (las suscripciones devuelven listas vacías). El
  problema es **estructural/latente**: cualquier escritura futura por ese camino (consola,
  script, reintroducción del botón) volvería a inflar totales. `#problema` (estructural).

### 1.2 Objetivos del modelo (alcance del diseño)

Diseñar el módulo **Reintegros** para que la Etapa 4 pueda implementar, como mínimo
(`HANDOFF-ETAPA-3.md` §3.4):

1. Registrar un gasto extraordinario que genere **dinero a recuperar** (el usuario debe cobrar)
   o una **deuda que el usuario deba devolver**.
2. Registrar **devoluciones parciales o completas**.
3. **Consultar saldos pendientes y liquidarlos** (el balance vuelve a cero; el historial
   permanece).
4. Mostrar un **resumen mensual de Reintegros en el balance**, que evalúa como mínimo y por
   separado: (a) gastos u operaciones que generan dinero por recuperar; (b) devoluciones
   recibidas; (c) devoluciones realizadas; (d) saldos pendientes de cobro y de devolución.

> **Alcance (actualización 14/10/2026):** la **condonación** (cierre por perdón de deuda,
> acción explícita distinta de eliminar — DC-8) queda **dentro del alcance de este
> diseño** (§4.4). Siguen **fuera de alcance** como evolución: vinculación
> `gastoVinculadoId` y catálogo de conceptos (§12.4, §14 4.6).

### 1.3 Qué NO es este documento

- No es un plan de implementación ejecutado: es el **diseño aprobable** previo a la Etapa 4.
- No reabre decisiones cerradas del `HANDOFF-ETAPA-3.md` §3 (§1.4).
- No modifica datos históricos, no retira Transferencias, no registra el cierre de la Etapa 3.

### 1.4 Decisiones cerradas incorporadas (no reabiertas — HANDOFF §3)

| # | Decisión cerrada |
|---|---|
| D-1 | Vocabulario canónico de usuario: **«Reintegros»** (sección e interfaz). Se permite convención técnica interna distinta si se justifica. |
| D-2 | Un reintegro **no es un ingreso**; devoluciones (recibidas o realizadas) **no inflan** ingresos ni gastos. |
| D-3 | Una devolución **reduce** el saldo pendiente en ambos sentidos (ej.: adelantan $1.000, reciben $500 ⇒ quedan $500 por recuperar). |
| D-4 | Al liquidar, el balance vuelve a cero pero **el historial permanece** (mismo criterio que fijos compartidos). |
| D-5 | Contrapartes: pareja, miembros del grupo, amistades, familiares, personas externas. Con usuario en la app → el diseño propone qué ve cada uno respetando permisos/datos personales. Sin usuario → registro visible solo para quien usa la app, sin crear cuentas. |
| D-6 | Gasto diario compartido ≠ deuda; no convertir retroactivamente. Separar: gastos personales, compartidos diarios, fijos personales, fijos compartidos, ingresos reales y reintegros. |
| D-7 | Transferencias legacy: **sustituir el flujo funcional por Reintegros** en Etapa 4 (§7). **No** se da por autorizada eliminación de datos, migración destructiva ni modificación de históricos. |
| D-8 | Alcance Etapa 4: modelo + UI mínima para los 4 puntos de §1.2. |

---

## 2. Evidencia consultada, con rutas y secciones exactas

### 2.1 Documentos de contexto leídos (repo padre)

| Documento | Secciones usadas |
|---|---|
| `context/MAPA-APPFINANCIERA.md` | §estructura, §módulos/rutas, §colecciones Firestore, §estado actual/deuda, §decisiones funcionales |
| `context/dominio.md` | §2 tipos de movimiento; §3.3 fijos (patrón balance); §3.4 ingresos; §5 recuperaciones; §6 transferencias legacy; §7 tarjeta; §10 visualizador; §11 reglas del dato; §12 diferencias D1/D4/D5/D7 |
| `context/arquitectura.md` | §capa de datos (services), §hooks, §escrituras submit, §flujos end-to-end, §decisiones/cargas técnicas (serverTimestamp, índices, sin rules) |
| `ROADMAP.md` | etapas 0–4, cierre de Etapa 2 (2.5 `3216095`, 2.6 `10ab576`), pendiente CRUD de ingresos |
| `HANDOFF-ETAPA-3.md` | completo (§3 decisiones, §4 evidencia a re-verificar, §5 transferencias, §6 coordinación, §7 entregable, §8 restricciones) |
| `CONTEXTO-ETAPA3.md` | §7 gastos extraordinarios/dinero a recuperar; §9 transferencias actuales; §11 visualizador; §15 alcance Stage 3; §16 criterio de cierre (semilla absorbida, referencia histórica) |
| `AGENTS.md` | reglas del repo, flujo de ramas/despliegue, pendientes conocidos |
| `PROPUESTA-2.3.md` | §9 pendientes (Etapa 3: `TransferenciasIngresosSection`, `totalIngresos`); **§9.1 deuda CRUD de ingresos** |
| `PROPUESTA-2.6.md` | §1–2 diagnóstico y decisiones de conservación (`gastosCalculations.js`, `origenCompra`, `Transferenciassections.jsx`); formato de referencia |
| `PROPUESTA-2.2.md`, `HANDOFF-ETAPA-2.md` | referencias de patrón (gate, `esPagado`, transferencias → Etapa 3) |

### 2.2 Código verificado (`AppFinanciera/`, solo lectura — rutas exactas)

| Área | Archivos leídos (ruta relativa a `AppFinanciera/`) |
|---|---|
| Alta transferencias | `app/agregar/page.jsx` · `app/agregar/components/ModoTransferencia.jsx` · `app/agregar/components/transferencia/hooks/useModoTransferencia.jsx` · `app/agregar/components/transferencia/helpers/submitTransferencia.jsx` |
| UI transferencias | `app/gastos/sections/Transferenciassections.jsx` · `app/gastos/components/FilaTransferencia.jsx` · `app/gastos/components/FilaGasto.jsx` · `app/ingresos/sections/TransferenciasIngresosSection.jsx` · `app/ingresos/page.jsx` · `app/gastos/page.jsx` |
| Suscripciones | `app/gastos/services/subscribeGastos.js` · `app/ingresos/services/subscribeIngresos.js` · `app/gastos-fijos/services/subscribeFixedExpenses.js` (referencia) |
| Totales | `app/gastos/hooks/useGastos.js` · `app/ingresos/hooks/useIngresos.js` |
| Helpers legacy | `app/gastos/helpers/gastosCalculations.js` · `app/agregar/components/compra/helpers/submitCompra.js` (`origenCompra`) |
| Ingresos (adyacente) | `app/agregar/components/ingresos/helpers/submitIngreso.js` |
| Patrón fijos a emular | `app/gastos-fijos/hooks/useFixedExpenses.js` · `app/gastos-fijos/components/PagarModal.jsx` · `lib/fixedExpensesTaxonomia.js` |
| Navegación / UI general | `app/components/navigation/BottomNav.jsx` · `app/home/page.jsx` · `app/home/hooks/useHomeData.js` · `app/home/helpers/quickActions.js` · `app/gastos/sections/GastosHeader.jsx` · `lib/GroupContext.jsx` |

Greps de localización: `transferenc|Transferenc` en `*.{js,jsx}` de `AppFinanciera/`;
`gastosCalculations|Transferenciassections|TransferenciasSection|FilaTransferencia|origenCompra`;
`/ingresos|/gastos-fijos|/reintegros`; `BottomNav|RouteGuard`.

### 2.3 Gate read-only de la colección `transferencias` (resultado incorporado)

Gate ejecutado **por el usuario** (no re-ejecutado por este agente) con script temporal
`inventario-transferencias-3.js` — **única operación `.get()`, 0 escrituras** — desde
Firebase Console → Cloud Shell, proyecto **`finanzas-app-1c5f6`**. Resultado **en el momento de
la ejecución**:

| Campo del inventario | Resultado |
|---|---|
| `totalDocumentos` | **0** |
| `existe` | **false** |
| `porAnio` | `{}` |
| `porMes` | `[]` |
| `combinacionesDeUidParaUid` | **0** |
| `sinFecha` | **0** |
| `sinParDeUids` | **0** |
| **Veredicto del gate** | **PASS — colección vacía al momento de la consulta** |

**Veredicto operativo (alcance de lo que esto prueba):** no hay registros en la colección
`transferencias` al momento de la consulta ⇒ **no hay datos que migrar ni que borrar al retirar
el flujo** en la Etapa 4.

**Límites explícitos de esta evidencia:** el resultado **no** demuestra que nunca existió
actividad histórica fuera de esa colección, **ni** que no existan referencias en otros lugares
(otros documentos, scripts externos, copias). Eso queda cubierto por la verificación de código
(§2.2, §2.4, §7.1 — inventario completo) y lo que no pueda resolverse con código queda marcado
`REQUIERE_VALIDACIÓN_FIRESTORE` (§12). Consistente con la validación read-only previa de
25/09/2026 (`transferencias` **ausente** en Firestore; `context/MAPA-APPFINANCIERA.md` §estado
Firestore).

### 2.4 Verificación de hechos documentados (HANDOFF §4) sobre el código actual

| Hecho del HANDOFF §4 / contexto | Veredicto | Evidencia exacta (código actual) |
|---|---|---|
| Reintegros no implementados | **CONFIRMADO** | No existe ninguna ruta, colección, hook ni módulo `reintegro*` en `AppFinanciera/` (greps 0 coincidencias). `context/dominio.md` §5: "No implementado". |
| Transferencias recibidas suman como ingreso (`useIngresos.js`) | **CONFIRMADO** | `useIngresos.js:93-118` — `totalIngresos = Σ ingresos + Σ transferenciasRecibidas` (suma de transferencias en `:103-114`). *Deriva de línea:* `dominio.md` cita `:95-106`; el rango actual es `:103-114` (mismo comportamiento). |
| Transferencias enviadas suman como gasto (`useGastos.js`) | **CONFIRMADO** | `useGastos.js:65-76` — filas sintéticas `tipo: "transferencia"` mezcladas en `gastosPersonales`; `:126` `totalPersonales`; `:130` `totalGastos`. *Deriva de línea:* `dominio.md` cita `:65-74`; actual `:65-76`. |
| Alta de transferencias deshabilitada en la UI (`app/agregar/page.jsx`) | **CONFIRMADO** | Botón comentado `:79-91`. El render `modo === "transferencia"` (`:133-135`) permanece pero es **inalcanzable**: el único `setModo("transferencia")` vive en el botón comentado. |
| Lecturas de balance activas | **CONFIRMADO** | `subscribeGastos.js:80-95` (query `transferencias` por `groupId` + `orderBy createdAt`; entra en `totalQueries` `:32`); `subscribeIngresos.js:50-72,111-125` (query por `paraUid` + rango de mes; `emitIfReady` exige ambas queries `:82-92`). |
| `TransferenciasIngresosSection`: import muerto + JSX comentado | **CONFIRMADO con matiz** | Import **vivo sin uso** en `ingresos/page.jsx:15`; JSX comentado `:110-122`. Además el conteo "N ingresos" **incluye** `transferenciasRecibidas.length` (`page.jsx:67-73`) ⇒ patrón "contado pero invisible" (mismo patrón que el bug `otros` resuelto en 2.3). |
| `Transferenciassections.jsx` con 0 importadores | **CONFIRMADO** | Grep global: solo se define a sí misma; `gastos/page.jsx` no lo importa ni lo renderiza. |
| `gastosCalculations.js` sin importadores, contiene balances de Transferencias | **CONFIRMADO** | 0 importadores (grep global). `:26-29` `calcularTotalIngresos` con comentario **"Transferencias recibidas = ingresos"** (semántica que contradice la regla de dominio); `:32-33` `calcularNeto`. |
| `origenCompra` en `submitCompra.js` (~74): escritura sin lectores | **CONFIRMADO** | `submitCompra.js:74` única mención en el repo; sin `where("origenCompra"...)` ni lectura del campo. |
| *(Nuevo hallazgo, no listado en el HANDOFF)* | **#actual** | `FilaGasto.jsx:21-24,37,63,82` **special-casea** las filas sintéticas `tipo === "transferencia"`: subtítulo propio y **sin menú editar/eliminar**. Cualquier retiro debe tocar esta rama. |
| *(Nuevo hallazgo)* | **#actual** | `useGastos` **no expone** `transferencias` en su return (`:146-165`): el estado existe pero la sección `TransferenciasSection` nunca se monta; el único efecto visible de las enviadas son las filas sintéticas dentro de `PersonalSection`. |
| *(Nuevo hallazgo)* | **#actual** | `useIngresos` sí expone `transferenciasRecibidas` (`:135`) y `openSections.transferencias` (`:33`) aunque la sección esté comentada. |

**Conclusión de §2.4:** los hechos que sostienen el problema están **confirmados**; no hubo
cambios de comportamiento desde el handoff (solo deriva menor de números de línea en la
documentación de contexto). Un hallazgo nuevo relevante para el retiro: `FilaGasto.jsx`.

---

## 3. Modelo conceptual de entidades, relaciones, estados y saldos

### 3.1 Vocabulario (convención técnica interna)

- **Usuario:** «Reintegro» = cada operación/obligación; «Reintegros» = sección e interfaz
  (D-1). **Decisión de diseño:** la convención técnica **coincide** con el vocabulario de
  usuario — colección `reintegros` — porque divergir (p. ej. `settlements`, `recuperaciones`)
  agregará costo cognitivo sin beneficio técnico; no hay choque técnico que justifique
  separarlos. `#propuesta`.
- Sentido de una obligación, **desde la perspectiva de quien la registró**:
  - `por_cobrar`: quien registró **adelantó dinero** → debe cobrar a la contraparte.
  - `por_devolver`: quien registró **debe dinero** → debe devolver a la contraparte.
- **Devolución:** operación que **reduce** el saldo de una obligación (parcial o total).
  Toda devolución distingue **dos roles**: **quien realiza el pago** (entregó el dinero:
  `realizadoPorUid`/`realizadoPorNombre`) y **quien registra el movimiento** (ingresó el dato
  en la app, trazabilidad: `registradoPor*`). **No se asume que sean la misma persona**
  (§3.2, §6.2; PO-5 decidida).
- **Saldo:** `monto − devuelto` (`devuelto` = índice acumulado de la Σ de **entregas no
  eliminadas**, §3.2/§3.4/§3.6). **Liquidado:** `saldo ≤ 0` (estado **derivado**, §3.4).
- **Sinonimia de vocabulario (14/10/2026):** «**entrega**» (término del usuario en las
  decisiones DC) y «**devolución**» (término histórico del handoff/dominio) designan la
  misma entidad: el doc de `reintegro_devoluciones`. Se conserva «devolución» como término
  canónico del modelo (colección, indicadores) y se usan como sinónimos en todo el
  documento. La acción visible de borrado se llama **«Eliminar»** (DC-6), **nunca «Anular»**.

### 3.2 Entidades y colecciones propuestas (`#propuesta`, Etapa 4)

Se proponen **dos colecciones nuevas**, siguiendo los patrones del repo (`addDoc` +
`serverTimestamp()` + `onSnapshot` + hooks por módulo; análogo `fixed_expenses` +
`fixed_expense_entries`):

**Colección `reintegros` — una obligación (generación de saldo):**

| Campo | Tipo | Notas |
|---|---|---|
| `sentido` | `"por_cobrar" \| "por_devolver"` | Perspectiva de `registradoPor` (§3.1) |
| `monto` | number > 0 | Importe de la obligación: la **parte de la contraparte** en un gasto extraordinario (ej. $1.000 del mueble 50/50), o el total de un préstamo simple |
| `contraparteUid` | string \| null | `null` si la contraparte no tiene usuario en la app |
| `contraparteNombre` | string | Siempre presente (display; libre si es externo) |
| `groupId` | string \| null | **Opcional** (H-4, aplicado): grupo activo cuando la contraparte es miembro; `null` para externos y cuando no aplique |
| `participantes` | uid[] (1–2 en v1) | **H-4 (aplicado, 13/10/2026):** uids de las partes visibles de la obligación: `registradoPor` + `contraparteUid` si existe; las contrapartes externas no aportan uid. Preparado para N miembros (futuro: gasto entre N = N reintegros, **sin diseñar**); v1 **máximo 2** y visibilidad limitada a esas dos partes (qué ve el resto del grupo = decisión futura) |
| `concepto` | string (requerido, corto) | Ej.: "Mueble", "Entrada", "Préstamo" — vocabulario abierto que reemplaza el rol de `concepto` de transferencias. **PO-6 DECIDIDA (14/10/2026): texto libre**, sin catálogo |
| `detalle` | string \| null | Libre |
| `gastoVinculadoId` | string \| null | **Reservado**: v1 siempre `null` (vinculación a gasto = mejora futura, §11) |
| `registradoPor` | uid | Auditoría; dueño del registro |
| `registradoPorNombre` | string | Patrón del repo (`submitTransferencia`, `submitIngreso`) |
| `devuelto` | number ≥ 0 | **Índice acumulado** de devoluciones (0 al alta); **solo lo escribe el módulo, vía las escrituras transaccionales propuestas** (§4.3, §3.6 `[Diseño propuesto]`). Existe porque el SDK web **no admite queries dentro de `Transaction.get`** (solo `DocumentReference`): el acumulador permite leer–validar–escribir atómico leyendo únicamente este doc. Debe coincidir siempre con **`Σ devoluciones no eliminadas`** — **invariante funcional requerida** (§3.4, §3.6); la estrategia técnica para garantizarla y reconciliar divergencias es **propuesta pendiente, no implementada ni verificada** (T-1) |
| `movimientoInicial` | `"ninguno" \| "salida" \| "entrada"` | **PO-8 (A+, aplicado, 13/10/2026):** ¿la plata de esta obligación ya registró un gasto (`salida`) o un ingreso (`entrada`) en la app, o es movimiento de caja nuevo (`ninguno`)? Precarga por sentido (§4.1); valida enum; editable en la edición del reintegro (§12.2). Se usa **solo** para las entradas/salidas del mes (§6.2); nunca altera `totalGastos`/`totalIngresos` (I-9) |
| `createdAt` | `serverTimestamp()` | Regla del dato (dominio §11) |

**Colección `reintegro_devoluciones` — cada devolución (historial permanente):**

| Campo | Tipo | Notas |
|---|---|---|
| `reintegroId` | string (docId de `reintegros`) | Asignación explícita de la devolución a la obligación |
| `monto` | number > 0 | Puede ser parcial o completar el saldo; **nunca mayor que el saldo** al momento de escribirse (§4.3) |
| `nota` | string \| null | Ej.: "Efectivo", "Transferencia bancaria" |
| `realizadoPorUid` | string \| null | **Quien entregó el dinero** (rol financiero). `null` si pagó una persona sin usuario en la app |
| `realizadoPorNombre` | string | Display del pagador; requerido si `realizadoPorUid` es `null` |
| `registradoPor` | uid | **Quien ingresó el dato en la app** (auditoría/trazabilidad). Puede coincidir o no con el pagador |
| `registradoPorNombre` | string | |
| `fechaPago` | `Timestamp` | **H-5 (aplicado, 13/10/2026):** fecha de la entrega; **default = fecha de creación**; **editable** en el modal de devolución (§9.4). Atribuye la devolución a su mes correcto en entradas/salidas e indicadores (§6.2). `createdAt` permanece como auditoría |
| `createdAt` | `serverTimestamp()` | Fecha real de la operación (auditoría; puede diferir de `fechaPago` si el usuario corrige la fecha) |

**Dos campos, dos roles (corrección de revisión):** `realizadoPor*` y `registradoPor*` son
**independientes por diseño** y no se asume que coincidan. Ejemplo que motivó la separación:
yo pago $500 y mi pareja registra el movimiento ⇒ el pagador soy **yo** (`realizadoPorUid:
mi uid`), el registrador es ella (`registradoPor: su uid`), y el indicador "Devoluciones
realizadas" (§6.2) me atribuye el pago a **mí**, no a ella. **PO-5 DECIDIDA (14/10/2026):**
dentro de su alcance de visibilidad, **cualquiera de las dos partes** puede
registrar/editar/eliminar entregas (§12.3); los **límites por operación** (editar/eliminar
obligación, condonar) son **propuesta pendiente** (§3.6.e, matriz P-5).

**Información de eliminación y condonación — requisitos y alternativas (14/10/2026;
`#propuesta` — PENDIENTE DE APROBACIÓN de la estructura: en este documento NO se fija
esquema):**

Requisitos de información (qué debe poder distinguirse y conservarse, sin duplicar estado
derivable):

| Dato | Naturaleza | Información requerida |
|---|---|---|
| **Pago total** | **Derivado** (`saldo ≤ 0`) | **Sin flag almacenado** (coherente con "no almacenar estado"): se deduce de `monto` y `devuelto` |
| **Condonación** (DC-8) | **Hecho, no derivable** | Quién condonó, cuándo, motivo **opcional**; conservar `monto`/`devuelto` originales |
| **Eliminación lógica** (DC-6/DC-7) | **Hecho, no derivable** | Quién eliminó, cuándo, motivo **opcional**; **conservar el registro original íntegro** (obligación o entrega) |

Alternativas de estructura (evaluadas, **sin elegir**):

- **A) Campos flat** en el doc (patrón real del repo: `esPagado`, `origenCompra`) —
  lecturas simples, sin query extra.
- **B) Objeto embebido** (`eliminacion: {…}`, `condonacion: {…}`) — agrupa la constancia;
  misma lectura.
- **C) Derivar de la bitácora** (§3.6) — sin campos dedicados, pero **acopla cada lectura
  operativa a una query extra** de la subcolección.

**Recomendación `#propuesta` (PENDIENTE):** alternativa **A/B** para los hechos de
condonación y eliminación (necesarios en lecturas operativas: sellos en UI, filtros) +
**bitácora espejo** en la misma operación (§3.6). **La estructura definitiva no se aprueba
aquí**: solo quedan declarados los requisitos.

**Por qué NO se almacena `estado`:** el estado se **deriva** siempre
(`pendiente` / `parcial` / `liquidado` / `condonado`, §3.4; las obligaciones **eliminadas**
quedan fuera de las vistas y no reciben estado operativo, §3.6). Lección aprendida del módulo de fijos: el
`estado` almacenado + `getEstado` derivado generaron inconsistencias resueltas recién en 2.2
(`esPagado` vs `estado`, `getEstado` calculando `pagado_hasta` antes del pago) y 2.9
(`esDelPeriodo`). Aquí la fuente de verdad son los hechos (`monto` y la colección
`reintegro_devoluciones`); el estado se calcula. El campo `devuelto` (arriba) **no** es estado
funcional: es un **índice de agregación** escrito por **un único módulo** (Reintegros), a
través de las escrituras transaccionales **propuestas** en §3.6.c — no exclusivamente por la
transacción de §4.3 —, reconstruible con `Σ de entregas **no eliminadas**`; no hay dos
caminos de escritura como en fijos.
`#propuesta` con justificación técnica.

### 3.3 Relaciones y visibilidad

```
reintegro (obligación) 1 ──── * reintegro_devoluciones (por reintegroId)
```

- **Obligación propia:** `registradoPor == uid` del usuario.
- **Obligación en espejo:** el uid del visualizador está en `participantes` pero no es
  `registradoPor` (en v1: `contraparteUid == uid`) — la registró la contraparte (contra el
  usuario). Para el usuario visualizador, el **sentido se invierte**
  (`sentidoDelViewer`): lo que para el registrador es `por_cobrar`, para la contraparte es
  `por_devolver` (y viceversa). Un solo documento representa la obligación **una sola vez**
  (sin doble entrada cuando ambos usan la app; §5.3 regla anti doble).
- **Visibilidad:** ambas partes ven la misma obligación (patrón análogo a gastos compartidos
  / fijos compartidos: historial compartido del grupo). Con H-4, v1 mantiene la visibilidad
  **limitada a las dos partes** (`participantes` con ≤2 uids); qué ven el resto de los
  miembros del grupo es una **decisión futura**, sin diseñar en esta propuesta. Las
  devoluciones de una obligación visible también son visibles (ambas partes ven el historial
  de pagos).
- **Contraparte externa** (`contraparteUid == null`): la obligación es visible **solo** para
  `registradoPor`; no hay con quién compartirla; no se crean cuentas (D-5).
- **Queries de suscripción (diseño v1, H-4 aplicado):**
  - **R1':** `reintegros where participantes array-contains uid orderBy createdAt desc`
    (una sola query para obligaciones **propias y en espejo**: el array `participantes`
    incluye a ambas partes — §3.2. Reemplaza a las versiones previas R1 (`registradoPor`)
    + R2 (`contraparteUid`), que ahora serían redundantes). Requiere **índice compuesto**
    `participantes (array_contains)` + `createdAt` (creación al implementar, riesgo R-2)
  - D1: `reintegro_devoluciones where reintegroId in [ids visibles]` (Firestore limita `in` a
    **30 valores** → trocear si hiciera falta; volumen esperado mínimo). Las devoluciones de
    una obligación **eliminada** no entran en la lista de ids ⇒ **exclusión en cascada**,
    sin tocar esos docs (§3.6.d).
  - **Exclusión de eliminadas — P-4 (`#propuesta`, sin `where("eliminada","==",false)`):**
    el filtrado de obligaciones eliminadas se propone **en cliente** (`!eliminada`), con la
    regla de compatibilidad **campo ausente = registro activo**: un doc sin el campo **no
    deja de verse** (evita ocultación silenciosa; sin cambio de comportamiento de registros
    existentes). El filtro a nivel de query quedaría **descartado como primario** porque
    Firestore excluiría docs sin el campo ⇒ **R-2 no cambia** (índice sigue siendo
    `array-contains + orderBy`). `[Diseño propuesto — no implementado]`
  - **Filtrado de mes:** el rango de mes (`getMonthRange`, patrón `useGastos.js:50-59`) se
    usa **solo para los flujos de la Card Resumen** (§6.2; selector dentro de la card).
    **La lista de `/reintegros` no se filtra por mes** (PO-1 DECIDIDA, 14/10/2026): muestra
    todos los activos agrupados por mes de ingreso (§9.2).
- **Nota de seguridad:** no hay Firestore Rules en el repo (arquitectura §3); la visibilidad
  bilateral del diseño es **del lado cliente** y **no constituye una garantía de seguridad**
  (cualquier cliente puede intentar lo que las reglas permitan). La verificación de las
  reglas reales de Firestore y de los permisos de acceso es un **gate obligatorio previo a
   habilitar las escrituras** del módulo (§8.5, criterios de aceptación en §13 C-17):
   **sin ese gate PASS y aprobado no se escribe** en `reintegros` ni `reintegro_devoluciones`.
   Los **permisos por operación** (editar/eliminar obligación, CRUD entregas, condonar) son
   **propuesta pendiente** (matriz §3.6.e, P-5) y entran en el alcance de esas reglas.
   Lo que deberá verificarse queda documentado con `REQUIERE_VALIDACIÓN_FIRESTORE` (§8.5,
   §12.1 R-1); en esta propuesta **no se consultó Firestore**.

### 3.4 Estados y saldos (todo derivado en cliente)

Por obligación, calculado al suscribir:

| Magnitud | Fórmula |
|---|---|
| `devuelto` | Campo del doc `reintegros` (índice atómico, §3.2). **No** se calcula con una query en cada render: se lee del doc y debe coincidir con `Σ devoluciones **no eliminadas**` (**invariante funcional requerida**; ver abajo y §3.6) |
| `saldo` | `monto − devuelto` |
| `estado` | **`condonado`** si la obligación tiene constancia de condonación (hecho almacenado, §4.4 — previo a los otros casos); si no: `saldo ≤ 0` → **`liquidado`** · `devuelto > 0` (y saldo > 0) → **`parcial`** · `devuelto == 0` → **`pendiente`** |

- **Liquidación = estado derivado**, no una acción separada: la última devolución (o la que
  agota el saldo) **es** la liquidación. Diferencia deliberada con fijos (`saldarPendiente`
  marcaba `pagado = corresponde` sin registrar dinero — `useFixedExpenses.js:301-307` —,
  porque en fijos el pago entre las partes ocurre fuera de la app y la app solo lleva el
  balance interno). En Reintegros, la devolución **es** el registro del pago entre las
   partes; no hace falta un "saldar" sin dinero. `#propuesta` con justificación. *(La
   **condonación** — cierre por perdón sin dinero — es una **acción explícita** con
   constancia propia: DC-8, §4.4 —, distinta de la liquidación derivada y de la
   eliminación lógica.)*
- **Historial permanece (D-4):** liquidar no borra ni edita nada: los docs de `reintegros` y
  `reintegro_devoluciones` permanecen; la UI los lista en la pestaña "Cerrados".
- **Obligaciones eliminadas y condonadas:** una obligación **eliminada** no tiene estado
  operativo: se excluye de listas y cálculos sin borrar sus docs ni los de sus entregas
  (§3.6). Una **condonada** queda con estado derivado `condonado` y pasa a "Cerrados"
  (§4.4).
- **Reconciliación del acumulador (T-1 — precisión del usuario, 14/10/2026):** la igualdad
  **`devuelto == Σ devoluciones no eliminadas`** se documenta como **invariante funcional
  REQUERIDA** del modelo: la condición que el diseño debe cumplir siempre. La **estrategia
  técnica** para garantizarla en ejecución y reconciliar divergencias (escrituras
  transaccionales con re-lectura de los docs involucrados, disciplina de escritor único,
  verificación propuesta de reconciliación — §3.6, P-2/P-9) queda como **propuesta
  pendiente: no está implementada ni verificada**, y **no se afirma que las transacciones
  por sí solas garanticen la igualdad** (el SDK web no permite recomputar la Σ dentro de la
  transacción). Divergencia = bug (o escritura externa), no un estado a "corregir a mano";
  el historial permite reconstruir `devuelto`.

### 3.5 Alternativas evaluadas

| Alternativa | Descripción | Veredicto |
|---|---|---|
| **A. Eventos inmutables** (una colección; cada generación/devolución es un doc; saldo = Σ con signo) | Simple, addDoc puro | **Descartada para v1:** sin doc-obligación que represente "la deuda del mueble"; asignar devoluciones a obligaciones cuando hay varias por la misma contraparte queda ambigua; "liquidar" no tiene ancla documental |
| **B. Obligación + pagos embebidos** (`devoluciones: []` en el doc; `arrayUnion`) | Colección única | **Descartada para v1:** `serverTimestamp()` **no** se permite dentro de `arrayUnion` (fechas de devolución perderían precisión o requerirían timestamp de cliente); updates de array con riesgo de última-escritura-gana ante concurrencia |
| **B'. Dos colecciones** (elegida) | `reintegros` + `reintegro_devoluciones` | **Elegida:** alinea con patrones del repo; historial por operación con `serverTimestamp` real; generaciones con `addDoc`; la devolución usa `runTransaction` (el `update` del acumulador `devuelto` ocurre **dentro** de la transacción: la carrera se resuelve allí, no se evita por ausencia de updates); estado 100 % derivado (aprovecha la lección de 2.2/2.9); asignación explícita vía `reintegroId` |

### 3.6 Fuente de verdad, bitácora, eliminación lógica y permisos — `[Diseño propuesto — no implementado]`

> **Naturaleza (14/10/2026):** todo lo que sigue es **diseño propuesto** de la Etapa 3:
> **no existe** en la app, **no hay** `firestore.rules` en el repo, **no se creó** ninguna
> bitácora, **no se ejecutó** ninguna transacción ni prueba. Las marcas `[Pendiente de
> aprobación]` señalan lo que el usuario **aún no ha decidido**.

**a) Fuente de verdad del saldo (definición funcional):**

- **Hechos** = docs de `reintegros` (`monto`; constancias de condonación/eliminación cuando
  existan — requisitos en §3.2, estructura **pendiente** P-3) + docs de
  `reintegro_devoluciones` (montos, fechas, marca de eliminación) + eventos de bitácora
  (cuando exista).
- **Invariante funcional requerida:** `devuelto == Σ devoluciones NO eliminadas` y
  `saldo = monto − devuelto ≥ 0` en toda escritura válida (I-3, I-7).
- **Estrategia técnica para garantizarla y reconciliar divergencias = propuesta pendiente
  (P-2/P-9):** escrituras transaccionales que **leen** los docs involucrados (obligación
  y/o entrega) antes de escribir, disciplina de escritor único sobre `devuelto`, y
  verificación de reconciliación propuesta para la Etapa 4 (§14). **No está implementada ni
  verificada; no se afirma que las transacciones por sí solas garanticen la igualdad**
  (T-1: el SDK web no admite recomputar la Σ dentro de `Transaction.get`). Divergencia
  detectada ⇒ **bug reportado**, nunca corrección manual silenciosa.

**b) Bitácora de eventos (P-1, `[Pendiente de aprobación]` de la estructura):**

- **Requisito:** registrar **creación, edición, eliminación y condonación** de obligaciones
  y entregas de forma **inmutable** (quién, cuándo, tipo de evento, campos relevantes
  **antes/después**, motivo opcional).
- **Alternativa propuesta:** subcolección `reintegros/{reintegroId}/eventos` con permisos
  **create-only** (sin `update` ni `delete` a nivel de reglas). Eventos: `creacion`,
  `edicion`, `eliminacion`, `condonacion` × obligación/entrega.
- La bitácora **no reemplaza** los datos funcionales de los docs: los docs originales se
  conservan **siempre** (DC-6/DC-7: sin borrado físico).

**c) Operaciones sobre entregas y obligaciones — atomicidad propuesta (P-2):**

- **Eliminar una entrega (DC-6):** **una** operación transaccional propuesta que (1) lee
  entrega + obligación; (2) valida que existan, que la entrega **no esté ya eliminada** y
  que la obligación **no esté eliminada**; (3) escribe la marca de eliminación de la entrega
  con su **constancia** (quién, cuándo, motivo **opcional** — el doc original se conserva
  íntegro); (4) recalcula `devuelto` **sobre el estado leído y validado** (no una resta
  aislada ciega); (5) escribe el evento de bitácora. **Si falla cualquier paso ⇒ rollback
  total:** sin eliminación parcial, sin bitácora huérfana, **saldo sin alterar**.
- **Reabrir (derivado, DC-2):** si la entrega eliminada había liquidado la obligación
  (`saldo` vuelve a `> 0`), el estado derivado la devuelve a `parcial`/`pendiente` y la fila
  reaparece en "Pendientes" — sin acción extra.
- **Editar una entrega (PO-7/DC-2):** validación transaccional propuesta del **saldo
  resultante** (`nuevo devuelto ≤ monto`), sin sobrepago.
- **Eliminar una obligación (DC-7):** **una** operación transaccional propuesta: marca +
  constancia (quién, cuándo, motivo opcional) + evento; **conserva la obligación y sus
  entregas** (nunca borrado en cascada); si tenía constancia de condonación, **ambas
  constancias se preservan juntas** (§4.4).
- **Condonar (DC-8):** acción explícita, **distinta de eliminar**: marca + constancia
  (usuario, fecha, motivo opcional) + evento; **no crea entrega** y **no incrementa
  `devuelto`** (§4.4, I-12).
- **Conflictos y concurrencia (propuestos, `#propuesta`):** toda operación relee en
  transacción; **rechazo = sin escritura y sin alterar el saldo**, con mensaje:
  doble eliminación → *"Este registro ya fue eliminado."*; edición/eliminación de un
  registro ya eliminado → mismo rechazo; dos escrituras simultáneas sobre el mismo saldo →
  *"El saldo cambió; revisá e intentá de nuevo."*; sin red → la transacción **no escribe ni
  encola** → *"No hay conexión. Intentá de nuevo."* (§4.3, §12.2).

**d) Exclusión de eliminados en los cálculos (P-4):**

- Obligación eliminada: **fuera de las listas y de saldos/indicadores** vía filtro en
  cliente con regla **campo ausente = activo** (§3.3). **Tensión T-3 (documentada, no
  contradicción):** un doc sin el campo **no se oculta**; la colección hoy **no existe**
  (§2.4), así que no hay registros existentes que migrar — la regla es de evolución futura,
  **sin migraciones** y sin cambio de comportamiento de registros existentes.
- Entregas de una obligación eliminada: se consultan **solo si la obligación es visible**
  (D1 usa los ids visibles) ⇒ **exclusión en cascada**, sin tocar esos docs. Quedan en
  Firestore para **auditoría**, fuera de todos los saldos operativos. **Sin vista de
  auditoría en v1** (futuro, §12.6).
- **Tensión T-2 (documentada, no contradicción):** D-4 dice "el historial permanece" y DC-7
  dice "desaparece de las listas" — se aclara: el historial **permanece en la base de datos
  y en la bitácora**; lo que desaparece es **solo de la vista operativa** de la app.

**e) Permisos propuestos (DC-3: no asumir permisos ilimitados) — TODO `[Pendiente de
aprobación]` (P-5):**

| Operación | Registrador | Contraparte (participante) | No-participante | Externo (`contraparteUid: null`) |
|---|---|---|---|---|
| Registrar entrega | sí | sí (**PO-5 decidida**) | **no** | solo el registrador (no hay 2.ª cuenta) |
| Editar entrega | sí, con validación de saldo resultante (propuesto) | sí, ídem | **no** | solo registrador |
| Eliminar entrega | sí (puede reabrir, derivado) | sí | **no** | solo registrador |
| Editar obligación | **propuesto:** solo él y solo si `devuelto == 0` (P-6) | propuesto: **no** | **no** | solo registrador |
| Eliminar obligación | **alternativas sin decidir:** E1 = solo registrador (recomendada: protege el historial de la otra parte) · E2 = ambos participantes | | **no** | solo registrador |
| Condonar deuda | **alternativas sin decidir:** C1 = solo el acreedor según su vista (`sentidoDelViewer == por_cobrar`, recomendada) · C2 = ambos participantes; caso borde externo = solo registrador | | **no** | solo registrador |

- **Congelaciones propuestas (P-6, `[Pendiente de aprobación]`):** sobre obligación
  **condonada** → solo lectura + «Eliminar»; sobre obligación **eliminada** → ninguna
  escritura (doc congelado, I-11); **entregas de una condonada** → congeladas.
- El **enforcement server-side** corresponde a `firestore.rules` dentro del gate §8.5
  (subetapa 4.0, criterios **propuestos — no implementados**).

---

## 4. Reglas de negocio

### 4.1 Gastos extraordinarios y adelantos (generación — crea saldo)

1. **Qué genera saldo:** el registro de una **obligación** (`reintegros`) representa dinero
   adelantado por el usuario a una contraparte (`por_cobrar`) o deuda asumida por el usuario
   con una contraparte (`por_devolver`). Casos: gasto extraordinario pagado por el usuario en
   favor de otro (mueble 50/50, entrada de amigo), préstamo de dinero, pago en nombre de otro.
2. **Monto:** el importe de la obligación — en un gasto extraordinario compartido, **la parte
   de la contraparte** (no el total del gasto). Ej.: mueble $2.000, 50/50 ⇒ `monto: 1000`.
3. **El gasto de fondo se registra aparte, con la maquinaria actual:** el usuario registra el
   gasto en `/gastos` como hoy (compartido diario — suma lo que pagó el usuario en su total
   `totalGruposUsuario` — o personal del pagador). **El módulo Reintegros no escribe en
   `gastos` ni en `ingresos`** y no crea deuda desde gastos compartidos (D-6: no convertir
   retroactivamente). La vinculación documental (`gastoVinculadoId`) queda **reservada** para
   una mejora futura; v1 es **opt-in manual y desacoplada**.
4. **La generación no infla nada:** no entra en `totalGastos` ni `totalIngresos` (§6,
   invariante I-1). **Consecuencia contable explícita (efecto aceptado, no bug):** el gasto
   de fondo permanece **íntegro** en `totalGastos` del mes en que se registró (mueble de
   $2.000, 50/50, pagado por el usuario ⇒ "Total del mes" muestra $2.000 —
   `useGastos.js:86-90,130`); cobrar la parte de la contraparte **no lo reduce** ni suma
   ingreso (D-2, I-1). La doble captura (gasto + reintegro) es deliberada: el gasto mide lo
   que salió del bolsillo del usuario; el reintegro mide la recuperación entre las partes.
5. **`por_devolver` self-registered:** el usuario también puede registrar **su propia deuda**
   cuando la contraparte no usa la app (§5.2).
6. **`movimientoInicial` (PO-8 A+, aplicado):** el alta **precarga** el valor según el
   sentido — `por_cobrar` ⇒ `"salida"` (la plata del usuario salió para adelantar);
   `por_devolver` ⇒ `"entrada"` (la plata ingresó a la app para pagar una deuda) — junto con
   un **texto anti-doble-captura** que el usuario debe confirmar: *si el fondo de esta
   obligación ya está registrado como gasto o ingreso en la app (caso mueble: el gasto de
   $2.000 ya está en `/gastos`), elegí "ninguno" para no contar dos veces el dinero en
   caja* (§6.2). El campo valida el enum (`ninguno`/`salida`/`entrada`) y es editable en la
   edición del reintegro (§12.2). **No altera `totalGastos` ni `totalIngresos`** (I-9).

### 4.2 Devoluciones parciales

1. Una devolución **parcial** es un doc en `reintegro_devoluciones` con `0 < monto < saldo`
   y con **`fechaPago`** (fecha de la entrega; H-5 — default = fecha de creación, editable
   en el modal; §3.2, §9.4).
2. **Reduce** el saldo de la obligación correspondiente (D-3), en cualquier sentido.
3. El `estado` derivado pasa a `parcial`; la obligación sigue abierta.
4. **No infla** ingresos (si el usuario recibe dinero) ni gastos (si el usuario devuelve
   dinero): la devolución **no es** un movimiento de `/ingresos` ni `/gastos` (D-2).
5. **Quien registra vs quien paga (roles separados):** la devolución identifica a **quien
   entregó el dinero** (`realizadoPorUid`/`realizadoPorNombre`) y a **quien ingresó el dato**
   (`registradoPor*`), de forma independiente (§3.2). El indicador "Devoluciones realizadas"
   (§6.2) usa **el pagador**, no el registrador. **No se asume que coincidan:** si la pareja
   registra un pago hecho por el usuario, el pago se le atribuye al usuario.
   - *Quién puede registrar, editar y eliminar entregas:* **PO-5 DECIDIDA (14/10/2026):**
     **cualquiera de las dos partes, dentro de su alcance de visibilidad**, puede
     gestionar entregas (patrón análogo a `registrarPago` de fijos — `useFixedExpenses.js:
     270-299` —, con roles separados: pagador `realizadoPorUid` vs registrador
     `registradoPor`). Los **límites por operación** (validaciones, congelaciones,
     permisos de editar/eliminar obligación y condonar) son **propuesta pendiente**
     (§3.6.e, matriz P-5).
   - El saldo reduce sin importar quién lo registre.

### 4.3 Devoluciones completas

1. Una devolución **completa** es la que deja `saldo ≤ 0`: un doc con `monto == saldo`
   (tope permitido — nunca mayor, ver punto 3) o varias parciales que lo agotan.
2. El `estado` derivado pasa a **`liquidado`**. El historial (obligación + devoluciones)
   permanece íntegro (D-4).
3. **Sobrepago (devolución > saldo): IMPEDIDO en v1 — la operación no se registra.**
   Especificación obligatoria (no se deja librado al formulario):

   | Control | Regla |
   |---|---|
   | **Validación del importe (form)** | El input acota al saldo vigente; el guardar queda deshabilitado si `importe <= 0` o `importe > saldo`. Mensaje: *"El importe supera el saldo pendiente de $X."* *(En estas fórmulas, `importe` = campo `monto` de la devolución, para no confundirlo con `monto` de la obligación.)* |
   | **Validación al guardar** | `submitDevolucion` re-verifica **dentro de la transacción**, sin confiar en el form: `importe > 0` e **`importe <= obligacion.monto − obligacion.devuelto`** (lectura del doc obligación dentro de `runTransaction`) |
   | **Mecanismo de consistencia** | **Transacción de Firestore** (`runTransaction`): (1) `tx.get(reintegroRef)` — **solo se puede leer el doc obligación dentro de una transacción** (el SDK web no admite queries en `Transaction.get`); (2) validar `importe <= monto − devuelto`; (3) `tx.set` del doc de devolución nuevo (id pre-generado con `doc(collection(db, "reintegro_devoluciones"))`; `addDoc` no existe dentro de transacciones) **+** `tx.update(reintegroRef, { devuelto: devuelto + importe })`. Si la validación falla, la transacción aborta **sin escribir nada** y la UI muestra el mensaje con el modal abierto (patrón `PagarModal` try/catch, §11.1). El `Σ devoluciones` **no** se lee dentro de la transacción (imposible con queries): el saldo validado sale del acumulador `devuelto` (§3.2), que se actualiza en la misma transacción. Es la **única** operación propuesta con transacción (el resto de la app usa `addDoc` puro): se justifica porque es la única que necesita **leer–validar–escribir atómicamente** sobre un saldo |
   | **Concurrencia (dos escrituras simultáneas)** | Solo una transacción gana; la segunda relee `devuelto` ya reducido y, si el importe ya no alcanza, **falla sin escribir** con el mensaje: *"El saldo cambió; revisá el importe e intentá de nuevo."* Nunca quedan dos devoluciones parciales incoherentes ni `saldo < 0` |
   | **Conectividad** | La transacción **requiere red**: sin conexión **no escribe ni encola** y puede tardar unos segundos en fallar; la UI debe manejar la espera (loading con timeout) y, si no hay red, mostrar *"No hay conexión. Intentá de nuevo."* y mantener el modal abierto. **Difiere** del comportamiento en cola de `addDoc` (R-6): las devoluciones **no** quedan pendientes offline |
   | **Resultado garantizado** | `saldo >= 0` en todos los caminos de la app; una devolución nunca puede exceder el saldo al momento de escribirse (invariante I-7) |

   - El modelo **tolera** defensivamente `saldo < 0` como `liquidado` (§3.4) por si apareciera
     un dato externo, pero con esta regla **ningún flujo de la app lo produce**: verlo sería
     señal de bug o de escritura externa.
   - **Edición de `monto` de la obligación:** también es **transaccional** — leer el doc
     (con `devuelto`), validar `monto > 0` y **`monto >= devuelto`**, y `update` en la misma
     transacción (§12.2). Así no se puede bajar el monto por debajo de lo ya devuelto.
   - **Corrección de entregas cargadas por error — PO-7 DECIDIDA (14/10/2026):** la
     corrección es (i) **editar** la entrega (validando el **saldo resultante**, sin
     sobrepago — DC-2) o (ii) **«Eliminar»** la entrega con **eliminación lógica**
     (DC-6): el doc original se conserva con su constancia (quién, cuándo, motivo
     **opcional**) y la operación — eliminación, recálculo del saldo/estado y registro de
     auditoría — debe ser **atómica** (rollback total ante cualquier fallo, §3.6.c).
     **«Eliminar» es la única acción visible: no existe «Anular».** Queda como **propuesta
     pendiente** la estrategia técnica exacta de garantía/reconciliación de `devuelto`
     (T-1: invariante funcional requerida; estrategia no implementada ni verificada).
   - **Eliminar una entrega que había liquidado la obligación:** la **reabre** (el estado
     derivado vuelve a `parcial`/`pendiente` y la fila reaparece en "Pendientes" — DC-2,
     §3.6.c).
   - **Sobrepagos — PO-3 DECIDIDA (14/10/2026):** se mantiene **impedido en v1** (la
     operación no se registra). Admitir pagos superiores al saldo / "a favor" queda como
     **evolución futura** que exigiría un modelo funcional propio (¿se guarda a favor?
     ¿se descuenta de otra obligación?) y decisión explícita (§12.3).

### 4.4 Liquidaciones, condonación y eliminación (cierres diferenciados — DC-8, 14/10/2026)

| Acción | Qué es | Efecto | ¿Mueve dinero? |
|---|---|---|---|
| **Pago total** | La entrega que agota el saldo | **Estado derivado** `liquidado` (sin acción "saldar" separada) | **Sí:** es una entrega real |
| **Condonación** (DC-8, en alcance) | **Acción explícita y diferenciada**: perdón de la deuda | Estado derivado `condonado` con constancia (usuario, fecha, motivo **opcional**) | **No:** no crea entrega, **no incrementa `devuelto`** ni el dinero recibido (I-12) |
| **Eliminación** (DC-7) | Corrección de un registro cargado por error | **Eliminación lógica**: sale de listas/cálculos; doc + constancia conservados (§3.6) | No mueve dinero; **conserva** entregas asociadas |

1. **Liquidación = estado derivado `liquidado`** (§3.4). No hay acción "saldar" separada en
   v1 (diferencia justificada con fijos, §3.4).
2. Una obligación **liquidada** no admite nuevas entregas (botón deshabilitado en UI). La
   **tolerancia defensiva** del modelo a `saldo < 0` queda solo para datos externos o
   escrituras fuera de flujo: **ningún camino de la app lo produce** (validación
   transaccional propuesta, §4.3, I-7).
3. **Condonación (DC-8 — dentro del alcance desde 14/10/2026):**
   - Acción explícita en la fila de la obligación (label UI propuesto: **«Condonar»**,
     `#propuesta` P-7) con confirmación breve.
   - Registra: **usuario** (`condonadaPor*`), **fecha**, **motivo opcional** (requisito de
     información §3.2; estructura de campos **pendiente**, P-3).
   - **No es un pago ni una eliminación:** no crea entrega, no incrementa `devuelto`, no
     suma en "Devoluciones recibidas" ni en entradas/salidas de caja (I-12).
   - Estado derivado → `condonado`; la obligación pasa a **"Cerrados"** con sello
     "Condonda" (label `#propuesta`). No admite nuevas entregas.
   - **Eliminar una obligación condonada** (si corresponde) **no borra la constancia de la
     condonación**: ambas constancias (condonación y eliminación) permanecen en el doc y
     como eventos (§3.6).
   - Permiso para condonar: **propuesta pendiente** (alternativas C1/C2, §3.6.e).
4. **No existe "cerrar mes":** los saldos son **continuos** (una deuda no se liquida porque
   cambie el mes; se liquida cuando se paga o se condona). El resumen mensual (§6) es un
   **corte de lectura**, no un proceso de cierre (mismo criterio que fijos: historial
   permanece).
5. **Las cuatro acciones diferenciadas (DC-8):** registrar entrega · eliminar entrega ·
   condonar · eliminar obligación — más la edición (obligación/entrega). **Ninguna se
   presenta como alternativa de otra en la UI**; la acción de borrado visible es
   **exclusivamente «Eliminar»** (DC-6; nunca «Anular»).

### 4.5 Invariantes del modelo

| ID | Invariante |
|---|---|
| I-1 | Ningún monto de `reintegros` ni `reintegro_devoluciones` entra en `totalGastos` (`useGastos.js:130`) ni en `totalIngresos` (`useIngresos.js:93-118`). |
| I-2 | Toda obligación visible tiene `monto > 0`; toda devolución tiene `reintegroId` válido y `monto > 0`. |
| I-3 | El estado nunca se almacena; siempre se deriva de `monto` y `devuelto` (índice de la Σ de devoluciones, §3.4). **`devuelto == Σ devoluciones NO eliminadas` = invariante funcional REQUERIDA** (la estrategia técnica de garantía/reconciliación es **propuesta pendiente** — T-1, §3.6.a, no implementada ni verificada). |
| I-4 | El historial (`reintegros` + `reintegro_devoluciones`) **nunca se borra físicamente** — ni al liquidar, ni al condonar, ni al eliminar: toda eliminación es **lógica y auditable** con constancia (quién, cuándo, motivo opcional) y conserva el registro original (DC-6/DC-7, §3.6). *(Actualización 14/10/2026: reemplaza la cláusula "borrado solo por corrección de error", incompatible con "sin borrado físico"; justificación registrada en el encabezado.)* |
| I-5 | Una obligación con `contraparteUid != null` y `groupId != null` es visible para ambos miembros del grupo con sentido espejo (§3.3). |
| I-6 | Toda devolución identifica **por separado** al pagador (`realizadoPorUid`) y al registrador (`registradoPor`); los indicadores usan el **pagador** para "Devoluciones realizadas" (§6.2). No se asume que coincidan. |
| I-7 | Ninguna devolución puede exceder el saldo de su obligación **al momento de escribirse** (validación transaccional sobre `monto − devuelto`, §4.3); `saldo >= 0` en todos los caminos de la app. La **edición** de una entrega valida además el **saldo resultante** (DC-2) |
| I-8 | El **deudor** de la obligación es quien debe figurar como pagador de sus devoluciones: `sentidoDelViewer == por_cobrar` ⇒ pagador = contraparte; `por_devolver` ⇒ pagador = usuario. Un pagador **tercero** (ajeno a ambas partes) es un caso **asimétrico**: el **acreedor** lo ve reflejado en "Devoluciones recibidas" (el indicador sigue a la obligación), pero el **deudor** no ve una "Devolución realizada" (porque no pagó él). La UI precarga al deudor como pagador y avisa si se elige un tercero (§9.4). **Este invariante es de atribución
contable; es compatible con la PO-5 decidida** (alt A; §12.3). |
| I-9 | Las **entradas y salidas de reintegros del mes** (§6.2, PO-8 A+) son **métricas derivadas**: se calculan en cliente a partir de `movimientoInicial`, `fechaPago` y los sentidos; **jamás escriben** en `gastos`, `ingresos`, `totalGastos` ni `totalIngresos`. |
| I-10 | Toda eliminación (obligación o entrega) es **lógica**, conserva el registro original y su constancia (quién, cuándo, motivo opcional); **sin borrado físico** y sin borrado en cascada de documentos históricos (DC-6/DC-7, §3.6). |
| I-11 | Un registro **eliminado** es **inmutable**: sin ediciones, sin re-eliminación, sin escrituras posteriores (rechazo transaccional propuesto, §3.6.c). |
| I-12 | La **condonación** no es un pago: **no** crea entrega, **no** incrementa `devuelto` ni el dinero recibido, ni suma en entradas/salidas de caja (DC-8, §4.4). |

---

## 5. Tratamiento de los casos en que el usuario debe cobrar y en que debe devolver

### 5.1 Usuario debe cobrar (`sentido: "por_cobrar"`)

- **Registro:** lo realiza **quien adelantó** (el usuario), con la contraparte seleccionada
  (miembro del grupo con `uid` o externo con nombre libre).
- **Ejemplos:** "Compré el mueble para la casa, pagué $2.000, mi parte es $1.000" →
  `por_cobrar`, `monto: 1000`; "Compré una entrada para un amigo, $500" → `por_cobrar`,
  `monto: 500`; "Le adelanté $200 en efectivo" → `por_cobrar`, `monto: 200`.
- **En la UI:** aparece en el bloque **"Te deben"** con saldo completo; cada devolución
  (parcial o total) reduce el saldo; al llegar a 0 pasa a la pestaña **"Cerrados"**.
- **Dinero recibido:** la devolución recibida **no es ingreso** (D-2, I-1) y se contabiliza
  solo en el resumen de Reintegros (§6).

### 5.2 Usuario debe devolver (`sentido: "por_devolver"`)

Dos escenarios, con reglas distintas:

- **(a) La contraparte usa la app:** la contraparte registra **su** obligación `por_cobrar`
  (contra el usuario). El usuario la ve **en espejo** (§3.3) bajo el bloque **"Debés"**
  (`sentidoDelViewer = por_devolver`). **No debe auto-registrar** una deuda en paralelo
   (regla anti doble, §5.3). Las devoluciones que el usuario haga se registran **contra ese
    mismo doc** (`reintegroId`) — quien paga queda en `realizadoPorUid`, quien opera la app en
   `registradoPor` (§3.2; puede no coincidir — **PO-5 decidida**, §12.3) —, y la contraparte ve el
   saldo reducirse.
- **(b) La contraparte NO usa la app** (amigo, familiar, externo): el usuario se registra a
  **sí mismo** la deuda: `por_devolver`, `contraparteUid: null`, `contraparteNombre` libre.
  Solo el usuario la ve. El usuario registra sus devoluciones contra esa obligación.

### 5.3 Regla anti doble registro — PO-4 DECIDIDA: confirmación bilateral (14/10/2026)

Cuando **ambos** miembros usan la app, la regla funcional para evitar que la misma
obligación real aparezca dos veces (una `por_cobrar` y otra `por_devolver` duplicada) es la
**confirmación bilateral estilo fijos** (**PO-4, decidida por el usuario**: la otra parte
confirma la obligación), manteniendo además la convención de uso (solo quien adelantó
registra la generación; el otro la ve en espejo, §5.2).

- **Alcance documentado (sin inventar detalles no definidos):** la confirmación aplica
  cuando la contraparte **tiene usuario en la app** (externos: no hay quién confirme,
  §8.2).
- **Comportamiento mínimo definido por la decisión:** la obligación requiere la
  confirmación de la otra parte (patrón de fijos, §11.1 como referencia de UX).
- **SIN DEFINIR (queda en §12.6, no se diseña aquí):** estados/queries/UI de la
  confirmación; qué ocurre entre el alta y la confirmación (¿visibilidad? ¿puede la otra
  parte registrar entregas? ¿puede el creador editar o eliminar?); interacción con
  condonación y eliminación; subetapa de implementación (§14).
- **DC-4 (14/10/2026):** el alta **no** emite advertencias ni bloqueos por posibles
  duplicados (título/contraparte/monto similares): eso es **distinto** de la confirmación
  bilateral y no se propone (el riesgo residual R-4 queda documentado en §12.1).

*(Mientras la confirmación no esté implementada, persiste la convención de uso como
mitigación documentada — R-4, §12.1. La recomendación previa del diseño (alternativa A)
queda **superada** por la decisión del usuario; §12.3.)*

### 5.4 Cuadro resumen de roles

| Situación | Quién registra la obligación | Sentido almacenado | Cómo la ve el usuario | Quién registra la devolución (rol usual) |
|---|---|---|---|---|
| Usuario adelantó (pareja/grupo) | Usuario | `por_cobrar` (contraparte = otro miembro, con `uid` + `groupId`) | "Te deben" | Cualquiera de las dos partes (PO-5 decidida) |
| Usuario adelantó (externo) | Usuario | `por_cobrar` (contraparte externa, `uid: null`) | "Te deben" (solo él lo ve) | Usuario (la contraparte no tiene app) |
| Contraparte adelantó (pareja/grupo) | Contraparte | `por_cobrar` (contra el usuario) | "Debés" (espejo, sentido invertido) | Cualquiera de las dos partes (PO-5 decidida); usualmente quien devuelve |
| Usuario debe (externo) | Usuario (auto-registro) | `por_devolver` (contraparte externa) | "Debés" (solo él lo ve) | Usuario |

> **Roles de una devolución:** quién **la registra** (`registradoPor`) y quién **pagó**
> (`realizadoPorUid`) son campos **distintos y no se asume que coincidan** (§3.2, §4.2
> (punto 5), §6.2). Esta tabla solo indica el rol usual de registro; el pagador se identifica
> siempre por separado. **PO-5 DECIDIDA (14/10/2026):** ambas partes, dentro de su alcance,
> gestionan entregas (§12.3).

---

## 6. Reglas de balance mensual y separación de ingresos, gastos y reintegros

### 6.1 Separación semántica (reglas del visualizador — dominio §10, D-6)

- `/gastos` (personales, compartidos diarios, fijos) y `/ingresos` (sueldo, bandas, freelance,
  otros) **no cambian de fórmula** por este módulo. Los reintegros viven en su **propia vista
  `/reintegros`** con su propio resumen mensual.
- **Invariante I-1:** ni generaciones ni devoluciones entran en `totalGastos` ni
  `totalIngresos`.
- El retiro de Transferencias (§7) es lo que **corrige** la violación actual de esta regla
  (transferencias recibidas hoy suman como ingreso en el código).
- **Totales brutos intactos (PO-8 A+):** `totalIngresos` y `totalGastos` muestran **solo**
  sus sumas de siempre; el "excedente de caja" de §6.2 se deriva de ellos y de las
  entradas/salidas de reintegros, pero **no altera** esas fórmulas ni agrega líneas nuevas a
  `/ingresos` o `/gastos`. **Acordeones retirados (DC-1, 14/10/2026):** esas páginas **no
  reciben** ninguna sección nueva del módulo (§9.7).

### 6.2 Resumen mensual de Reintegros (§3.4.4) — indicadores y caja (PO-8: A+)

La card **Resumen del mes** de `/reintegros` (con **selector de mes propio dentro de la
card**, patrón `MonthSelectorModal`; el encabezado se titula solo **«Reintegros»** — PO-1
DECIDIDA: el selector **solo afecta los flujos** de ese mes y **nunca filtra la lista**)
evalúa, como mínimo y por separado, las cuatro distinciones contables exigidas. **Los
acordeones de `/ingresos` y `/gastos` fueron retirados por DC-1** (§9.7): el resumen vive
**solo** en `/reintegros`. Se propone terminología más clara y **una adición simétrica**
(permitida por el handoff: "puede proponer terminología más clara, pero debe conservar
estas distinciones"):

| §3.4.4 pide | Nombre propuesto | Cálculo (del mes visible) |
|---|---|---|
| gastos u operaciones que generan dinero por recuperar | **Generado por recuperar** | `Σ monto` de obligaciones con `sentidoDelViewer == por_cobrar` creadas en el mes (por `createdAt` de la obligación, en cliente) |
| *(extensión simétrica recomendada)* | **Deuda generada** | `Σ monto` de obligaciones con `sentidoDelViewer == por_devolver` creadas en el mes (por `createdAt`) |
| devoluciones recibidas | **Devoluciones recibidas** | `Σ monto` de devoluciones de obligaciones `por_cobrar` del visualizador, con **`fechaPago`** de la devolución en el mes (dinero que **ingresó** al reducirse mi acreencia; H-5) |
| devoluciones realizadas | **Devoluciones realizadas** | `Σ monto` de devoluciones con **`realizadoPorUid == uid`** del visualizador — es decir, **quien pagó**, no quien registró (§3.2, I-6) — con **`fechaPago`** en el mes. Ej.: pago $500 y mi pareja los registra ⇒ me figura **a mí** |
| saldos pendientes de cobro y de devolución | **Pendiente de cobro · Pendiente de devolución** | `Σ saldo` de obligaciones **abiertas** (`saldo > 0`) de **todos** los activos, cualquiera sea su mes de ingreso (**stock global — PO-1 DECIDIDA, 14/10/2026**), agrupadas por `sentidoDelViewer`; **sin** filtro del selector (no es flujo) |

**Entradas y salidas de reintegros del mes (PO-8 A+ — decidida por el usuario):** junto a
los indicadores anteriores, la **Card Resumen de `/reintegros`** muestra dos totales de
**caja por concepto de reintegros** (métricas derivadas; I-9):

| Indicador | Cálculo |
|---|---|
| **Entradas de reintegros** | Devoluciones recibidas del mes (`fechaPago`) + `Σ monto` de obligaciones **creadas en el mes** (`createdAt`) con `movimientoInicial == "entrada"` |
| **Salidas de reintegros** | Devoluciones realizadas del mes (`fechaPago`, pagador = usuario) + `Σ monto` de obligaciones **creadas en el mes** (`createdAt`) con `movimientoInicial == "salida"` |

**Excedente de caja — fórmula de referencia, NO línea calculada en pantalla (PO-8 A+):**

```
excedente de caja = totalIngresos − totalGastos + entradas de reintegros − salidas de reintegros
```

El usuario lo calcula manualmente; el diseño **no** muestra una línea de excedente en
ninguna pantalla y **no** agrega líneas nuevas a las pantallas existentes (evolución futura
posible, §12.3 PO-8). **Los totales brutos `totalIngresos`/`totalGastos` no se alteran**
(§6.1, I-9).

> **Nota de atribución (I-8):** "Devoluciones **recibidas**" se calcula **por la obligación**
> (sentido del visualizador), mientras que "Devoluciones **realizadas**" se calcula **por el
> pagador**. Con el invariante I-8 (pagador = deudor) ambas se complementan sin solaparse y
> **cada devolución cae en exactamente un indicador** de cada visualizador (prueba de
> partición en §14). Si un **tercero** paga una deuda: el acreedor la ve en "recibidas"; el
> deudor **no** ve una "realizada" (asimetría documentada en I-8) — y tampoco la cuenta en
> sus **salidas de caja**, porque no salió plata de su bolsillo. La UI precarga al deudor
> como pagador y avisa ante un tercero (§9.4).

**Cuestión derivada PO-8a — SIN OBJETO (14/10/2026):** refería a si `movimientoInicial`
aparece como ítem en los acordeones de §9.7; los acordeones fueron **retirados por DC-1**,
por lo que no queda nada que decidir (§12.3).

**Separación exigida por el alcance:** el resumen distingue por separado (a) **movimientos
del mes**, (b) **saldos pendientes actuales** (stock) y (c) **devoluciones registradas**;
los **ingresos y gastos reales** siguen midiéndose solo en `/ingresos` y `/gastos` (§6.1).
Los reintegros **no se contabilizan como ingresos ni como gastos nuevos**: representan la
devolución o reducción de una obligación existente (D-2, invariante I-1).

**"Saldos pendientes" — PO-1 DECIDIDA (14/10/2026, según el prompt del usuario):**
los saldos pendientes de §6.2 se muestran como **stock vigente global** (todas las
obligaciones **abiertas**, cualquiera sea su mes de generación), **etiquetados como
globales**, **junto** a los flujos mensuales filtrados por el selector de la card. La
alternativa ("solo obligaciones generadas en el mes visible") queda **descartada y
documentada** en §12.3 (recomendación previa del diseño superada por la decisión).

### 6.3 Dónde vive el resumen — **DECIDIDO (PO-2, CONFIRMADO el 13/10/2026)**

`HANDOFF-ETAPA-3.md` §3.4.4 pide "Mostrar un resumen mensual de Reintegros **en el
balance**", pero la app **no tiene** una página "Balance" unificada (los totales están
repartidos en `TotalMesCard` de `/gastos`, `TotalIngresosCard` de `/ingresos`,
`BalanceMesCard` de `/gastos-fijos`; `/home` no muestra datos financieros — `useHomeData.js`
solo trae saludo/quick actions).

**Decisión del usuario (13/10/2026, según el prompt): PO-2 = CONFIRMADO** — resuelta así:

- El **resumen mensual** vive en `/reintegros` (card Resumen del mes, §9.2).
- `/home` recibe un **botón "Reintegros"** como **entrada de navegación** (quick action
  `path: "/reintegros"`; §9.1) — **sin** duplicar cifras ni resúmenes en `/home`.
- ~~Los **acordeones informativos del mes** aparecen en `/ingresos` (entradas) y `/gastos`
  (salidas)~~ — **retirados por DC-1 (14/10/2026):** `/ingresos` y `/gastos` **no** reciben
  secciones nuevas; el resumen queda **solo** en `/reintegros` (§9.7, nota de
  trazabilidad).

**Nota frente al handoff ("en el balance" — citada, no reinterpretada en silencio):**
`HANDOFF-ETAPA-3.md` §3.4.4 dice textual "Mostrar un resumen mensual de Reintegros **en el
balance**" y exige evaluar "como mínimo y por separado": (a) gastos u operaciones que
generan dinero por recuperar; (b) devoluciones recibidas; (c) devoluciones realizadas;
(d) saldos pendientes de cobro y de devolución. La decisión del usuario ubica el resumen
en `/reintegros` con acceso desde `/home`; **las cuatro distinciones contables se
conservan íntegras** en §6.2, por lo que lo sustantivo del punto 4 del handoff queda
cubierto y la lectura en tensión ("en el balance" como página unificada) queda **resuelta
por el usuario**. `#decisión`.

---

## 7. Tratamiento de Transferencias legacy: registros existentes (gate) y lecturas históricas/código

**Decisión aprobada (D-7, HANDOFF §5):** el flujo funcional de Transferencias será
**sustituido por Reintegros** dentro de la futura Etapa 4. Esta sección localiza todo lo
asociado, explica cómo evitar la inflación de totales y recomienda qué hacer con código,
registros y referencias **diferenciando cada caso**.

### 7.1 Inventario completo de Transferencias en el código (verificado con greps)

| # | Archivo (`AppFinanciera/`) | Qué hace | Recomendación para Etapa 4 |
|---|---|---|---|
| 1 | `app/agregar/page.jsx:8` | import vivo de `ModoTransferencia` | **Eliminar** import (junto con el bloque de retiro) |
| 2 | `app/agregar/page.jsx:79-91` | botón "Transferencia" **comentado** (alto deshabilitado) | **Eliminar** el bloque comentado (el hueco lo ocupa "Reintegro", §9) |
| 3 | `app/agregar/page.jsx:133-135` | render `modo === "transferencia"` (inalcanzable) | **Eliminar** (reemplazado por el modo Reintegro) |
| 4 | `app/agregar/components/ModoTransferencia.jsx` (234 l.) | wizard completo de alta (grupo → destinatario → concepto/monto) | **Eliminar archivo** (el patrón de alta se reutiliza conceptualmente por `ReintegroModal` — modal de un paso, no wizard — sin arrastrar código) |
| 5 | `app/agregar/components/transferencia/hooks/useModoTransferencia.jsx` (139 l.) | estado del wizard; carga miembros vía `groups.members` + `users` | **Eliminar carpeta** `transferencia/` completa |
| 6 | `app/agregar/components/transferencia/helpers/submitTransferencia.jsx` (37 l.) | `addDoc` a `transferencias` (`:18-36`); **único escritor** de la colección | **Eliminar** (con la carpeta). *Nota: retirar el escritor es coherente con la ausencia total de datos (gate §2.3).* |
| 7 | `app/gastos/services/subscribeGastos.js:26-38,60-96` | query `transferencias` por `groupId` por grupo; entra en `totalQueries` (`:32`) y en `onChange` | **Quitar** la query y el mapa; `totalQueries` queda `1 + groupIds.length` (más simple y más rápido el `onLoaded`) |
| 8 | `app/gastos/hooks/useGastos.js:18,27-29,59,65-76,129` | estado `transferencias`; filas sintéticas `tipo:"transferencia"` dentro de `gastosPersonales` → inflan `totalPersonales`/`totalGastos` | **Quitar** toda la rama; `gastosPersonales` = solo gastos personales reales |
| 9 | `app/ingresos/services/subscribeIngresos.js:50-72,76-125` | query `transferencias` por `paraUid` + rango; `emitIfReady` dual | **Quitar** la query; el service queda con una sola query (simplifica el patrón de carga) |
| 10 | `app/ingresos/hooks/useIngresos.js:22-25,33,49-55,103-114,117,135` | `transferenciasRecibidas`; **suman en `totalIngresos`** | **Quitar**; `totalIngresos` = solo ingresos reales (cumple I-1 y D-2) |
| 11 | `app/ingresos/page.jsx:15,39,72,110-122` | import vivo sin uso; `transferenciasRecibidas.length` en "N ingresos"; JSX comentado | **Quitar** import, conteo y JSX comentado |
| 12 | `app/gastos/sections/Transferenciassections.jsx` (51 l.) | sección acordeón de transferencias; **0 importadores** | **Eliminar archivo** (código muerto del área; evaluado: conservarlo no aporta — su UI fue reemplazada conceptualmente por `FilaReintegro`) |
| 13 | `app/gastos/components/FilaTransferencia.jsx` (62 l.) | fila de transferencia (recibida/enviada); usado por #12 y #14 | **Eliminar archivo** (con #12 y #14) |
| 14 | `app/ingresos/sections/TransferenciasIngresosSection.jsx` (30 l.) | acordeón en `/ingresos`; importado sin uso | **Eliminar archivo** |
| 15 | `app/gastos/components/FilaGasto.jsx:21-24,37,63,82` | rama `tipo === "transferencia"` (sin editar/eliminar) | **Quitar la rama** (queda sin efecto tras #8; limpieza coherente con el retiro) |
| 16 | `app/gastos/helpers/gastosCalculations.js` (34 l., **0 importadores**) | `calcularTotalIngresos` ("Transferencias recibidas = ingresos") y `calcularNeto` — semántica **contraria** a D-2 | **Eliminar archivo** (evaluado para Etapa 3 como pidió 2.6: sin importadores y su única "utilidad" es la semántica legacy que Reintegros reemplaza; conservarlo perpetuaría la confusión de dominio) |
| 17 | *(campo aparte)* `app/agregar/components/compra/helpers/submitCompra.js:74` | `origenCompra: true` escrito sin lectores | **No tocar** — decisión 2.6 #2 ya cerrada (conservar; posible uso externo). No guardado con Transferencias; queda como estaba. Uso externo: `REQUIERE_VALIDACIÓN_FIRESTORE` solo si se quisiera confirmar, **sin acción en Etapa 4** |

**Índices Firestore en riesgo hoy:** `subscribeGastos`/`subscribeIngresos` requieren
índices compuestos sobre `transferencias` (`groupId`+`createdAt`, `paraUid`+`createdAt` —
arquitectura §2). Con la colección vacía no se manifiestan errores; **al retirar las queries
(#7, #9) esos índices dejan de ser necesarios** (no hay que crear ni borrar nada para el
retiro).

### 7.2 Registros existentes (gate) y lecturas históricas

- **Registros en `transferencias`:** **0** (gate §2.3, PASS). ⇒ **No hay datos que migrar ni
  borrar** al retirar el flujo. **No se elimina, no se migra, no se toca Firestore** (D-7).
- **Referencias en otros lugares del código:** inventario **completo** en §7.1 (greps
  exhaustivos). No se hallaron lecturas/escrituras de `transferencias` fuera de ese listado.
- **Referencias fuera del código del repo** (scripts de consola, copias, integración del
  Organizador): **no verificables con código** → `REQUIERE_VALIDACIÓN_FIRESTORE` si se
  quisiera confirmar algún caso puntual; el gate cubrió el **estado** de la colección, no el
  comportamiento futuro de actores externos.

### 7.3 Cómo evitar que el flujo antiguo infle los totales (HANDOFF §5.3)

1. **Hoy:** inflación **posible pero no efectiva** (0 documentos ⇒ las queries devuelven
   vacío; los totales actuales no están inflados).
2. **Con el retiro (§7.1 #7–#11):** desaparecen **los caminos de cómputo**: ni
   `totalIngresos` ni `totalGastos` ni "N ingresos" ni "N transacciones" contabilizarán nada
   proveniente de `transferencias`, **incluso si** un actor externo escribiera docs en esa
   colección en el futuro (las suscripciones ya no la leerán).
3. **Escritor eliminado (#6):** la app deja de poder crear transferencias (además de que el
   alta ya era inalcanzable por UI).

### 7.4 Retiro del acceso y del flujo — diseño (HANDOFF §5.4–5.5)

- **Se retira en la Etapa 4**, no antes (restricción §8 del handoff: "no retirar todavía el
  flujo"). El retiro se agrupa en **una subetapa dedicada (4.5)**, posterior a tener el
  módulo Reintegros funcionando (§14), para verificar en un solo paso que `/gastos`,
  `/ingresos` y `/agregar` quedan correctos y sin regresiones.
- **Qué NO se retira ni se toca:** datos de Firestore (vacíos, pero por principio de no
  modificación de históricos, D-7), `origenCompra` (#17, decisión cerrada aparte), índices
  (no hay que hacer nada).
- **Qué se retira:** 100 % del código de §7.1 excepto #17.
- **La retirada se mantiene como paso SEPARADO de la implementación del módulo nuevo**
  (subetapa 4.5 independiente, §14): no se mezcla con el alta de Reintegros, para poder
  verificar por separado que el módulo nuevo funciona y que el retiro no rompe nada.

#### Condiciones obligatorias antes de ejecutar cualquier eliminación (subetapa 4.5)

> El gate (§2.3) muestra la colección **vacía al momento de esa comprobación**; eso **no
> demuestra por sí solo** que no exista dependencia funcional en el código ni que todas las
> referencias históricas estén descartadas — por eso el retiro exige estas seis condiciones:

1. **Revisar el diff exacto** de cada cambio (archivo por archivo, antes de cualquier commit).
2. **Identificar todas las lecturas, cálculos, componentes y referencias** a Transferencias
   (inventario base: §7.1; greps `transferenc|Transferenc` sobre `*.{js,jsx}` al momento del
   retiro).
3. **Verificar que los totales de ingresos y gastos no cambien incorrectamente** (antes vs
   después con los mismos datos; con la colección vacía los totales deberían ser idénticos).
4. **Ejecutar las pruebas pertinentes:** greps `0 restos`, `build` OK, `lint` 0 nuevos,
   harness/pruebas locales y prueba funcional de `/gastos`, `/ingresos`, `/agregar`.
5. **Comprobar que el nuevo modelo de Reintegros no se contabilice como ingreso ni gasto**
   (invariante I-1) después del retiro.
6. **Solicitar aprobación explícita del usuario antes de realizar las eliminaciones**
   (flujo AGENTS.md: Local → Staging → aprobación → Producción con verificación).

- **`origenCompra` (#17) no se toca** salvo que una revisión posterior, expresamente
  autorizada, demuestre que corresponde (decisión 2.6 #2 ya cerrada).

---

## 8. Contrapartes con y sin usuario: permisos y visibilidad

### 8.1 Contraparte CON usuario en la app (pareja / miembros del grupo)

| Aspecto | Diseño propuesto |
|---|---|
| Identificación | `contraparteUid` + `contraparteNombre` + `groupId` (el grupo activo, `groups[0]` — patrón del repo) |
| Selección en el alta | Lista de miembros del grupo distinto del usuario, resuelta como `useModoTransferencia.jsx:32-85` (`groups.members` → `users` por docId, con fallback de display si el doc no existe) |
| Quién ve la obligación | **Ambas partes** (R1', §3.3): historial compartido, análogo a gastos/fijos compartidos |
| Qué ve cada uno | El mismo doc; el **sentido se interpreta por visualizador** (`sentidoDelViewer`, §3.3): el dueño ve "Te deben"/"Debés" según su perspectiva; la contraparte ve el espejo |
| Devoluciones | Ambas partes ven el historial de devoluciones de la obligación (quién registró, cuándo, monto, nota) |
| Datos personales | Cada parte ve `registradoPorNombre` y `contraparteNombre` tal como se guardaron; no se exponen email ni datos extra de `users` (solo `displayName`, patrón ya usado) |
| Permisos (línea base) | Filtrado **del lado cliente** por R1' (`participantes array-contains`) — **no es una garantía de seguridad**. **Sin Firestore Rules en el repo** ⇒ antes de habilitar cualquier escritura del módulo corre el **gate obligatorio §8.5** (reglas + pruebas de permisos, con criterios de aceptación). `REQUIERE_VALIDACIÓN_FIRESTORE` para conocer las reglas vigentes; riesgo documentado R-1 (§12). **No es una mejora futura opcional: es prerrequisito** |

### 8.2 Contraparte SIN usuario (amistades, familiares, personas externas)

| Aspecto | Diseño propuesto |
|---|---|
| Identificación | `contraparteUid: null` + `contraparteNombre` (texto libre, requerido) |
| Cuentas | **No se crean cuentas** ni se invita a nadie (D-5) |
| Visibilidad | **Solo** el usuario que registró la obligación (no hay segundo uid con quien compartirla); `groupId: null` |
| Devoluciones | Registradas por el usuario (la contraparte no tiene app para registrarlo) |
| Agrupación por nombre | Sin normalización en v1: "Juan", "juan", "Juan P." son nombres distintos (aceptable para uso real de 1–2 usuarios; ver §12.2) |

### 8.3 Caso especial: la pareja (uso real actual)

La app la usan **dos personas** (una pareja), cada una con su cuenta, en un mismo grupo
(`context/MAPA-APPFINANCIERA.md` §Qué es). El caso por defecto es contraparte **con usuario
en el grupo** ⇒ modelo de visibilidad bilateral (§8.1) cubre el uso real principal. Los
externos (amigo de la entrada del CONTEXTO-ETAPA3 §7) cubre §8.2.

### 8.4 Riesgo de identificación mixta `uid`/`iud` (hallazgo previo, 25/09/2026)

La validación read-only encontró en `users`: 2 docs con campo `uid`, 2 con `iud`, y en
`groups.members`: mezcla de `docId` y `users.uid` (0 sin match). La resolución de miembros
**funciona hoy** (0 sin match) gracias al fallback de `useModoTransferencia`, pero es
**frágil**. El módulo Reintegros **hereda** esa resolución (§8.1). **No se arregla aquí**
(fuera de alcance; cambio mínimo); se documenta como **riesgo R-5** (§12) con mitigación:
copiar el patrón de resolución con fallback, sin depender de `users.uid` como única fuente.

### 8.5 Gate de seguridad de Firestore — **prerrequisito obligatorio previo a las escrituras**

La verificación de reglas y permisos **no es una mejora futura opcional**: es un **gate
obligatorio que debe PASS antes de habilitar cualquier escritura** del módulo (`addDoc`/transacción sobre `reintegros` y `reintegro_devoluciones`). Las pruebas de permisos se
ejecutan en el **Emulator Suite local** (ver criterio 3), no contra el proyecto real.
*(Definición del control: en esta tarea **no se consultó ni se
modificó** Firestore; esto documenta qué deberá verificarse y qué evidencia hará falta
durante la implementación.)*

Tres niveles que **no deben confundirse**:

| Nivel | Qué es | ¿Garantía de seguridad? |
|---|---|---|
| Filtrado de datos en el **cliente** (query R1', §3.3) | El cliente solo pide "lo que le toca" | **NO**: cualquier cliente puede intentar leer/escribir lo que las reglas permitan |
| **Reglas de seguridad de Firestore** | Restricciones server-side de lectura/escritura por usuario y colección | **SÍ**, si están definidas y son correctas |
| **Pruebas de permisos y acceso** | Evidencia de que un usuario no autorizado **no** puede leer ni escribir, y que las partes legítimas **sí** pueden | **SÍ**, una vez ejecutadas y PASS |

**Criterios de aceptación del gate — `[Diseño propuesto — no implementado]` (comprobables;
hoy **no existen** `firestore.rules` ni pruebas):**

1. **Reglas versionadas:** `firestore.rules` (y `firebase.json`) existen en el repo y cubren
   `reintegros` y `reintegro_devoluciones`. El archivo **parte de la copia exacta de las
   reglas vigentes en consola** (Firestore tiene un **único conjunto de reglas por proyecto**:
   lo que se despliegue afecta a Producción) más la definición de las colecciones nuevas. Se
   documenta qué permiten y por qué (`REQUIERE_VALIDACIÓN_FIRESTORE` solo para el estado
   **previo** en consola).
2. **Equivalencia repo ↔ desplegado:** evidencia de que lo desplegado coincide con el archivo
   del repo — **copia desde consola + comparación registrada** (hash o diff). Sin esto, el
   PASS local no garantiza Producción. El despliegue de reglas requiere el flujo de
   `AGENTS.md` con aprobación explícita, como cualquier cambio a Producción.
3. **Pruebas en Emulator Suite** con `@firebase/rules-unit-testing` (dependencia dev nueva en
   Etapa 4): las escrituras de prueba ocurren **en el emulador local**, no en el proyecto
   real — así el gate no contradice la prohibición de escribir hasta el PASS:
   - 3.1 No autenticado: sin lectura ni escritura en ambas colecciones.
   - 3.2 Usuario ajeno a la obligación: sin lectura de `reintegros` ni de sus devoluciones;
     sin escritura.
   - 3.3 Escritura con `registradoPor ≠ request.auth.uid`: rechazada (el cliente no puede
     firmar por otro).
   - 3.4 Devolución sobre obligación ajena (`reintegroId` de un doc del que el autor no es
     participante): rechazada.
   - 3.5 Modificación de campos inmutables de una obligación existente (`contraparteUid`,
     `registradoPor`): rechazada.
   - 3.6 Cambio de `monto` con `devuelto > 0` (o con devoluciones): rechazado.
    - 3.7 **Borrado físico (`deleteDoc`) de una obligación o entrega: rechazado siempre**
      (propuesto): toda eliminación es **lógica** (update con marca + constancia, §3.6) —
      sustituye al criterio previo ("borrado con `devuelto > 0`"), superado por DC-6/DC-7
      (sin borrado físico, I-10).
    - 3.8 **Acople devolución ↔ obligación** (en las reglas, no solo en la app): al crear una
      devolución, `getAfter(obligación).devuelto == get(obligación).devuelto +
      devolución.monto` y `getAfter(obligación).devuelto <= getAfter(obligación).monto`; y
      `devolución.monto > 0`. Un cliente malicioso no puede crear una devolución que
      desincronice el acumulador ni exceder el saldo.
    - 3.9 Positiva: las dos partes legítimas (registrador y contraparte con usuario) leen y
      escriben (alta de obligación, devolución vía transacción en el emulador).
    - 3.10 Externos (`contraparteUid: null`): solo el registrador lee/escribe.
    - 3.11 **No-participante:** sin escritura sobre la obligación ni sobre sus entregas
      (alta de entrega, edición, eliminación, condonación — según matriz §3.6.e).
    - 3.12 **Doble eliminación:** el segundo intento sobre una entrega/obligación ya
      eliminada **no escribe** (rechazo con "Este registro ya fue eliminado." — §3.6.c).
    - 3.13 **Edición de un registro eliminado:** rechazada (registro inmutable — I-11).
    - 3.14 **Mutación de la bitácora:** `update`/`delete` sobre `eventos` rechazados
      (permisos create-only — §3.6.b).
    - 3.15 **Condonación:** según matriz pendiente (C1/C2, §3.6.e); crea constancia de
      condonación **sin** crear entrega ni modificar `devuelto` (I-12).
4. **Evidencia registrada** (archivo de resultados PASS/FAIL por caso) y **aprobación expresa
   del usuario**; sin PASS no se habilitan escrituras (dependencia de 4.1, §14 — subetapa
   4.0).

**Cuestión abierta — proyecto de Staging:** `AGENTS.md` establece que Staging y Producción
**comparten el mismo proyecto Firebase** (`finanzas-app-1c5f6`), por lo que las reglas
desplegadas son **únicas** para ambos entornos: probar en Staging valida código, **no** reglas
aisladas. El Emulator Suite (criterio 3) es por eso el **único** entorno donde las pruebas del
gate no tocan el proyecto real. Si en el futuro se separan proyectos, el gate debe
re-evaluarse (reglas por proyecto). *(Condición registrada; no se supone un proyecto distinto.)*

Si el gate **no PASS**, el diseño/corrección de las reglas se vuelve una **subetapa previa
(dependencia de 4.1, §14 — subetapa 4.0)**: **no se procede a escribir** hasta PASS.

---

## 9. Propuesta de UI mínima para uso real (los 4 puntos de §3.4)

Principio: **consistencia con el patrón existente** de módulos (página con header + selector
de mes + cards + acordeones; altas vía **modal** en `/agregar` — decisión de esta pasada,
§9.3, que reemplaza al wizard multi-paso de la versión previa del diseño; estilo visual
Tailwind ya usado). **Mínimo viable**, sin refactor de layout general.

### 9.1 Acceso

- **Botón "Reintegros" en `/home`** (PO-2 CONFIRMADO, 13/10/2026): **entrada de
  navegación** vía `app/home/helpers/quickActions.js` — nueva entrada "Ver reintegros"
  (habilitada, `path: "/reintegros"`), siguiendo el patrón de "Ver ingresos" / "Gastos
  fijos". **Sin resumen ni cifras en `/home`** (el resumen vive en `/reintegros`; §6.3).
- **BottomNav** (`app/components/navigation/BottomNav.jsx`): tiene slots deshabilitados
  ("Compras", "Pendientes"). **No se propone cambiar BottomNav en el mínimo** (afecta el
  layout de todas las páginas); queda como **mejora futura** (§12).

### 9.2 Página `/reintegros` (punto 3 — consultar saldos — y punto 4 — resumen)

Estructura mínima (patrón `/gastos`; pestañas y filas según PO-2 CONFIRMADO):

| Elemento | Contenido |
|---|---|
| `ReintegrosHeader` | Título **"Reintegros"** (sin mes — PO-1 DECIDIDA) + **selector de mes SOLO dentro de la Card Resumen** y **solo para los flujos** (patrón `MonthSelectorModal`, `GastosHeader.jsx`); **no filtra la lista** (§6.2, §3.3) |
| **Card Resumen del mes** | Los indicadores de §6.2 (Generado por recuperar, Deuda generada, Devoluciones recibidas, Devoluciones realizadas, Pendiente de cobro · Pendiente de devolución — **globales**, PO-1) + pie con **Entradas de reintegros** y **Salidas de reintegros** (del mes del selector); **selector de mes propio** de la card |
| **Lista agrupada por mes de ingreso (PO-1)** | **Todos los obligaciones activas** (sin filtro de mes), **agrupadas por el mes de `createdAt`** (orden desc); el orden **dentro** de cada grupo es desc por `createdAt`. **Los Cerrados también se agrupan por mes de ingreso** (mismo patrón) |
| **Pestañas (PO-2)** | **Pendientes** (por defecto) y **Cerrados** — sustituyen a las secciones "Te deben"/"Debés"/"Liquidados" de la versión previa del diseño |
| Pestaña **Pendientes** | Obligaciones con `saldo > 0`; cada fila distingue visualmente **presté** (`por_cobrar` → "Te deben") vs **me prestaron** (`por_devolver` → "Debés"), incluido el espejo; fila de encabezado de grupo: **"Ingresó en {mes}"** |
| Pestaña **Cerrados** | Histórico de obligaciones `liquidado` y **`condonado`** (agrupadas por mes de ingreso; historial permanece — D-4) |
| **FilaReintegro** | Análoga a `FilaTransferencia`/`FilaGasto` con vocabulario propio: sentido ("Te deben" ↔ "Debés"), **título** (campo `concepto`), detalle, **fecha de apertura** (`createdAt`), **con quién** (`contraparteNombre`), **monto total**, **monto devuelto**, **deuda actual (saldo)** y **entregas registradas** (monto + `fechaPago` de cada devolución); acciones: **Agregar pago** (= Registrar devolución, si `saldo > 0`), **Saldar deuda** (= modal de devolución con el **saldo exacto precargado**; el estado sigue derivado — I-3 intacto), **Editar** (validando saldo resultante) y **«Eliminar»** (lógica, con constancia quién/cuándo/motivo opcional — DC-6/DC-7; **nunca «Anular», sin borrado físico**), **Condonar** (sello/acción según §4.4) — permisos por **matriz pendiente** (§3.6.e) |

### 9.3 Alta de una generación (punto 1) — modal (decisión de esta pasada)

- **Botón "Reintegro"** en `/agregar` (nueva `SectionBlock`, p. ej. junto a Gastos/Ingresos
  o en su propia sección "Reintegros") que abre un **modal de alta** (`ReintegroModal`,
  patrón de modales `PagarModal.jsx`) — **reemplaza al wizard multi-paso** (`ModoReintegro`
  con `StepBar`) de la versión previa del diseño.
- **Campos del modal:**
  1. **Tipo** — "¿Qué pasó?" → "Presté (me deben)" / "Me prestaron (debo devolver)"
     (→ `sentido: por_cobrar` / `por_devolver`).
  2. **Contraparte** — miembros del grupo (con usuario, resolución patrón
     `useModoTransferencia`) o "Persona externa" (nombre libre). Para `por_devolver`
     self-registered con externo: nombre libre.
  3. **Título** (campo `concepto`, requerido — en la UI se llama "título", sin cambio de
     modelo), **monto**, **fecha** (= fecha de creación del registro; no editable en alta),
     **movimientoInicial** (precargado por sentido con texto anti-doble-captura, §4.1) y
     **detalle** (opcional).
- **Submit** (`submitReintegro.js`): `addDoc` a `reintegros` con los campos de §3.2
  (`participantes` armado con las dos partes visibles, §3.3). Tras el alta → redirect a
  `/reintegros` (patrón: `ModoIngreso` redirige a `/ingresos`).
- **Nota de UX:** el modal **no** crea el gasto de fondo en `/gastos`; al final se puede
  mostrar un texto breve ("Este registro no modifica tus gastos: si corresponde, registrá el
  gasto en Agregar") — coherente con el desacoplamiento de §4.1.3.

### 9.4 Alta de una devolución (punto 2)

- Desde `FilaReintegro` (acción **"Agregar pago"** o **"Saldar deuda"**, §9.2) con
  `saldo > 0`: abre **modal** (patrón `PagarModal.jsx`): monto prellenado con el `saldo`
  vigente (editable, **acotado al saldo**; en "Saldar deuda" el saldo exacto), nota
  opcional, **fecha** (campo `fechaPago`: default hoy, **editable** — H-5, atribuye la
  entrega a su mes correcto; §3.2, §6.2) y selector **"¿Quién pagó?"** (`Yo` / `La otra
  persona` / nombre libre si es un externo). El selector **precarga al deudor** según el
  sentido (I-8): `por_devolver` ⇒ "Yo"; `por_cobrar` ⇒ "La otra persona"; si se elige un
  **tercero** se muestra un aviso breve ("Este pago lo hizo otra persona: no figura en tus
  'Devoluciones realizadas'"). Editable. El selector alimenta
  `realizadoPorUid`/`realizadoPorNombre`; `registradoPor*` guarda quién opera la app.
  **Ambos campos se envían siempre, sin asumir que coincidan** (§3.2, I-6, I-8; quién puede
  registrar = **PO-5 decidida: cualquiera de las dos partes** en su alcance — §4.2, §12.3).
- **Validaciones:** `0 < importe <= saldo` en el formulario **y de nuevo al guardar dentro de
  una transacción** (§4.3). Si falla: mensaje *"El importe supera el saldo pendiente de $X"*,
  *"El saldo cambió; revisá el importe e intentá de nuevo"* (concurrencia) o *"No hay
  conexión. Intentá de nuevo."* (sin red: la transacción no escribe ni encola, §4.3
  Conectividad; loading con timeout), **modal abierto** y sin escritura (patrón try/catch de
  `PagarModal`).
- **Submit** (`submitDevolucion.js`): **transacción de Firestore** que relee **el doc de la
  obligación** (`monto`, `devuelto`), valida `importe <= monto − devuelto` y recién entonces
  escribe la devolución (`reintegroId`, `monto`, `fechaPago`, `nota`, `realizadoPorUid`,
  `realizadoPorNombre`, `registradoPor`, `registradoPorNombre`, `createdAt: serverTimestamp()`)
  **y actualiza `devuelto`** en la misma transacción (§4.3; el `Σ devoluciones` no se lee
  dentro de la transacción). Motivo: garantizar consistencia ante escrituras simultáneas.
- La UI recalcula saldo/estado vía `onSnapshot` (sin refresh manual). Parcial → sigue en
  pendientes; completa → aparece en "Cerrados".

### 9.5 Liquidación (punto 3, remainder)

- **Sin botón de liquidar:** la última devolución completa cambia el estado derivado y la
  fila migra a la pestaña **"Cerrados"** (§3.4, §4.4). Se muestra un feedback breve (p. ej. "Liquidado ✓",
  patrón de labels de fijos "Al día ✓").

### 9.6 Resumen mensual en el balance (punto 4) — PO-2 CONFIRMADO

- La **card Resumen** de §9.2 **implementa los indicadores** del resumen mensual exigido (los
  4 de §6.2 + "Deuda generada" + pie de **Entradas/Salidas de reintegros**).
- **Ubicación decidida (PO-2, CONFIRMADO 13/10/2026):** resumen dentro de `/reintegros`;
  acceso desde `/home` por botón de navegación (§9.1); ~~acordeones del mes en `/ingresos`
  y `/gastos`~~ **retirados por DC-1** (§9.7). La ambigüedad "en el balance" del
  `HANDOFF-ETAPA-3.md` §3.4.4 queda **citada y resuelta por el usuario** en §6.3; las
  cuatro distinciones contables se conservan.

### 9.7 Acordeones del mes en `/ingresos` y `/gastos` — **RETIRADOS (DC-1, 14/10/2026)**

> **Nota de trazabilidad (no se implementa nada de lo que sigue):** este diseño original
> proponía acordeones informativos en `/ingresos` y `/gastos` (PO-2 CONFIRMADO + PO-8 A+).
> El usuario decidió **DC-1: retirarlos** — esas páginas **no reciben** ninguna sección
> nueva del módulo; el resumen (incluidos **Entradas/Salidas de reintegros del mes** de
> §6.2/PO-8 A+) vive **solo** en la Card Resumen de `/reintegros`. `totalIngresos` y
> `totalGastos` siguen intactos (§6.1, I-9). Las entradas/salidas **no se pierden**: se
> muestran en la card de `/reintegros`. La decisión suprime además el hook de acordeones
> previsto en §10.A y las ediciones de
> `ingresos/page.jsx`/`gastos/page.jsx` por este motivo (§10.B); PO-8a queda **sin objeto**
> (§6.2, §12.3).
>
> **Hechos verificados (13/10/2026) que motivaban la propuesta — conservados como
> evidencia:** `Transferenciassections.jsx` tiene **0 importadores** en `/gastos`;
> `TransferenciasIngresosSection.jsx` está importado sin uso en `ingresos/page.jsx:15` con
> JSX comentado (`:110-122`); ambos se retiran en 4.5 (§7.1 #12/#14).

---

## 10. Cambios mínimos por archivo o módulo, con justificación; sin refactor general

Separados en **dos bloques**: (A) altas del módulo nuevo (funcionalidades nuevas) y (B)
retiro de Transferencias (corrección/limpieza). Ambos **solo se ejecutan en la Etapa 4** tras
aprobación. No se propone ningún refactor general (auth, groups, layout, taxonomías, fijos
quedan intactos).

### 10.A Módulo nuevo (archivos a crear — `#propuesta`, funcionalidad nueva)

| Archivo nuevo (`AppFinanciera/`) | Responsabilidad | Justificación |
|---|---|---|
| `app/reintegros/page.jsx` | Página (header, resumen, secciones, modal devolución) | Patrón de todas las rutas (`/gastos`, `/ingresos`) |
| `app/reintegros/hooks/useReintegros.js` | Estado + cálculo de saldos/estados/indicadores/entradas-salidas (§6.2) + acciones (alta, devolución, editar, eliminar, condonar); indicador "Devoluciones realizadas" por `realizadoPorUid`; **lista sin filtro de mes** (PO-1, §3.3) | Patrón `useGastos`/`useIngresos`; toda la matemática vive aquí (estado derivado, I-3, I-6, I-8, I-9) |
| `app/reintegros/services/subscribeReintegros.js` | Queries **R1'** y D1 (§3.3, H-4); **exclusión de eliminadas en cliente con campo ausente = activo** (P-4) | Patrón `subscribeIngresos` (una sola query principal + historial) |
| `app/reintegros/sections/{ReintegrosHeader,ResumenMesCard,PendientesSection,CerradosSection}.jsx` | UI (pestañas Pendientes/Cerrados, PO-2) | Patrón sections por módulo |
| `app/reintegros/components/FilaReintegro.jsx` | Fila (con entregas: monto + `fechaPago`; acciones Agregar pago / Saldar deuda, §9.2) | Análoga a `FilaGasto` |
| `app/reintegros/components/DevolucionModal.jsx` | Modal de devolución (monto acotado, **fecha `fechaPago`**, selector pagador, §9.4) | Patrón `PagarModal` |
| `app/agregar/components/reintegros/ReintegroModal.jsx` | **Modal de alta** (un paso; reemplaza al wizard `ModoReintegro`) | Patrón `PagarModal`; decisión de esta pasada (§9.3) |
| `app/agregar/components/reintegros/hooks/useReintegroModal.js` | Estado del modal + resolución de miembros (patrón `useModoTransferencia`) | Patrón `useModoTransferencia` |
| `app/reintegros/services/eventos.js` | **Bitácora propuesta** (P-1, subcolección `reintegros/{id}/eventos`, create-only): `registrarEvento(...)` — `#propuesta` `[Diseño propuesto]` | Sin análogo en el repo; requisitos §3.6.b |
| `app/agregar/components/reintegros/helpers/submitReintegro.js` | **`runTransaction` propuesta** (P-2): alta de `reintegros` + evento `creacion` **atómicos** (incluye `participantes`, `movimientoInicial` §3.2) | Patrón `submitTransferencia`/`submitIngreso`; **todas** las escrituras del módulo pasan a ser transaccionales (§3.6.c) |
| `app/agregar/components/reintegros/helpers/submitDevolucion.js` | **`runTransaction`**: `tx.get` de la obligación, valida `importe <= monto − devuelto`, escribe la devolución, actualiza `devuelto` y registra evento (§4.3, §3.6.c); campos `realizadoPor*` y `registradoPor*` | Validación de sobrepago + concurrencia + bitácora en una misma operación (el `Σ devoluciones` no se lee en la transacción) |
| `app/agregar/components/reintegros/helpers/{eliminarEntrega,eliminarObligacion,condonar}.js` | **Acciones transaccionales propuestas** (P-2, §3.6.c): marca lógica + constancia (quién, cuándo, motivo opcional) + recálculo de `devuelto` (donde aplique) + evento; **rollback total** ante fallo; rechazan registros ya eliminados (I-11) | `#propuesta` `[Diseño propuesto]`; DC-6, DC-7, DC-8 |

### 10.B Archivos existentes a editar (mínimo, con qué se toca)

| Archivo existente | Edición mínima | Justificación |
|---|---|---|
| `app/agregar/page.jsx` | (1) Agregar botón "Reintegro" + apertura de `ReintegroModal`; (2) en 4.5: eliminar bloques #1–#3 de §7.1 | Alta del punto 1 (modal, §9.3); retiro del legacy |
| `app/home/helpers/quickActions.js` | Agregar entrada "Ver reintegros" (habilitada) — **botón de navegación** (PO-2) | Acceso al módulo (§9.1) |
| `app/ingresos/page.jsx` | (4.5, único motivo) quitar import vivo, conteo de `transferenciasRecibidas.length` y JSX comentado (#11) | Retiro del legacy — **sin acordeones nuevos** (DC-1: no se agregan secciones del módulo) |
| `app/gastos/services/subscribeGastos.js` | (4.5) Quitar query y mapa de transferencias (#7) | Eliminar camino de inflación y simplificar `totalQueries` |
| `app/gastos/hooks/useGastos.js` | (4.5) Quitar estado `transferencias` y filas sintéticas (#8) | I-1 / D-2 |
| `app/ingresos/services/subscribeIngresos.js` | (4.5) Quitar query `transferencias` y dualidad de `emitIfReady` (#9) | I-1 / D-2; simplificación |
| `app/ingresos/hooks/useIngresos.js` | (4.5) Quitar `transferenciasRecibidas` del estado y del `totalIngresos` (#10) | I-1 / D-2 |
| `app/gastos/components/FilaGasto.jsx` | (4.5) Quitar rama `esTransferencia` (#15) | Limpieza coherente con #8 |

> **`useIngresos`/`useGastos`: qué cambia y qué NO.** Solo cambian en la **subetapa 4.5**
> (retiro de Transferencias: filas #8 y #10 de §7.1 — quitar la rama de transferencias que
> infla totales). **No** se modifican sus fórmulas de `totalGastos`/`totalIngresos` ni se les
> agrega estado ni secciones: **DC-1 (14/10/2026) retiró los acordeones** — `/ingresos` y
> `/gastos` **no reciben** ediciones nuevas del módulo (§9.7). La única edición de
> `ingresos/page.jsx` es el retiro #11 de 4.5.

### 10.C Archivos a eliminar (en 4.5 — retiro)

`app/agregar/components/ModoTransferencia.jsx` ·
`app/agregar/components/transferencia/` (hook + helper, completa) ·
`app/gastos/sections/Transferenciassections.jsx` ·
`app/gastos/components/FilaTransferencia.jsx` ·
`app/ingresos/sections/TransferenciasIngresosSection.jsx` ·
`app/gastos/helpers/gastosCalculations.js`
(detalle y racional en §7.1; eliminaciones evaluadas una por una).

### 10.D Lo que NO se toca (confirmado)

- **Firestore:** 0 escrituras, 0 migraciones, 0 borrados (D-7; gate §2.3 = vacío).
- `submitCompra.js` / `origenCompra` (decisión 2.6 #2, §7.1 #17).
- `/gastos-fijos`, `useFixedExpenses`, `PagarModal`, taxonomías — solo se **leen como
  referencia** de patrón (§11).
- Deuda CRUD de ingresos (`PROPUESTA-2.3.md` §9.1) — **no se resuelve aquí** (§11.4).
- Manejo de errores de `subscribeIngresos` — deuda separada (§11.3); el retiro de #9 la
  **simplifica** pero no la cierra.
- `useIngresos.js`/`useGastos.js`: sus **fórmulas de totales no cambian** (solo la rama
  transferencias se retira en 4.5; ver nota en §10.B); **sin secciones nuevas** (DC-1).
- Auth, GroupContext, BottomNav, layout, `package.json`.

---

## 11. Interacciones con gastos fijos, gastos compartidos, pagos parciales y lo que el repo demuestre

### 11.1 Gastos fijos compartidos (Decisión funcional 3 — patrón a emular, sin integración)

- **Interacción funcional: ninguna.** Un fijo compartido con balance `pendiente_saldar`
  (`useFixedExpenses.js:156-178`, `balanceNeto`, `itemsQueDebo`/`itemsQueDebenAMi`) es un
  balance **interno del módulo fijos**; **no se convierte** en un reintegro automáticamente
  (D-6 y cambio mínimo). El usuario que quiera trackear algo análogo entre personas fuera del
  patrón fijos usa Reintegros.
- **Lo que SÍ se emula (patrón, no código):** balance acumulado + liquidación + **historial
  permanente** (fijos: `saldarPendiente`/`saldarMes` setean `pagado = corresponde` y estado
  `saldado` sin borrar la entry — `useFixedExpenses.js:301-317`). Reintegros logra lo mismo
  con estado **derivado** y devoluciones como historial (§3.4), evitando el doble origen de
  verdad (`estado` almacenado vs `getEstado`) que complicó 2.2/2.9.
- `PagarModal.jsx` (try/catch/finally, loading, error visible — corregido en 2.7) es el
  patrón a copiar para el `DevolucionModal` **en el manejo de errores y loading**. La deuda
  preexistente de **escrituras sin timeout** en modo offline (§12.1 R-6) aplica al camino
  `addDoc` (`submitReintegro`); el `submitDevolucion` **transaccional no encola** y falla
  sin red (§4.3 Conectividad) — la UI del modal debe cubrir ambos caminos.

### 11.2 Gastos compartidos diarios (Decisión funcional 2)

- **No generan deuda ni balance; no se convierten retroactivamente** (D-6). Un gasto
  extraordinario compartido (mueble) se registra **hoy** como gasto compartido diario (suma
  lo que pagó el usuario — `useGastos.js:82-91`) **y, si corresponde recuperar**, el usuario
  registra **además** un reintegro (§4.1.3). Los dos registros son **desacoplados** (sin
  `gastoVinculadoId` en v1). La recuperación posterior **no modifica** `totalGastos`
  (consecuencia contable explícita en §4.1.3; D-2, I-1).

### 11.3 Pagos parciales y otras interacciones

- **Pagos parciales:** fijos los modelan en `participantes[].pagado/corresponde` (update in
  place); Reintegros los modelan como **docs separados** en `reintegro_devoluciones`
  (addDoc, histórico con fecha real). Semántica de liquidación análoga; mecanismos distintos
  y sin código compartido (consistente con la práctica del repo de duplicar `esPagado` a
  propósito en `useFixedExpenses.js:25-29`).
- **`subscribeIngresos` sin manejo de errores** (deuda conocida, dominio §3.4): el retiro de
  la query de transferencias (#9 de §7.1) **elimina la dualidad** `emitIfReady` y reduce la
  superficie de fallo (una sola query en vez de dos), pero **no cierra** la deuda (la query
  de `ingresos` puede seguir fallando por índice). Sigue siendo deuda **sin subetapa**,
  fuera del alcance de la Etapa 4.
- **Tarjeta (Decisión funcional 5, dominio §7):** el módulo futuro de tarjeta debe
  **reutilizar** el modelo de Reintegros (la devolución de la parte de la tarjeta **no es
  ingreso**). Por eso `reintegros` se diseña **genérico** (sentido + contraparte + monto +
  devoluciones), sin atarse a "gasto de supermercado" ni taxonomías; `gastoVinculadoId`
  reservado. **Sin implementación de tarjeta** en la Etapa 4 (fuera de alcance).

### 11.4 Adyacente y fuera de alcance: deuda de CRUD de ingresos (`PROPUESTA-2.3.md` §9.1)

- **No se resuelve** en la Etapa 4 (sigue sin subetapa asignada; decisión explícita del
  usuario del 30/09/2026).
- **Sí se aprende de ella:** el módulo Reintegros propone **CRUD básico desde el día 1**
  (editar monto/título/detalle — validando el **saldo resultante** — y **«Eliminar» lógico**
  con constancia: DC-6/DC-7; ver §11.4 al pie). Justificación: un reintegro
  mal cargado sin corrección repetiría el problema de "un ingreso mal cargado no se corrige
  desde la app". Es una **funcionalidad nueva** justificada del propio módulo, no un arreglo
  de la deuda de ingresos.

*(Corrección de guarda previa — 14/10/2026: la versión anterior de esta sección proponía
"no eliminar obligación con devoluciones" y "no bajar monto por debajo de lo devuelto".
La primera queda **superada por DC-7**: eliminar una obligación con entregas **está
permitido** y es **lógico, conservando** la obligación, sus entregas y la constancia
(§3.6.c). La segunda se conserva, reforzada por la validación transaccional (I-7) y por el
control del saldo resultante al editar entregas (DC-2).)*

### 11.5 Resumen de interacciones (adyacente vs fuera de alcance)

| Módulo / deuda | ¿Interacciona con Reintegros? | Tratamiento |
|---|---|---|
| Gastos fijos compartidos | Solo como **patrón a emular** | Sin integración de datos; sin código compartido |
| Gastos compartidos diarios | El gasto extraordinario se registra aparte | Desacoplado (§11.2); sin conversión |
| Pagos parciales (fijos) | Patrón semántico análogo | Mecanismo propio (devoluciones) |
| Transferencias (secciones legacy) | El módulo **no** reutiliza su lógica ni agrega acordeones en sus páginas (DC-1) | Se eliminan en 4.5 (§7.1 #12/#14); §9.7 retirado |
| Tarjeta (futura) | El modelo debe **reutilizarse** desde ahí | Genérico; fuera de alcance en Etapa 4 |
| CRUD de ingresos (§9.1 de 2.3) | No interacciona | **Fuera de alcance**; solo lección aplicada al CRUD de reintegros |
| Errores de `subscribeIngresos` | El retiro #9 la simplifica | **Fuera de alcance** cerrarla |
| Escrituras sin timeout (AGENTS.md) | Con **P-2 propuesta** (todas las escrituras transaccionales) el módulo **no** heredaría el mecanismo de la deuda: las transacciones no encolan (§12.1 R-6) | **Fuera de alcance** la deuda compartida de la app; el modal del nuevo módulo sí maneja espera/timeout y sin conexión (§9.4) |

---

## 12. Riesgos, casos límite, decisiones aún abiertas y alternativas

### 12.1 Riesgos

| ID | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R-1 | **Sin Firestore Rules en el repo:** la visibilidad bilateral (§8.1) se filtra solo del lado cliente | Privacidad si se usara multiusuario real (hoy: 2 usuarios de confianza) | **Gate obligatorio §8.5 previo a las escrituras** (reglas versionadas, equivalencia repo↔desplegado, pruebas en Emulator con casos negativos concretos + acople devolución↔obligación, evidencia + aprobación — criterios 1–4); `REQUIERE_VALIDACIÓN_FIRESTORE` para conocer las reglas vigentes. **No es mejora futura: sin PASS no se escribe** |
| R-2 | Índices compuestos de las nuevas queries (R1'/D1; R1' = `array-contains` + `orderBy createdAt`, §3.3) no existen | `onSnapshot` falla ⇒ `loading` infinito (patrón ya visto) | Crear índices (auto-prompt de consola o pre-creación) al implementar; verificar con gate read-only estilo etapas previas; `REQUIERE_VALIDACIÓN_FIRESTORE` |
| R-3 | Límite `in` (30) de Firestore en D1 (historial de devoluciones) | Con > 30 obligaciones visibles, la query trocea mal | Trocear en batches de 30 en el service; volumen esperado mínimo. El **saldo** ya no depende de D1 (sale del acumulador `devuelto`, §3.2); el troceo solo afecta el **historial** |
| R-4 | **Doble registro** de la misma obligación real por ambas partes | Obligación duplicada en el resumen global (cada usuario vería su versión) | **PO-4 DECIDIDA (14/10/2026): confirmación bilateral** estilo fijos (alcance documentado en §5.3). **Mientras no esté implementada**, persiste la convención de uso como mitigación documentada; los **vacíos de detalle** (qué ocurre entre alta y confirmación) van a §12.6 sin inventar. DC-4: sin avisos de duplicados |
| R-5 | Resolución frágil de miembros (`uid`/`iud` — §8.4) | Contraparte mal resuelta en el alta | Copiar fallback de `useModoTransferencia`; no arreglar el dato (fuera de alcance) |
| R-6 | Hereda la **deuda preexistente de escrituras sin timeout** (AGENTS.md). **Actualización 14/10/2026 (P-2, propuesta):** con **todas** las escrituras del módulo pasadas a `runTransaction`, ninguna **encola** en offline (las transacciones no se encolan: fallan sin red) — el mecanismo de la deuda compartida (promesas de `addDoc`/`updateDoc` sin timeout) **no aplicaría** al módulo. **Sin implementar:** la deuda compartida de la app sigue **fuera de alcance** | UX en modo offline | Modal con espera/timeout y mensaje de sin conexión (§9.4, §3.6.c); deuda compartida = fuera de alcance |
| R-7 | Desfase timezone `serverTimestamp` vs `getMonthRange` client (arquitectura §1) | Movimiento al borde del mes | Preexistente de todos los módulos; mismo criterio; no se agrava |
| R-8 | Gate = estado puntual; un script externo podría escribir `transferencias` en el futuro | Reintroducción de datos que la app ya no leerá (tras 4.5 el código no los computa) | Aceptado; sin escritor en la app (#6 de §7.1) |
| R-9 | **Concurrencia en devoluciones:** dos escrituras simultáneas contra el mismo saldo (dos dispositivos / doble tap) | Sobrepago o `saldo < 0` si no hay control | **Transacción de Firestore** en `submitDevolucion` (§4.3): `tx.get` de la obligación (`monto`, `devuelto`) → validar → escribir devolución + actualizar `devuelto`, atómico; la operación perdedora falla sin escribir, con mensaje explícito (I-7) |

### 12.2 Casos límite (reglas propuestas)

| Caso | Regla propuesta |
|---|---|
| Devolución mayor al saldo (sobrepago) | **Impedida en v1** (**PO-3 DECIDIDA**, 14/10/2026): validación en el form **y** transaccional al guardar; la operación **no se registra** y se muestra *"El importe supera el saldo pendiente de $X"* (§4.3). Modelo tolera `saldo < 0` solo como defensa; exponer "a favor" / admitir sobrepagos = evolución futura que exigiría decisión explícita (§4.3) |
| Dos devoluciones simultáneas contra el mismo saldo | Solo una transacción gana; la perdedora **no escribe** y muestra *"El saldo cambió; revisá el importe e intentá de nuevo"* (§4.3, R-9) |
| Pago hecho por una persona y registrado por la otra | **Soportado por diseño**: `realizadoPorUid` (pagador) ≠ `registradoPor` (registrador); el indicador "Devoluciones realizadas" usa el pagador (§3.2, §6.2, I-6). El pagador debe ser el **deudor** (I-8); el modal lo precarga y avisa ante un tercero (§9.4) |
| Pago hecho por un **tercero** (ni acreedor ni deudor) | Caso **asimétrico** (I-8): el acreedor lo ve en "Devoluciones recibidas" (obligación); el deudor **no** ve una "Devolución realizada". UI precarga al deudor y avisa si se elige tercero (§9.4) |
| Editar/eliminar obligación **con** devoluciones | **DC-7 (14/10/2026):** **eliminar está permitido** (lógica, conserva obligación + entregas + constancia; §3.6.c); **editar** con `devuelto > 0` → **propuesto que NO** (solo si `devuelto == 0`, P-5/P-6) |
| Editar monto de obligación sin devoluciones | Permitir; edición **transaccional** (leer doc con `devuelto`, validar `monto > 0` y `monto >= devuelto`, `update` en la misma transacción — §4.3) |
| Devolución cargada con importe equivocado | **PO-7 DECIDIDA (14/10/2026):** corregir vía **editar** la entrega (validando saldo resultante) o **«Eliminar»** la entrega (lógica + constancia + recálculo de `devuelto` en la misma operación — §4.3, §3.6.c). **Nunca borrado físico; nunca «Anular»** |
| Devolución sin fecha explícita | `fechaPago` **default = fecha de creación** (`createdAt`); la UI permite editar la fecha para atribuir la entrega al mes correcto (H-5; §3.2, §9.4) |
| Edición de `fechaPago` | Editable en v1 (la auditoría queda en `createdAt`); cambiarla mueve la entrega entre meses en entradas/salidas e indicadores (§6.2) |
| `movimientoInicial` mal cargado o que debe cambiar | Editable en la edición del reintegro (§4.1); cambiarlo recalcula entradas/salidas del mes de creación (§6.2, I-9); si el fondo ya está registrado como gasto/ingreso debe ser `"ninguno"` (anti-doble-captura, §4.1 punto 6) |
| Casos de caja verificables (harness PO-8) | Pagué $3.000 como gasto y cobré $1.000 ⇒ caja **−2.000**. Presté $3.000 en efectivo (`movimientoInicial == "salida"`) ⇒ caja **−3.000**. Me prestaron $3.000 (`"entrada"`) ⇒ caja **+3.000**. Me pagaron algo mío (tercero paga; `"ninguno"`) ⇒ caja **0** (no entró ni salió plata mía; I-8) — §6.2, fórmula de referencia |
| Eliminar obligación con o sin devoluciones | **DC-7:** permitido en ambos casos vía **eliminación lógica** (marca + constancia quién/cuándo/motivo opcional); el registro **permanece** en BD/bitácora (I-4 actualizado: sin borrado físico nunca) y **sale de las vistas** (§3.6.d) |
| Eliminar una entrega (1.ª vez / 2.ª vez) | 1.ª: atómica (marca + constancia + recálculo de `devuelto` + evento; rollback total). 2.ª o sobre registro ya eliminado: **rechazada sin escritura** con *"Este registro ya fue eliminado."* (I-11, §3.6.c) |
| Condona la obligación y después alguien intenta registrar una entrega | **Rechazado** (propuesto): obligación `condonado` con **entregas congeladas** (§3.6.e) |
| Eliminar obligación condonada | **Permitido sin perder la constancia:** condonación y eliminación **ambas permanecen** en el doc y como eventos (§4.4) |
| Contraparte que deja el grupo | Obligación con `groupId` sigue visible por R1' (`participantes array-contains uid`, §3.3); sin cambios |
| Externos con nombre variante | Sin normalización v1 (§8.2); agrupación exacta por string |
| Obligación `por_devolver` self-registered y luego la contraparte también registra la suya | Duplicado posible (R-4); **PO-4 decidida: confirmación bilateral** (alcance §5.3; vacíos en §12.6) |
| Cobro de una parte de un gasto compartido | El gasto de fondo sigue **íntegro** en `totalGastos` del mes del gasto; la devolución no lo reduce ni suma ingreso (D-2, I-1; §4.1.3). **Efecto aceptado, no bug.** Efecto en caja (PO-8, §6.2): la devolución recibida suma en **Entradas de reintegros**; el monto de la obligación solo suma si `movimientoInicial == "entrada"`. Ej.: mueble $2.000 50/50 con `movimientoInicial: "ninguno"` + cobro de $1.000 ⇒ caja −1.000 respecto del mes (gasto −2.000 + entrada +1.000) |
| Mes sin operaciones | Resumen en cero; secciones con empty state (patrón `OtrosSection`) |

### 12.3 Decisiones funcionales — estado actualizado (14/10/2026)

> **Estado actualizado (decisión del usuario, 14/10/2026, según su prompt):**
> **PO-1, PO-3, PO-4, PO-5, PO-6 y PO-7 DECIDIDAS** (registradas abajo con su alternativa
> elegida y lo que queda sin definir); **PO-2 y PO-8 DECIDIDAS** (13/10/2026, con la
> supersesión parcial de los acordeones por **DC-1**, documentada); **PO-8a SIN OBJETO**.
> Las decisiones **DC-1…DC-8** del 14/10/2026 se registran en **§12.5**; lo aún no definido
> (vacíos de PO-4, estructura de campos P-3, matriz de permisos P-5, subetapa de
> confirmación) queda en **§12.6** sin inventar. Este documento **no elige alternativas en
> silencio**: lo decidido y lo pendiente se marcan explícitamente.

#### PO-1 — Alcance de los saldos pendientes: ¿global o mensual? (§6.2)

| | |
|---|---|
| **Alternativa A** | **Vigentes globales**: todas las obligaciones abiertas, cualquiera sea su mes de generación |
| **Alternativa B** | Solo las obligaciones **generadas en el mes visible** que sigan abiertas |
| **Consecuencias** | **A:** muestra la deuda real "de cualquier momento" (es un stock continuo); en un mes con poco movimiento puede mostrar cifras de meses anteriores (por eso se etiquetan como "actual"). **B:** coherente con el corte mensual, pero **oculta** deudas abiertas de meses anteriores |
| **Recomendación del diseño** | **A**, etiquetados como "actual" y separados de los flujos del mes |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026): alternativa A** — stock global de abiertas cualquiera sea su mes, junto a los flujos filtrados (§6.2). *La lista de `/reintegros` se agrupa por mes de ingreso (PO-1 también resuelve la agrupación: §9.2).*

#### PO-2 — Ubicación del resumen mensual: ¿`/home` o solo `/reintegros`? (§6.3) — DECIDIDA

| | |
|---|---|
| **Alternativa A** | Card "Resumen del mes" **dentro de `/reintegros`** (alcance mínimo) |
| **Alternativa B** | A **+** reflejo en `/home` (o en una futura página Balance global) |
| **Consecuencias** | **A:** no toca layout de otras páginas; el usuario entra al módulo para verlo. **B:** se acerca más a la lectura "en el balance" de `HANDOFF-ETAPA-3.md` §3.4.4, pero amplía alcance y afecta `/home` |
| **Decisión del usuario** | **CONFIRMADO (13/10/2026, según este prompt):** resumen en `/reintegros`; **botón "Reintegros" en `/home`** como entrada de navegación (sin cifras en `/home`); **pestañas** Pendientes (default) / Cerrados en `/reintegros`. *(Supersesión parcial 14/10/2026: los **acordeones** en `/ingresos`/`/gastos` de esta decisión fueron **retirados por DC-1** — §6.3, §9.7.)* La ambigüedad "en el balance" queda citada y resuelta por el usuario (§6.3) |
| **Estado** | **DECIDIDO POR EL USUARIO (13/10/2026, según este prompt)** |

#### PO-3 — Saldos negativos y pagos a favor (§4.3)

| | |
|---|---|
| **Alternativa A** | **Impedir sobrepagos en v1**: validación en form + transaccional; `saldo >= 0` siempre |
| **Alternativa B** | **Admitir pagos mayores al saldo** y modelar el excedente ("a favor") |
| **Consecuencias** | **A:** modelo simple y predecible; mensaje claro cuando no cabe el importe. **B:** exige un modelo funcional propio (¿a favor? ¿descuento de otra obligación? ¿cómo se muestra?) = decisión y diseño adicionales |
| **Recomendación del diseño** | **A** en la primera versión; **B** queda documentada como evolución posible que requeriría decisión explícita |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026): alternativa A** — sin sobrepagos en v1; B queda como evolución futura documentada (§4.3) |

#### PO-4 — Confirmación bilateral en la primera versión (§5.3, R-4)

| | |
|---|---|
| **Alternativa A** | **Sin confirmación**: convención de uso (solo quien adelantó registra) |
| **Alternativa B** | **Confirmación bilateral** estilo fijos: la otra parte confirma la obligación |
| **Consecuencias** | **A:** cambio mínimo; persiste el riesgo R-4 de doble registro si ambos registran. **B:** evita duplicados con estado/queries adicionales y un paso extra de UX |
| **Recomendación del diseño** | **A**, siempre que se garantice un registro único y permisos claros (gate §8.5 + convención §5.3); evaluar **B** tras uso real |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026): alternativa B** — **confirmación bilateral** estilo fijos en la primera versión (alcance documentado §5.3; **vacíos sin definir → §12.6**, sin inventar). La recomendación previa (A) queda **superada** |

#### PO-5 — Quién puede registrar una devolución y cómo se identifica a quien pagó (§3.2, §4.2 (punto 5), §6.2)

| | |
|---|---|
| **Alternativa A** | **Cualquiera de las dos partes registra**; el pagador se identifica por separado con `realizadoPorUid` (campo distinto de `registradoPor`) |
| **Alternativa B** | **Solo quien pagó** puede registrar su devolución |
| **Alternativa C** | Registro por cualquiera pero **sin campo de pagador** (`realizadoPorUid == registradoPor` por construcción) |
| **Consecuencias** | **A:** cubre el caso real señalado (yo pago, mi pareja registra) y corrige la atribución de "Devoluciones realizadas"; exige el campo extra y el selector "¿Quién pagó?" en el modal. **B:** más estricta, pero pierde registros cuando la otra parte no coopera o no usa la app. **C:** modelo más simple, pero **vuelve a atribuir mal el pago** cuando otra persona lo registra (exactamente el problema corregido) |
| **Recomendación del diseño** | **A** — permitir que cualquiera registre y separar **pagador vs registrador** |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026): alternativa A** — cualquiera de las dos partes registra; pagador y registrador se identifican por separado (§3.2, §4.2). Los **límites por operación** van a la matriz de permisos **pendiente** (§3.6.e, P-5) |

#### PO-6 — Concepto de la obligación: texto libre o catálogo (§3.2)

| | |
|---|---|
| **Alternativa A** | **Texto corto libre** (como `concepto`/`detalle` actuales) |
| **Alternativa B** | **Catálogo / taxonomía** de conceptos |
| **Consecuencias** | **A:** sin modelado previo, ágil para 1–2 usuarios; nombres libres no agrupan automáticamente. **B:** consistencia y filtros futuros, pero obliga a definir categorías ahora (posiblemente prematuro) |
| **Recomendación del diseño** | **A** en v1; catálogo solo si el uso real lo pide |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026): alternativa A** — texto libre (§3.2) |

#### PO-7 — Corrección de entregas cargadas por error (§4.3, §12.2) — DECIDIDA

| | |
|---|---|
| **Alternativa A** | **Mecanismo de corrección**: permitir **editar** la entrega o **«Eliminar»** (lógica) una entrega; el ajuste de `devuelto` ocurre en **la misma operación atómica** (§3.6.c) |
| **Alternativa B** | **Sin corrección en v1**: la entrega errónea permanece; solo se puede registrar una nueva si el caso lo permite (sobrepago impedido, PO-3) |
| **Consecuencias** | **A:** integridad preservada con constancia y auditoría (quién, cuándo, motivo opcional); exige transacción + matriz de permisos. **B:** un error de carga distorsiona `devuelto`, saldos e indicadores |
| **Decisión del usuario** | **DECIDIDA (14/10/2026): A** — corrección vía **Editar** (valida saldo resultante) o **«Eliminar»** lógico con constancia; **nunca borrado físico, nunca «Anular»** (DC-6, §4.3, §3.6.c) |
| **Estado** | **DECIDIDO POR EL USUARIO (14/10/2026)** |

#### PO-8 — Caja por concepto de reintegros: totales, acordeones y excedente (§6.2, §9.7) — DECIDIDA

| | |
|---|---|
| **Alternativa elegida** | **A+** (decidida por el usuario, 13/10/2026): **totales puros** de `totalIngresos`/`totalGastos` intactos + **entradas/salidas de reintegros del mes** en la Card Resumen de `/reintegros` + ~~acordeón informativo en `/ingresos` y `/gastos`~~ (**retirado por DC-1**, 14/10/2026); "excedente de caja" documentado **solo como fórmula de referencia** (`ingresos − gastos + entradas − salidas`), **sin** línea calculada en pantalla (evolución futura) |
| **Qué NO se hace** | No se agregan líneas nuevas en pantallas existentes; no se muestra el excedente calculado; no se alteran las fórmulas de `totalIngresos`/`totalGastos` (I-9) |
| **Aplicado en** | §3.2 (`movimientoInicial`), §4.1 punto 6 (precarga + anti-doble-captura), §6.2 (indicadores y fórmula), ~~§9.7 (acordeones)~~ (retirado por DC-1), §10.A/§10.B (archivos), §12.2 (casos de caja) |
| **Cuestión derivada (PO-8a)** | ~~¿`movimientoInicial` aparece como ítem en los acordeones del mes?~~ **SIN OBJETO desde 14/10/2026:** los acordeones fueron retirados por DC-1 (§6.2) |
| **Estado** | **DECIDIDO POR EL USUARIO (13/10/2026, según este prompt; alcance de acordeones supersedido por DC-1 el 14/10/2026)** |

### 12.4 Alternativas residuales

- **Retiro de Transferencias ANTES del módulo nuevo** (variante de 4.5 adelantada): técnicamente
  seguro hoy (colección vacía, 0 inflación efectiva) y limpiaría temprano; se descarta como
  plan base porque agrupa mejor la verificación del retiro con el módulo completo (4.5) y
  evita dos ventanas de cambio en `/gastos`/`/ingresos`. Queda como alternativa válida si el
  usuario prioriza limpieza inmediata (§14). *(No confundir con **4.0**, que es el gate de
  seguridad §8.5, obligatorio antes de las escrituras.)*
- **Colección única de eventos** (§3.5, alt. A) y **pagos embebidos** (alt. B): descartadas
  con racional; se reevaluarían solo si el volumen o la concurrencia lo exigieran
  (optimización futura).

### 12.5 Decisiones del usuario — DC-1 a DC-8 (14/10/2026)

> Registradas **tal como fueron dadas**, con el alcance que documentan y sin extrapolaciones
> técnicas (la ejecución de cada una queda sujeta a §12.6).

| ID | Decisión (usuario, 14/10/2026) | Secciones afectadas |
|---|---|---|
| **DC-1** | **`/reintegros` es la pantalla central:** lista de **todos los activos agrupados por mes de ingreso** (Pendientes/Cerrados con resumen + historial); **saldo** = entregas válidas no eliminadas; **`/home` solo botón** (sin cifras); **`/agregar` solo alta de obligación** (sin entregas); **retirar acordeones** de `/gastos` e `/ingresos` con nota de trazabilidad; **sin sumas** a `totalIngresos`/`totalGastos`; **`/balance` fuera de Etapas 3/4** | §6.1–§6.3, §9.1–§9.2, §9.7, §10.A/§10.B, §14 |
| **DC-2** | Cada entidad tiene **fecha propia**; **sin sobrepagos**; editar entrega valida el **saldo resultante**; estado **derivado** (cierre derivado); **condonación explícita**; **reabrir** al eliminar una entrega que liquidó; **sin borrado físico** | §3.2, §3.4, §4.3, §4.4 |
| **DC-3** | **No asumir permisos ilimitados:** permisos por alcance + **documentar las autorizaciones** de condonar/eliminar (matriz pendiente) | §3.6.e, §8.5 |
| **DC-4** | Sin avisos ni bloqueos por posibles **duplicados** en el alta (eso ≠ PO-4) | §5.3, R-4 |
| **DC-5** | **Título = texto libre** (PO-6A) | §3.2, §9.3 |
| **DC-6** | UI **exclusivamente «Eliminar»** (jamás «Anular»); constancia = registro original + **quién + cuándo + motivo opcional**; operación **atómica** | §4.3, §3.6.c, §12.2 |
| **DC-7** | **«Eliminar» obligación = lógico** con constancia y trazabilidad de sus entregas; **sin borrado en cascada** | §3.6, §11.4, §12.2 |
| **DC-8** | **Cuatro acciones diferenciadas:** registrar entrega · eliminar entrega · **condonar** · eliminar obligación (condonación ≠ pago ≠ eliminación) | §4.4, §12.2 |

### 12.6 Pendientes abiertos al cierre del diseño (no inventados)

| Pendiente | Qué falta definir | Referencias |
|---|---|---|
| **Vacíos de PO-4** (confirmación bilateral) | Estados/queries/UI de la confirmación; qué ocurre **entre el alta y la confirmación** (¿visibilidad? ¿puede la otra parte registrar entregas? ¿puede el creador editar/eliminar?); interacción con condonación y eliminación; subetapa de implementación | §5.3, §14 |
| **P-1 Bitácora** | Aprobación de la estructura (subcolección `eventos`, create-only) y de los tipos de evento | §3.6.b |
| **P-2 Atomicidad** | Estrategia técnica para **todas** las escrituras (incl. alta) y, sobre **T-1**, cómo **garantizar/reconciliar** `devuelto == Σ entregas no eliminadas` (no alcanza con afirmar "las transacciones lo hacen": SDK web sin queries en `Transaction.get`) | §3.6.a–c, §3.4 |
| **P-3 Estructura de campos** | Esquema de constancias (eliminación/condonación) y pago total derivado: **no fijado** (requisitos + alternativas A/B/C) | §3.2 |
| **P-4 Exclusión de eliminados** | Confirmación de la estrategia en cliente (campo ausente = activo) y del R-2 sin cambio | §3.3, §3.6.d |
| **P-5 Matriz de permisos** | Elección E1/E2 (eliminar obligación) y C1/C2 (condonar); edición de obligación con `devuelto > 0` | §3.6.e, §8.5 |
| **P-6 Congelaciones** | Aprobación de congelaciones (condonada: lectura + «Eliminar»; entregas congeladas; eliminada: inmutable) | §3.6.e |
| **P-7 Labels UI** | Textos confirmados: «Condonar», sello «Condonda» | §4.4 |
| **P-8 Casos del gate** | Criterios 3.7 y 3.11–3.15 como **propuestos** (no implementados) | §8.5 |
| **P-9 Reconciliación de `devuelto`** | Verificación de la invariante (propuesta para Etapa 4) | §3.4, §3.6.a, §14.1 |
| **Subetapa de la confirmación (PO-4)** | A qué subetapa de §14 se la asigna | §14 |

---

## 13. Criterios verificables de cierre del diseño

El diseño se considera completo y verificable cuando:

| # | Criterio | Estado en esta propuesta |
|---|---|---|
| C-1 | Las 15 secciones de `HANDOFF-ETAPA-3.md` §7 están presentes, con rutas/líneas exactas en §2 | ✅ §1–§15 de este documento |
| C-2 | El modelo cubre los 4 flujos de §3.4 (alta generación, devolución parcial/completa, consulta+liquidación, resumen mensual con las distinciones mínimas) | ✅ Flujos 1–4 (§3–§5, §6.2, §9.2–9.7). Ubicación del resumen **decidida** (**PO-2 CONFIRMADO**, §6.3); entradas/salidas de caja según **PO-8 (A+)** (§6.2); alcance de saldos pendientes según **PO-1 DECIDIDA** (stock global, §6.2) |
| C-3 | Invariante explícito: reintegros (generaciones y devoluciones) **no** entran en `totalIngresos` ni `totalGastos` | ✅ I-1 (§4.5), §6.1 |
| C-4 | Inventario **completo** de Transferencias con archivo:línea y recomendación por caso (datos / código / referencias diferenciados) | ✅ §7.1 (17 entradas), §7.2 |
| C-5 | Gate registrado **tal cual** con su veredicto operativo correcto (vacío ⇒ sin migración/borrado) y con sus **límites explícitos** (no prueba ausencia histórica fuera de la colección) | ✅ §2.3 |
| C-6 | Hechos del HANDOFF §4 re-verificados sobre el código actual, con qué confirmó / qué cambió / hallazgos nuevos | ✅ §2.4 |
| C-7 | Casos "debe cobrar" y "debe devolver" tratados con reglas explícitas, incluida la regla anti doble | ✅ §5 |
| C-8 | Contrapartes con/sin usuario con permisos y visibilidad propuestos; datos personales y ausencia de creación de cuentas respetados | ✅ §8 |
| C-9 | Cambios mínimos por archivo, con justificación, separando creación / edición / eliminación / no tocar; sin refactor general | ✅ §10 |
| C-10 | Interacciones adyacentes tratadas; deuda CRUD de ingresos marcada fuera de alcance | ✅ §11 |
| C-11 | Riesgos, casos límite y decisiones (PO-1, PO-3, PO-4, PO-5, PO-6, PO-7 **DECIDIDAS** 14/10/2026; PO-2 y PO-8 **DECIDIDAS** 13/10/2026; **DC-1…DC-8** y **pendientes P-1…P-9** listados) con alternativas, consecuencias y lo que sigue sin definir | ✅ §12.1, §12.2, §12.3, §12.5, §12.6 |
| C-12 | Subetapas candidatas de Etapa 4 pequeñas, verificables, con dependencias explícitas | ✅ §14 |
| C-13 | Coordinación 2.5 / 2.6 / Etapa 4 constatada (ambas cerradas el 11/10/2026) | ✅ §15 |
| C-14 | Hallazgos clasificados (`#actual`/`#deseado`/`#problema`/`#propuesta`) y separación explícita correcciones / estructurales / nuevas / mejoras / ideas | ✅ Apéndice A y B |
| C-15 | Restricciones §8 del handoff respetadas: solo diseño, `AppFinanciera/` intacto, 0 Firestore, 0 commits/push, sin retiro ni implementación, sin registrar cierre | ✅ Declarado en el encabezado y verificado al cierre |
| C-16 | `REQUIERE_VALIDACIÓN_FIRESTORE` marcado donde la respuesta dependa de datos/reales no verificables con código | ✅ §7.1 #17, §7.2, §8.1, §8.5, §12.1 (R-1, R-2) |
| C-17 | **Gate de seguridad de Firestore** definido como prerrequisito obligatorio previo a habilitar escrituras, con criterios de aceptación comprobables: reglas versionadas (copia de las vigentes + colecciones nuevas), equivalencia repo↔desplegado (hash/diff), pruebas en **Emulator Suite** (negativas concretas 3.1–3.8 y 3.11–3.15 incl. acople devolución↔obligación con `getAfter`, positivas 3.9–3.10), evidencia + aprobación — **criterios etiquetados `[Diseño propuesto]`, no implementados** | ✅ Definido en §8.5 (con nota de proyecto Staging compartido); **ejecución pendiente en Etapa 4** (subetapa 4.0) |
| C-18 | **Sobrepago impedido en v1**: validación del importe en form + validación transaccional sobre `monto − devuelto` (acumulador del doc obligación; el `Σ devoluciones` **no** se lee en la transacción), con comportamiento definido ante concurrencia, conectividad (sin cola) y mensajes esperados | ✅ §4.3, §9.4, R-9, I-7 |
| C-19 | **Atribución de pagos independiente de quién registró** (`realizadoPorUid` vs `registradoPor`) coherente en modelo, reglas, indicadores y ejemplos; invariante **I-8** (pagador = deudor, con asimetría documentada del tercero; compatible con **PO-5 decidida A**) | ✅ §3.1, §3.2, §4.2 (punto 5), §5.4, §6.2, I-6, I-8 |
| C-20 | PO-1…PO-8 presentadas con alternativas/consecuencias; **PO-2 y PO-8 DECIDIDAS** (13/10/2026); **PO-1, PO-3, PO-4, PO-5, PO-6 y PO-7 DECIDIDAS** (14/10/2026, según el prompt); **PO-8a SIN OBJETO**; **DC-1…DC-8** registradas (§12.5); lo no definido en **§12.6** (sin cerrar nada por inferencia) | ✅ §12.3, §12.5, §12.6 |
| C-21 | **Excedente de caja (PO-8 A+):** fórmula documentada como referencia (`ingresos − gastos + entradas − salidas`) **sin** línea calculada en pantalla; totales brutos intactos (I-9); casos de caja verificables con valores esperados | ✅ §6.2, §12.2, I-9 |
| C-22 | ~~Acordeones del mes en `/ingresos` y `/gastos`~~ **Retirados por DC-1** (14/10/2026): esas páginas **no reciben** secciones nuevas ni hook propio; `useIngresos`/`useGastos` sin cambios fuera de 4.5 (retiro 4.5 separado con sus 6 condiciones intactas, §7.4) | ✅ §9.7 (nota de trazabilidad), §10.B, §10.D |
| C-23 | **Evidencia en 3 niveles** sin contradicciones: `[Dato actual]` / `[Diseño propuesto — no implementado]` / `[Pendiente de aprobación]`; nada de bitácora, transacciones ni pruebas presentado como existente (§14.1 = pruebas **propuestas, no ejecutadas**) | ✅ Leyenda del encabezado, §3.6, §8.5, §14.1 |
| C-24 | **Invariante T-1** documentada como **requerida** (`devuelto == Σ entregas no eliminadas`) con su estrategia técnica **pendiente** (sin afirmar que las transacciones por sí solas la garantizan) | ✅ §3.4, §3.6.a, I-3 |
| C-25 | **Supersesiones y tensiones explícitas** (acordeones→DC-1, PO-4 alt A→B, guarda "no eliminar con devoluciones"→DC-7, "borrado por corrección"→I-10; tensiones T-1/T-2/T-3) | ✅ Encabezado, §3.6.d, §4.5, §9.7, §11.4, §12.3 |

---

## 14. Candidatos de subetapas para la implementación futura (Etapa 4)

**Ninguna subetapa está autorizada aún:** la Etapa 4 requiere aprobación explícita y separada
del usuario. Estas son candidatas **a planificar** tras aprobar el diseño. Cada una sigue el
flujo completo: Local → Staging (con aprobación) → Producción (con aprobación) → verificación
(AGENTS.md). Patrón de verificación sugerido por subetapa: `build` + `lint` (0 nuevos) +
harness runtime local (patrón 2.2/2.7) + prueba funcional del usuario.

| Subetapa | Alcance (mínimo verificable) | Dependencias | Criterios de done |
|---|---|---|---|
| **4.0 — Gate de seguridad Firestore (G-Seg)** | Ejecutar el gate de §8.5: versionar `firestore.rules`/`firebase.json` (**copia exacta** de las reglas vigentes en consola + colecciones nuevas); verificar **equivalencia repo↔desplegado** (copia desde consola + hash/diff registrado); correr pruebas en **Emulator Suite** (`@firebase/rules-unit-testing`): negativas 3.1–3.8 y **3.11–3.15** (incl. acople devolución↔obligación con `getAfter`, doble eliminación, bitácora create-only, condonación) y positivas 3.9–3.10; registrar evidencia. *Staging comparte proyecto Firebase (§8.5): el Emulator es el único entorno de prueba de reglas* | Aprobación de la Etapa 4 | Los **criterios 1–4** de §8.5 PASS + evidencia registrada + **aprobación expresa del usuario**. **Sin PASS no se habilita ninguna escritura del módulo** (dependencia de 4.1) |
| **4.1 — Modelo y servicios** | Colecciones `reintegros` (acumulador `devuelto` + `participantes` + `movimientoInicial`, §3.2) + `reintegro_devoluciones` (`realizadoPor*`/`registradoPor*` separados + `fechaPago`, §3.2); **estructura de constancias según P-3 (pendiente)**; `subscribeReintegros.js` (R1'/D1, §3.3, exclusión en cliente P-4); `useReintegros.js` con cálculo de saldos/estados/indicadores/entradas-salidas (§3.4, §6.2, I-8, I-9) y acciones de escritura; **bitácora según P-1 (pendiente)**; **sin UI visible aún** (o con prueba en sandbox) | Aprobación de la Etapa 4 **+ G-Seg (4.0) PASS** + **aprobación de P-1/P-3/P-4** | Harness propuesto (§14.1): saldo parcial/completo/liquidado/condonado, sentido espejo, indicadores (incl. "Devoluciones realizadas" por `realizadoPorUid`), entradas/salidas con `movimientoInicial` y `fechaPago`, **reconciliación `devuelto == Σ entregas no eliminadas`** (P-9), **prueba de partición de indicadores** (sentido × pagador: cada devolución cae en exactamente un indicador; asimetría del tercero según I-8), edición de monto con guarda `monto >= devuelto`; `build`/`lint` OK; 0 escrituras en Producción |
| **4.2 — Alta de generación** | `ReintegroModal` + hook de estado del modal + `submitReintegro`; botón "Reintegro" en `/agregar` (`page.jsx`); redirect a `/reintegros` | 4.1 | Alta por **modal** (ambos sentidos; contraparte miembro y externa; `movimientoInicial` precargado con anti-doble-captura) verificada en Local/Staging |
| **4.3 — Devoluciones y consulta de pendientes** | `DevolucionModal` (selector "¿Quién pagó?" con precarga del deudor I-8, campo **fecha `fechaPago`**, saldo precargado para "Saldar deuda") + `submitDevolucion` **transaccional** (lee obligación, valida `importe <= monto − devuelto`, escribe devolución + actualiza `devuelto`; manejo de concurrencia y de sin red — §4.3); página `/reintegros` con **pestañas Pendientes/Cerrados** y `FilaReintegro` | 4.2 | Parcial baja saldo; completa liquida y migra a Cerrados; historial visible; sobrepago rechazado con mensaje; doble escritura simultánea = solo una gana; `devuelto` siempre == Σ de entregas no eliminadas (P-9); sin red: mensaje y sin cola; atribución de pago por pagador |
| **4.4 — Resumen mensual y agrupaciones** | `ResumenMesCard` con los indicadores de §6.2 + **selector de mes propio** (solo flujos; decisión PO-1); lista de `/reintegros` **agrupada por mes de ingreso** (Pendientes y Cerrados; PO-1 **decidida**); **sin acordeones** en `/ingresos`/`/gastos` (DC-1) | 4.3 | Los 4 indicadores mínimos (+ Deuda generada) por separado; **Entradas/Salidas de reintegros** (PO-8 A+); stock global de pendientes etiquetado; grupos por `createdAt` orden desc; mes sin operaciones en cero; `totalIngresos`/`totalGastos` intactos |
| **4.5 — Retiro de Transferencias (paso separado)** | §7.1 #1–#16 (ediciones §10.B + eliminaciones §10.C), **previo cumplimiento de las 6 condiciones de §7.4**: diff revisado, referencias identificadas, totales sin cambios indebidos, evidencia de las pruebas de retiro, I-1 verificado, aprobación explícita del usuario | 4.4 (recomendado; alternativa: adelantada — §12.4) | Las 6 condiciones de §7.4 cumplidas; greps 0 restos; build/lint OK; totales de `/gastos` e `/ingresos` correctos (0 documentos de transferencias, gate ya PASS); Reintegros no suma como ingreso ni gasto; verificación en Producción |
| **4.6 — (Opcional / mejora)** | CRUD ampliado, vinculación `gastoVinculadoId`, BottomNav, **confirmación bilateral (PO-4 decidida: pendiente de diseño detallado, §12.6)**, ítem de excedente calculado (evolución de PO-8); **ya NO**: condonación (en alcance, mover a la subetapa que corresponda según §12.6), corrección de entregas (PO-7 decidida → va con 4.3/CRUD), PO-8a (sin objeto) | 4.4 | Definir por separado, fuera del mínimo §3.4 |

**Candidatas nuevas derivadas de las decisiones 14/10/2026 (sujetas a aprobación):**

| Subetapa | Alcance | Dependencias |
|---|---|---|
| **4.3-bis — Eliminar/condonar (acciones DC-6/DC-7/DC-8)** | Helpers transaccionales `eliminarEntrega`/`eliminarObligacion`/`condonar` (§3.6.c), constancias (P-3), sello UI y labels (P-7) | 4.3 + **aprobación de P-3/P-5/P-6/P-7** |
| **4.4-bis — Bitácora (P-1)** | Subcolección `eventos` create-only + escritura en cada acción | 4.1 + **aprobación de P-1**; reglas dentro de 4.0 |

### 14.1 Pruebas propuestas (NO ejecutadas)

> **[Pendiente de aprobación] — ninguna de estas pruebas fue ejecutada**; se listan como
> candidatas de harness para las subetapas de §14. **`package.json` no incluye ningún
> framework de pruebas ni `@firebase/rules-unit-testing`** (verificado 14/10/2026): el
> entorno de pruebas es a su vez una **herramienta a instalar y aprobar** en Etapa 4.

1. Alta de obligación por ambos sentidos; `participantes` correctos; redirección a `/reintegros`.
2. Devolución parcial: baja `devuelto`, `saldo > 0`, sigue en Pendientes.
3. Devolución completa: `saldo == 0`, estado derivado `liquidado`, migra a Cerrados.
4. Sobrepago rechazado (form y transacción), sin escritura parcial.
5. Dos devoluciones simultáneas contra el mismo saldo: solo una gana; `devuelto` consistente.
6. Sin red: transacción falla sin cola y con mensaje; sin escritura encola offline.
7. Atribución: pagador ≠ registrador; indicadores usan `realizadoPorUid`; asimetría del tercero (I-8).
8. **Reconciliación (P-9):** `devuelto == Σ entregas no eliminadas` tras alta, edición y eliminación.
9. Participante no autorizado: sin escritura (emulador, §8.5).
10. Estado derivado: ninguna escritura almacena `estado` (I-3).
11. *(Propuesto, DC)* **Eliminar entrega:** atómica; reabre si liquidaba; doble eliminación rechazada; `devuelto` recalculado sin restas ciegas.
12. *(Propuesto, DC)* **Eliminar obligación:** lógica; conserva entregas + constancia; sale de listas sin salir de BD.
13. *(Propuesto, DC)* **Condonación:** sin entrega, sin `devuelto`, sin caja; estado `condonado`.
14. *(Propuesto, DC)* **Obligación eliminada:** inmutable (edición/re-eliminación rechazadas).
15. *(Propuesto, DC)* **Bitácora:** create-only; rollback deja eventos consistentes.

*(Formato: run de harness local por subetapa + evidencia en Staging; ninguna de estas
pruebas corre en esta Etapa 3.)*

**Orden recomendado:** 4.0 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5 (→ 4.6 y/o 4.3-bis/4.4-bis si se
aprueban).
**4.0 (gate de seguridad) es prerrequisito de 4.1**: no se habilita ninguna escritura del
módulo sin su PASS. La justificación de dejar 4.5 al final: verificar el retiro una sola vez,
con el módulo nuevo funcionando, evitando dos ventanas de cambio en `/gastos`/`/ingresos`.
Alternativa válida (§12.4): **adelantar el retiro** si se prioriza limpieza inmediata (seguro
hoy por colección vacía), sin confundirlo con el gate 4.0.

---

## 15. Recomendación sobre cómo coordinar 2.5, 2.6 y la Etapa 4 (§6 del handoff — constatación)

**Constatación (§6 del handoff, ya resuelta):** la **2.5** (`3216095`, retiro del flujo
legacy de gastos fijos) y la **2.6** (`10ab576`, limpieza de código muerto) **ambas cerraron
el 11/10/2026**, **antes** de este diseño, y quedaron **verificadas en Producción** por el
usuario. `main` == `staging` == Producción == `10ab576`. **La Etapa 2 está completamente
cerrada (9/9 subetapas); no hay subetapas abiertas que bloqueen este diseño.**

La sugerencia de §6 del handoff (**excluir `transferencias` del alcance de 2.6**) **se
siguió**: 2.6 limpió código muerto **sin tocar** el área de Transferencias. Además, por
decisión explícita del usuario quedaron **conservados** para esta evaluación (ya realizada
aquí):

| Elemento conservado por 2.6 | Evaluación de la Etapa 3 (esta propuesta) |
|---|---|
| `app/gastos/helpers/gastosCalculations.js` (0 importadores; balances de Transferencias) | **Recomendación: eliminar en 4.5** (§7.1 #16) — su semántica ("Transferencias recibidas = ingresos") contradice D-2 y queda reemplazada por Reintegros |
| `origenCompra` en `submitCompra.js:74` (escritura sin lectores) | **Recomendación: no tocar** (§7.1 #17) — decisión 2.6 #2 ya cerrada; no guardado con Transferencias; uso externo `REQUIERE_VALIDACIÓN_FIRESTORE` sin acción en Etapa 4 |
| `Transferenciassections.jsx` (0 importadores; área Transferencias) | **Recomendación: eliminar en 4.5** (§7.1 #12) — evaluado: conservarlo no aporta; su rol lo toma `FilaReintegro` |

**Coordinación recomendada con la Etapa 4:** (1) el usuario aprueba este diseño (cierre de la
Etapa 3 en la conversación de cierre); (2) recién entonces se planifican las subetapas de
§14 con alcance y dependencias; (3) la implementación de cada subetapa obedece el flujo de
ramas y despliegue de `AGENTS.md` (nunca push directo a `main`); (4) el retiro de
Transferencias (4.5) ocurre **dentro** de la Etapa 4, nunca antes de su aprobación. **Este
documento no autoriza ninguna de esas acciones.**

---

## Apéndice A — Clasificación de hallazgos (`#actual | #deseado | #problema | #propuesta` + etapa)

| ID | Etiqueta | Hallazgo / propuesta | Etapa |
|---|---|---|---|
| A-1 | `#problema` | Transferencias recibidas suman como ingreso en `totalIngresos` (`useIngresos.js:103-114`) | 4 (retiro, subetapa 4.5) |
| A-2 | `#problema` | Transferencias enviadas suman como gasto personal (`useGastos.js:65-76` → `:130`) | 4 (retiro, 4.5) |
| A-3 | `#actual` | Alta de transferencias deshabilitada en UI (botón comentado `page.jsx:79-91`); render muerto `:133-135` | 4 (retiro, 4.5) |
| A-4 | `#actual` | Lecturas de transferencias activas en `subscribeGastos`/`subscribeIngresos` (0 documentos ⇒ 0 inflación efectiva hoy) | 4 (retiro, 4.5) |
| A-5 | `#actual` | "N ingresos" cuenta `transferenciasRecibidas.length` sin sección visible (`page.jsx:67-73`; JSX `:110-122`) — patrón "contado pero invisible" | 4 (retiro, 4.5) |
| A-6 | `#actual` | `FilaGasto.jsx` special-casea filas `tipo === "transferencia"` (sin editar/eliminar) | 4 (retiro, 4.5) |
| A-7 | `#actual` | `gastosCalculations.js` sin importadores con semántica legacy ("Transferencias recibidas = ingresos") | 4 (eliminación, 4.5) |
| A-8 | `#actual` | `origenCompra` escrito sin lectores (`submitCompra.js:74`) | Sin acción (decisión 2.6 #2); evaluar aparte |
| A-9 | `#problema` | No existe concepto de deuda/cobro pendiente ni de saldo de reintegros (dominio §5) | 4 (módulo nuevo, 4.1–4.4) |
| A-10 | `#deseado` | Reintegros como categoría propia, aplicable a pareja, grupo, amistades, familiares y externos; reutilizable por el módulo tarjeta futuro | 4 (diseño §3–§8) |
| A-11 | `#propuesta` | Colecciones `reintegros` + `reintegro_devoluciones`; estado 100 % derivado; liquidación = estado derivado (§3) | 4 (4.1) |
| A-12 | `#propuesta` | Visibilidad bilateral para contrapartes con usuario; solo-registrador para externos; sin creación de cuentas (§8) | 4 (4.1–4.3) |
| A-13 | `#propuesta` | Resumen mensual con los 4 indicadores mínimos + "Deuda generada" simétrico; saldos como stock global (**PO-1 DECIDIDA** 14/10/2026); ubicación del resumen **decidida** (**PO-2 CONFIRMADO** — §6.2, §6.3) | 4 (4.4) |
| A-14 | `#propuesta` | CRUD básico de reintegros desde el día 1 (lección de la deuda de ingresos §9.1) | 4 (4.2/4.3) |
| A-15 | `#propuesta` | Regla anti doble registro por **confirmación bilateral** (**PO-4 DECIDIDA** 14/10/2026; alcance §5.3, vacíos §12.6), con convención de uso como mitigación mientras no esté implementada (R-4) | 4 (confirmación; subetapa a asignar — §12.6) |
| A-16 | `#deseado` | **Gate de seguridad Firestore (§8.5)**: reglas versionadas (copia exacta de las vigentes + colecciones nuevas), equivalencia repo↔desplegado y pruebas en **Emulator Suite** (negativas concretas 3.1–3.8, incl. acople devolución↔obligación; positivas) como **prerrequisito obligatorio** antes de habilitar las escrituras (el filtrado cliente no es garantía) | **4.0 (gate previo a 4.1)** — `REQUIERE_VALIDACIÓN_FIRESTORE` |
| A-17 | `#deseado` | Vinculación `gastoVinculadoId` (obligación ↔ gasto extraordinario) | Futuro (4.6) |
| A-18 | `#deseado` | **Confirmación bilateral** de obligaciones (estilo fijos — **PO-4 DECIDIDA**, pendiente de diseño/subetapa, §12.6); **condonación** ahora **en alcance** (DC-8, §4.4); ajustes de monto = edición con guarda | Futuro/4 (subetapas por asignar) |
| A-19 | `#actual` | Deuda CRUD de ingresos sin editar/eliminar (`PROPUESTA-2.3.md` §9.1) — adyacente | Fuera de alcance de la Etapa 4 |
| A-20 | `#actual` | `subscribeIngresos` sin manejo de errores (loading infinito si falla la query); el retiro #9 la simplifica pero no la cierra | Fuera de alcance de la Etapa 4 |
| A-21 | `#actual` | Escrituras sin timeout en Firestore (deuda preexistente AGENTS.md); heredada por los nuevos submits | Fuera de alcance de la Etapa 4 |
| A-22 | `#actual` | Identificación mixta `uid`/`iud` en `users`/`groups.members` (frágil para resolver contrapartes; R-5) | Fuera de alcance (mitigación por fallback) |
| A-23 | `#propuesta` | **Atribución de pagos separada del registro**: `realizadoPorUid`/`realizadoPorNombre` (quien pagó) vs `registradoPor*` (auditoría); indicador "Devoluciones realizadas" usa el pagador; **I-8** pagador = deudor con asimetría del tercero y precarga en el modal (§3.1, §3.2, §4.2 (punto 5), §6.2, §9.4, I-6, I-8) | 4.1 / 4.3 (compatible con **PO-5 decidida A**; I-8 no la cierra) |
| A-24 | `#propuesta` | **Sobrepago impedido en v1** (**PO-3 DECIDIDA** 14/10/2026): validación en form + validación transaccional sobre el acumulador `devuelto` (el `Σ devoluciones` **no** se lee en la transacción — SDK web), con reglas de concurrencia, conectividad y mensajes esperados (§4.3, I-7, R-9) | 4.3 |
| A-26 | `#propuesta` | **Acumulador `devuelto` en `reintegros`**: índice atómico escrito solo por la transacción de devolución; permite leer–validar–escribir sin queries en `Transaction.get` (SDK web). Reconciliable con `Σ devoluciones`; edición de monto con guarda `monto >= devuelto` (§3.2, §3.4, §4.3) | 4.1 / 4.3 |
| A-27 | `#propuesta` | **Invariante I-8 (pagador = deudor)**: atribución contable de indicadores con asimetría documentada del pagador tercero; precarga del deudor en el modal; prueba de partición en el harness (§4.5, §6.2, §9.4, §14) | 4.1 / 4.3 (compatible con **PO-5 decidida A**; **no la cierra** — los límites por operación van a P-5) |
| A-25 | `#deseado` | **Estado PO/DC (14/10/2026):** PO-1…PO-7 **decididas** (PO-2/PO-8 el 13/10; PO-1/3/4/5/6/7 el 14/10); PO-8a **sin objeto**; **DC-1…DC-8** registradas (§12.5); pendientes técnicos **P-1…P-9** (§12.6) | Decididas: aplicar en 4.x; pendientes: requieren aprobación antes de la subetapa correspondiente |
| A-28 | `#propuesta` | **H-4 aplicado:** `participantes` (array, ≤2 en v1) + `groupId` opcional; query única R1' (`array-contains` + `orderBy createdAt`); visibilidad v1 limitada a las dos partes; gasto entre N = N reintegros (futuro) (§3.2, §3.3) | 4.1 |
| A-29 | `#propuesta` | **H-5 aplicado:** `fechaPago` en devoluciones; default = creación; editable en modal; atribuye el mes de entradas/salidas e indicadores (§3.2, §6.2, §9.4) | 4.1 / 4.3 |
| A-30 | `#propuesta` | **PO-8 (A+) decidido:** `movimientoInicial` (`salida`/`entrada`/`ninguno`) con precarga por sentido y anti-doble-captura; entradas/salidas de caja del mes; excedente como fórmula de referencia **sin** línea calculada; **I-9** (§3.2, §4.1 punto 6, §6.2, §12.2) | 4.1–4.4 |
| A-31 | `#propuesta` | **PO-2 (CONFIRMADO):** pestañas Pendientes/Cerrados en `/reintegros`; botón de navegación en `/home`; ~~acordeones en `/ingresos` y `/gastos`~~ **retirados por DC-1** (14/10/2026, §9.7) | 4.3 / 4.4 |
| A-32 | `#propuesta` | Modal de alta `ReintegroModal` en `/agregar` (reemplaza al wizard `ModoReintegro` de la versión previa del diseño) (§9.3, §10.A) | 4.2 |
| A-33 | `#propuesta` | **PO-7 decidida (14/10/2026):** corrección de entregas vía **Editar** (saldo resultante) o **«Eliminar»** lógico atómico con constancia; **nunca borrado físico** (§4.3, §12.2, §12.3) | 4.3 / 4.3-bis |
| A-34 | `#propuesta` | **Bitácora de eventos** (`reintegros/{id}/eventos`, create-only) para creación/edición/eliminación/condonación — **P-1 pendiente** (§3.6.b) | 4.4-bis (tras aprobar P-1) |
| A-35 | `#propuesta` | **Eliminación lógica universal** (DC-6/DC-7): constancia quién/cuándo/motivo opcional, sin borrado físico ni en cascada; registro eliminado inmutable (I-10, I-11) — **P-3/P-5/P-6 pendientes** (§3.6) | 4.3-bis |
| A-36 | `#propuesta` | **Condonación** (DC-8): acción explícita ≠ pago ≠ eliminación; estado derivado `condonado`; sin `devuelto` ni caja (I-12) — labels **P-7 pendientes** (§4.4) | 4.3-bis |
| A-37 | `#propuesta` | **Todas las escrituras transaccionales** (P-2): alta, entrega, editar, eliminar, condonar, con rollback total y mensajes de conflicto — **no implementado; T-1 abierta** (§3.6.a–c) | 4.1–4.3-bis |
| A-38 | `#propuesta` | **Agrupación de la lista por mes de ingreso** (`createdAt`, desc) con selector **solo en Card Resumen** para flujos (**PO-1/DC-1**, §3.3, §9.2) | 4.4 |

## Apéndice B — Separación explícita de tipos de cambio

**Prerrequisito de seguridad (gate obligatorio, previo a cualquier escritura del módulo):**

- Gate de seguridad Firestore: reglas versionadas (copia de las vigentes + colecciones
  nuevas), equivalencia repo↔desplegado y pruebas en **Emulator Suite** (negativas concretas,
  acople devolución↔obligación, positivas), con evidencia y aprobación del usuario
  (A-16, §8.5) — subetapa **4.0**, dependencia de 4.1. **No es una mejora futura: sin PASS
  no se escribe.**

**Correcciones necesarias** (arreglan un comportamiento incorrecto/latente del modelo actual):

- Retiro de las lecturas de transferencias que inflan totales (A-1, A-2, A-4) — 4.5.
- Conteo honesto de "N ingresos" (A-5) — 4.5.
- Limpieza de la rama `esTransferencia` en `FilaGasto` (A-6) — 4.5.

**Cambios estructurales** (nueva forma de representar el dato, sin UI nueva aún):

- Modelo de datos de Reintegros: colecciones `reintegros` + `reintegro_devoluciones`,
  sentido, saldos derivados (A-11) — 4.1.
- Suscripciones y hook de cálculo (`subscribeReintegros`, `useReintegros`) — 4.1.

**Funcionalidades nuevas** (capacidades que el usuario no tiene hoy):

- Alta de obligaciones (generación, ambos sentidos, contraparte miembro o externa, modal) — 4.2.
- Registro de devoluciones parciales/completas y liquidación derivada — con atribución de
  pago propia (`realizadoPorUid`, A-23), **fecha `fechaPago`** (H-5, A-29) y validación
  transaccional de sobrepago (A-24) — 4.3.
- Consulta de saldos pendientes con **pestañas Pendientes/Cerrados** — 4.3 (A-31).
- Resumen mensual con indicadores separados + **Entradas/Salidas de reintegros** (PO-8) — 4.4.
- **Agrupación de la lista por mes de ingreso** con selector solo de flujos (PO-1/DC-1) — 4.4 (A-38).
- ~~Acordeones del mes en `/ingresos` y `/gastos`~~ **retirados por DC-1** (§9.7) — sin subetapa.
- CRUD básico de reintegros (editar/eliminar con constancia y guardas; DC-6/DC-7) — 4.2/4.3 (A-14, A-33, A-35).
- **Condonación** (acción explícita, DC-8) — 4.3-bis (A-36).
- Eliminación de `gastosCalculations.js` y `Transferenciassections.jsx` (código muerto evaluado) — 4.5 (A-7).

**Mejoras futuras** (valiosas pero fuera del mínimo de la Etapa 4; requieren decisión propia):

- Vinculación obligación ↔ gasto (`gastoVinculadoId`) — A-17.
- **Confirmación bilateral** de obligaciones (PO-4 decidida; **diseño/subetapa pendientes**,
  §12.6) — A-18/A-15; **bitácora** (P-1) y **estructura de constancias** (P-3) si no se
  aprueban con 4.x.
- Entrada en **BottomNav** (el acceso por `/home` ya está resuelto con PO-2 CONFIRMADO);
  **línea de excedente de caja calculada** en pantalla (evolución futura de PO-8 A+).
- Catálogo de conceptos — **PO-6 resuelta como texto libre** (catálogo solo si el uso lo
  pide); denormalización de saldos si crece el volumen — R-3.
- Módulo tarjeta reutilizando este modelo — dominio §7 (Etapa 4+ posterior).

> **Nota:** la seguridad de Firestore (A-16) **no** figura entre las mejoras futuras: es un
  **prerrequisito obligatorio** (§8.5, subetapa 4.0) previo a habilitar escrituras.

**Ideas de producto** (visión, no compromiso de implementación):

- Recordatorios de cobro/devolución a contrapartes.
- Compartir el estado de un reintegro con un externo (link/invitación sin cuenta completa).
- Estadísticas de reintegros (quién debe más, tendencias de recuperación).
- Integración con el Organizador para reportes de saldo pendiente global.

---

*Fin del documento. Etapa 3 — diseño del modelo de Reintegros. Producido 13/10/2026;
**actualizado 14/10/2026** con las decisiones PO-1…PO-7 y DC-1…DC-8 del usuario, la
sección §3.6 (diseño propuesto de fuente de verdad/bitácora/permisos), §12.5/§12.6 y §14.1.
Pendiente: aprobación del diseño (y Organizador) para cerrar la Etapa 3 y planificar la
Etapa 4, más los pendientes P-1…P-9 de §12.6. Este documento no implementa, no modifica
código ni datos, y no autoriza deploys.*





