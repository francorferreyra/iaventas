import { askOpenAI } from './OpenAIService.js'

export async function classifyAnalyticsQuestion(question) {
  const systemPrompt = `
Sos un clasificador de preguntas de negocio.
NO respondas la pregunta.
NO inventes datos.
Solo devolvé JSON válido.

Tipos posibles:
- TOP_PRODUCTS_BY_MONTH
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT

Reglas:
- Si preguntan "qué producto se vendió más en X mes" → TOP_PRODUCTS_BY_MONTH
- Si preguntan "qué productos promocionar" → PRODUCTS_TO_PROMOTE
- Si preguntan "qué productos se venden juntos" → BUNDLE_PRODUCTS
- Si preguntan "a qué clientes ofrecer X producto" → CLIENTS_FOR_PRODUCT

Formato de salida (JSON PURO, sin texto):
{
  "type": "...",
  "month": "MM",
  "product": "string"
}
`

  const response = await askOpenAI({
    system: systemPrompt,
    user: question
  })

  try {
    return JSON.parse(response)
  } catch (error) {
    console.error('Error parseando clasificación IA:', response)
    return { type: 'UNKNOWN' }
  }
}