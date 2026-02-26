import { askOpenAI } from '../ai/OpenAIService.js'

export async function classifyClientsQuestion(query) {
  const prompt = `
Clasificá la intención de esta pregunta en una sola palabra:

- search_clients
- recommend_products
- campaign_idea

Pregunta: "${query}"

Respondé SOLO con la categoría.
`

  const result = await askOpenAI([
    { role: 'user', content: prompt }
  ])

  return result.trim().toLowerCase()
}