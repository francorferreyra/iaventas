import { askOpenAI } from './OpenAIService.js'

export async function classifyIntent(question) {

  const systemPrompt = `
Sos un clasificador de intención para un sistema de analítica y clientes.

NO respondas la pregunta.
NO inventes datos.
Respondé SOLO JSON válido.

Dominios posibles:
- analytics
- clients
- unknown

Tipos posibles:

Para analytics:
- TOP_PRODUCTS_BY_MONTH
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT

Para clients:
- search_clients
- recommend_products
- campaign_idea

Reglas:

Analytics:
- "qué producto se vendió más en X mes" → TOP_PRODUCTS_BY_MONTH
- "qué productos promocionar" → PRODUCTS_TO_PROMOTE
- "qué productos se venden juntos" → BUNDLE_PRODUCTS
- "a qué clientes ofrecer X producto" → CLIENTS_FOR_PRODUCT

Clients:
- Buscar clientes → search_clients
- Recomendar productos → recommend_products
- Idea de campaña → campaign_idea

Formato obligatorio:

{
  "domain": "analytics | clients | unknown",
  "type": "string",
  "params": {
    "month": "MM o null",
    "product": "string o null"
  }
}
`

  const response = await askOpenAI({
    system: systemPrompt,
    user: question
  })

  try {
    const parsed = JSON.parse(response)

    return {
      domain: parsed.domain || 'unknown',
      type: parsed.type || 'unknown',
      params: parsed.params || {}
    }

  } catch (error) {
    console.error('Error parseando intent IA:', response)

    return {
      domain: 'unknown',
      type: 'unknown',
      params: {}
    }
  }
}