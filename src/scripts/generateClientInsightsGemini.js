import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";

/* ==========================
   Gemini
========================== */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash", // modelo válido actual
});

/* ==========================
   Utils
========================== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ==========================
   Script
========================== */
async function run() {
  await connectMongo();
  const db = getMarketingConnection();
  const collection = db.collection("clients_ai_insights");

  console.log("🚀 Buscando clientes pendientes...");

  const clients = await collection
    .find({
      $and: [
        {
          $or: [
            { resumenIA: { $exists: false } },
            { resumenIA: null },
            { resumenIA: "" },
          ],
        },
        { procesandoIA: { $ne: true } },
      ],
    })
    .sort({ _id: 1 })
    .limit(5) // ⛔ máximo 5 por corrida
    .toArray();

  if (!clients.length) {
    console.log("✅ No hay clientes pendientes");
    process.exit(0);
  }

  for (const c of clients) {
    try {
      /* 🔒 Bloqueo inmediato */
      await collection.updateOne(
        { _id: c._id },
        { $set: { procesandoIA: true } }
      );

      const prompt = `
Respondé SOLO JSON válido. No agregues texto ni explicaciones.

{
  "resumen": "string",
  "accion": "string",
  "mensaje": "string",
  "scoreRecompra": number
}

Cliente:
Nombre: ${c.nombre}
Segmento: ${c.segmento}
Total facturado: ${c.totalFacturado}
Compras: ${c.compras}
Días sin comprar: ${c.diasSinComprar}
Rubros frecuentes: ${(c.rubrosFrecuentes || []).join(", ")}
Marcas frecuentes: ${(c.marcasFrecuentes || []).join(", ")}
`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      const json = JSON.parse(raw.replace(/```json|```/g, ""));

      /* 💾 Guardar resultado */
      await collection.updateOne(
        { _id: c._id },
        {
          $set: {
            resumenIA: json.resumen,
            accion: json.accion,
            mensaje: json.mensaje,
            scoreRecompra: json.scoreRecompra,
            generadoEl: new Date(),
          },
          $unset: { procesandoIA: "" },
        }
      );

      console.log(`✔ Gemini insight → ${c.nombre}`);

      /* ⏳ Pausa obligatoria (cuota free) */
      await sleep(30_000);
    } catch (err) {
      console.error(`❌ Error con ${c.nombre}:`, err.message);

      /* 🔓 Liberar bloqueo en error */
      await collection.updateOne(
        { _id: c._id },
        { $unset: { procesandoIA: "" } }
      );

      await sleep(45_000);
    }
  }

  console.log("🏁 Corrida finalizada");
  process.exit(0);
}

run();
