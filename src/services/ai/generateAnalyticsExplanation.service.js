import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateAnalyticsExplanation(intent, data) {
  if (!data || !data.length) {
    return 'No se encontraron datos para esa consulta.'
  }

  const topProduct = data[0]

  const prompt = `
Eres un analista ejecutivo senior.

La consulta fue: ${intent.type}

El producto más vendido (ya ordenado correctamente) es:
- Nombre: ${topProduct._id}
- Cantidad vendida: ${topProduct.totalVendido}
- Facturación: ${topProduct.totalFacturado}

Genera un análisis ejecutivo claro y profesional.
Debe:
- Confirmar que es el más vendido del mes
- Mencionar unidades
- Mencionar facturación
- Dar una interpretación estratégica
- Ser breve y directo
`

  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [{ role: 'user', content: prompt }],
  })

  return response.choices[0].message.content
}