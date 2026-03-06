import { askOpenAI } from "./OpenAIService.js"

export async function detectIntent(question) {

const systemPrompt = `
Sos un sistema que interpreta preguntas comerciales.

Debes devolver SIEMPRE un JSON válido con esta estructura:

{
  "domain": "sales | products | clients | analytics",
  "type": "INTENT_NAME",
  "params": {
    "month": number | null,
    "year": number | null,
    "product": string | null,
    "limit": number | null
  }
}

Tipos posibles:

TOP_PRODUCTS
LIST_PRODUCTS_BY_MONTH
PRODUCT_RECOMMENDATION
SALES_ANALYSIS
CLIENT_ANALYSIS
SALES_OPPORTUNITIES

Ejemplos:

Pregunta: "Que productos se vendieron mas"
Respuesta:
{
  "domain":"sales",
  "type":"TOP_PRODUCTS",
  "params":{"month":null,"year":null,"product":null,"limit":10}
}

Pregunta: "dime productos vendidos en febrero"
Respuesta:
{
  "domain":"sales",
  "type":"LIST_PRODUCTS_BY_MONTH",
  "params":{"month":2,"year":null,"product":null,"limit":null}
}
`

const response = await askOpenAI({
system: systemPrompt,
user: question,
maxTokens: 150
})

try {

const json = JSON.parse(response)

return json

} catch (err) {

console.log("Error parseando intent IA:", response)

return {
domain: "unknown",
type: "unknown",
params: {
month: null,
year: null,
product: null,
limit: null
}
}

}

}