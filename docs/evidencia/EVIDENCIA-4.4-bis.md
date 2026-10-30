# EVIDENCIA-4.4-bis — Bitácora: esquema canónico, cobertura y verificación

**Estado:** **CERRADA 30/10/2026** — commit en `AppFinanciera/staging`: **`d2be899`** (2 helpers + harness) + **este commit** (docs del repo padre). P-1 aprobada por el usuario el 30/10/2026 (esquema canónico). Gates de cierre: harness **57/57**, reglas **44/44**, lint baseline 4 (0 nuevos), build OK.
Repo: `AppFinanciera/` · rama `staging` · sin tocar `main`.

---

## 1. Alcance

- **P-1 (estructura de la bitácora) — CERRADA:** esquema canónico por tipo/entidad, aditivo y tolerante.
- **Cobertura:** las 7 acciones que escriben bitácora emiten **exactamente un** evento, del tipo/entidad correcto, dentro de su `runTransaction`.
- **Verificación:** harness H44–H47 (esquema exacto, cardinalidad, fallo sin evento, create-only).
- **Fuera de alcance (respetado):** vista de bitácora (v1 sin UI), migración de eventos, `firestore.rules` (**sin cambios**), dependencias, Firestore real, `main`/Producción.

---

## 2. Esquema canónico (P-1)

### 2.1 Capa 1 — obligatorios en los 4 tipos × 2 entidades

| Campo | Tipo | Justificación |
|---|---|---|
| `registradoPor` | uid | «quién»; exigido por reglas |
| `tipo` | `creacion` \| `edicion` \| `eliminacion` \| `condonacion` | «qué»; exigido por reglas |
| `entidad` | `obligacion` \| `entrega` | «sobre qué»; exigido por reglas |
| `createdAt` | `serverTimestamp` → `Timestamp` | «cuándo»; **no lo exigen las reglas** ⇒ invariante de aplicación, verificada en harness |

### 2.2 Capa 2 — campos por tipo/entidad

| tipo | entidad | campos adicionales | Estado |
|---|---|---|---|
| `creacion` | `obligacion` | `monto`, `sentido` | **nuevo en 4.4-bis (G-B)** |
| `creacion` | `entrega` | `entregaId`, `monto` | **nuevo en 4.4-bis (G-A)** |
| `edicion` | `obligacion` | `montoAnterior`, `montoNuevo` | ya cumplía |
| `edicion` | `entrega` | `entregaId`, `montoAnterior`, `montoNuevo` | ya cumplía |
| `eliminacion` | `obligacion` | `monto`, `devuelto`, `motivo` | ya cumplía |
| `eliminacion` | `entrega` | `entregaId`, `montoEliminado`, `motivo` | ya cumplía (**alias heredado**, §2.3.2) |
| `condonacion` | `obligacion` | `monto`, `devuelto`, `motivo` | ya cumplía |
| `condonacion` | `entrega` | — | **no aplica**: perdonar es sobre la deuda, no sobre un pago |

### 2.3 Capa 3 — compatibilidad (aditivo y tolerante)

1. **Ningún evento pasado se reescribe ni se completa** (la bitácora es create-only desde 4.0: no hay migración posible).
2. **`montoEliminado` es el alias heredado de `monto` en `eliminacion/entrega`.** Se conserva (renombrar la escritura sería no aditivo y dejaría dos nombres en la historia); un lector futuro usa `monto ?? montoEliminado`.
3. **Campos extra desconocidos se toleran y no se leen** (p. ej. `reintegroId`, que solo escribe `eliminarEntrega` y es redundante con la ruta `reintegros/{rid}/eventos`).
4. **`motivo` se escribe siempre que aplique, con `null` explícito** (`motivo || null`): `null` (sin motivo) ≠ ausente (evento previo).
5. **El `id` del doc del evento no es parte del esquema** (autogenerado).
6. **La bitácora no es la fuente del saldo:** `devuelto` en un evento es un snapshot de auditoría, no un acumulador (D-6: la fuente son los docs).

### 2.4 Omisiones deliberadas

| Omitido | Motivo |
|---|---|
| `contraparteUid/Nombre`, `registradoPorNombre`, `participantes`, `groupId` | PII / datos que no cambian; viven en el doc |
| `concepto`, `detalle`, `movimientoInicial`, `movimientoInicialTipo`, `gastoVinculadoId`, `fechaPago` | No son objeto de la acción; el doc los conserva (DC-6/DC-7: sin borrado físico) |
| `devuelto` en `creacion` | El alta siempre nace con `devuelto == 0` (reglas) |
| `devuelto` en `edicion` | Derivable del delta `montoNuevo − montoAnterior` |
| Snapshot completo antes/después | Sería versionado de documentos, no bitácora de acciones |
| `rid` | Ya está en la ruta |
| Tipo `confirmacion` | Sin objeto desde 17/10/2026 (sin confirmación bilateral) |

---

## 3. Cambios de código (2 helpers, aditivos)

### 3.1 G-A — `submitDevolucion.js`

La ref de la entrega se captura **antes** de escribirla para poder publicar `entregaId`:

```js
const entRef = doc(collection(db, "reintegro_devoluciones"));
tx.set(entRef, { /* mismo shape, mismo id autogenerado en cliente */ });
…
tx.set(doc(collection(db, "reintegros", rid, "eventos")), {
  registradoPor: uid, tipo: "creacion", entidad: "entrega",
  entregaId: entRef.id,   // nuevo
  monto,                  // nuevo
  createdAt: serverTimestamp(),
});
```

**Motivo:** sin `entregaId`, `creacion/entrega` era **incorrelacionable** con su pago (`useEdiciones.js:63` descarta eventos de entrega sin `entregaId`).

### 3.2 G-B — `submitReintegro.js`

```js
tx.set(doc(collection(db, "reintegros", rid, "eventos")), {
  registradoPor: uid, tipo: "creacion", entidad: "obligacion",
  monto, sentido,         // nuevo
  createdAt: serverTimestamp(),
});
```

**Motivo:** sin `monto` la auditoría no es autosuficiente (si el monto se edita después, el valor original solo se reconstruye encadenando `edicion`); `sentido` desambigua la dirección del importe. `devuelto` se omite a propósito (§2.4).

### 3.3 Sin `eventos.js`

`EVIDENCIA-4.1.md:294-295` dejó la decisión abierta («un helper suelto se evaluará en 4.4-bis si hace falta»). **No hace falta:** la deriva de esquema se controla con el harness exact-keys (H44/H45), y un wrapper obligaría a refactorizar 7 helpers ya verificados (cambio no mínimo). Se ratifica el ajuste 8 de 4.1: **escritura inline por helper**.

---

## 4. Matriz de cobertura (7 acciones)

| # | Acción | Helper | tipo / entidad | Campos canónicos |
|---|---|---|---|---|
| 1 | Alta de obligación | `submitReintegro` | `creacion` / `obligacion` | `monto`, `sentido` |
| 2 | Alta de devolución | `submitDevolucion` | `creacion` / `entrega` | `entregaId`, `monto` |
| 3 | Editar monto de obligación | `editarObligacion` | `edicion` / `obligacion` | `montoAnterior`, `montoNuevo` |
| 4 | Editar monto de entrega | `editarEntrega` | `edicion` / `entrega` | `entregaId`, `montoAnterior`, `montoNuevo` |
| 5 | Eliminar entrega | `eliminarEntrega` | `eliminacion` / `entrega` | `entregaId`, `montoEliminado`, `motivo` |
| 6 | Eliminar obligación | `eliminarObligacion` | `eliminacion` / `obligacion` | `monto`, `devuelto`, `motivo` |
| 7 | Condonar | `condonar` | `condonacion` / `obligacion` | `monto`, `devuelto`, `motivo` |

Celdas sin acción: `condonacion/entrega` (no aplica) · `edicion` de campos no financieros (no existe en el modelo; D-8(ii) solo permite `monto`).

---

## 5. Gaps

| Tipo | Gap | Estado |
|---|---|---|
| Código | `creacion/entrega` sin `entregaId`/`monto` | **resuelto (G-A)** |
| Código | `creacion/obligacion` sin `monto`/`sentido` | **resuelto (G-B)** |
| Código | `montoEliminado` vs `monto` | **documentado** como alias heredado (no se renombra: sería no aditivo) |
| Código | `reintegroId` denormalizado solo en `eliminacion/entrega` | tolerado, no se agrega ni se quita |
| Código | No existe `eventos.js` | ratificado que no se crea (§3.3) |
| Reglas | No exigen `createdAt` ni el shape | fuera de alcance (`firestore.rules` intacto); invariante verificada en harness |
| Verificación | Esquema exacto, cardinalidad, fallo sin evento, create-only | **cubierto por H44–H47** |
| Documentación | `PROPUESTA-ETAPA-4.md` §1.6 citaba §3.5; `MAPA-APPFINANCIERA.md:86` decía «hoy se escriben `creacion` y `edicion`» | **corregido en este lote** (§8) |

---

## 6. Harness (H44–H47)

| Caso | Qué verifica |
|---|---|
| **H44** | Esquema **exacto** (claves, sin faltantes ni sobrantes) de `creacion/obligacion`, `creacion/entrega`, `edicion/obligacion`, `edicion/entrega`; `createdAt` Timestamp; `entregaId` correlaciona con el doc real de la entrega; `monto`/`sentido` del alta; atribución a quien editó |
| **H45** | Esquema exacto de `eliminacion/obligacion`, `eliminacion/entrega` (con `montoEliminado` y `reintegroId` heredados) y `condonacion/obligacion`; `motivo` con valor y `null` explícito; `condonacion/entrega` no existe |
| **H46** | **Una acción ⇒ un evento**: secuencia de 6 acciones exitosas ⇒ 6 eventos (`creacion` 2 · `edicion` 2 · `eliminacion` 2); **4 fallos** (`SALDO_INSUFICIENTE`, `MONTO_BLOQUEADO`, `MONTO_SIN_CAMBIOS`, `ELIMINADA`) ⇒ conteo invariante. Invariante del caso: `nEventos == nAccionesExitosas` |
| **H47** | **Create-only (caso 15 §14.1):** `updateDoc` y `deleteDoc` sobre un evento real ⇒ `assertFails`, evento intacto; `setDoc` de un no participante ⇒ rechazado |

**Conteo: 53 → 57** (4 casos nuevos; ninguno borrado ni reescrito). Los tests previos asertan campos sueltos o longitud, nunca el conjunto exacto de claves, así que los campos nuevos de G-A/G-B no los afectan (H1, H2, H15–H21, H32–H35 verificados en la misma corrida).

`deleteDoc` se agregó al import del harness. Sin cambios en `firestore.rules` (el `create` de `eventos` no tiene `hasOnly`: los campos nuevos pasan sin tocar reglas — mismo patrón ya verificado el 21/10).

---

## 7. Limitación conocida (documentada, **no** asentada como assert)

**Un participante puede escribir un evento sin que exista la acción asociada.** Las reglas solo pueden verificar, dentro de la transacción, que quien escribe es participante (`rules:359-361`), que `registradoPor == uid()` y que `tipo`/`entidad` están en la lista blanca; **no pueden verificar que la acción ocurrió**. El acople acción↔evento es de aplicación + harness, no de reglas (mismo criterio de `PROPUESTA-ETAPA-4.md` §1.6).

- **Impacto:** nulo sobre saldos y montos (la bitácora no alimenta cálculos; el único consumidor, `useEdiciones`, solo pinta chips). Afecta **solo el historial**.
- **Decisión (30/10/2026, usuario):** **no** se escribe un test que afirme que la forja está permitida — fijaría la limitación como comportamiento esperado y se rompería el día que se cierre con reglas. **H47 se limita al `update`/`delete` rechazados y al no participante.**
- Cierre futuro posible (no en esta etapa): reglas que exijan `createdAt == request.time` y un campo de acción firmado, o mover la bitácora a Cloud Functions.

---

## 8. Corrección de referencia (§3.5 → §3.6.b)

`PROPUESTA-ETAPA-4.md` §1.6 citaba `PROPUESTA-ETAPA-3.md` **§3.5** como fuente del esquema, pero §3.5 son las **«Alternativas evaluadas»** (`PROPUESTA-ETAPA-3.md:450`); la bitácora está en **§3.6.b** (`:481-490`). Se aplicó una **enmienda datada 30/10/2026** en §1.6 (la PROPUESTA es inmutable salvo enmienda explícita) que además deja asentado que **`eventos.js` no existe**.

Docs corregidos en este lote: `PROPUESTA-ETAPA-4.md` §1.6 · `context/dominio.md` (§5.3 nuevo) · `context/MAPA-APPFINANCIERA.md:86` · `context/arquitectura.md` · `ROADMAP.md` (histórico) · `HANDOFF-ETAPA-4.md` §0 · `AGENTS.md` (estado).

---

## 9. Gates (30/10/2026)

| Gate | Resultado |
|---|---|
| `npm run harness:reintegros` | **57/57** (fail 0, skipped 0, exit 0) — 53 previos + H44–H47 |
| `npm run test:rules` | **44/44** (fail 0, exit 0) — `firestore.rules` sin cambios |
| `npm run lint` | baseline exacta: 4 preexistentes (`useIngresos.js:39`, `GroupContext.jsx:17`, `HomeHeader.jsx:28`, `page.js:10`), **0 nuevos** |
| `npm run build` | `✓ Compiled successfully`, exit 0 |
| Escrituras en proyecto real | **0** (todo contra emulador `demo-finanzas`) |

Nota de entorno: puerto 8080 libre al correr los gates (el emulador huérfano del 25/10 ya se había terminado en la sesión anterior).

---

## 10. Cierre (30/10/2026)

- **Commit de código:** `d2be899` en `AppFinanciera/staging` — 3 archivos, +392/−1 (`submitDevolucion.js`, `submitReintegro.js`, `tests/harness/reintegros.harness.test.mjs`).
- **Docs del repo padre:** este archivo + las correcciones de §8.
- **Sin push a `main`** (se mantiene hasta el cierre de la Etapa 4 con aprobación explícita y comparación de reglas: `REQUIERE_VALIDACIÓN_FIRESTORE`).
- **Siguiente subetapa: 4.5** (retiro de Transferencias). 4.4 quedó diferida (absorbida por la Etapa 5).
- **Pendiente latente (sin cambios):** `useReintegros.js:240` — `devolucionesRealizadas` solo exportado, sin consumidor.
- **`REQUIERE_VALIDACIÓN_FIRESTORE` (no bloqueante):** cuántos eventos reales existen desde 23/10 y con qué shape (los previos a este commit no tienen `monto`/`sentido`/`entregaId`; el esquema es tolerante, no hay migración).
