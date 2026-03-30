import { askOpenAI } from './OpenAIService.js'

export async function classifyIntent(question, history = []) {

  const systemPrompt = `
Sos un clasificador de intención para un sistema de analítica y clientes.

Tu única tarea es:
1) Clasificar la intención
2) Extraer parámetros

Respondé SOLO JSON válido.

-------------------------
DOMINIOS
-------------------------
- analytics
- clients
- unknown

-------------------------
TIPOS
-------------------------

Analytics:
- TOP_PRODUCTS_BY_MONTH
- PRODUCTS_TO_PROMOTE
- BUNDLE_PRODUCTS
- CLIENTS_FOR_PRODUCT
- LIST_PRODUCTS_BY_MONTH
- SALES_OPPORTUNITIES

Clients:
- search_clients
- recommend_products
- campaign_idea

-------------------------
REGLAS DE CLASIFICACIÓN
-------------------------

Analytics:

- Si la pregunta menciona:
  "producto más vendido", "productos más vendidos",
  "ranking", "top", "los que más se venden"
  (aunque diga "listado" o "listar")
  → TOP_PRODUCTS_BY_MONTH

- Si la pregunta pide listar productos vendidos en un mes
  y NO menciona ranking ni "más vendidos"
  → LIST_PRODUCTS_BY_MONTH

- Si habla de promocionar, impulsar o mejorar ventas
  → PRODUCTS_TO_PROMOTE

- Si habla de productos que se venden juntos o combos
  → BUNDLE_PRODUCTS

- Si habla de clientes para ofrecer un producto
  → CLIENTS_FOR_PRODUCT

- Si habla de oportunidades de venta
  → SALES_OPPORTUNITIES

Clients:

- Buscar clientes → search_clients
- Recomendar productos → recommend_products
- Ideas de campaña → campaign_idea

Si no coincide → unknown

-------------------------
EXTRACCIÓN DE PARÁMETROS
-------------------------

- Mes → "01" a "12"
  (enero=01, febrero=02, marzo=03, etc.)

- Año → "YYYY"

- Número de resultados → "limit"

- Producto → "product"

- Clase:
  Si aparece un nombre propio que NO es un producto,
  asumir que es clase/marca/proveedor.

  Ejemplos:
  "Nelso Ferreyra S.R.L"
  "Perkins"
  "Castellano"

  → devolver en "clase"

Si no existe → null

-------------------------
FORMATO
-------------------------

{
  "domain": "analytics | clients | unknown",
  "type": "string",
  "params": {
    "month": "MM o null",
    "year": "YYYY o null",
    "product": "string o null",
    "clase": "string o null",
    "limit": number o null
  }
}

-------------------------
EJEMPLOS
-------------------------

Input: "dame los 10 productos más vendidos de marzo"
Output:
{
  "domain": "analytics",
  "type": "TOP_PRODUCTS_BY_MONTH",
  "params": {
    "month": "03",
    "year": null,
    "product": null,
    "clase": null,
    "limit": 10
  }
}

Input: "dame un listado de los productos más vendidos de marzo"
Output:
{
  "domain": "analytics",
  "type": "TOP_PRODUCTS_BY_MONTH",
  "params": {
    "month": "03",
    "year": null,
    "product": null,
    "clase": null,
    "limit": null
  }
}

Input: "dime los productos más vendidos de nelso ferreyra s.r.l"
Output:
{
  "domain": "analytics",
  "type": "TOP_PRODUCTS_BY_MONTH",
  "params": {
    "month": null,
    "year": null,
    "product": null,
    "clase": "NELSO FERREYRA S.R.L",
    "limit": null
  }
}

Input: "listame productos de marzo"
Output:
{
  "domain": "analytics",
  "type": "LIST_PRODUCTS_BY_MONTH",
  "params": {
    "month": "03",
    "year": null,
    "product": null,
    "clase": null,
    "limit": null
  }
}
`

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...history,
    {
      role: "user",
      content: question
    }
  ]

  const response = await askOpenAI({
    messages
  })

  console.log("Respuesta IA RAW:", response)
console.log("Tipo:", typeof response)

  try {

    // limpiar markdown
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
      domain: parsed.domain || 'unknown',
      type: parsed.type || 'unknown',
      params: {
        month: parsed.params?.month || null,
        year: parsed.params?.year || null,
        product: parsed.params?.product || null,
        clase: parsed.params?.clase || null,
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
        clase: null,
        limit: null
      }
    }
  }
}