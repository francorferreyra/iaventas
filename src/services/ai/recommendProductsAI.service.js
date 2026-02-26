// src/services/ai/recommendProductsAI.service.js
import { askOpenAI } from '../ai/OpenAIService.js'
/**
 * Recomendación de productos / campañas
 * @param {Object} conn conexión a la DB
 * @param {String} query pregunta del usuario
 */
export async function recommendProductsAI(conn, query) {
  // 1️⃣ Detectar tipo de recomendación
  const q = query.toLowerCase()

  let mode = 'general'

  if (q.includes('campaña') || q.includes('promoción')) {
    mode = 'campaign'
  }

  if (q.includes('artículo') || q.includes('producto') || q.includes('vender')) {
    mode = 'products'
  }

  // 2️⃣ Buscar productos más vendidos (ejemplo simple)
  const ProductModel = conn.model('Product')
  const SaleModel = conn.model('Sale')

  const topProducts = await SaleModel.aggregate([
    { $unwind: '$products' },
    {
      $group: {
        _id: '$products.product',
        totalVendidos: { $sum: '$products.quantity' }
      }
    },
    { $sort: { totalVendidos: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ])

  // 3️⃣ Respuesta estructurada
  if (mode === 'products') {
    return {
      type: 'recommend_products',
      message: 'Productos recomendados para impulsar ventas',
      products: topProducts.map(p => ({
        id: p.product._id,
        nombre: p.product.nombre,
        totalVendidos: p.totalVendidos
      }))
    }
  }

  if (mode === 'campaign') {
    return {
      type: 'campaign_idea',
      message: 'Idea de campaña sugerida',
      campaign: {
        titulo: 'Promo clientes activos',
        objetivo: 'Aumentar recompra',
        productosSugeridos: topProducts.slice(0, 3).map(p => p.product.nombre),
        mensaje:
          'Aprovechá un descuento exclusivo por tiempo limitado en nuestros productos más vendidos.'
      }
    }
  }

  // 4️⃣ Fallback
// 🔹 Generar mensaje comercial con IA

const messagePrompt = `
Sos un experto en marketing y ventas B2B.

Producto recomendado: ${selected.product.nombre}
Motivo de recomendación: ${parsed.reason}

Generá:

1) Mensaje corto tipo WhatsApp (persuasivo y directo)
2) Versión más formal tipo email
3) Llamado a la acción claro

Respondé SOLO en JSON con esta estructura:

{
  "whatsapp": string,
  "email": string,
  "cta": string
}
`

const messageResponse = await askOpenAI(messagePrompt, { maxTokens: 300 })

let messageParsed
try {
  messageParsed = JSON.parse(messageResponse)
} catch (e) {
  messageParsed = {
    whatsapp: "Consultanos por este producto destacado.",
    email: "Tenemos una recomendación especial para tu empresa.",
    cta: "Contactanos hoy mismo."
  }
}

return {
  type: mode === 'campaign'
    ? 'campaign_recommendation'
    : 'product_recommendation',

  product: {
    id: selected.product._id,
    nombre: selected.product.nombre,
    totalVendidos: selected.totalVendidos
  },

  reason: parsed.reason,

  marketing: {
    whatsapp: messageParsed.whatsapp,
    email: messageParsed.email,
    cta: messageParsed.cta
  }
}
}