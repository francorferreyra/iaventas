import { askOpenAI } from './OpenAIService.js'

export async function recommendProductsAI(conn, query) {

  const q = query.toLowerCase()

  let mode = 'general'

  if (q.includes('campaña') || q.includes('promoción')) {
    mode = 'campaign'
  }

  if (q.includes('artículo') || q.includes('producto') || q.includes('vender')) {
    mode = 'products'
  }

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

  if (!topProducts.length) {
    return {
      type: mode,
      message: 'No se encontraron productos para recomendar',
      products: []
    }
  }

  // 🔹 MODO PRODUCTOS
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

  // 🔹 MODO CAMPAÑA
  if (mode === 'campaign') {

    const campaignPrompt = `
Sos un experto en marketing B2B.

Productos más vendidos:
${topProducts.map(p => `- ${p.product.nombre}`).join('\n')}

Generá:
1) Nombre de campaña
2) Objetivo
3) Mensaje corto tipo WhatsApp
4) Llamado a la acción

Respondé SOLO en JSON:
{
  "titulo": string,
  "objetivo": string,
  "mensaje": string,
  "cta": string
}
`

    const response = await askOpenAI({
      system: 'Sos especialista en campañas comerciales.',
      user: campaignPrompt,
      maxTokens: 300
    })

    let campaignData

    try {
      campaignData = JSON.parse(response)
    } catch {
      campaignData = {
        titulo: 'Promo especial productos destacados',
        objetivo: 'Impulsar ventas de productos top',
        mensaje: 'Aprovechá nuestros productos más vendidos con beneficios exclusivos.',
        cta: 'Consultanos hoy mismo.'
      }
    }

    return {
      type: 'campaign_idea',
      campaign: campaignData,
      productosBase: topProducts.slice(0, 3).map(p => p.product.nombre)
    }
  }

  // 🔹 Fallback general
  return {
    type: 'recommend_products',
    message: 'Productos sugeridos',
    products: topProducts.map(p => ({
      id: p.product._id,
      nombre: p.product.nombre,
      totalVendidos: p.totalVendidos
    }))
  }
}