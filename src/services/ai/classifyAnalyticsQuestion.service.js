import { openaiChat } from './openaiChat.service.js'

export async function classifyAnalyticsQuestion(question) {
  const prompt = `
Clasificá la pregunta en uno de estos tipos:

- TOP_PRODUCTS_BY_MONTH (requiere month)
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT (requiere product)

Respondé SOLO JSON.

Pregunta: "${question}"

Ejemplo:
{
  "type": "TOP_PRODUCTS_BY_MONTH",
  "month": "enero"
}
`

  const response = await openaiChat([
    { role: 'user', content: prompt }
  ])

  return JSON.parse(response)
}