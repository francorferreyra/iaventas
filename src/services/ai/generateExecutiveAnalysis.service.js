import { askOpenAI } from './OpenAIService.js'

export async function generateExecutiveAnalysis({ intent, data }) {

  const systemPrompt = `
Sos un analista comercial ejecutivo.

Tu tarea es analizar datos comerciales y generar:

- summary (resumen ejecutivo corto)
- insight (interpretación comercial)
- recommendation (acción recomendada)

Respondé SOLO JSON válido con esta estructura:

{
  "summary": "string",
  "insight": "string",
  "recommendation": "string"
}
`

  const userPrompt = `
Intención: ${intent.type}

Datos comerciales:
${JSON.stringify(data).slice(0, 3000)}
`

  const response = await askOpenAI({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 200
  })

  try {

    let clean = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No se encontró JSON válido')
    }

    clean = clean.substring(firstBrace, lastBrace + 1)

    const parsed = JSON.parse(clean)

    return {
      summary: parsed.summary || null,
      insight: parsed.insight || null,
      recommendation: parsed.recommendation || null
    }

  } catch (err) {

    console.error('Error parseando análisis IA:', response)

    return {
      summary: "No se pudo generar análisis automático.",
      insight: null,
      recommendation: null
    }

  }
}