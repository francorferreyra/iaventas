export async function detectSalesOpportunities(conn) {

  const SaleModel = conn.model('Sale')

  // 1️⃣ Productos más vendidos
  const topProducts = await SaleModel.aggregate([

    { $unwind: '$products' },

    {
      $group: {
        _id: '$products.product',
        totalVendidos: { $sum: '$products.quantity' },
        clientes: { $addToSet: '$client' }
      }
    },

    {
      $project: {
        product: '$_id',
        totalVendidos: 1,
        totalClientes: { $size: '$clientes' }
      }
    },

    { $sort: { totalVendidos: -1 } },

    { $limit: 10 }

  ])

  // 2️⃣ Traer info de productos
  const ProductModel = conn.model('Product')

  const enriched = []

  for (const p of topProducts) {

    const product = await ProductModel.findById(p.product)

    if (!product) continue

    enriched.push({
      nombre: product.nombre,
      vendidos: p.totalVendidos,
      clientes: p.totalClientes
    })
  }

  // 3️⃣ Detectar oportunidades
  const opportunities = []

  for (const p of enriched) {

    if (p.vendidos > 50 && p.clientes < 10) {

      opportunities.push({
        type: 'market_expansion',
        product: p.nombre,
        insight: `El producto ${p.nombre} tiene muchas ventas pero pocos clientes.`,
        recommendation: `Promocionar ${p.nombre} a nuevos clientes.`
      })
    }

  }

  return {
    type: 'sales_opportunities',
    opportunities
  }

}