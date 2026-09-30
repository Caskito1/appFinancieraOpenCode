// ============================================================================
// GATE READ-ONLY — Subetapa 2.3 (Ingresos: labels de bandas + filas + Otros)
// ============================================================================
//
// USO: Firebase Console → Cloud Shell → pegar este archivo completo y ejecutar
//      node gate-2.3.js
//
// READ-ONLY ESTRICTO: solo .get(). Sin escrituras, sin migraciones, sin
// addDoc/updateDoc/setDoc/deleteDoc/writeBatch.
//
// Imprime UNICAMENTE agregados: sin montos, sin UIDs, sin `detalle`.
//
// ANTES DE EJECUTAR: reemplazar PROJECT_ID por el del proyecto
// (clave NEXT_PUBLIC_FIREBASE_PROJECT_ID del .env.local del proyecto).
//
// Si PROJECT_ID se deja como "PROJECT_ID", el script NO hace nada y lo avisa,
// para no consultar por error el proyecto equivocado.
// ============================================================================

const { Firestore } = require("@google-cloud/firestore");

const PROJECT_ID = "PROJECT_ID"; // <-- REEMPLAZAR

// Ids canónicos que escribe la app (useModoIngreso.js:7-20).
const CANONICOS = ["laventolera", "laimbailable", "tapelao"];

// Ids "legacy" que aparecen en TIPO_LABEL (FilaIngreso.jsx:6-12) pero que
// la app NUNCA escribió. Si alguno aparece en datos reales, hay que parar.
const LEGACY = ["la_ventolera", "la_imbailable"];

(async () => {
  if (PROJECT_ID === "PROJECT_ID") {
    console.log(
      "\nABORTADO: reemplazar PROJECT_ID por el id real del proyecto.\n" +
        "No se ejecutó ninguna consulta.\n",
    );
    return;
  }

  const db = new Firestore({ projectId: PROJECT_ID });

  // ÚNICA operación de red de todo el script.
  const snap = await db.collection("ingresos").get();

  const docs = snap.docs.map((d) => d.data());

  const porTipo = {};
  const subtiposBanda = {};

  let otros = 0;
  let idsLegacy = 0;
  let subtipoEnNoBanda = 0;
  let sinDetalle = 0;
  let sinTipo = 0;
  let sinUsuario = 0;
  let montoInvalido = 0;

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
    if (!Number.isFinite(Number(d.monto))) montoInvalido += 1;
  }

  const subtiposDesconocidos = Object.keys(subtiposBanda).filter(
    (k) => !CANONICOS.includes(k) && k !== "(null)",
  );

  console.log(
    JSON.stringify(
      {
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
        montoInvalido,
      },
      null,
      2,
    ),
  );

  // ---- Lectura del resultado (no modifica nada) ----
  console.log("\n===== LECTURA DEL GATE =====");

  if (idsLegacy > 0) {
    console.log(
      `STOP: ${idsLegacy} documento(s) con id de subtipo LEGACY.\n` +
        "  -> NO implementar. Definir un mapa de aliases de LECTURA con el usuario.",
    );
  } else {
    console.log("PASS: idsLegacy = 0 -> el fix es 100% lado lectura, sin alias ni migración.");
  }

  if (subtiposDesconocidos.length === 0) {
    console.log("PASS: todos los subtipos de banda tienen label.");
  } else {
    console.log(
      `AVISO: subtipos de banda sin label -> ${JSON.stringify(subtiposDesconocidos)}\n` +
        "  -> No bloquea; se mostrarian crudo via el fallback.",
    );
  }

  console.log(
    otros > 0
      ? `INFO: hay ${otros} ingreso(s) tipo "otros" -> la seccion nueva tendra datos reales.`
      : 'INFO: no hay ingresos tipo "otros" -> la seccion nueva arranca vacia y colapsa.',
  );

  if (sinTipo > 0 || sinUsuario > 0) {
    console.log(
      `AVISO: sinTipo=${sinTipo} sinUsuario=${sinUsuario} -> documentos que la app no puede clasificar ni mostrar.`,
    );
  }
  if (subtipoEnNoBanda > 0) {
    console.log(
      `AVISO: subtipoEnNoBanda=${subtipoEnNoBanda} -> hay subtipo en tipos que no son banda.`,
    );
  }
  if (montoInvalido > 0) {
    console.log(`AVISO: montoInvalido=${montoInvalido} -> montos no numéricos.`);
  }

  console.log(`INFO: sinDetalle=${sinDetalle} -> filas que titulan "Ingreso".`);
  console.log("");
})();
