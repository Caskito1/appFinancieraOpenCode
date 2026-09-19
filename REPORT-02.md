# REPORT-02 — Auditoría de AppFinanciera

Etapa 2 del roadmap. Solo lectura: no se modificó código ni datos de la aplicación.
Fuentes: `HANDOFF-02.md`, `AGENTS.md`, `ROADMAP.md`.

## 1. Resumen ejecutivo

- La app registra gastos (`tipo: "personal" | "compartido"`), gastos fijos, ingresos y transferencias. No existe un modelo propio de tarjeta: el resumen se registra como gasto fijo personal "OCA" y el dinero entre integrantes se modela con transferencias.
- **No existe** concepto de "gasto de terceros", "adelanto", "reintegro" ni "dinero a recuperar" como tipo o campo. Los equivalentes funcionales más cercanos viven dispersos en transferencias y en los saldos de gastos fijos compartidos.
- **Distorsión central:** los gastos fijos compartidos siempre se dividen 50/50 sin importar quién pagó, y los gastos compartidos de la colección `gastos` nunca se dividen. El total del mes ignora a quién debe o quién debe quién.
- Los reintegros/transferencias recibidos suman al total de ingresos sin contra-partida en gastos, lo que infla el "balance". El único cálculo de neto existente (`gastosCalculations.js`) es código muerto e inconsistente.
- Los pendientes conocidos se confirmaron: el bug de ingresos freelance se localizó en el rotulado de filas (busca por `subtipo`, no por `tipo`), y los "productos faltantes" están ligados a una doble taxonomía de gastos fijos y a la pérdida de la opción "otros".

## 2. Mapa de la app

### Stack y estructura

- Next.js 16 (App Router, client components) + React 19 + Firebase (Auth + Firestore). `package.json:1-24`.
- Código en `organizador-app/`:
  - `app/agregar/` — alta de gastos, gastos fijos, ingreso, compra, transferencia.
  - `app/gastos/` — vista de gastos del mes (hooks y servicios en `app/gastos/hooks/` y `app/gastos/services/`).
  - `app/gastos-fijos/` — vista de gastos fijos y balance compartido.
  - `app/ingresos/` — vista de ingresos del mes.
  - `app/home/`, `app/login/` — entrada y autenticación.
  - `lib/` — `firebase.js` (config), `taxonomia.js` y `fixedExpensesTaxonomia.js` (catálogos), `ingresos.js`, contexts (`AuthContext.jsx`, `GroupContext.jsx`), `temp.js`.
- No hay schemas ni tipos: las entidades son documentos Firestore definidos al momento de escritura.

### Entidades / colecciones Firestore

| Colección | Campos clave | Escritura |
|---|---|---|
| `gastos` | `monto`, `producto`, `productoId`, `categoria`, `subcategoria`, `contexto`, `tipo` (`personal`/`compartido`), `usuario`, `groupId`, `origenCompra` | `app/agregar/components/unico/helpers/submitUnico.js:28-69`, `app/agregar/components/compra/helpers/submitCompra.js:30-75` |
| `ingresos` | `tipo` (`sueldo`/`banda`/`freelance`/`otros`), `subtipo`, `detalle`, `monto`, `usuario`, `createdAt` | `app/agregar/components/ingresos/helpers/submitIngreso.js:26-45` |
| `transferencias` | `monto`, `concepto` (`alquiler`/`tarjeta`/`otros`), `deUid`/`deNombre`, `paraUid`/`paraNombre`, `groupId` | `app/agregar/components/transferencia/helpers/submitTransferencia.jsx:18-36` |
| `fixed_expenses` | Dos usos incompatibles: (A) config personal `{expenseId, usuario, montoDefault, activo}` (activo, `useFixedExpenses.js:180-189`) y (B) registro legado de gasto fijo con schema que nadie consume (código muerto, `fixedExpenseHelpers.js:24-70`) | `useFixedExpenses.js:180-189` / flujo legado deshabilitado (`agregar/page.jsx:82-93`) |
| `fixed_expense_entries` | `fixedExpenseId`, `nombre`, `periodo` (`YYYY-MM`), `montoTotal`, `vencimiento`, `pagoHasta`, `paidByUid`/`paidByNombre`, `participantes[]` (1 o 2 items con `{uid, corresponde, pagado}`), `estado` | `useFixedExpenses.js:201-244` |
| `groups` / `users` | `name`, `members`; `displayName` | Solo lectura en este repo (`lib/GroupContext.jsx:22-41`, `useModoTransferencia.jsx:52-68`) |

### Flujo de datos

- **Gasto único**: `agregar/page.jsx:54-65` → `ModoUnico.jsx` → `submitUnico.js` → `addDoc("gastos")`.
- **Compra rápida**: `ModoCompra.jsx` → `submitCompra.js` → `writeBatch` (un doc por producto en `gastos`, `origenCompra: true`).
- **Gasto fijo**: alta personal en `fixed_expenses` (`useFixedExpenses.js:180-189`); registro mensual en `fixed_expense_entries` (`useFixedExpenses.js:201-244`); confirmar pago (`:246-275`) y saldar deuda (`:277-293`).
- **Ingreso**: `ModoIngreso.jsx` → `submitIngreso.js` → `addDoc("ingresos")`; filtrado por mes en `subscribeIngresos.js:30-48`.
- **Transferencia**: alta deshabilitada en UI (`agregar/page.jsx:96-107`) pero lectura activa: las enviadas entran como gasto propio (`useGastos.js:65-74`) y las recibidas como ingreso (`useIngresos.js:95-106`).
- **Vistas del mes**: `/gastos` filtra por rango de `createdAt` (`dateHelpers.js:3-20` aplicado en `useGastos.js:50-59`); `/ingresos` igual en `subscribeIngresos.js:18-28`.

## 3. Hallazgos

### 3.1 Gastos compartidos de `gastos`: nunca se dividen

- `totalGrupo` suma el monto completo de todos los compartidos del grupo (`useGastos.js:86`); `totalUsuario` toma solo los que pagó `user.uid` (`useGastos.js:87-89`); `totalGastos` usa `totalGruposUsuario` (`useGastos.js:116-120`).
- No hay campo "quién debe qué" a nivel gasto compartido. El label "Tu parte" (`GroupSection.jsx:18`) en realidad muestra "lo que pagaste", no tu parte.
- **Distorsión:** la pareja paga $1000 de un gasto supuestamente 50/50 → el mes del usuario no refleja sus $500; el que paga carga los $1000 completos como gasto del mes.

### 3.2 Gastos fijos compartidos: división 50/50 fija que ignora quién pagó

- `totalFixed` suma `montoTotal/2` para toda entrada con `groupId` (`useGastos.js:110-114`), y `registrarPago` hardcodea `mitad = montoTotal/2` (`useFixedExpenses.js:264`) con `participantes` de exactamente 2 elementos.
- Si la pareja pagó el 100% y el usuario aún no reintegra, `/gastos` igual suma `monto/2` al total del mes → sobrecuenta gasto real de caja. Si el usuario pagó el 100%, solo cuenta `monto/2` → subcuenta su salida real. El `balanceNeto` de `/gastos-fijos` captura la diferencia (`useFixedExpenses.js:156-160`) pero el total del mes la ignora.
- `registrarPago` elige al "otro" como `grupo.members[0]` distinto del user (`useFixedExpenses.js:265`): no soporta proporciones distintas de 50/50 ni grupos de más de 2.

### 3.3 Doble conteo posible: gasto de tarjeta + transferencia

- No hay vínculo entre gasto, transferencia y gasto fijo. La tarjeta se registra como gasto fijo personal "OCA" (`fixedExpensesTaxonomia.js:11`, `fixedExpensesConfig.js:43-46`) y adicionalmente se puede transferir plata a la pareja con concepto `tarjeta` (`useModoTransferencia.jsx:27`), que entra a `gastosPersonales` como gasto (`useGastos.js:65-74`). Ambos cuentan sobre el mismo dinero → doble registro imposible de detectar.

### 3.4 El reintegro recibido cuenta como ingreso y no reduce gastos

- Las transferencias recibidas suman a `totalIngresos` (`useIngresos.js:95-106`) pero no se listan (sección comentada `app/ingresos/page.jsx:99-111`) ni restan nada de gastos.
- Un reintegro de la pareja infla "Total ingresos" sin contra-partida → el "balance neto" nunca podría ser correcto.

### 3.5 Código de cálculo muerto e inconsistente

- `gastosCalculations.js:1-34` define `calcularTotal`, `calcularTotalGastos`, `calcularTotalIngresos` y `calcularNeto`; `calcularTotalIngresos` usa `gasto.recibi` que no se computa en ningún lado. Ninguna función se importa en la app.

### 3.6 Divergencia entre `/gastos` y `/gastos-fijos` para suscripciones anuales

- `/gastos` filtra `fixed_expense_entries` por `periodo` exacto (`subscribeFixedExpenses.js:20,35`), mientras `/gastos-fijos` propaga anuales vía `pagoHasta` (`useFixedExpenses.js:79-97`). Una suscripción anual aparece en gastos-fijos para meses futuros pero no suma al total del mes de `/gastos`.
- Además `totalFixed` suma el `monto/2` compartido aun cuando la entrada está en `"pendiente_pago"` (nadie pagó; `registrarGasto` deja `paidByUid: null`, `useFixedExpenses.js:222-224`).

### 3.7 Dos lógicas de "compartido" bajo la misma etiqueta

- Colección `gastos`: monto completo cargado por quien paga, sin división ni participantes.
- Colección `fixed_expense_entries`: `montoTotal` y división 50/50 con `participantes`.
- Misma etiqueta, cálculo distinto, incluso dentro de la misma pantalla `/gastos` (`totalGruposUsuario` vs `totalFixed`).

### 3.8 Pendiente confirmado: ingresos freelance mal rotulados y tipo "otros" sin sección

- `FilaIngreso.jsx:27-35`: la fila se rotula por `ingreso.subtipo`, nunca por `ingreso.tipo`; para freelance `subtipo` es `null` → la fila muestra el `detalle` como título (y repetido como subtítulo, `FilaIngreso.jsx:37-41`). La entrada `TIPO_LABEL.freelance` (`FilaIngreso.jsx:4`) es inalcanzable.
- Los ids de banda escritos por la UI (`laventolera`, `laimbailable`, `useModoIngreso.js:9-19`) no coinciden con las claves de `TIPO_LABEL` (`la_ventolera`, `la_imbailable`, `FilaIngreso.jsx:6-12`).
- El tipo `otros` es registrable (`PasoTipoIngreso.jsx:115-129`) y suma al total (`useIngresos.js:85-93`) pero no tiene sección (`useIngresos.js:63-83`, `page.jsx:75-97`).
- Riesgo sistémico: `subscribeIngresos.js:94-125` no maneja errores y solo emite datos cuando ambas queries cargan → una query fallida (ej. falta índice compuesto) deja la página en loading infinito (`page.jsx:45-49`).

### 3.9 Pendiente confirmado: productos faltantes vinculados a doble taxonomía

- `lib/taxonomia.js` declara que los productos custom "se guardan en Firestore y se mergean en runtime" (`taxonomia.js:4`) pero no existe ese merge (grep sin `collection(db,"productos")`); solo el botón "Otros" hardcodeado (`useModoUnico.js:43-53`).
- Catálogo de gastos fijos: `lib/temp.js:18` incluye la opción "otros" que **no está** en la lista activa `fixedExpensesTaxonomia.js:10-19` → el catálogo activo la perdió.
- Dos taxonomías de gastos fijos paralelas: `fixedExpensesConfig.js` vs `fixedExpensesTaxonomia.js`. Diffieren, p. ej. en Disney: compartido en `fixedExpensesConfig.js:72-76`, personal en `fixedExpensesTaxonomia.js:15`.

### 3.10 Transferencias: UI deshabilitada pero lógica activa

- Alta de transferencias comentada (`agregar/page.jsx:96-107`), pero las transferencias enviadas igual cuentan como gasto (`useGastos.js:65-74`) y las recibidas como ingreso (`useIngresos.js:95-106`).

## 4. Preguntas abiertas

- ¿Cómo se crean los grupos y los documentos `users`? En este repo solo hay lecturas (`lib/GroupContext.jsx:22-41`, `useModoTransferencia.jsx:42-68`).
- ¿Existen documentos huérfanos en `fixed_expenses` del flujo legado (`submitFixedExpense`, `fixedExpenseHelpers.js:24-70`)? Ninguna vista los consume.
- ¿Existen productos custom en Firestore? La nota de `taxonomia.js:4` no tiene código de merge asociado.
- ¿Cuál es el contenido real de Firestore en `ingresos`? Puede haber registros históricos con `tipo`/`createdAt` de otro formato que la query excluye silenciosamente (`subscribeIngresos.js:30-48`).
- ¿Existen los índices compuestos requeridos por `subscribeIngresos.js:30-48` y `:50-72`? Si no, la vista de ingresos queda en loading infinito (no verificable sin la consola de Firebase).
- ¿Qué "productos faltantes" concretos se deben agregar a `lib/taxonomia.js`? Depende del usuario, no del código.
- ¿Cuál es el propósito de `lib/temp.js` (igual a `fixedExpensesTaxonomia.js` + item "otros")?
- ¿Cómo se cargaron las transferencias existentes, si la UI de alta está comentada?
- Reglas de seguridad de Firestore: no hay archivos de reglas en el repo; no se puede auditar quién escribe `fixed_expense_entries` compartidas.
- Limitación de "un solo grupo": `useGastos.js:38` y `useFixedExpenses.js:37` usan `groups[0]`.
- Zona horaria: el rango de mes es local (`subscribeIngresos.js:18-28`) vs `serverTimestamp()` UTC; puede haber desfases cerca de los bordes del mes.

## 5. Recomendaciones de diseño a alto nivel

Observaciones que enmarcan la Etapa 3 (diseño). No constituyen decisiones ni tareas de implementación.

- Definir una semántica clara de "quién pagó" vs "quién corresponde" para gastos compartidos (hoy solo existe en parte en `fixed_expense_entries`), sin cambiar necesariamente la estructura de `gastos`.
- Evaluar cómo unificar o alinear las dos lógicas de "compartido" hoy vigentes (colección `gastos` sin división vs `fixed_expense_entries` con 50/50) y el 50/50 fijo.
- Considerar cómo representar "dinero a recuperar" y reintegros sin inflar ingresos ni duplicar gastos (hoy los reintegros suman a ingresos sin contra-partida; hay doble conteo posible tarjeta + transferencia).
- Decidir si el concepto "tarjeta" necesita representación propia o si basta mantenerlo como gasto fijo/transferencia con vínculo explícito.
- Resolver los pendientes conocidos de bajo riesgo (rotulado de ingresos freelance y tipo "otros", taxonomía "otros"/Disney) dentro del diseño, si se consideran necesarios para el mínimo funcional.