import "dotenv/config";
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";

import {
  generateClientSummary,
  generateClientAction,
  generateClientMessage,
  generateClientScore,
} from "../services/ai/OpenAIService.js";

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
    .limit(5)
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

      const payload = {
        nombre: c.nombre,
        segmento: c.segmento,
        totalFacturado: c.totalFacturado,
        compras: c.compras,
        diasSinComprar: c.diasSinComprar,
        rubrosFrecuentes: c.rubrosFrecuentes || [],
        marcasFrecuentes: c.marcasFrecuentes || [],
      };

      /* 🤖 OpenAI */
      const resumenIA = await generateClientSummary(payload);
      const accion = await generateClientAction(payload);
      const mensaje = await generateClientMessage(payload);
      const scoreRecompra = await generateClientScore(payload);

      /* 💾 Guardar resultado */
      await collection.updateOne(
  { _id: c._id },
  {
    $set: {
      resumenIA,
      accion,
      mensaje,
      scoreRecompra,
      generadoEl: new Date(),
    },
    $unset: { procesandoIA: "" },
  }
);

      console.log(`✔ OpenAI insight → ${c.nombre}`);

      await sleep(10_000); // ⬅️ OpenAI permite menos pausa
    } catch (err) {
      console.error(`❌ Error con ${c.nombre}:`, err.message);

      await collection.updateOne(
        { _id: c._id },
        { $unset: { procesandoIA: "" } }
      );

      await sleep(20_000);
    }
  }

  console.log("🏁 Corrida finalizada");
  process.exit(0);
}

run();
