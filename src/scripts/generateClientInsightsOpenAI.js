import "dotenv/config";
import OpenAI from "openai";
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateInsights() {
  try {

    await connectMongo();
    const db = getMarketingConnection();

    const metricsCollection = db.collection("clients_metrics");
    const insightsCollection = db.collection("clients_ai_insights");

    const clients = await metricsCollection.aggregate([
      {
        $lookup: {
          from: "clients_ai_insights",
          localField: "_id",
          foreignField: "_id",
          as: "ai"
        }
      },
      {
        $match: { ai: { $size: 0 } }
      },
      { $limit: 50 }
    ]).toArray();

    console.log("👀 Clientes encontrados sin IA:", clients.length);

    if (!clients.length) {
      console.log("✅ No hay clientes pendientes");
      return;
    }

    for (const client of clients) {

      try {

        // ⭐ Reducimos tokens enviando solo lo necesario
        const cleanClient = {
          cliente: client._id,
          nombre: client.nombre,
          segmento: client.segmento,
          totalFacturado: client.totalFacturado,
          compras: client.compras,
          diasSinComprar: client.diasSinComprar,
          scoreRecompra: client.scoreRecompra
        };

        const prompt = `
Analiza estos datos de cliente y genera insights comerciales B2B.

Responde SOLO JSON válido sin texto extra.

Formato requerido:
{
  "risk_level": "LOW | MEDIUM | HIGH",
  "recommendations": ["string"],
  "summary": "string"
}

Datos cliente:
${JSON.stringify(cleanClient)}
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "Sos un analista experto en marketing B2B."
            },
            {
              role: "user",
              content: prompt
            }
          ],
        });

        let content = completion.choices?.[0]?.message?.content;

        if (!content) {
          console.log("⚠️ IA devolvió vacío →", client._id);
          continue;
        }

        // 🔥 Limpieza JSON
        content = content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        let parsed;

        try {
          parsed = JSON.parse(content);
        } catch {
          console.log("⚠️ JSON inválido IA →", client._id);
          continue;
        }

        await insightsCollection.updateOne(
          { _id: client._id },
          {
            $set: {
              resumenIA: parsed.summary,

              accionIA: parsed.recommendations?.join("\n• "),

              mensajeIA: `Hola ${client.nombre || "cliente"}, queremos ayudarte a optimizar tus compras y ofrecerte beneficios personalizados.`,

              accionSugerida: parsed.risk_level,

              scoreRecompra: client.scoreRecompra || 0,
              prioridad: client.prioridad || "Media",

              generadoEl: new Date()
            }
          },
          { upsert: true }
        );

        console.log("✅ Insight generado →", client._id);

        // ⭐ Anti rate limit
        await delay(500);

      } catch (error) {
        console.log("❌ Error generando insight →", client._id);
        console.log(error.message || error);
      }

    }

    console.log("🎯 Proceso finalizado");

  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

generateInsights();
