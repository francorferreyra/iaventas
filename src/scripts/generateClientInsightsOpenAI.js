import "dotenv/config";
import OpenAI from "openai";
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateInsights() {
  try {
    await connectMongo();

    const db = getMarketingConnection();

    const metricsCollection = db.collection("clients_metrics");
    const insightsCollection = db.collection("clients_ai_insights");

    const totalClients = await metricsCollection.countDocuments();

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

        const prompt = `
Analiza estos datos de cliente y genera insights comerciales.

Responde SOLO JSON válido sin texto extra.

Formato requerido:
{
  "risk_level": "LOW | MEDIUM | HIGH",
  "recommendations": ["string"],
  "summary": "string"
}

Datos cliente:
${JSON.stringify(client)}
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
          ]
        });

        let content = completion.choices[0].message.content;

        content = content
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

        let parsed;

        try {
          parsed = JSON.parse(content);
        } catch {
          console.log("⚠️ JSON inválido IA, se omite cliente:", client._id);
          continue;
        }

        // 🔥 UPSERT CORRECTO
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

      } catch (error) {
        console.log("❌ Error cliente:", client._id);
      }
    }

    console.log("🎯 Proceso finalizado");

  } catch (error) {
    console.error("❌ Error general:", error);
  }
}

generateInsights();
