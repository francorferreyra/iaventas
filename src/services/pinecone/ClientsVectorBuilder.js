import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function buildClientVector(client) {

  const text = `
  Cliente ${client.raw.nombre}
  Segmento ${client.computed.segmentoAuto}
  Score recompra ${client.computed.scoreRecompra}
  Dias sin comprar ${client.raw.diasSinComprar}
  Insight ${client.insight?.summary ?? ""}
  `

  const embedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  })

  return embedding.data[0].embedding
}
