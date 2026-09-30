# PROPUESTA — Subetapa 2.3: Ingresos (labels de bandas + filas + sección "Otros")

> **Naturaleza: PLANIFICACIÓN. NO IMPLEMENTADA. El gate read-only es el próximo paso; la implementación espera aprobación explícita del usuario.**
> Documento redactado el 30/09/2026, después del cierre de 2.2 y 2.8 (`PROPUESTA-2.2.md` §10).

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.3 de la Etapa 2 · **Hallazgo origen:** P4 (`HANDOFF-ETAPA-2.md` §2)
**Fuentes de contexto:** `HANDOFF-ETAPA-2.md` §2 (P4) · `context/dominio.md` §3.4 · `REPORT-02.md` §3.8 · `context/arquitectura.md`
**Decisiones del usuario:** 30/09/2026 (alcance mínimo, título de fila, gate previo, `lib/ingresos.js` intacto)

## 0. Estado actual

| Ítem | Estado |
|---|---|
| Alcance funcional | ✅ **DEFINIDO Y APROBADO** (30/09/2026) — un solo lote |
| Origen de labels de bandas | ✅ **DECIDIDO** — importar `BANDAS` de `useModoIngreso` (opción A, mínima) |
| Título de la fila | ✅ **DECIDIDO** — `detalle ?? "Ingreso"` (opción A) |
| Gate read-only de `ingresos` | ⏳ **PENDIENTE** — script preparado en §5, a ejecutar por el usuario |
| Aprobación de implementación | ⏳ **NO OTORGADA** — se pide después del gate |
| Implementación | ❌ **NO IMPLEMENTADA** — ningún archivo de `AppFinanciera/` fue tocado |
| Firestore | ⛔ **SIN CAMBIOS** — 0 escrituras previstas en 2.3 |
| `main` / `staging` / Producción | ✅ **Alineados en `66ba009`** (`PROPUESTA-2.2.md` §10.1) |

## 1. Diagnóstico corregido (30/09/2026)

La documentación anterior (`REPORT-02.md` §3.8, `HANDOFF-ETAPA-2.md` §2 P4, `dominio.md` §3.4) atribuyó el problema de bandas a un desajuste de ids en `FilaIngreso.jsx`. **Ese diagnóstico era incorrecto en cuanto a dónde se ve el bug.** Verificado sobre el código:

### 1.1 El desajuste de ids existe, pero es código inalcanzable

`FilaIngreso.TIPO_LABEL` (`FilaIngreso.jsx:1-13`) tiene keys `la_ventolera` / `la_imbailable` / `tapelao`. Lo que la app escribe son `laventolera` / `laimbailable` / `tapelao` (`useModoIngreso.js:7-20`, `PasoTipoIngreso.jsx:3-5`).

Pero **`FilaIngreso` solo tiene dos importadores**: `SueldoSection.jsx:3` y `FreelanceSection.jsx:3`. Ambos reciben documentos de `tipo: "sueldo"` / `tipo: "freelance"`, y en ambos casos `subtipo` es `null` (`seleccionarTipo` resetea `subtipo` a `null`, `useModoIngreso.js:43-51`; `submitIngreso.js:31` escribe `subtipo: subtipo ?? null`).

⇒ `TIPO_LABEL` **nunca se consulta con una clave de banda**. Las 5 keys son inalcanzables, incluidas `sueldo` y `freelance`.

**Consecuencia práctica: arreglar `FilaIngreso` no arregla nada visible.** (Además, `tapelao` sí coincide entre ambos mapas, así que un "arreglo" que alineara los ids sobre `FilaIngreso` habría roto ese sub-tipo.)

### 1.2 El bug de bandas visible está en `BandasSection`

`BandasSection` **no usa `FilaIngreso`**: agrupa por el id crudo y renderiza su propia fila.

| Línea | Código | Efecto |
|---|---|---|
| `:10-11` | `const key = ingreso.subtipo \|\| "Sin banda";` | agrupa por id — correcto, no se toca |
| `:60` | `<p className="... capitalize ...">{banda}</p>` | **`"laventolera"` → CSS `capitalize` → "Laventolera"** |

Resultado actual: **"Laventolera"** y **"Laimbailable"**. `tapelao` → "Tapelao", que se ve bien por casualidad y por eso el defecto nunca se resultó notorio. Además, si una banda tuviera **2 ingresos**, el error se vería **una sola vez** (en el header del grupo), no por fila.

### 1.3 `FilaIngreso` tiene un segundo bug, distinto

El título es `TIPO_LABEL[ingreso.subtipo] ?? ingreso.detalle ?? "Ingreso"` (`:27-35`) y el subtítulo vuelve a pintar `ingreso.detalle` (`:37-41`).

Como `submitIngreso.js:34` guarda `detalle: detalle.trim() || null`, el `detalle` es **o `null`, o un string no vacío**. Por lo tanto, cuando existe `detalle`, **el subtítulo es siempre idéntico al título**.

| Tipo | `subtipo` | `detalle` | Qué se ve hoy |
|---|---|---|---|
| `freelance` | `null` | **requerido** (`PasoDetalleIngreso.jsx:11-13`) | el proyecto **dos veces** |
| `sueldo` | `null` | opcional | el detalle dos veces, o "Ingreso" si falta |
| `otros` | `null` | **requerido** | (no se muestra: no hay sección) |

Este es el "bug freelance" de `REPORT-02.md` §3.8. **Es un defecto diferente del de bandas**, aunque ambos vivan en el mismo archivo.

### 1.4 Los ids de escritura son correctos y no se tocan

`useModoIngreso.js` tiene **un solo commit** en toda la historia (`8192f5d`) y siempre exportó `laventolera` / `laimbailable` / `tapelao` (verificado con `git log -p --follow`). ⇒ **Ningún id "legacy" fue escrito por esta app**, y cambiar los ids de escritura dejaría huérfanos los documentos históricos.

**Regla dura de 2.3: el fix es 100 % lado lectura. `useModoIngreso.js` y `submitIngreso.js` no se tocan.** El gate read-only (§5) lo confirma contra los datos reales.

### 1.5 `otros`: la plata entra, no se ve y no se cuenta

| Hecho | Evidencia |
|---|---|
| Se puede registrar | `PasoTipoIngreso.jsx:114-129` |
| **Suma al total** | `useIngresos.js:88-94` suma **todos** los docs sin filtrar por `tipo` |
| **No tiene sección** | `useIngresos.js:63-83` solo agrupa `sueldo` / `banda` / `freelance` |
| **No se cuenta** en "N ingresos" | `page.jsx:65-70` suma solo las 3 secciones + `transferenciasRecibidas` |

⇒ El usuario ve un `Total ingresos` que incluye dinero que **no puede encontrar en ninguna lista** y que **no está en el conteo** de transacciones.

**Invariante que cierra 2.3:** *todo peso dentro de `Total ingresos` es visible en alguna sección **y** está contado en "N ingresos".* Hoy `otros` cumple **0 de 2**. Es el mismo principio que se cerró en 2.2 ("la etiqueta y el número cuentan lo mismo").

## 2. Alcance: 5 archivos, un solo lote

| # | Archivo | Acción | Líneas |
|---|---|---|---|
| 1 | `app/ingresos/sections/BandasSection.jsx` | Modificar — mostrar el label real de la banda | +~7 |
| 2 | `app/ingresos/components/FilaIngreso.jsx` | Modificar — borrar `TIPO_LABEL` y el subtítulo duplicado | −~17 |
| 3 | `app/ingresos/hooks/useIngresos.js` | Modificar — `ingresosOtros` + `openSections.otros` | +~8 |
| 4 | `app/ingresos/sections/OtrosSection.jsx` | **Nuevo** — sección "Otros" | ~28 |
| 5 | `app/ingresos/page.jsx` | Modificar — montar la sección + sumar al conteo | +~12 |

**Decisiones cerradas por el usuario (30/09/2026):**

| Decisión | Elección | Motivo |
|---|---|---|
| Origen de los labels | **Opción A (mínima):** `BandasSection` importa `BANDAS` de `useModoIngreso` | Coincide con el criterio de alcance de 2.2 (el usuario eligió duplicar `esPagado` en vez de extraer un helper). 5 archivos en vez de 7 |
| Título de la fila | **Opción A:** `detalle ?? "Ingreso"` | El tipo ya lo dice el header de la sección; la fila muestra el nombre real una sola vez |
| `lib/ingresos.js` | **No se toca** | Agendado para borrado en **2.6**; no se adelanta trabajo de otra subetapa |
| Lote | **Único** | Las 3 partes son el mismo defecto de visualización en la misma pantalla, sin escrituras |

## 3. Cambios previstos (código exacto)

### 3.1 `app/ingresos/sections/BandasSection.jsx`

Agrupar **sigue siendo por id** (no se cambia `:10-11`: agrupar por id es correcto). Lo único que cambia es **cómo se muestra** el header del grupo (`:60`).

```js
import Acordeon from "@/app/gastos/components/Acordeon";

// Fuente única de los labels. Los IDs son los canónicos que escribe
// useModoIngreso (nunca se cambian). Duplicado por decisión de alcance
// de 2.3: no se extrae a una taxonomía compartida.
import { BANDAS } from "@/app/agregar/components/ingresos/hooks/useModoIngreso";

const BANDA_LABEL = BANDAS.reduce((acc, b) => {
  acc[b.id] = b.label;
  return acc;
}, {});

const labelBanda = (id) => BANDA_LABEL[id] ?? id;
```

Y en el header del grupo (`:59-62`):

```jsx
<p className="font-sora text-[14px] font-semibold capitalize text-text">
  {labelBanda(banda)}
</p>
```

Reglas:
- Se **mantiene** la clase `capitalize`: es inocua para los labels ya capitalizados ("La Ventolera") y sirve de fallback legible si algún día aparece un `subtipo` desconocido.
- El caso `"Sin banda"` (`:11`) se mantiene literal: `labelBanda("Sin banda")` cae en el `?? id` y devuelve `"Sin banda"`, luego `capitalize` lo deja igual.
- **No** se cambia el cálculo de `totalGeneral` ni de `totalBanda` (`:24-29`, `:42-50`).

### 3.2 `app/ingresos/components/FilaIngreso.jsx`

1. **Borrar `TIPO_LABEL` completo** (`:1-13`) — las 5 keys son inalcanzables (§1.1).
2. Título (`:27-35`) → `ingreso.detalle ?? "Ingreso"`.
3. **Borrar el bloque del subtítulo** (`:37-41`).

```jsx
const titulo = ingreso.detalle ?? "Ingreso";
...
<p className="text-[14px] font-medium text-text">
  {titulo}
</p>

<p className="mt-[2px] text-[11px] text-text-muted">
  {fecha.toLocaleDateString()}
</p>
```

**Por qué el subtítulo desaparece y no se "corrige":** con `submitIngreso.js:34` (`detalle: detalle.trim() || null`), `detalle` es `null` o un string **no vacío**. Si el título es `detalle`, la condición `ingreso.detalle && ingreso.detalle !== titulo` es **siempre falsa** ⇒ el subtítulo sería código muerto desde el arranque. Mantenerlo sería volver a dejar código inalcanzable, que es exactamente el defecto que 2.3 viene a limpiar. La fila queda: **nombre + fecha + monto**.

**Efecto visual esperado:** en freelance, "Diseño web" aparece **una** vez en lugar de dos. En sueldo sin detalle, sigue diciendo "Ingreso".

### 3.3 `app/ingresos/hooks/useIngresos.js`

- Nuevo filtro junto a `ingresosFreelance` (`:77-83`):

```js
const ingresosOtros = useMemo(
  () => ingresos.filter((i) => i.tipo === "otros"),
  [ingresos],
);
```

- `openSections` (`:27-33`) += `otros: true`.
- Exponer `ingresosOtros` en el return (`:119-132`).
- **`totalIngresos` NO se toca** (`:85-110`): ya suma todos los documentos. Agregar la sección **no cambia ni un peso** del total.

### 3.4 `app/ingresos/sections/OtrosSection.jsx` (nuevo)

Copia del patrón de `FreelanceSection.jsx`, con `empty` como en `BandasSection`:

```jsx
import Acordeon from "@/app/gastos/components/Acordeon";

import FilaIngreso from "../components/FilaIngreso";

export default function OtrosSection({
  ingresos,
  open,
  onToggle,
}) {
  return (
    <Acordeon
      titulo="Otros"
      total={ingresos.reduce(
        (a, i) => a + Number(i.monto || 0),
        0,
      )}
      open={open}
      onToggle={onToggle}
      empty={!ingresos.length}
    >
      {ingresos.map((i) => (
        <FilaIngreso key={i.id} ingreso={i} />
      ))}
    </Acordeon>
  );
}
```

Usa el `Acordeon` de `@/app/gastos/components/Acordeon` (el que ya importan las otras secciones), **no** el duplicado muerto `app/ingresos/components/Acordeon.jsx` (agendado para 2.6).

**Nota de consistencia (fuera de alcance):** `SueldoSection` y `FreelanceSection` **no** pasan `empty`, así que con 0 movimientos muestran un acordeón desplegado y vacío. `OtrosSection` **sí** lo pasa y colapsa a "Sin movimientos este mes", igual que `BandasSection`. Unificar eso sería alcance extra: **no se hace en 2.3.**

### 3.5 `app/ingresos/page.jsx`

- Importar `OtrosSection` (junto a `:13`).
- Destructurear `ingresosOtros` (`:30-43`).
- **Contar** los otros (`:65-70`):

```jsx
totalTransacciones={
  ingresosSueldo.length +
  ingresosBandas.length +
  ingresosFreelance.length +
  ingresosOtros.length +
  transferenciasRecibidas.length
}
```

- Montar la sección **después** de `FreelanceSection` (`:91-97`) y **antes** del bloque comentado de transferencias (`:99-111`), que no se toca:

```jsx
<OtrosSection
  ingresos={ingresosOtros}
  open={openSections.otros}
  onToggle={() => toggleSection("otros")}
/>
```

## 4. Fuera de alcance (no tocar en 2.3)

- **`useModoIngreso.js` y `submitIngreso.js`** — los ids de escritura son canónicos (§1.4).
- `lib/ingresos.js` — muerto, 0 importadores, agendado para **2.6**.
- `app/ingresos/components/Acordeon.jsx` — duplicado muerto, **2.6**.
- `TransferenciasIngresosSection` (import muerto en `page.jsx:14`, JSX comentado) — **Etapa 3**.
- `totalIngresos` tratando las transferencias recibidas como ingreso — contradice la regla de dominio "reintegro ≠ ingreso" — **Etapa 3**.
- `subscribeIngresos.js` sin manejo de errores (loading infinito si falla una query) — **candidato nuevo, sin subetapa asignada**.
- Unificar el flag `empty` en `SueldoSection` / `FreelanceSection`.
- `detalle` requerido o no para `freelance` / `otros` (`PasoDetalleIngreso.jsx:11-13`).
- Cualquier escritura en Firestore, migración o corrección de históricos.
- El importe o la estructura de los subtipos de banda (no se agregan bandas nuevas).

## 5. Gate read-only previo — PENDIENTE

**Read-only estricto: solo `.get()`, sin escrituras, sin migraciones.** Imprime únicamente agregados: **sin montos, sin UIDs, sin `detalle`.**

- Colección: **`ingresos`**.
- Origen: **Firebase Console → Cloud Shell** (Node + `@google-cloud/firestore`, autenticación de la sesión). Mismo procedimiento que el gate de `PROPUESTA-2.2.md` §6.

### 5.1 Script

**Archivo listo para copiar:** `gate-2.3-lectura-ingresos.js` (en la raíz de este repo).

**Uso:** Firebase Console → Cloud Shell → subir/copiar el archivo → reemplazar `PROJECT_ID` → ejecutar:

```
node gate-2.3-lectura-ingresos.js
```

El script **aborta sin hacer ninguna consulta** si `PROJECT_ID` quedó sin reemplazar, para no leer por error el proyecto equivocado.

> `PROJECT_ID` es el id del proyecto Firebase (clave `NEXT_PUBLIC_FIREBASE_PROJECT_ID` del `.env.local`). **No se lee ni se imprime ninguna otra variable.**

```js
const { Firestore } = require("@google-cloud/firestore");

const PROJECT_ID = "PROJECT_ID";

const CANONICOS = ["laventolera", "laimbailable", "tapelao"];
const LEGACY = ["la_ventolera", "la_imbailable"];

(async () => {
  if (PROJECT_ID === "PROJECT_ID") {
    console.log("\nABORTADO: reemplazar PROJECT_ID por el id real.\n");
    return;
  }

  const db = new Firestore({ projectId: PROJECT_ID });
  const snap = await db.collection("ingresos").get();   // ÚNICA operación
  const docs = snap.docs.map((d) => d.data());

  const porTipo = {};
  const subtiposBanda = {};
  let otros = 0;
  let idsLegacy = 0;
  let subtipoEnNoBanda = 0;
  let sinDetalle = 0;
  let sinTipo = 0;
  let sinUsuario = 0;

  for (const d of docs) {
    const tipo = d.tipo ?? "(ausente)";
    porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;

    if (tipo === "banda") {
      const st = d.subtipo ?? "(null)";
      subtiposBanda[st] = (subtiposBanda[st] ?? 0) + 1;
      if (LEGACY.includes(d.subtipo)) idsLegacy += 1;
    }

    if (tipo === "otros") otros += 1;
    if (tipo !== "banda" && d.subtipo) subtipoEnNoBanda += 1;
    if (!d.detalle) sinDetalle += 1;
    if (!("tipo" in d)) sinTipo += 1;
    if (!d.usuario) sinUsuario += 1;
  }

  const subtiposDesconocidos = Object.keys(subtiposBanda).filter(
    (k) => !CANONICOS.includes(k) && k !== "(null)",
  );

  console.log(JSON.stringify({
    total: docs.length,
    porTipo,
    subtiposBanda,
    subtiposDesconocidos,
    idsLegacy,
    otros,
    subtipoEnNoBanda,
    sinTipo,
    sinDetalle,
    sinUsuario,
  }, null, 2));
})();
```

> El archivo `gate-2.3-lectura-ingresos.js` además interpreta el resultado y **no imprime montos, UIDs ni `detalle`**. El bloque de arriba es la referencia de lo que hace.

### 5.2 Criterio del gate

| Señal | Resultado | Acción |
|---|---|---|
| `idsLegacy` | `=== 0` | ✅ **PASS** — el fix es 100 % lado lectura, sin alias, sin migración |
| `idsLegacy` | `> 0` | ⛔ **STOP** — hay datos con ids distintos de los canónicos. Definir con el usuario un mapa de aliases de **lectura** antes de tocar código |
| `subtiposDesconocidos` | `[]` | ✅ **PASS** — todos los subtipos de banda tienen label |
| `subtiposDesconocidos` | `no vacío` | ⚠️ No bloquea, pero **reportar**: el fallback `?? id` los mostraría crudo |
| `otros` | `> 0` | La sección "Otros" muestra datos reales; el caso de prueba §6 tiene un sujeto |
| `otros` | `=== 0` | La sección arranca vacía y colapsa; el caso de prueba §6 tiene que **crear** uno |
| `porTipo` | — | Informativo: dimensiona qué se ve y qué queda fuera |
| `sinTipo` / `sinUsuario` | `=== 0` | ✅ Sin documentos huérfanos que la app no puede clasificar ni mostrar |
| `subtipoEnNoBanda` | `=== 0` | ✅ `subtipo` solo se usa para bandas (coherente con `seleccionarTipo`) |
| `sinDetalle` | — | Informativo: son filas que titulan "Ingreso" |

⇒ **Solo `idsLegacy > 0` detiene la subetapa.** El resto se reporta y se decide con el usuario.

### 5.3 Qué NO hace el gate

No lee ni escribe `gastos`, `fixed_expense_entries`, `groups` ni `users`. No verifica los índices de `subscribeIngresos.js` (eso requeriría una escritura o unLogging de error, y queda fuera). No valida los `usuarios` UIDs contra `users`.

## 6. Verificación

### 6.1 Estática
- `npm run build` — esperado 9/9 rutas.
- `npm run lint` — el baseline de `PROPUESTA-2.2.md` §7.3 es **2 errores + 3 warnings preexistentes**; el criterio de cierre es **0 problemas nuevos**.
- **Fixtures lógicos** (sin Firestore): matriz `tipo` × `subtipo` × `detalle` → label/título esperado.

| `tipo` | `subtipo` | `detalle` | Label de banda (§3.1) | Título de fila (§3.2) |
|---|---|---|---|---|
| `banda` | `laventolera` | `x` | **La Ventolera** | `x` |
| `banda` | `laimbailable` | `null` | **La Imbailable** | Ingreso |
| `banda` | `tapelao` | `x` | **Tapelao** (sin regresión) | `x` |
| `banda` | desconocido | `x` | el id crudo (fallback) | `x` |
| `banda` | `null` | `x` | Sin banda | `x` |
| `sueldo` | `null` | `x` | — | `x` (una vez) |
| `sueldo` | `null` | `null` | — | Ingreso |
| `freelance` | `null` | `x` | — | `x` (una vez, **no dos**) |
| `otros` | `null` | `x` | — | `x` |

### 6.2 Runtime local

Requiere `.env.local` con las 6 variables `NEXT_PUBLIC_FIREBASE_*` (`lib/firebase.js:7-12`). **Ojo: el `.env.local` del proyecto apunta a la misma base que Producción** (`PROPUESTA-2.2.md` §8) ⇒ la prueba **escribe datos reales**. Por eso:

- Usar el **sandbox ya construido** en 2.2 (conservado a propósito): usuario de prueba A `doVj0bxHqjdtV2N88FuLiyaeCK12`, usuario de prueba B `IJWQmtR1z2Z29xrGsXhMe9OAUtA2`, grupo `groups/TEST-2-2`.
- **Nunca** registrar un ingreso real de prueba en la cuenta real.
- **Limpiar** los documentos temporales al terminar y **verificar** el conteo antes/después, como en `PROPUESTA-2.2.md` §5.1.

> La app no tiene registro de usuarios ni creación de grupos desde la UI (`context/arquitectura.md:24`) ⇒ el andamiaje se preparó a mano desde Firebase Console y se conserva.

| # | Caso | Resultado esperado |
|---|---|---|
| 1 | Banda **La Ventolera** con detalle | Header del grupo: **"La Ventolera"** (no "Laventolera"). Total del grupo correcto |
| 2 | Bandas **La Imbailable** y **Tapelao** | **"La Imbailable"** y **"Tapelao"**. Sin regresión en el id que ya se veía bien |
| 3 | **Freelance** con detalle "Diseño web" | La fila muestra **"Diseño web" una sola vez** + fecha + monto. **No aparece repetido** |
| 4 | **Otros** con detalle "Venta" | Aparece la **sección "Otros"** con su monto, y "N ingresos" **suma +1** ⇒ invariante de §1.5 cumplida |
| 5 | Mes **sin** ingresos `otros` | La sección colapsa a "Sin movimientos este mes"; el total no cambia; no rompe el render |
| 6 | **Regresión global** | **`totalIngresos` es idéntico antes y después** de la implementación en todos los casos. Si cambia un peso, es un error |
| 7 | **Regresión de `/gastos`** | `/gastos` intacto (2.3 no lo toca, pero comparten base) |

## 7. Flujo de ejecución

**Regla: ninguna promoción ni deploy encadenado automáticamente.** Cada ambiente exige aprobación explícita del usuario.

| # | Paso | Estado | Aprobación |
|---|---|---|---|
| 1 | Plan funcional + decisiones de alcance | ✅ **HECHO** (30/09/2026) | ✅ |
| 2 | Documentación (`PROPUESTA-2.3.md`, `dominio.md` §3.4) | ✅ **HECHA** | — |
| 3 | **Gate read-only de `ingresos`** (§5) | ⏳ **PENDIENTE** — script listo | — |
| 4 | **Aprobación de implementación** | ⏳ **NO OTORGADA** | 👈 **se pide al usuario** |
| 5 | Implementación local (5 archivos, §3) | ❌ No empezada | — |
| 6 | `npm run build` + `npm run lint` + fixtures | ❌ No empezada | — |
| 7 | Test local + limpieza del sandbox | ❌ No empezada | — |
| 8 | Revisión funcional del usuario | ❌ No empezada | — |
| 9 | Merge a `staging` + push | ❌ No empezada | 👈 **aprobación explícita** |
| 10 | Test en Staging | ❌ No empezada | 👈 **aprobación explícita** |
| 11 | Merge a `main` + deploy a Producción | ❌ No empezada | 👈 **aprobación explícita** |
| 12 | Test en Producción + cierre de 2.3 | ❌ No empezada | 👈 **aprobación explícita** |

> **No encadenar:** terminar el paso 7 **no** habilita el 9. Cada uno espera su aprobación.
> **Verificar antes de cada promoción** que `main`, `staging` y Producción siguen en el mismo commit (lo que falló en 2.2 y se corrigió en `PROPUESTA-2.2.md` §10.1).

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Importar `BANDAS` desde `app/agregar/...` hacia `app/ingresos/...` crea dependencia lectura→escritura | **0 cambio de comportamiento**: los ids son idénticos y no se usa ningún hook. Deuda anotada, reversible en 2.6 |
| El gate encuentra `idsLegacy > 0` | STOP antes de tocar código; se define un alias de lectura con el usuario |
| El conteo "N ingresos" cambia | Es **la corrección pedida**: antes mentía. Se valida en el caso 4 |
| La prueba runtime escribe en la base real | Sandbox de 2.2 reutilizado + limpieza verificada con conteo antes/después (como §5.1 de 2.2) |
| Un `subtipo` de banda desconocido en el futuro | Fallback `?? id` + `capitalize`: se muestra crudo pero no rompe |
| Que "arreglar" los ids de escritura parezca más simple | Los ids de escritura son intocables (§1.4) y el gate lo verifica contra datos reales |

## 9. Pendientes que 2.3 deja explícitos

- **2.7-GUARD** (`groupId` al dar de alta un fijo compartido): sigue **NO implementada**, requiere aprobación propia.
- **2.6**: `lib/ingresos.js` y `app/ingresos/components/Acordeon.jsx` (ambos muertos), `storage`, `origenCompra`.
- **Etapa 3**: `TransferenciasIngresosSection`, y el hecho de que `totalIngresos` sume las transferencias recibidas como ingreso (contradice "reintegro ≠ ingreso").
- **Candidato sin subetapa:** `subscribeIngresos.js` no maneja errores ⇒ loading infinito si falla una query (`REPORT-02.md` §3.8).
