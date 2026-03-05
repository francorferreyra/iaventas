import { askOpenAI } from './OpenAIService.js'

export async function classifyIntent(question) {

  const systemPrompt = `
Sos un clasificador de intención para un sistema de analítica y clientes.

Tu única tarea es clasificar la intención y extraer parámetros.
NO respondas la pregunta.
NO expliques nada.
NO agregues texto adicional.
Respondé SOLO JSON válido.

Dominios posibles:
- analytics
- clients
- unknown

Tipos posibles:

Analytics:
- TOP_PRODUCTS_BY_MONTH
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT
- LIST_PRODUCTS_BY_MONTH

Clients:
- search_clients
- recommend_products
- campaign_idea

-------------------------
REGLAS DE CLASIFICACIÓN
-------------------------

Analytics:

- Si la pregunta pide el producto más vendido en un mes → TOP_PRODUCTS_BY_MONTH

- Si habla de promocionar, impulsar, recomendar o mejorar ventas → PRODUCTS_TO_PROMOTE

- Si habla de productos que se venden juntos o combos → BUNDLE_PRODUCTS

- Si habla de clientes para ofrecer un producto específico → CLIENTS_FOR_PRODUCT

- Si la pregunta pide listar, mostrar, dar o mencionar productos vendidos en un mes,
  aunque incluya una cantidad (ej: "dime 10 productos que se vendieron en enero"),
  clasificar como → LIST_PRODUCTS_BY_MONTH


Clients:

- Si habla de buscar clientes → search_clients
- Si habla de recomendar productos a clientes → recommend_products
- Si pide ideas de campaña → campaign_idea


Si no coincide claramente con ninguna regla → unknown.


-------------------------
EXTRACCIÓN DE PARÁMETROS
-------------------------

- Si se menciona un mes (enero a diciembre),
  devolverlo en formato "01" a "12".

  Enero = "01"
  Febrero = "02"
  Marzo = "03"
  Abril = "04"
  Mayo = "05"
  Junio = "06"
  Julio = "07"
  Agosto = "08"
  Septiembre = "09"
  Octubre = "10"
  Noviembre = "11"
  Diciembre = "12"

  Reconocer meses aunque estén en mayúscula o minúscula.

- Si se menciona un año (ej: 2023, 2024),
  devolverlo como "YYYY".

- Si se menciona un número asociado a cantidad de productos (ej: 5, 10, 20),
  devolverlo como "limit".

Si un parámetro no existe → null.


-------------------------
FORMATO OBLIGATORIO
-------------------------

{
  "domain": "analytics | clients | unknown",
  "type": "string",
  "params": {
    "month": "MM o null",
    "year": "YYYY o null",
    "product": "string o null",
    "limit": number o null
  }
}
`

  const response = await askOpenAI({
    system: systemPrompt,
    user: question
  })

  try {
    // 🔥 1️⃣ Limpiar markdown si viene ```json
    let clean = response
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    // 🔥 2️⃣ Extraer solo el JSON válido
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No se encontró JSON válido')
    }

    clean = clean.substring(firstBrace, lastBrace + 1)

    const parsed = JSON.parse(clean)

    return {
      domain: parsed.domain || 'unknown',
      type: parsed.type || 'unknown',
      params: {
        month: parsed.params?.month || null,
        year: parsed.params?.year || null,
        product: parsed.params?.product || null,
        limit: parsed.params?.limit || null
      }
    }

  } catch (error) {
    console.error('Error parseando intent IA:', response)

    return {
      domain: 'unknown',
      type: 'unknown',
      params: {
        month: null,
        year: null,
        product: null,
        limit: null
      }
    }
  }
}