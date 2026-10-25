# EVIDENCIA-4.3-bis — Eliminar obligación / perdonar deuda / eliminar pago

**Estado:** **CERRADA 25/10/2026** — commits en `AppFinanciera/staging`: **`1de79c8`** ((a) `.gitignore`) · **`f0a66af`** ((b) seed + flag) · **`beddcf3`** ((c) 4.3-bis completo) + **este commit** (docs del repo padre). Push a `staging` como respaldo (`4551914..beddcf3`); **`main` sin tocar** (la promoción queda hasta el cierre de la Etapa 4). Gates de cierre: harness **53/53**, reglas **44/44**, lint baseline 4 (0 nuevos), build OK.
Repo: `AppFinanciera/` · rama `staging` · decisiones finales 24/10/2026 · cierre 25/10/2026.

## 1. Fase A — archivos nuevos (23/10/2026)

- **Helpers transaccionales** (autocontenidos: reciben `db` como parámetro, no importan `modelo.js`, reutilizan `ReintegroError` de `submitDevolucion.js` **sin modificarlo**):
  - `app/agregar/components/reintegros/helpers/eliminarEntrega.js` — eliminar pago; recálculo `devuelto = leído − monto` (≥0); constancia `eliminacion` en la entrega + evento `eliminacion/entrega`.
  - `app/agregar/components/reintegros/helpers/eliminarObligacion.js` — E1 solo registrador (`NO_REGISTRADOR`); elimina la obligación en su conjunto (transacción), agrega constancia `eliminacion` **sin cascada** sobre entregas (DC-7/I-10); evento `eliminacion/obligacion`.
  - `app/agregar/components/reintegros/helpers/condonar.js` — C1 solo acreedor (`NO_ACREEDOR`; externa → registrador, miembro → espejo según sentido); agrega `condonacion` **sin tocar `devuelto`** (I-12); evento `condonacion/obligacion`.
- **Guardas de cliente en los 3 helpers:** `ELIMINADA` / `CONDONADA` / `LIQUIDADA`. **Nota:** la LIQUIDADA es **barrera de cliente únicamente** — `firestore.rules` no la bloquea (mismo patrón que 4.3b §3.1); las reglas sí bloquean ramas (e)/(f)/(i) server-side. `firestore.rules` **intocado**.
- **Códigos de error:** `NO_ENCONTRADA`, `ELIMINADA`, `CONDONADA`, `LIQUIDADA`, `NO_REGISTRADOR`, `NO_ACREEDOR`, `VALIDACION`.
- **Shape de constancias:** `{ eliminadaPor | condonadaPor, createdAt (serverTimestamp), motivo: motivo || null }`. Eventos con `motivo` y `registradoPor`.
- **Harness:** `tests/harness/reintegros.harness.test.mjs` +12 tests (**H32–H43**) → total **53**.

## 2. Cambio aprobado en `modelo.js` (23/10/2026)

**Motivo (hallazgo `#problema`):** **H41** destapó una asimetría real: `entradasDelMes.recibidas` exigía que la obligación madre estuviera en `activas`, pero `salidasDelMes.realizadas` sumaba el pago **sin verificar la obligación**. Tras eliminar una obligación, la entrega conservada (I-4) dejaba de sumar en entradas pero **seguía sumando en salidas** (esperado 0 / real 400). Aprobación del usuario con 5 condiciones (Set en vez de `find`; confirmar «activas» con la definición real; grep de usos; gates completos; documentar).

**Diff final aplicado** (`app/reintegros/helpers/modelo.js`, en `salidasDelMes`):

```js
const activas = obligaciones.filter((r) => !("eliminacion" in r));
const entregasActivas = entregas.filter((e) => !("eliminacion" in e));
// 4.3-bis: solo suman pagos cuya obligación siga activa — espejo de
// recibidas en entradasDelMes. Obligación eliminada ⇒ la entrega
// conservada (I-4) deja de contar en ambos libros; condonadas y
// liquidadas (sin constancia de eliminación) siguen contando.
const activasIds = new Set(activas.map((r) => r.id));
const realizadas = entregasActivas
  .filter(
    (d) =>
      activasIds.has(d.reintegroId) &&
      d.realizadoPorUid === uid &&
      enRangoMes(d.fechaPago, start, nextStart),
  )
  .reduce((a, d) => a + Number(d.monto || 0), 0);
```

**Verificación «activas» con la definición real (no solo tests):**

- `salidasDelMes` filtra con `!("eliminacion" in r)` (mismo predicado que `useReintegros.js:131`).
- Por `estadoDe` (`modelo.js:19-26`): **eliminada ⇔ tiene `eliminacion`** (único filtro) · **condonada ⇔ tiene `condonacion`** (queda en el Set ⇒ **sigue contando**) · **liquidada ⇔ estado derivado `saldo <= 0`** sin campo almacenado (queda en el Set ⇒ **sigue contando**). Solo las eliminadas quedan afuera.
- Pago cuya obligación fue **eliminada** → excluido (H41); sobre **condonada/pagada/parcial** → sigue contando (H42/H43).

**Grep de usos de `salidasDelMes` (condición 3):**

| Uso | Qué pasa | Coherente |
|---|---|---|
| `useReintegros.js:266` (único uso productivo) | `obligaciones: activas` (ya sin `eliminacion`) + `entregas: entregasActivas`; ambas nacen de la misma suscripción/participación: si la entrega es legible, la obligación madre está en `obligacionesGated` | ✅ |
| Harness: 15 call sites | 13 con `entregas = []` (H13/H22–H29: trivialmente coherentes) · 2 en H41 con entrega real cuya madre está en `activas` antes y correctamente fuera después | ✅ |

**Hallazgo `#deseado` fuera de alcance (no modificado):** `useReintegros.js:240` — `devolucionesRealizadas` replica el patrón viejo (sin chequeo de obligación activa), pero está **solo exportado (línea 311) y no consumido por ninguna UI** (grep en todo `AppFinanciera/`): latente, sin impacto. Revisar si se consumiera en el futuro.

## 3. Gates (23/10/2026) — todos en verde

| Gate | Resultado |
|---|---|
| `npm run harness:reintegros` | **53/53** (fail 0), exit 0 — 41 previos + H32–H43 |
| `npm run test:rules` | **44/44** (fail 0), exit 0 — `firestore.rules` sin cambios |
| `npm run lint` | baseline exacta: 4 preexistentes (`useIngresos.js:39`, `GroupContext.jsx:17`, `HomeHeader.jsx:28`, `page.js:10`), **0 nuevos** |
| `npm run build` | EXIT 0 — `✓ Compiled successfully` |
| Escrituras en proyecto real | **0** (todo contra emulador `demo-finanzas`) |

## 4. Notas de run

- **H35 (corrección de test, no de código):** el tercero no participante C recibe `permission-denied` de las reglas en el `tx.get` **antes** de correr el guard de cliente `NO_ACREEDOR` (no puede leer la obligación). El test ahora espera `permission-denied` para C; `NO_ACREEDOR` lo cubre B (participante deudor) — verificado en el mismo H35.
- **H38:** contraparte (participante, no registrador) → `NO_REGISTRADOR` de cliente; forja directa de constancias por B/C → rechazada por reglas rama (e)/(f) (`assertFails`).
- **«Reabre si liquidaba» (caso 11 §14.1 de la PROPUESTA-ETAPA-3):** **no alcanzable vía helper** por la guarda LIQUIDADA de cliente (decisión 4.3-bis); H32 cubre reabre parcial → pendiente.
- **Emulador colgado:** puerto 8080 ocupado por un emulador huérfano (PID 15372, proyecto `finanzas-app-1c5f6`) de una sesión previa; terminado antes de correr gates.
- **H39 (concurrencia):** eliminar pago vs pago nuevo sobre saldo insuficiente → invariante `[0, monto]` + D-7 siempre se cumplen; el rechazo del pago es `SALDO_INSUFICIENTE` cuando corresponde.
- **D-9 opción B (H37):** sobre una perdonada se puede eliminar conservando **ambas constancias** (`condonacion` + `eliminacion`); el re-registro estándar (alta 4.2 + devolución 4.3) liquida la nueva obligación. **SUPERADO 24/10/2026:** D-9 opción B retirada — ver §6.

## 5. Fase B — UI (23/10/2026)

- **Nuevo:** `app/reintegros/components/ConfirmarAccionModal.jsx` — mini-modal de confirmación de las tres acciones (`condonar` · `eliminar-obligacion` · `eliminar-pago`), patrón 4.3b: `MODAL_SHEET_CLASSES`, **timeout de UI de 15 s sin reintento**, anti-doble-toque (`enviandoRef`), botón deshabilitado durante la transacción, mensaje **R-6** («No se guardó nada: sin conexión…»), **motivo opcional** en las tres (el **copy D-9 opción B precargado** para perdonadas, vigente el 23/10, se retiró el 24/10 con la excepción — ver §6). Mensajes de UI por código: `NO_ENCONTRADA` · `ELIMINADA` · `CONDONADA` · `LIQUIDADA` · `NO_REGISTRADOR` · `NO_ACREEDOR` · `VALIDACION` · `permission-denied` · `unavailable`/`deadline-exceeded` (R-6) · fallback + mensaje propio de timeout.
- **Editados:** `components/FilaReintegro.jsx` (menú ⋮ + sello) · `sections/PendientesSection.jsx` y `sections/CerradosSection.jsx` (passthrough de callbacks) · `page.jsx` (estado `accion` + monta `ConfirmarAccionModal`).
- **Menú ⋮ «Acciones»** (`aria-label="Acciones"`, 40×40 px, `aria-haspopup`/`aria-expanded`, sheet `MODAL_SHEET_CLASSES`; sin ícono si no hay acciones):
  - **Obligación abierta (Activos):** `Editar monto` (solo registrador) · `Perdonar deuda` (solo acreedor C1: externa→registrador, miembro→espejo) · `Eliminar` (rojo, al final; solo registrador).
  - **Perdonada (Saldados):** solo `Eliminar` (registrador — D-9 opción B). **Liquidada: sin menú.** *(SUPERADO 24/10/2026: las dos, sin menú — ver §6.)*
  - **Pago (solo Activos):** `Editar monto` · `Eliminar` (ambas partes; la LIQUIDADA de cliente la cubre el helper). Sin callbacks en Saldados ⇒ sin menú de pagos.
- **Botones chicos inline de 4.3b retirados** («Editar monto» de la obligación y «Editar» por pago): las acciones ahora viven solo en el menú ⋮ para no duplicar entradas. Si el usuario prefiere conservarlos, se reverte.
- **Sello:** `ETIQUETA_ESTADO.condonado` → **«Perdonada»** (etiqueta de UI; el modelo y los eventos siguen con `condonacion`).
- **Sin cambios (verificado):** `DevolucionModal.jsx` y `useReintegros.js`.

### 5.1 Gates Fase B (23/10/2026) — todos en verde

| Gate | Resultado |
|---|---|
| `npm run harness:reintegros` | **53/53** (fail 0), exit 0 |
| `npm run test:rules` | **44/44** (fail 0), exit 0 — reglas intactas |
| `npm run lint` | baseline exacta: 4 preexistentes (mismos archivos), **0 nuevos** |
| `npm run build` | EXIT 0 — `✓ Compiled successfully` |

## 6. Decisiones finales del usuario (24/10/2026) — regla estricta de Cerradas

**REGLA:** en Cerradas (liquidadas y perdonadas) **no se edita ni elimina nada**, sin importar si cerró por pago o por perdón. **Sin menú ⋮ en ninguna fila de Cerradas.** Las obligaciones eliminadas desde Activos siguen sin aparecer en ninguna lista (sin cambios); `useReintegros.js` **no se toca** y las eliminadas no se muestran como cerradas. **D-9 opción B (perdonada → Eliminar) RETIRADA el 24/10/2026.**

Cambios aplicados (24/10/2026):

1. **UI (`FilaReintegro.jsx`):** retirada la excepción del menú de perdonadas — `accionesObl` solo se construye para `abierta`; condonadas y liquidadas quedan sin ⋮.
2. **Helper (`eliminarObligacion.js`):** rechaza también condonadas — guarda de cliente `CONDONADA` (error limpio) junto a la LIQUIDADA (que ahora cubre `saldo <= 0` sin excepción). Orden de guardas: `ELIMINADA` → `NO_REGISTRADOR` → `CONDONADA` → `LIQUIDADA`. `firestore.rules` **sin cambios** (la rama (f) no bloquea estos estados: barrera de cliente, igual que LIQUIDADA).
3. **Harness:** H37 reescrito — «cerradas: eliminar condonada/liquidada ⇒ error, sin escritura» (ambas guardas cubiertas + re-registro estándar conservado); H40 ajustado — eliminar la perdonada rechazada (`CONDONADA`) y doble eliminación sobre abierta separada (`ELIMINADA`, un solo evento). Total de casos **sin cambios: 53**.
4. **`ConfirmarAccionModal.jsx`:** retirado el copy D-9 opción B (`COPY_D9`/`esCondonada`) — ramal muerto con la excepción.
5. **`DevolucionModal.jsx`:** una línea de texto cuando el monto iguala el saldo: «Con este pago la deuda queda saldada y ya no podrá editarse» (solo UI; lógica intacta).
6. **Ajustes de UI (23–25/10/2026):** ícono ⋮ discreto (svg 18px, `text-text-muted/60`) a la derecha del monto — en la obligación (columna monto+estado junto al botón, estructura del header del acordeón) y en cada pago — con área táctil **30×30 px** (decisión final 24/10; era 40); hoja del menú como **`MenuAccionesSheet` montado en `page.jsx`** junto a los otros modales (patrón de `ReintegroModal`), con `MODAL_SHEET_CLASSES` y su padding inferior 125px + safe-area intactos. **El `createPortal` a `document.body` quedó DESCARTADO (24/10):** sacaba la hoja del contexto de apilamiento de la app (`AppBackground` `z-[1]`) y tapaba el `BottomNav` sin importar su z-index; al montarla en `page.jsx` el nav (fixed z-50, después en el DOM) la cubre igual que a los demás modales. `BottomNav` **sin cambios**. `modelo.js` con el Set de `activasIds` (§2) se mantiene.

**Limitación conocida (aceptada):** un último pago erróneo que liquida una obligación **no se puede corregir desde la app** — queda liquidada (sin menú: no se elimina el pago ni se edita) y no se puede eliminar la obligación (guarda LIQUIDADA). Camino previsto: re-registro estándar como obligación nueva (bloque de re-registro conservado en H37). El caso de control «perdonada con registrador deudor» (§6 anterior, pendiente de documentar) **perdió objeto** con el retiro de D-9B.

## 7. Verificación «Dinero del mes» (24/10/2026) — 2300 explicado, sin bug

Consulta del usuario: Salidas de Ana (octubre) en **2300** esperando **1300** tras «eliminar Alquiler». Verificado contra el estado real del emulador (probe de solo lectura, borrado después) y con las mismas funciones de `modelo.js` que usa `useReintegros`:

- **2300 = movimientos iniciales `salida`** de obligaciones activas de Ana: Alquiler 1000 + Libros 600 + Viaje 700. Sus pagos realizados son $0 y su espejo $0.
- Lo eliminado en la prueba fue **un pago** de Alquiler ($300), **no la obligación** (ninguna `reintegros` tenía `eliminacion`) — un pago nunca mueve Salidas, solo Entradas.
- Tras eliminar la **obligación** Alquiler (calculado con `modelo.js` sobre los docs reales): **Salidas 1300** (Libros 600 + Viaje 700) y **Entradas 1300** (Cena 500 + Libros 600 + Viaje 200; bajan los pagos de Alquiler 1000, todos en octubre) — coincide con lo esperado. **Sin cambios de código por esto.**
- Ruta de UI verificada: `eliminarObligacion` escribe top-level `eliminacion: {eliminadaPor, createdAt, motivo}` (mismo nombre/forma que `"eliminacion" in r` en `modelo.js` y en el filtro `activas` de `useReintegros.js:131`); «Dinero del mes» solo lee `entradasReintegros`/`salidasReintegros` del hook (sin otra columna ni cache); `subscribeReintegros.js:58` re-emite con `docChanges() > 0` aunque el conjunto de rids no cambie → la UI se actualiza sola tras la transacción. **H41** ya cubría «eliminar obligación ⇒ movimientoInicial sale de salidas/entradas del registrador y del espejo» con la misma entrada de datos que el hook.

## 8. Gates (24/10/2026 y re-corrida de cierre 25/10/2026) — todos en verde

| Gate | Resultado |
|---|---|
| `npm run harness:reintegros` | **53/53** (fail 0) — H37/H40 reescritos verdes |
| `npm run test:rules` | **44/44** (fail 0) — `firestore.rules` sin cambios |
| `npm run lint` | baseline exacta: 4 preexistentes, **0 nuevos** |
| `npm run build` | EXIT 0 — `✓ Compiled successfully` |
| Escrituras en proyecto real | **0** (todo contra emulador) |

**Re-corrida de cierre (25/10/2026, tras los ajustes finales de UI):** harness **53/53** (fail 0, exit 0 — conteo real de la corrida: 53 tests, 0 skipped), `test:rules` **44/44**, lint baseline 4 (0 nuevos), build `✓ Compiled successfully`. Entorno dejado listo: emuladores reiniciados + re-seed (fixture 4.3-bis limpio; los reinicios regeneran los uids del emulador de Auth, credenciales por email sin cambios); `scripts/probe-43bis.mjs` (diagnóstico temporal) **borrado**; `git status` limpio (sin `sw.js`/`workbox`/probe).

## 9. Cierre (25/10/2026)

- **Commits en `AppFinanciera/staging`** (aprobación explícita del usuario): **`1de79c8`** `chore: .gitignore` (artefactos next-pwa) · **`f0a66af`** `chore(4.3-bis): seed` (fixture + flag `--experimental-detect-module`) · **`beddcf3`** `feat(4.3-bis)` (helpers + regla estricta + `modelo.js` + UI + harness; 12 archivos, +1548/−37).
- **Push a `staging` como respaldo** (`4551914..beddcf3`), sin `main` y sin usar el Preview de Vercel para Reintegros (staging y Producción comparten `finanzas-app-1c5f6`).
- **Docs del repo padre:** este commit (checklist de cierre: esta evidencia, `dominio.md`, `arquitectura.md`, `MAPA-APPFINANCIERA.md`, `ROADMAP.md` §Histórico, `HANDOFF-ETAPA-4.md` §0, `AGENTS.md`).
- **Pendiente hasta el cierre de la Etapa 4 (no de esta subetapa):** promoción `staging` → `main` con aprobación explícita — orden decidido 22/10/2026 (EVIDENCIA-4.3 §6.1): `test:rules` final → **comparar las reglas nuevas con las desplegadas hoy** (`REQUIERE_VALIDACIÓN_FIRESTORE`) → deploy de reglas → promover → verificar Producción.
- **Siguiente subetapa: 4.4** (resumen mensual y agrupaciones) — **no arranca hasta que su plan sea aprobado**.
- **Pendiente latente (sin cambios, §2):** `useReintegros.js:240` — `devolucionesRealizadas` replica el patrón anterior (suma pagos sin verificar obligación activa); solo exportado, no consumido por UI. Revisar si se consumiera.
