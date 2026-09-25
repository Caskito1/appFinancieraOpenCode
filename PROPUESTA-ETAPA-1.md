# PROPUESTA-ETAPA-1 — Base estructural (AppFinanciera)

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Etapa:** 1 (diseño/análisis, read-only sobre la aplicación)
**Fuente:** HANDOFF-ETAPA-1-BASE-ESTRUCTURAL.md, REPORT-ETAPA-0.md, context/MAPA-APPFINANCIERA.md, context/dominio.md, context/arquitectura.md
**Fecha:** 2026-09-24

---

## 1. Resumen ejecutivo

La Etapa 0 identificó: (a) **doble esquema en `fixed_expenses`** (config activa `{expenseId, usuario, montoDefault, activo}` vs legacy `{nombre, compartido, monto, fecha, balanceado, saldoPendiente, ...}`), (b) **50/50 hardcodeado** y **`participantes` asumido exactamente 2** (`useFixedExpenses.js:175,264-265`; `useGastos.js:97,113`), (c) **transferencias legacy** leídas por `/gastos` y `/ingresos` pero UI de alta deshabilitada (`agregar/page.jsx:82-107`), (d) **concepto de recuperaciones/reintegros no modelado** (las recibidas suman como ingreso, contradiciendo "reintegro ≠ ingreso"), (e) **Otros** faltante en catálogo activo de gastos fijos, (f) **taxonomía de fijos duplicada** (`temp.js` sin importadores).

La presente propuesta establece una **base estructural** para sostener el mínimo funcional:

- **Unificar esquema de `fixed_expenses`** hacia **config activa** por usuario. El esquema legado (escritura por `fixedExpenseHelpers.js`/ModoGastosFijos) debe considerarse **obsoleto y fuera de uso activo**. No se propone migración (Etapa 1 no implementa), solo posición estructural.
- **Extender modelo de división** a **porcentajes configurables y N participantes** (flexible internamente), manteniendo 50/50 por defecto y posibilidad de interfaz simple hoy.
- **Posicionar `transferencias` como legacy** (queries en código; **colección ausente** en Firestore — validado v3.1) pero **no incorporarlas al modelo de ingresos reales**; la corrección semántica (reintegro ≠ ingreso) pasa por introducir **recuperaciones/reintegros** (Etapa 3) y desvincular transferencias recibidas de "ingresos reales".
- **Proponer modelo conceptual de `recuperaciones`/`reintegros`** (colección + estados), reutilizable para futuro módulo de **tarjeta** (Etapa 4), cumpliendo regla fundamental: **reintegro/recuperación ≠ ingreso real**.
- **Preservar decisiones cerradas:** diario compartido ≠ deuda; fijos compartidos generan balance con historial; "Otros" presente en todos los catálogos relevantes.

**Clasificación general:** #propuesta + Etapa 1 (base estructural). Cambios **solo de diseño/documentación**; sin modificación de la app.

---

## 2. Modelo de datos propuesto por colección

> Distinguir: **Estructural ahora (Etapa 1)** / **Habilitante Etapa 3** / **Futuro Etapa 4**. Basado en evidencia de código (`archivo:línea`).

### 2.1 `gastos`
- **Estado actual (#actual):** `{ usuario, tipo:"personal"|"compartido", monto, detalle, categoria, subcategoria, contexto, producto, productoId, esOtros?, cantidad?, unidad?, usuarioNombre?, groupId?, origenCompra?, createdAt(serverTimestamp()) }` (`submitUnico.js:28-69`, `submitCompra.js:30-75`, `useGastos.js:61-80`).
- **Propuesta (estructural ahora):** mantener esquema actual. **Principio:** gasto compartido diario **no genera balance** (Decisión 2). `origenCompra` existe pero **no se lee** (#problema menor, código muerto potencial; no requiere cambio estructural ahora).
- **Nota:** "Tu parte" en UI = lo pagado por el usuario (`GroupSection.jsx:18`, `useGastos.js:87-89`) — semántica actual a documentar, no cambiar en modelo.
- **Clasificación:** #actual confirmado, #propuesta mantener sin cambios estructurales.

### 2.2 `fixed_expenses` (configuración activa)
- **Estado actual (#actual/#problema):** Dos esquemas en misma colección:
  - **A (activo/config):** `{ expenseId, usuario, montoDefault?, activo, createdAt }` (`useFixedExpenses.js:180-189`, `agregarGastoPersonal/actualizarMontoDefault/desactivarGastoPersonal`)
  - **B (legacy):** `{ nombre, expenseId, categoria/compartido, monto, fecha, vencimiento?, estado, pagado, balanceado, saldoPendiente, usuario, usuarioNombre, groupId?, createdAt }` (`fixedExpenseHelpers.js:24-71`, ModoGastosFijos — UI deshabilitada)
- **Propuesta (estructural ahora):** **Adoptar esquema único A (config activa por usuario)** como modelo de trabajo. 
  - **Esquema recomendado único:**
    ```text
    fixed_expenses (config usuario)
    - expenseId (string, obligatorio) — id estable (catálogo)
    - usuario (string/uid, obligatorio) — dueño de la activación
    - montoDefault (number|null) — sugerido para registrar entrada mensual
    - activo (boolean, obligatorio) — si aparece en catálogo activo del usuario
    - createdAt (Timestamp) — serverTimestamp()
    ```
  - **Evidencia Firestore (v3.1, read-only):** los datos actuales están **100 % en esquema A**. La coexistencia legacy corresponde al **código/flujo histórico**, **no** a documentos legacy encontrados en Firestore.
  - 9/9 con `expenseId` · 9/9 con `usuario` · 9/9 con `activo` · 9/9 con `montoDefault` numérico · 9/9 con `createdAt`
  - 9/9 `activo=true`
  - 7 `expenseId` distintos (candombe, celular, disney, drive, fondo_solidaridad, oca, spotify)
  - **0 legacy · 0 híbridos**
- **Regla:** documentos con esquema legacy **no deben escribirse** en flujos activos; el esquema B (escritura por helper legacy) se considera **obsoleto** y **solo de código**. La posición propuesta es **dejar de usar esquema B** (sin migrar datos históricos en Etapa 1: no hay documentos legacy que migrar). No se ejecuta migración.
- **Justificación (#propuesta):** elimina doble esquema (P8), reduce ambigüedad, alinea con lectura activa (`useFixedExpenses` lee config activa por `usuario`+`activo==true`).
- **Clasificación:** #problema (doble esquema en código) → evidencia muestra **100 % A en datos** → **#actual confirmado, legacy solo en código**. Etapa futura: 2 (limpieza del helper legacy). **No implementado ahora.**

### 2.3 `fixed_expense_entries` (entradas mensuales — ACTIVO)
- **Estado actual (#actual):** `{ fixedExpenseId, nombre, periodo (YYYY-MM), montoTotal, vencimiento?, pagoHasta?, paidByUid?, paidByNombre?, usuario, groupId?, participantes[], estado: "sin_registrar"|"pendiente_pago"|"pendiente_saldar"|"saldado"|"pagado_hasta", createdAt }` (`useFixedExpenses.js:201-244`, `subscribeFixedExpenses.js:17-47`).
- **Propuesta (estructural ahora):** **Mantener esquema actual** como base, con **extensión de modelo de división** (no ruptura):
  - **Extensión propuesta (habilita Etapa 1/4):**
    - `division` (opcional): objeto `{ tipo: "fijo_50_50"|"porcentual"|"personalizado", modo?: string }` (por defecto `fijo_50_50` para compatibilidad hacia atrás)
    - `participantes[]` ampliar para soportar **N participantes** con `{ uid, corresponde (number), pagado (number), porcentaje? (number) }`. Hoy asume 2; propuesto permitir >=1. **No romper docs existentes** (lectura tolerante).
- **Regla de totales (#deseado/#propuesta):** el modelo interno debe permitir porcentajes configurables (Decisión 7). Hoy hardcodeado: `mitad = montoTotal/2` (`useFixedExpenses.js:264`), `montoPersonal/2` en totales (`useGastos.js:97,113`, `useFixedExpenses.js:175`). Propuesta: **abstraer cálculo de "parte correspondiente"** por participante (basado en `division.porcentajes` o `corresponde` calculado). **Interfaz puede seguir mostrando 50/50**.
- **Estados:** mantener tal cual (incluye `pagado_hasta` para vigencia anual). 
- **Hallazgos:** `#problema` fijo compartido en `pendiente_pago` suma 50% al mes (`useGastos.js:110-114`) — el cálculo de totales mensuales debe considerar **estado** (no sumar montos con nadie pagado o con entrada no registrada). Esto afecta lógica de lectura (Etapa 2/3), no estructura del documento.
- **Clasificación:** #actual mantener + #propuesta extensión no invasiva (backward compatible). Estructural ahora.

### 2.4 `ingresos`
- **Estado actual (#actual):** `{ usuario, tipo:"sueldo"|"banda"|"freelance"|"otros", subtipo?, detalle?, monto, usuarioNombre?, createdAt }` (`submitIngreso.js:26-45`, `useIngresos.js:63-83`).
- **Propuesta (estructural ahora):** mantener esquema. **Separación conceptual clave:** ingresos aquí son **ingresos reales**. Las **transferencias recibidas NO deben clasificarse como ingresos reales** (ver 2.5 y 2.6).
- **Notas (#problema conocidos, Etapa 2):** bug visual bandas (ids `laventolera/la_imbailable` vs guardado `laventolera`/`laimbailable`) — corrección de mapeo, no cambio estructural. Tipo `otros` existe pero sin sección visual — UI.
- **Clasificación:** #propuesta sin cambio estructural.

### 2.5 `transferencias` (legacy)
- **Estado actual (#actual/#problema):** `{ deUid, paraUid, paraNombre, monto, concepto:"alquiler"|"tarjeta"|"otros", detalle?, groupId?, createdAt }` (`submitTransferencia.jsx:18-36`). UI alta **deshabilitada** (`agregar/page.jsx:96-107`), pero **leídas activamente**: enviadas → aparecen como gasto personal "Transferencia" (`useGastos.js:65-74`); recibidas → suman a `totalIngresos` (`useIngresos.js:95-106`), sección visual comentada (`app/ingresos/page.jsx:99-111`).
- **Evidencia Firestore (v3.1, read-only):** colección `transferencias` **ausente**; **0 documentos históricos**; **no hay masa que migrar**. Las queries legacy existentes en código son evidencia de **código/flujo histórico**, **no** de datos existentes. La pregunta 6.1 queda **cerrada "sin masa"** (la decisión humana vigente mantiene `transferencias` **fuera del modelo funcional**).
- **Propuesta (estructural ahora, posición — NO decisión ejecutiva):**
  - **Posición recomendada (insumo para decisión usuario):** considerar `transferencias` como **colección legacy**. La semántica actual (convertirlas a gasto/ingreso del mes) **distorsiona el modelo** (reintegro ≠ ingreso). 
  - **Propuesta estructural:** **no ampliar** su uso para representar recuperaciones. Las recuperaciones deben vivir en colección propia (2.6) con vínculo explícito al gasto/origen cuando corresponda.
  - **Recomendación de lectura (sin implementar):** a futuro, las transferencias **no deben sumarse a ingresos reales**. La corrección requiere introducir modelo de recuperaciones (Etapa 3). Mientras no se implemente, el modelo conceptual debe dejar claro: **transferencias legacy ≠ ingresos reales**.
  - **Opción A (conservar legacy):** mantener esquema, documentar su semántica heredada y **aislar** su efecto sobre totales reales (solo cuando se implemente recuperaciones). 
  - **Opción B (retirar/migrar lecturas):** redirigir semántica vía recuperaciones. **No decidir por el usuario**; proponer ambas y dejar pregunta abierta (6.1).
- **Clasificación:** #problema (semántica heredada) → #propuesta (posición estructural, sin ejecutar). **6.1 cerrada "sin masa"** (decisión humana + evidencia v3.1). Etapa futura 2/3.

### 2.6 `recuperaciones` / `reintegros` (modelo conceptual — Habilitante Etapa 3)
- **Estado actual:** **No existe** (#problema P1). Transferencias recibidas inflan ingresos (`useIngresos.js:95-106`).
- **Propuesta (conceptual, lista para Etapa 3, estructural ahora):** crear **colección propia** `recuperaciones` (o `reintegros`/`settlements`). **Regla fundamental:** **reintegro/recuperación ≠ ingreso real** (Decisión 4).
- **Esquema conceptual propuesto (no implementar ahora):**
  ```text
  recuperaciones
  - origenTipo (enum): "gasto_compartido_adelantado"|"tarjeta"|"transferencia_legacy"?|"otro"
  - origenId (string|null) — vínculo a gasto/fijo/entry cuando exista
  - groupId (string|null)
  - deUid (quien debe devolver) / aUid (quien adelantó/recibe devolución)
  - montoTotal (number, positivo) — monto total a recuperar
  - saldoPendiente (number) — saldo restante a devolver
  - montoPagado (number, default 0) — total pagado hasta el momento
  - estado (enum): "pendiente"|"parcial"|"saldado"|"anulado"
  - tipo (enum): "reintegro"|"recuperacion"|"adelanto" (nombre definido)
  - motivo/origen (string|null) — descripción del origen
  - notas/detalle (string|null)
  - cuotas (object|null): {
      cantidad (number),           // total de cuotas
      montoPorCuota (number),      // monto estimado por cuota
      cuotasPagadas (number),     // cantidad de cuotas pagadas
      cuotasPendientes (number),  // cantidad de cuotas pendientes
      frecuencia? (enum): "mensual"|"semanal"|"quincenal"|"otra",
      primeraCuotaFecha? (Date/Timestamp),
      proximaCuotaFecha? (Date/Timestamp)
    }
  - pagosParciales (array|null): [{ monto (number), fecha (Timestamp/Date), medio? (string), notas? (string) }]
  - historialPagos (array|null): alias/compat con pagosParciales para trazabilidad
  - createdAt (Timestamp), updatedAt? (Timestamp), saldadoAt? (Timestamp)
  ```
- **Principios:** devolución **reduce saldo pendiente** (pagos parciales actualizan `montoPagado`, `saldoPendiente`, `estado` y cuotas), **no suma a ingresos reales**. Reutilizable para **módulo tarjeta** (Etapa 4) — los cargos de tarjeta con parte ajena generan ítems de recuperación.
- **Nombre adoptado:** `recuperaciones` (Decisión 1.2).
- **Clasificación:** #deseado (D1), #propuesta (modelo conceptual estructural). Habilitante Etapa 3.

### 2.7 `groups` / `users` (relaciones)
- **Estado actual (#actual):** `groups` leído por `GroupContext` (query `where members array-contains user.uid`, `getDocs`) (`GroupContext.jsx:22-41`). `users` leído por `useModoTransferencia` vía `doc(db,"users",uid)` (`useModoTransferencia.jsx:42-68`).
- **Propuesta (estructural ahora):** mantener modelo actual (`groups.members` array de uids). Validar en Firestore (lectura): existencia de docs `users`, campos (`displayName`, `email`), integridad de `members` (refs válidas). **No cambiar estructura**.
- **Limitación actual:** asume **un solo grupo activo** (`groups[0]`, `useGastos.js:38`, `useFixedExpenses.js:37`) — visión futura Etapa 4 (múltiples grupos). Estructuralmente compatible.
- **Resultado validación Firestore (v3.1, read-only):**
  - `members` estructuralmente **válidos**: 2 uids distintos, **0 sin match** (1 coincide con users docId, 1 con `users.uid`).
  - **Hallazgo — identificación mixta:** 1 member coincide con users **document ID**; 1 coincide con el campo `users.uid`.
  - `users`: 4 docs, **2 con `uid`**, **2 con `iud`**, `uid==iud`=0 (inconsistencia de naming coexistente).
  - **Hallazgo estructural pendiente de diseño posterior**; **no migrar ni corregir nada ahora** (Etapa 1 no implementa).
- **Clasificación:** #propuesta sin cambio.

### 2.8 `productos` / catálogos
- **Estado actual (#actual/#problema):** `taxonomia.js` indica "productos custom se guardan en Firestore y se mergean en runtime" (`taxonomia.js:4`) pero **no hay código de merge** (grep sin `collection(db,"productos")`). Catálogo de fijos activo sin "Otros" (`fixedExpensesTaxonomia.js:10-19`), presente solo en `temp.js:18`. Doble taxonomía fijos con discrepancia Disney+ (compartido vs personal) (`fixedExpensesConfig.js:72-76` vs `fixedExpensesTaxonomia.js:15`).
- **Propuesta (estructural ahora):**
  - **Gastos (diarios):** mantener `lib/taxonomia.js` como fuente canónica local; si existen productos custom en Firestore, el modelo debe prever **merge opcional** (no implementado ahora). Documentar como deuda (Etapa 2).
  - **Gastos fijos:** **unificar taxonomías** — usar **`lib/fixedExpensesTaxonomia.js` como canónico**. Eliminar/archivar duplicado `lib/temp.js` (sin importadores, código muerto). **Agregar `"otros"`** al catálogo de fijos **personales y compartidos** (Decisión 6; alcance decidido en 6.4). Discrepancia Disney+: **resuelta = PERSONAL** (6.3, decisión cerrada). Implementación de catálogo: **Etapa 2**, sin cambios ahora.
- **Evidencia Firestore (v3.1, read-only):** colección `productos` **ausente**; **0 documentos que migrar**; **no crear colección ahora**. D10 se mantiene como deuda documental (merge opcional no implementado).
- **Clasificación:** #problema → #propuesta (unificación + inclusión "Otros"). Etapa 2 para limpieza/decisión de Disney+.

---

## 3. Decisiones de estructura

| Decisión | Estado actual | Propuesta (Etapa 1) | Justificación | Clasificación/Etapa |
|---|---|---|---|---|
| **D1. fixed_expenses (doble esquema)** | Config activa (A) + legacy (B) en misma colección | **Adoptar esquema único A**. Documentar B como obsoleto. **Sin migración**. | Elimina ambigüedad (P8), alinea con flujos activos. | #problema→#propuesta. Etapa 2 (limpieza). |
| **D2. División fijos compartidos** | 50/50 hardcodeado, `participantes`=2 (`useFixedExpenses.js:264-265`, `useGastos.js:97,113`) | Modelo interno **no limitado a 50/50 ni 2 participantes**. Añadir `division` + ampliar `participantes[]` (backward compatible). Por defecto `fijo_50_50`. UI puede seguir 50/50. | Decisión 7. Permite evolución (60/40, 3+ participantes) sin romper estructura actual. | #deseado→#propuesta. Estructural ahora (habilita 4). |
| **D3. Totales mensuales fijos pendientes** | Fijo compartido en `pendiente_pago` **suma 50%** (`useGastos.js:110-114`) | Proponer regla de lectura: **no sumar al total mensual** entradas con `estado=="pendiente_pago"` o sin `paidByUid` definido (o sumar 0 hasta que alguien registre pago). **Cambio de lógica (lectura)**, no estructura. | Corrige distorsión del mes (P3). Afecta `useGastos.totalFixed` (Etapa 2). | #problema→#propuesta. Etapa 2. |
| **D4. Diario compartido ≠ deuda** | Cumplido (sin división en `gastos`) | **Mantener**. No introducir balance en `gastos` compartidos. | Decisión 2. | #actual confirmado. |
| **D5. Transferencias (posición)** | Legacy leído; alta deshabilitada; recibidas inflan ingresos | **Posición propuesta:** legacy con semántica heredada a aislar. No usarlas para ingresos reales. Las recuperaciones deben vivir en colección propia. **No decidir ejecución**. | P1 + D4. Evita perpetuar "reintegro = ingreso". | #problema→#propuesta. Insumo decisión humana (6.1). Etapa 2/3. |
| **D6. Recuperaciones/Reintegros** | No existe | **Modelo conceptual `recuperaciones`** (colección propia), estados `pendiente/parcial/saldado/anulado`, vínculo a origen cuando aplica, **no es ingreso real**. Reutilizable para tarjeta. | Decisión 4, D1 (Etapa 3). Habilita corrección semántica P1. | #deseado→#propuesta. Habilitante Etapa 3. Estructural ahora. |
| **D7. Tarjeta (compatibilidad)** | Modelado parcial (OCA fijo personal / concepto tarjeta en transferencias) | **Recuperaciones reutilizables** para módulo tarjeta (Etapa 4). Tarjeta no requiere colección propia obligatoria ahora; diseño debe permitir generar ítems de recuperación por parte ajena. | Decisión 5. | #deseado→#propuesta. Etapa 4. |
| **D8. "Otros"** | Existe en gastos/ingreso; **perdido** en fijos activos (`fixedExpensesTaxonomia.js` vs `temp.js`) | **Incluir "Otros"** en catálogos activos (**personales y compartidos** — 6.4 cerrada). También ingreso "otros" requiere sección visual (Etapa 2). | Decisión 6, P6. | #problema→#propuesta. Etapa 2 (catálogo). |
| **D9. Unificar taxonomías fijos** | Doble taxonomía + `temp.js` sin importadores | Usar `fixedExpensesTaxonomia.js` como **canónico**. Archivar/eliminar `temp.js`. Discrepancia Disney+ **resuelta = PERSONAL** (6.3, cerrada). | P7. Simplifica. | #problema→#propuesta. Etapa 2. |
| **D10. Productos custom** | Nota en `taxonomia.js:4` sin merge | Documentar **merge opcional** (Firestore `productos`) como deuda; **no implementar ahora**. Mantener local como fuente. | Evitar asumir implementación inexistente. | #actual→#propuesta (documentar). Etapa 2. |

---

## 4. Validación Firestore read-only

**Autorizado:** lectura exclusivamente. **Prohibido:** escrituras/migraciones/índices/reglas.

### 4.1 Validaciones prioritarias (HANDOFF)

1. **Índices compuestos / query patterns** — `ingresos` (`usuario`+`createdAt` range+orderBy), `gastos` (`usuario`+`tipo`+`createdAt`, `groupId`+`tipo`+`createdAt`), `transferencias` (`groupId`+`createdAt`, `paraUid`+`createdAt`), `fixed_expense_entries` (`usuario`+`periodo`, `groupId`+`periodo`). 
2. **`fixed_expenses` real** — proporción config activa vs esquema legacy + docs híbridos (P8).
3. **`users`/`groups`** — campos reales, validez `groups.members` (refs).
4. **`productos`** — existencia/estructura.

### 4.2 Resultado de validación (ejecución read-only real — script `validacion-ae.sh` v3.1)

**Acceso a Firestore:** autorizado (Decisión 6.5) y **ejecutado** desde Cloud Shell con Service Account `firestore-validacion-readonly` (custom role con `datastore.entities.get` + `datastore.entities.list`, IAM condition sobre `(default)`), vía **Firestore REST read-only**. Sin escrituras, sin índices, sin reglas, sin migraciones, sin cambios en la app. Evidencia: reportes `validacion-reporte-*.json` (bloques A–E).

**Conclusión 4.2 — estados validados:**

- **Índices / query patterns — VALIDADO.** *"Validado mediante ejecución read-only contra los patrones reales de consulta de la aplicación."* Los **5 patrones reales** devolvieron **HTTP 200** (ningún índice faltante, sin candidatos pendientes):
  1. `ingresos`: `usuario` + rango `createdAt` + `orderBy` desc → **200**
  2. `gastos`: `usuario` + `tipo=personal` + `orderBy` → **200**
  3. `gastos`: `groupId` + `tipo=compartido` + `orderBy` → **200**
  4. `fixed_expense_entries`: `usuario` + `periodo` (igualdad) → **200**
  5. `fixed_expense_entries`: `groupId` + `periodo` (igualdad) → **200**
  `transferencias`: N/A (colección ausente). **Aclaración:** esto **NO** significa que se hayan validado todos los índices posibles de Firestore; **solamente los patrones reales evaluados**. Riesgo de loading infinito para los patrones evaluados: **descartado**.
- **`fixed_expenses` (esquema A vs B vs híbridos) — VALIDADO.** 9/9 esquema A (`expenseId`, `usuario`, `activo`, `montoDefault` numérico, `createdAt`); `activo=true` 9/9; **7 `expenseId` distintos**; **0 legacy · 0 híbridos**. El doble esquema es **solo código/flujo histórico** (helper legacy deshabilitado). **P8 → #actual confirmado.**
- **`users`/`groups` (estructura real, integridad `members`) — VALIDADO.** `users`: 4 docs, 2 con `uid`, 2 con `iud`, `uid==iud`=0. `groups`: 1 doc; `members` = 2 uids distintos, 1 coincide con users docId, 1 con `users.uid`, **0 sin match** → members estructuralmente **válidos**. **Hallazgo:** identificación mixta (documentID vs campo `uid`) + coexistencia `uid`/`iud` — estructural, **pendiente de diseño posterior**, sin migración ahora.
- **`productos` — VALIDADO como ausente.** 0 documentos que migrar; **no crear colección**. D10 se mantiene como deuda documental.
- **`transferencias` — VALIDADO como ausente.** 0 documentos históricos; las queries del código son evidencia de **código/flujo histórico**, no de datos. 6.1 cerrada "sin masa".
- **Conteos y unions (v3.1):** `fixed_expense_entries` **34** · `fixed_expenses` **9** · `gastos` **408** · `groups` **1** · `ingresos` **15** · `users` **4**. Unions reales registradas: `gastos` (16 campos, coherente con 2.1), `ingresos` (7 campos, `subtipo` presente), `fixed_expense_entries` (13 campos = payload exacto de `useFixedExpenses.registrarGasto`), `fixed_expenses` (5 campos = esquema A).
- **Clasificador D1 (diagnóstico del script):** la ejecución **v3** devolvió `A=0/B=0/HIBRIDO=0/OTRO=0` por **fallo del propio script** (precedencia de `as $B` dentro de una conjunción + error de `jq` enmascarado por `2>/dev/null` que colapsaba al fallback de ceros). La **v3.1** corrigió el clasificador (flags explícitos con `has()`, paréntesis por flag, error de jq expuesto y guarda de cordura `A+B+H+O == total == docs`). v3.1 confirmó **A=9 / B=0 / HIBRIDO=0 / OTRO=0** (cordura OK: 9==9==9). **El resultado v3 (todo ceros) NO debe conservarse como evidencia de datos.**

**Hallazgos Firestore (documentados):**
- `fixed_expenses` 100 % esquema A en datos (0 legacy, 0 híbridos).
- `transferencias` y `productos` **ausentes**.
- `users` con `uid` e `iud` coexistiendo (2/2, 0 iguales).
- `groups.members` válido pero con identificación mixta (docId vs `users.uid`).
- Se **propone** actualización de `context/` con estos hallazgos estructurales (mantenimiento), **pendiente de aprobación** (no aplicada).

### 4.3 Diferidos (Etapa 2/3)

- Subtipos ingresos/bandas (P4), `createdAt`/zona horaria — **posteriores** a menos que diseño Etapa 1 los requiriera para cerrarse. Datos `transferencias`: **n/a (colección ausente — validado)**.

---

## 5. Dependencias entre etapas y próximos pasos

| Dependencia | Origen | Habilita/Bloquea | Próximo paso |
|---|---|---|---|
| **Unificación esquema `fixed_expenses` (D1)** | Doble esquema (P8) | **Habilita** limpieza (Etapa 2). **No bloquea** diseño estructural Etapa 1. | Etapa 2: decidir destino del helper/schema legacy (conservar/archivar) — **validación Firestore (4.2) ya ejecutada: 0 legacy, 0 híbridos en datos**. |
| **Modelo división N participantes + porcentajes (D2)** | Decisión 7 (50/50 hardcodeado P2) | **Habilita** Etapa 4 (config por grupo). **No bloquea** correcciones Etapa 2. | Implementación futura (post-aprobación). Diseño cerrado conceptualmente. |
| **Regla totales fijos `pendiente_pago` (D3)** | P3 | **Habilita** corrección de totales mensuales (Etapa 2). Cambio de lectura. | Ajustar `useGastos.totalFixed` + considerar estados en lectura (sin tocar estructura). |
| **Recuperaciones (D6)** | P1, D1 Etapa 3 | **Habilita** corrección semántica (reintegro ≠ ingreso). **Bloquea parcialmente** "limpieza" definitiva de semántica de `transferencias` hasta su adopción. | Etapa 3: diseñar/implementar colección + migrar lógica de totales (ingresos reales vs recuperaciones). |
| **Posición `transferencias` (D5)** | Legacy leído; **colección ausente** (v3.1) | **Define ruta**: aislar efecto sobre ingresos reales; **6.1 cerrada "sin masa"** (`transferencias` fuera del modelo funcional). | Sin masa que migrar; la corrección semántica (transferencias ≠ ingresos) queda para recuperaciones (Etapa 3). |
| **Unificación taxonomías + "Otros" (D8,D9)** | P6,P7 | **Habilita** consistencia catálogos (Etapa 2). | Etapa 2: aplicar catálogo con Disney+ = PERSONAL (6.3) y "Otros" en personal+compartido (6.4) + limpiar `temp.js`. |
| **Índices Firestore (4.2)** | Riesgo loading infinito | **Potencial bloqueante descartado**: los patrones reales evaluados devolvieron todos HTTP 200. | Validación read-only ya ejecutada (v3.1); re-validar solo si cambian patrones de consulta (Etapa 2+). |

**Conclusión dependencias:** Etapa 1 (base estructural) **no bloquea** Etapas 2/3; proporciona **decisiones estructurales habilitantes**. Algunas correcciones (semántica transferencias→ingresos) quedan **aplazadas** hasta Etapa 3 (adopción de recuperaciones).

---

## 6. Preguntas abiertas (requieren decisión humana)

Solo las que no pueden responderse con evidencia de código y requieren criterio del usuario:

1. **6.1 Transferencias (legacy): conservar vs retirar lecturas**  
   Dado que alta está deshabilitada y su lectura distorsiona "ingresos reales", ¿**conservar** lecturas actuales temporalmente (compatibilidad histórica) o **aislar/retirar** su efecto sobre totales reales **cuando se introduzcan recuperaciones** (Etapa 3)?  
   _Propuesta no ejecutiva (Opción A/B en 2.5)._  
   _CERRADA (2026-09-25):_ transferencias declaradas **fuera del modelo funcional** (decisión humana). Validación v3.1 confirma colección **ausente** → cerrada **"sin masa"**.

2. **6.2 Nombre técnico para recuperaciones/reintegros**  
   ¿Nombre preferido para colección/concepto? Opciones sugeridas: `recuperaciones`, `reintegros`, `settlements`, `adelantos`. Debe reflejar "devolución no es ingreso".  
   _Afecta naming en modelo conceptual (2.6)._

3. **6.3 Disney+ — clasificación en gastos fijos**  
   En taxonomía activa (`fixedExpensesTaxonomia.js:15`) figura **personal**; en legacy config (`fixedExpensesConfig.js:72-76`) figura **compartido**. ¿Clasificación correcta hoy (uso real)?  
   _CERRADA (2026-09-25):_ **Disney+ = PERSONAL** (decisión humana, vigente). Coincide además con el dato real: `disney` aparece entre los `expenseId` activos (v3.1). Sin implementar ahora.

4. **6.4 ¿Incluir "Otros" también en gastos fijos compartidos?**  
   Decisión 6 pide "Otros" presente y funcional. ¿Aplica a compartidos o solo personales?  
   _CERRADA (2026-09-25):_ **"Otros" disponible en gastos fijos personales y compartidos** (decisión humana, vigente). Sin implementar ahora (Etapa 2 para catálogo).

5. **6.5 ¿Validar Firestore read-only ahora (índices + fixed_expenses real + users/groups + productos)?**  
   Para cerrar incertidumbres (4.2), ¿autorizar inspección read-only puntual antes de aprobar Etapa 2?  
   _No invasivo (solo lectura). Recomendado para evitar sorpresas._  
   _RESUELTA (2026-09-25):_ autorizada y **ejecutada** (Service Account + REST read-only, script `validacion-ae.sh` v3.1). Resultados completos en 4.2.

> Resto de dudas ya respondidas por REPORT-ETAPA-0/context/dominio.

---

## 7. Lo NO implementado y reglas respetadas

**NO implementado (Etapa 1 = diseño):**
- No se modificó `AppFinanciera/` (ningún archivo de código, componentes, hooks, servicios, páginas, datos).
- No se crearon/migraron/actualizaron documentos en Firestore.
- No se crearon índices, no se cambiaron reglas.
- No se ejecutaron migraciones ni refactors.
- No se implementaron decisiones (solo propuesto diseño estructural).
- No se avanzó a Etapa 2/3.

**Reglas respetadas (AGENTS.md + HANDOFF):**
- **Read-only sobre aplicación.** Solo archivos permitidos modificados: `PROPUESTA-ETAPA-1.md` (nuevo). `ROADMAP.md` **no modificado** (registro de avance opcional según HANDOFF; no necesario). `context/MAPA-APPFINANCIERA.md` **actualizado como mantenimiento**: la validación Firestore (v3.1) produjo **hallazgos estructurales nuevos** (esquema A 100 %, ausencia de `transferencias`/`productos`, coexistencia `uid`/`iud`, members con identificación mixta). Esa actualización de contexto fue **aprobada, revisada y commiteada en `78e1461`** (cierre de Etapa 1); ya **no está pendiente** de aprobación. 
- **Auditar antes de diseñar, diseñar antes de implementar.** Ciclo seguido (LEER→ANALIZAR→VALIDAR→DISEÑAR→PROPONER).
- **Decisiones funcionales cerradas respetadas.** Diario compartido ≠ deuda, fijos compartidos con balance+historial, reintegro ≠ ingreso, tarjeta futura, "Otros" debe existir, modelo no limitado a 50/50, acceso Firestore **read-only ejecutado** (SA + REST, sin escrituras; Decisión 6.5), históricos no modificados, `transferencias` fuera del modelo funcional.
- **Cambio mínimo.** Propuesta basada en evidencia (`archivo:línea`), sin inventar datos financieros.
- **Clasificación de hallazgos:** `#actual/#deseado/#problema/#propuesta` + etapa futura aplicada.
- **Validación Firestore:** ejecutada read-only contra patrones reales (v3.1). Índices evaluados **HTTP 200**; `fixed_expenses` 100 % A (0 legacy/híbridos); `users`/`groups` válidos con hallazgos (`uid`/`iud`, members mixta); `productos` y `transferencias` **ausentes**. Sin alternativa invasiva requerida.

---

## 8. Estado del repo tras la etapa

**Archivos modificados (único permitido):**
- `C:\Users\Usuario\Desktop\Proyectos Personales\opencode-AppFinanciera\PROPUESTA-ETAPA-1.md` — **nuevo** (entregable).

**Archivos NO modificados:** `AppFinanciera/` (intacto), `context/*`, `ROADMAP.md`, `AGENTS.md`, `.opencode/*`, REPORTs, HANDOFFs.

**Verificación Git (estado):**
- `git status` (inspeccionado conceptualmente): solo nuevo archivo `PROPUESTA-ETAPA-1.md` sin tracking/modificaciones en `AppFinanciera/` ni en resto del repo padre fuera de este entregable.
- `AppFinanciera/` permanece **intacto** (repo anidado).

**Cierre: Etapa 1 CERRADA (2026-09-25).**

- **Base del cierre:** evidencia Firestore v3.1 (read-only, Service Account + REST) + esta propuesta + `context/MAPA-APPFINANCIERA.md` (documentación alineada entre ambos).
- **Motivo resumido:** estructura real de Firestore validada read-only; patrones reales de consulta validados (5 × HTTP 200); `fixed_expenses` confirmado **100 % esquema activo** (0 legacy · 0 híbridos, 7 expenseIds); ausencia de `transferencias` y `productos` confirmada; decisiones funcionales de esta etapa cerradas (6.1–6.5, D1–D10); hallazgos `users.uid/iud` y `groups.members` (identificación mixta) clasificados como **no bloqueantes** y diferidos a etapas posteriores.
- **Alcance del cierre:** sin cambios de código de la aplicación; sin inicio de Etapa 2; sin implementar Disney+/"Otros"/recuperaciones ni ninguna otra decisión funcional; `uid/iud` y members-mixta quedan como hallazgos para diseño/implementación posterior.
- **Git:** sin commit ni push. Según HANDOFF, commit/push quedan para orden explícita del usuario.
