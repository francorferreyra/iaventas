import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Chat genérico (cuando necesitás control total)
 */
export async function openaiChat(
  messages,
  {
    model = 'gpt-4o-mini',
    maxTokens = 300
  } = {}
) {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  })

  return response.choices[0].message.content
}

/**
 * Helper simple para preguntas directas
 * (ideal para classify, recommend, etc)
 */
export async function askGPT(
  prompt,
  options = {}
) {
  return openaiChat(
    [
      {
        role: 'system',
        content: 'Sos un asistente experto en marketing y ventas.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    options
  )
}