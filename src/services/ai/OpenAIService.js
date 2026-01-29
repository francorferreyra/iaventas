import 'dotenv/config'
import OpenAI from 'openai'
import openai from "./openaiClient.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini'


async function runPrompt({ system, user }) {
  const response = await openai.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })

  return response.output_text
}

export async function generateClientSummary(data) {
  return runPrompt({
    system: 'Sos un analista de marketing...',
    user: `Datos del cliente: ${JSON.stringify(data)}`,
  })
}

export async function generateClientAction(data) {
  return runPrompt({
    system: 'Sos un experto en retención...',
    user: `Datos del cliente: ${JSON.stringify(data)}`,
  })
}

export async function generateClientMessage(data) {
  return runPrompt({
    system: 'Sos especialista en comunicación...',
    user: `Datos del cliente: ${JSON.stringify(data)}`,
  })
}

export async function generateClientScore(client) {
  const prompt = `
Devolvé SOLO un número entero entre 0 y 100.
No agregues texto, símbolos ni explicaciones.

Evaluá la probabilidad de recompra del cliente considerando:
- Total facturado
- Cantidad de compras
- Días sin comprar
- Diversidad de rubros y marcas

Cliente:
Total facturado: ${client.totalFacturado}
Compras: ${client.compras}
Días sin comprar: ${client.diasSinComprar}
Rubros frecuentes: ${(client.rubrosFrecuentes || []).join(", ")}
Marcas frecuentes: ${(client.marcasFrecuentes || []).join(", ")}
`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const raw = response.output_text?.trim();
  const score = Number(raw);

  if (Number.isNaN(score)) return 0;

  return Math.min(100, Math.max(0, score));
}

export async function explainClientScore(client, score) {
  const prompt = `
Explicá brevemente (máx 2 frases) por qué este cliente tiene un score de recompra de ${score}.
Usá lenguaje claro y comercial.
NO repitas el número del score.

Datos del cliente:
Total facturado: ${client.totalFacturado}
Compras: ${client.compras}
Días sin comprar: ${client.diasSinComprar}
Rubros frecuentes: ${(client.rubrosFrecuentes || []).join(", ")}
Marcas frecuentes: ${(client.marcasFrecuentes || []).join(", ")}
`;

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  return response.output_text?.trim() || "";
}
