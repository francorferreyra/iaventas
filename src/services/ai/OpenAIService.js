import 'dotenv/config'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini'

/* ==========================
   Core
========================== */

export async function askOpenAI({ system, user }) {
  const response = await openai.responses.create({
    model: MODEL,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.4,
    max_output_tokens: 300,
  })

  return response.output_text?.trim() || ''
}

/* ==========================
   Business helpers
========================== */

export async function generateClientSummary(data) {
  return askOpenAI({
    system: 'Sos un analista senior de marketing y comportamiento de clientes.',
    user: `
Generá un resumen claro y breve del cliente.
Datos:
${JSON.stringify(data, null, 2)}
`,
  })
}

export async function generateClientAction(data) {
  return askOpenAI({
    system: 'Sos un experto en retención y activación de clientes.',
    user: `
Sugerí UNA acción concreta para este cliente.
Datos:
${JSON.stringify(data, null, 2)}
`,
  })
}

export async function generateClientMessage(data) {
  return askOpenAI({
    system: 'Sos especialista en comunicación comercial.',
    user: `
Escribí un mensaje corto y listo para enviar al cliente.
Datos:
${JSON.stringify(data, null, 2)}
`,
  })
}

export async function generateClientScore(data) {
  const result = await askOpenAI({
    system:
      'Sos un analista experto en modelos de recompra y scoring de clientes.',
    user: `
Asigná un score de probabilidad de recompra ENTRE 0 y 1.
Respondé SOLO un número decimal (ej: 0.72).
Datos del cliente:
${JSON.stringify(data, null, 2)}
`,
  })

  const parsed = parseFloat(
    String(result).replace(',', '.')
  )

  if (Number.isNaN(parsed)) return 0

  return Math.max(0, Math.min(1, parsed))
}

export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })

  return response.data[0].embedding
}
