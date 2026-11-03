# EVIDENCIA-4.5 — Retiro de Transferencias

**Estado:** **CERRADA 03/11/2026.** Commit de código en `AppFinanciera/staging`: **`f4a1cd7`** (14 archivos, +34/−808) + **este commit** (docs del repo padre). Gates: `test:rules` **71/71**, `test:gastos` **8/8**, `harness:reintegros` **57/57**, lint baseline 4 (0 nuevos), build OK. **Verificación funcional local aprobada por el usuario** (§7).
Repo: `AppFinanciera/` · rama `staging` · sin tocar `main` · **0 escrituras en Firestore real**.

---

## 1. Alcance ejecutado

Retiro del **100 % del código de Transferencias** (§7.1 #1–#16 de `PROPUESTA-ETAPA-3.md`), cumpliendo las **6 condiciones de §7.4**:

1. Diff revisado archivo por archivo y aprobado por el usuario (checkpoint).
2. Inventario por greps al momento del retiro (16 archivos con coincidencias; 7 eliminados, 7 editados, 2 conservados por prosa de dominio).
3. Totales antes/después: con la colección vacía, **idénticos** (§7).
4. Pruebas: greps, build, lint, `test:rules`, `test:gastos`, harness y prueba funcional de `/gastos`, `/ingresos` y `/agregar`.
5. **I-1 verificado**: los Reintegros no suman en `totalGastos` ni `totalIngresos`.
6. **Aprobación explícita del usuario antes de las eliminaciones.**

**No se tocó:** datos de Firestore, `origenCompra` (`submitCompra.js`, decisión 2.6 #2), `firestore.rules` (bloque `transferencias`), `firestore.indexes.json`, ni Reintegros/gastos/ingresos/fijos.

---

## 2. Gate read-only de `transferencias` (condición 3)

**No se pudo ejecutar contra el proyecto real.** La sesión de `firebase-tools` está vencida (el `refresh_token` guardado fue rechazado con 400) y no hay service account en el repo. No se pidieron credenciales.

- **Fallback aplicado (autorizado por el usuario):** gate de Etapa 3 (0 registros) + emulador + **`REQUIERE_VALIDACIÓN_FIRESTORE`**.
- **Emulador:** `transferencias` = **0 docs** (verificado por REST admin antes de la prueba).
- **Si el proyecto real tuviera N > 0:** los documentos **no se borran**; dejan de leerse. El delta esperado es la corrección D-7/I-1:
  - `Total del mes` de `/gastos` baja por la suma de transferencias **enviadas** por el usuario (`deUid == uid`) en el mes visible;
  - `Total ingresos` de `/ingresos` baja por la suma de transferencias **recibidas** (`paraUid == uid`) en el mes visible;
  - `N transacciones` / `N ingresos` bajan por la cantidad correspondiente.
- **Acción sugerida al Organizador:** confirmar el conteo en Firebase Console → Firestore → `transferencias` y, si hay docs, registrar el delta. → `REQUIERE_VALIDACIÓN_FIRESTORE`.

---

## 3. Inventario final

### 3.1 Eliminados (7 archivos, −808 líneas)

| Archivo | Rol |
|---|---|
| `app/agregar/components/ModoTransferencia.jsx` | wizard de alta |
| `app/agregar/components/transferencia/hooks/useModoTransferencia.jsx` | estado del wizard |
| `app/agregar/components/transferencia/helpers/submitTransferencia.jsx` | **único escritor** de `transferencias` |
| `app/gastos/sections/Transferenciassections.jsx` | sección con 0 importadores |
| `app/gastos/components/FilaTransferencia.jsx` | fila usada solo por las secciones retiradas |
| `app/ingresos/sections/TransferenciasIngresosSection.jsx` | sección importada sin uso |
| `app/gastos/helpers/gastosCalculations.js` | 0 importadores; semántica legacy (“Transferencias recibidas = ingresos”) |

### 3.2 Editados (7 archivos)

| Archivo | Cambio |
|---|---|
| `app/agregar/page.jsx` | sin import, botón comentado ni render de Transferencia |
| `app/gastos/services/subscribeGastos.js` | sin `transferenciasMap` ni query por grupo; `totalQueries = 1 + groupIds.length`; `onChange({ gastos })` |
| `app/gastos/hooks/useGastos.js` | sin estado `transferencias`, `transferenciasMes` ni filas sintéticas; `gastosPersonales = base.sort(porFechaDesc)` |
| `app/gastos/components/FilaGasto.jsx` | sin rama `tipo === "transferencia"` (subtítulo y menú) |
| `app/ingresos/services/subscribeIngresos.js` | **una sola query**; sin rango, sin query de transferencias, sin `emitIfReady`; `onData({ ingresos })` |
| `app/ingresos/hooks/useIngresos.js` | sin `transferenciasRecibidas`; efecto solo `[user?.uid]`; `totalIngresos` = solo ingresos |
| `app/ingresos/page.jsx` | sin import muerto, sin conteo de transferencias, sin JSX comentado |

### 3.3 Conservado a propósito

- **Prosa de dominio en Reintegros** (3 coincidencias): `ReintegroModal.jsx:399,415` y `useReintegroModal.js:170` (“recibió dinero (efectivo o transferencia)”). No es código de la colección.
- **`origenCompra`** en `submitCompra.js` (decisión 2.6 #2).
- **Reglas de `transferencias`**: es parte de la copia exacta de consola (BLOQUE A). El retiro es de código, no de seguridad. La app ya no lee ni escribe la colección; un actor externo todavía podría hacerlo y la app lo ignora. Un default-deny sería una decisión aparte y otro deploy.

---

## 4. Reglas e índices

- **`firestore.rules`: sin cambios.** El bloque `transferencias` se conserva (ver §3.3). El deploy de reglas sigue diferido al cierre de la Etapa 4 (junto con `gastos`/`ingresos` y el BLOQUE B de Reintegros).
- **`firestore.indexes.json`: sin cambios.** No había índices de `transferencias` declarados (solo `reintegros`). Los índices compuestos que usaban las queries retiradas dejan de ser necesarios; no hay que crear ni borrar nada.

---

## 5. Compatibilidad de datos históricos

- **Sin migración ni borrado.** Los documentos de `transferencias` (si existen) quedan intactos en Firestore; la app deja de leerlos.
- **`gastos` e `ingresos`:** sin cambios (4.5-fecha intacto: `fecha` con fallback a `createdAt`).
- **Reintegros:** sin cambios; no se contabilizan como ingreso ni gasto (I-1).
- **Cliente viejo en caché:** la versión anterior (que aún lee `transferencias`) sigue funcionando contra los mismos datos; el retiro es solo de esta versión.

---

## 6. Gates (03/11/2026, post-borrado)

| Gate | Resultado |
|---|---|
| `npm run test:rules` | **71/71** (44 Reintegros + 14 gastos + 13 ingresos) |
| `npm run test:gastos` | **8/8** |
| `npm run harness:reintegros` | **57/57** |
| `npm run lint` | baseline exacta 4, **0 nuevos** |
| `npm run build` | `✓ Compiled successfully`, 10 páginas, exit 0 |
| Greps de la superficie retirada | **0** fuera de los 7 archivos eliminados; **3** en prosa de Reintegros (justificadas) |
| Escrituras en Firestore real | **0** (todo emulador; sin push) |

---

## 7. Verificación funcional local (aprobada por el usuario, 03/11/2026)

Entorno: emuladores Firestore + Auth (`--project finanzas-app-1c5f6`), `npm run seed:emulator` (usuarios + grupo + **fixture de Reintegros: 4 obligaciones**) + seed temporal con **1 gasto y 1 ingreso legacy de octubre** (sin `fecha`). **`transferencias` = 0 docs.** Dev server con `NEXT_PUBLIC_USE_EMULATOR=true` y aviso `[EMULADOR]` confirmado. **0 escrituras al proyecto real.**

| # | Caso | Esperado | Resultado |
|---|---|---|---|
| a | Firebase Console → `transferencias` | vacía o N docs | **Reportado por el usuario; sin delta en el emulador** |
| b | `/gastos` octubre | `$5.000` · `1 transacciones` (legacy por fallback) | **PASS** |
| b | `/ingresos` octubre | `$20.000` · `1 ingresos` (legacy por fallback) | **PASS** |
| b | Ambos en noviembre | `$0` · `0` | **PASS** |
| b | Antes vs después (0 transferencias) | idénticos | **PASS** (las queries retiradas devolvían 0) |
| c | `/reintegros` | 4 obligaciones (2 activas + 2 cerradas) | **PASS** |
| c | I-1: totales tras visitar Reintegros | siguen `$5.000` / `$20.000` | **PASS** |
| d | `/agregar` | Gasto único, Compra rápida, Agregar ingreso, Reintegro; **sin** Transferencia | **PASS** |
| e | `/gastos` y `/ingresos` | sin filas ni conteo de transferencias | **PASS** |

**Aprobación:** el usuario validó el paso a paso en Local y autorizó el cierre. No se pusheó ni se desplegó nada.

---

## 8. Riesgos y notas

1. **Datos históricos en el proyecto real** → `REQUIERE_VALIDACIÓN_FIRESTORE` (conteo). Si hay docs, el ajuste de totales es la corrección esperada; registrar el delta.
2. **`/ingresos` con una sola query**: si esa query falla (índice/permisos), el loading infinito sigue siendo la deuda preexistente (`subscribeIngresos` sin `onError`). No se agrava.
3. **`subscribeIngresos` ya no depende de `selectedMonth`**: cambiar de mes no re-suscribe; el filtro por `fechaEfectiva` sigue en `useIngresos`.
4. **`gastosCalculations.js` eliminado**: 0 importadores; su semántica legacy contradecía D-2.
5. **`main` sin tocar**: la promoción y el deploy de reglas son parte del cierre de la Etapa 4 (aprobaciones separadas).

---

## 9. Cierre (03/11/2026)

- [x] Diff revisado y aprobado (condición 1).
- [x] Inventario y greps al momento del retiro (condición 2).
- [x] Totales idénticos con 0 transferencias en el emulador (condición 3); real → `REQUIERE_VALIDACIÓN_FIRESTORE`.
- [x] Gates y prueba funcional (condición 4).
- [x] I-1 verificado con el fixture de Reintegros (condición 5).
- [x] Aprobación explícita antes de las eliminaciones (condición 6).
- [x] Código (`f4a1cd7`) + docs (este commit).
- [x] `ROADMAP.md` §Histórico, `AGENTS.md`, `HANDOFF-ETAPA-4.md` §0/§4, `PROPUESTA-ETAPA-4.md` §1.7 y `context/*`.

**Con esto el núcleo de la Etapa 4 queda completo.** Siguiente: **cierre de la Etapa 4** (pasos separados y con aprobación propia): push a `staging`, verificación diferida de 4.5-fecha, deploy de reglas (`gastos`/`ingresos` + BLOQUE B) y promoción a `main` con verificación en Producción.
