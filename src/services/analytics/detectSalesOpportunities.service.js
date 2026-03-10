export async function detectSalesOpportunities(conn) {

  const SaleCollection = conn.db.collection('sales')

  const topProducts = await SaleCollection.aggregate([

    {
      $group: {
        _id: "$Articulo",
        nombre: { $first: "$NombreArticulo" },
        totalVendidos: { $sum: "$Cantidad" },
        clientes: { $addToSet: "$Cliente" }
      }
    },

    {
      $project: {
        articulo: "$_id",
        nombre: 1,
        totalVendidos: 1,
        totalClientes: { $size: "$clientes" }
      }
    },

    { $sort: { totalVendidos: -1 } },

    { $limit: 20 }

  ]).toArray()

  const opportunities = []

  for (const p of topProducts) {

    if (p.totalVendidos > 20 && p.totalClientes < 10) {

      opportunities.push({
        type: "market_expansion",
        product: p.nombre,
        insight: `El producto ${p.nombre} tiene muchas ventas (${p.totalVendidos}) pero pocos clientes (${p.totalClientes}).`,
        recommendation: `Promocionar ${p.nombre} a nuevos clientes.`
      })

    }

  }

  return {
    type: "sales_opportunities",
    opportunities
  }

}