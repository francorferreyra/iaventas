import { askGPT } from './openaiChat.service.js'

export async function classifyClientsQuestion(query) {
  const prompt = `
Clasificá la siguiente pregunta en UNO de estos tipos:

- search_clients
- recommend_products
- campaign_idea
- general_advice

Respondé SOLO con el tipo.

Pregunta:
"${query}"
`

  const response = await askGPT(prompt)
  return response.trim()
}