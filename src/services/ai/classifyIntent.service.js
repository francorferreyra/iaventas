import { askOpenAI } from './OpenAIService.js'

export async function classifyIntent(question) {

  const systemPrompt = `
Sos un clasificador de intención para un sistema de analítica y clientes.

NO respondas la pregunta.
NO expliques nada.
Respondé SOLO JSON válido.

Dominios:
- analytics
- clients
- unknown

Tipos:

Analytics:
- TOP_PRODUCTS_BY_MONTH
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT

Clients:
- search_clients
- recommend_products
- campaign_idea

Reglas de clasificación:

Si la pregunta habla de:
- producto más vendido en un mes → TOP_PRODUCTS_BY_MONTH
- promocionar, publicitar, recomendar producto, impulsar ventas → PRODUCTS_TO_PROMOTE
- productos que se venden juntos → BUNDLE_PRODUCTS
- clientes para ofrecer un producto → CLIENTS_FOR_PRODUCT

Si la pregunta habla de:
- buscar clientes → search_clients
- recomendar productos a clientes → recommend_products
- ideas de campaña → campaign_idea

Si no coincide con nada → unknown.

Si se menciona un mes (enero a diciembre),
extraerlo como:
"01" a "12".

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