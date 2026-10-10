# PROPUESTA — Subetapa 2.4: Robustez de sesión/redirección (RouteGuard/AuthContext)

> **Naturaleza: SUBETAPA CERRADA (10/10/2026).** Implementada en `feat/2.4-auth-loading` (`1716a19`),
> publicada en `staging` por fast-forward, **validada por el usuario en Staging**, promovida a `main`
> por fast-forward con aprobación explícita (deploy automático a Producción) y **validada en
> Producción por el usuario (10/10/2026)**. `main` == `staging` == Producción == `1716a19`.
> No queda nada pendiente de 2.4. Plan aprobado por el usuario el 10/10/2026 (PLAN FINAL con 5
> garantías; aclaración sobre `onAuthStateChanged` en Firebase v12 previa y aprobada).

**Repo objetivo:** opencode-AppFinanciera (app anidada `AppFinanciera/`, repo git propio)
**Subetapa:** 2.4 de la Etapa 2 · **Origen:** candidato "Robustez — RouteGuard/AuthContext" (`HANDOFF-ETAPA-2.md` §2)
**Archivos tocados:** **1** — `AppFinanciera/lib/AuthContext.jsx` (+28/−5). `RouteGuard.jsx`, consumidores y Firestore **sin cambios**.

## 0. Estado actual

| Ítem | Estado |
|---|---|
| Diagnóstico | ✅ **VERIFICADO** sobre el código real (confirmó el diagnóstico histórico) |
| Plan técnico | ✅ **APROBADO** por el usuario (núcleo + salvaguarda 8 s + 5 garantías) |
| Aclaración Firebase v12 | ✅ **APROBADA** — callback de error de `onAuthStateChanged` deprecado, nunca disparado |
| Rama de trabajo | ✅ `feat/2.4-auth-loading` (creada desde `96934c0` = `main` == `origin/staging`) |
| Implementación | ✅ **COMMITEADA** `1716a19` — 1 archivo, +28/−5 |
| `build` | ✅ **OK 9/9** (con env vars dummy en el proceso de build — ver §6.3) |
| `lint` | ✅ **0 problemas nuevos** (2 errores + 3 warnings preexistentes de `HEAD`, ver §6.2) |
| Prueba funcional local (runtime) | ✅ **PASS** (10/10/2026, usuario) — refresh `/home`, acceso sin sesión, `/login` con sesión activa, login/logout, navegación entre rutas protegidas |
| Push a `staging` | ✅ **HECHO** (10/10/2026) — `git push origin feat/2.4-auth-loading:staging`, fast-forward `96934c0..1716a19`. `origin/staging` == `1716a19` |
| Verificación funcional en Staging | ✅ **PASS** (10/10/2026) — «Está correcto en staging» (usuario) |
| Promoción a `main` / Producción | ✅ **HECHA** (10/10/2026) — `git push origin origin/staging:main`, fast-forward `96934c0..1716a19`, deploy automático (Vercel) |
| Verificación funcional en Producción | ✅ **PASS** (10/10/2026) — «Aprobado en producción» (usuario) |
| Firestore | ⛔ **SIN CAMBIOS — 0 escrituras** |
| Estado de ambientes | ✅ **ALINEADOS**: `origin/main` == `origin/staging` == **`1716a19`** |
| Cierre | ✅ **CERRADA** (10/10/2026) — flujo completo Local → Staging → Producción → verificación |

## 1. Diagnóstico verificado (10/10/2026)

**`lib/AuthContext.jsx` (estado pre-cambio, HEAD `96934c0`):**
- `user` se inicializa en `undefined` (:10) y `onAuthStateChanged` lo pasa a `firebaseUser ?? null`. `undefined` = "sesión aún no resuelta"; `null` = sin sesión.
- El provider expone **solo `{ user }`** — **no hay `loading`**, ni estado de error, ni callback de error del observer.

**`app/components/layout/RouteGuard.jsx` (intacto):**
- :13 destructura `const { user, loading } = useAuth()` → `loading` es **siempre `undefined`** (propiedad inexistente).
- Efecto :21-22 `if (loading) return` nunca corta; `LoadingScreen` :41-45 **nunca se muestra**.
- Consecuencia: al montar en ruta protegida con la sesión sin resolver, `!user` (undefined es falsy) ⇒ `router.replace("/login")` **antes de que Firebase resuelva** → parpadeo / redirección prematura; si luego resulta autenticado, rebote de vuelta a `/home`. Mismo origen en `/login` con sesión existente.
- Sin bucle de redirección ni exposición de contenido protegido (en ruta protegida sin user el render devuelve `null`).

**Consumidores:** todos usan solo `{ user }` (GroupContext, useGastos, useIngresos, useFixedExpenses, home, FilaGasto, Modos de `agregar/`). **RouteGuard es el único consumidor de `loading`** ⇒ el contrato ya estaba pensado con `loading`; solo faltaba implementarlo.

## 2. Causa raíz

El estado de carga **nunca existió**: `AuthContext` solo exponía `user`; `RouteGuard` consume un `loading` inexistente (siempre `undefined`) y decide antes de que `onAuthStateChanged` emita su primer callback, tratando "resolviendo" como "no autenticado".

## 3. Aclaración técnica sobre errores (aprobada previamente)

- Firebase instalado: **`firebase@12.12.1`** (verificado con `npm ls`).
- La referencia oficial de `onAuthStateChanged(auth, nextOrObserver, error?, completed?)` declara el parámetro `error` como **«Deprecated. This callback is never triggered»** (confirmado también por el issue oficial firebase-js-sdk#6254). **No se agregó callback de error: sería código muerto.**
- Riesgo residual real de bloqueo: si la inicialización de Auth nunca asienta (hang de IndexedDB en entornos exóticos; firebase-js-sdk#8482/#9132/#10311), el primer callback del observer nunca llega y `user` quedaría `undefined` para siempre → **salvaguarda de 8 s**.
- Errores de `signIn`/`signOut` ya se manejan en sus propias promesas (login `page.jsx:47-50`, home `page.jsx:30-32`) — fuera de alcance.

## 4. Cambio implementado (`lib/AuthContext.jsx`, único archivo)

1. **`loading` derivado:** el provider expone `{ user, loading: user === undefined }`. No puede quedar `undefined`; sin estado extra que pueda desincronizarse.
2. **Salvaguarda `AUTH_RESOLVE_TIMEOUT_MS = 8000`:** un solo `setTimeout` en el effect (deps `[]`) que, si al vencer `user` sigue `undefined`, hace `setUser(u => u === undefined ? null : u)`. No pisa sesiones resueltas; no es confirmación de sesión, solo evita bloqueo eterno.
3. **Suscripción y cleanup:** bandera `cancelled` + `unsubscribe()` + `clearTimeout(safety)` en el cleanup (unmount). **La suscripción NO se da de baja al vencer el timeout:** si Firebase emite después un usuario autenticado, `null → User` y `RouteGuard` redirige `/login → /home` (recuperación).
4. **`try/catch` acotado** a errores **síncronos** de creación de la suscripción (config rota, `auth` indefinido): `console.error` + `setUser(null)` **diferido vía `queueMicrotask`** con el mismo guard funcional (el diferido fue necesario para no introducing un error lint nuevo, ver §6.2). No afirma capturar errores asíncronos del observer (no existen en v12, §3).
5. **`RouteGuard.jsx` sin cambios:** ya estaba escrito contra el contrato `loading` (efecto :22 y LoadingScreen :41-45).

### Garantías del diseño (las 5 aprobadas)

1. El timeout es **salvaguarda, no confirmación** de que Firebase resolvió; solo actúa si `user` sigue `undefined`.
2. Al vencer, **solo cambia `undefined → null`** (guard funcional); nunca sobrescribe una sesión resuelta; el timer se limpia al desmontar.
3. El `try/catch` cubre **solo errores síncronos** de crear la suscripción.
4. Si el timeout vence y después Firebase emite el usuario autenticado, **se recupera** (`null → User` → `/home`); no queda permanente en el login.
5. El timeout **no se reinicia en cada render** ni genera duplicados en Strict Mode (effect con deps `[]`; cleanup limpia timer y suscripción en el doble mount de dev).

## 5. Comportamiento resultante

- Durante la resolución de auth: **`LoadingScreen` en todas las rutas** (incluido `/login`) — fin del parpadeo y de la redirección prematura.
- Rutas protegidas: solo se redirige con `loading === false` y `user === null` (**deny-by-default**, sin acceso por defecto).
- `/login` con sesión existente: espera la resolución y hace `replace("/home")`.
- Login/logout: sin cambios; los `router.push` propios coexisten sin bucle (mismo destino que el guard).

## 6. Verificación estática (10/10/2026, Local)

### 6.1 Estado de ambientes al momento de implementar
`main` == `origin/main` == `origin/staging` == **`96934c0`** (verificado con fetch). Árbol limpio antes de empezar. Rama de trabajo `feat/2.4-auth-loading` creada desde `96934c0`. **Sin push.**

### 6.2 Lint
- **Resultado: 5 problemas (2 errores + 3 warnings)** — idéntico al baseline de `HEAD` (preexistentes: errores en `useIngresos.js:39` y `GroupContext.jsx:17`; warnings en `ModoGastosFijos.jsx`, `HomeHeader.jsx`, `page.js`). **0 problemas nuevos.**
- Durante la implementación apareció 1 error lint nuevo (`react-hooks/set-state-in-effect` sobre el `setUser(null)` síncrono del catch en `AuthContext.jsx`) y **se corrigió** difeririéndolo con `queueMicrotask` + guard funcional (mismo comportamiento, sin setState síncrono en el body del effect).

### 6.3 Build
- **Compilación + generación estática: OK 9/9** (`/`, `/_not-found`, `/agregar`, `/gastos`, `/gastos-fijos`, `/home`, `/ingresos`, `/login`).
- **Nota de entorno:** este checkout **no tiene `.env.local`** (gitignored, ausente). Sin env vars, el build falla en el prerender de `/_not-found` con `auth/invalid-api-key` — **reproducido también sobre el baseline `96934c0` sin el cambio** (build control): es una limitación preexistente del entorno, **no causada por 2.4**. Para verificar la compilación completa se corrió el build con **env vars dummy solo en el proceso de shell** (sin crear archivos, sin modificar configuración); con eso, 9/9 rutas OK. La verificación runtime con datos reales queda **PENDIENTE** con el `.env.local` del proyecto.

## 7. Plan de pruebas (PENDIENTE — no ejecutadas en esta pasada)

| # | Escenario | Esperado | Entorno |
|---|---|---|---|
| 1 | Refresh en `/home` logueado | `LoadingScreen` → `/home`, sin pasar por `/login` | Local + Staging |
| 2 | No logueado → ruta protegida | Loading → `replace("/login")`, sin contenido privado | Local + Staging |
| 3 | Logueado abre `/login` | Loading → `replace("/home")`, sin parpadeo del form | Local + Staging |
| 4 | Login desde formulario | Login → `/home` sin bounce | **Cuenta real** (Staging) |
| 5 | Logout | → `/login`, sin blanco ni bucle | **Cuenta real** (Staging) |
| 6 | Resolución lenta (DevTools Slow/Offline breve) | Loading visible todo el rato; sin redirect prematura | Local |
| 7 | Error síncrono de suscripción | Revisión de código; resolución a `/login`, sin bloqueo | Local |
| 8 | Navegación entre rutas protegidas | Sin Loading intermedio tras resuelta la sesión | Local + Staging |
| 9 | Timeout vence y luego llega el user (delay artificial solo en harness, sin commitear) | Recuperación `null → User` → `/home` | Local |
| 10 | Strict Mode / doble mount (dev) | Un solo timer, sin error de setState tras unmount | Local (dev) |

Transversal: `build` 9/9 · `lint` 0 nuevos · **0 escrituras en Firestore**.

## 8. Criterios de aceptación de cierre

1. `useAuth()` expone `loading` booleano real; imposible `undefined`. ✅ (implementado, verificado en código)
2. Ninguna redirección durante `loading === true`; `LoadingScreen` visible. ⬜ (requiere runtime)
3. Escenarios 1–6, 8, 10 PASS (4–5 con cuenta real en Staging). ⬜
4. Ningún estado queda más de 8 s en Loading sin resolver (usuario o `/login`). ⬜ (runtime) / ✅ (diseño)
5. Consumidores `{ user }` sin cambios; `RouteGuard` intacto. ✅
6. Cerrada solo tras Local → `staging` → verificación del usuario → aprobación explícita → `main` (fast-forward) → verificación en Producción. ⬜

## 9. Exclusiones (confirmadas, sin cambios)

Timeouts de escritura Firestore · estado "Guardando…" · 2.5 (legacy fijos) · 2.6 (código muerto) · modelo de datos/reglas · login/home (los `router.push` propios quedan intactos) · refactor de autenticación más allá de `AuthContext.jsx`.

## 10. Próximos pasos (requieren autorización por separado)

1. Prueba runtime local con `.env.local` real (escenarios 1–3, 6–10).
2. Revisión funcional del usuario en Local.
3. Push a `staging` + verificación (Preview de Vercel) — **no hecho**.
4. Aprobación explícita → promoción a `main` (solo fast-forward) → verificación en Producción.
5. Cierre de 2.4 en `HANDOFF-ETAPA-2.md` y `ROADMAP.md` al verificarse en Producción.
