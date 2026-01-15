import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  await connectMongo();
  const db = getMarketingConnection();
  const collection = db.collection("clients_ai_insights");

  const clients = await collection
    .find({ resumenIA: { $exists: false } })
    .limit(5) // ⛔ NO más de 5 por corrida
    .toArray();

  for (const c of clients) {
    const prompt = `
Respondé SOLO JSON válido, sin texto extra.

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

    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      const json = JSON.parse(raw.replace(/```json|```/g, ""));

      await collection.updateOne(
        { _id: c._id },
        { $set: { ...json, generadoEl: new Date() } }
      );

      console.log(`✔ Gemini insight → ${c.nombre}`);
      await sleep(30_000); // 🔒 obligatorio

    } catch (err) {
      console.error(`❌ Error con ${c.nombre}:`, err.message);
      await sleep(45_000);
    }
  }

  process.exit(0);
}

run();
