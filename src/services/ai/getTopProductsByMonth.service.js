export async function getTopProductsByMonth(year, month) {
  const db = global.marketingDB

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 1)

  return db.collection('sales').aggregate([
    {
      $match: {
        Fecha: { $gte: from, $lt: to }
      }
    },
    {
      $group: {
        _id: '$NombreArticulo',
        unidadesVendidas: { $sum: '$Cantidad' },
        totalFacturado: { $sum: '$Total' }
      }
    },
    { $sort: { unidadesVendidas: -1 } },
    { $limit: 10 }
  ]).toArray()
}

export async function getProductsToPromote() {
  const db = global.marketingDB

  return db.collection('sales').aggregate([
    {
      $group: {
        _id: '$NombreArticulo',
        unidadesVendidas: { $sum: '$Cantidad' },
        totalFacturado: { $sum: '$Total' }
      }
    },
    {
      $match: {
        unidadesVendidas: { $lte: 5 }
      }
    },
    {
      $project: {
        producto: '$_id',
        unidadesVendidas: 1,
        totalFacturado: 1
      }
    },
    { $sort: { unidadesVendidas: 1 } },
    { $limit: 10 }
  ]).toArray()
}

export async function getBundledProducts() {
  const db = global.marketingDB

  return db.collection('sales').aggregate([
    {
      $group: {
        _id: {
          cliente: '$Cliente',
          fecha: '$Fecha'
        },
        productos: { $addToSet: '$NombreArticulo' }
      }
    },
    {
      $match: {
        'productos.1': { $exists: true }
      }
    },
    { $unwind: '$productos' },
    {
      $group: {
        _id: '$productos',
        vecesEnCombo: { $sum: 1 }
      }
    },
    { $sort: { vecesEnCombo: -1 } },
    { $limit: 10 }
  ]).toArray()
}

export async function getClientsForProduct(productoObjetivo) {
  const db = global.marketingDB

  return db.collection('sales').aggregate([
    // 1️⃣ Facturas que NO contienen el producto objetivo
    {
      $group: {
        _id: '$Comprobante',
        cliente: { $first: '$Cliente' },
        nombreCliente: { $first: '$NombreCliente' },
        productos: { $addToSet: '$NombreArticulo' },
        rubros: { $addToSet: '$NombreRubro' }
      }
    },

    // 2️⃣ Excluir facturas donde esté el producto objetivo
    {
      $match: {
        productos: { $ne: productoObjetivo }
      }
    },

    // 3️⃣ Agrupar por cliente
    {
      $group: {
        _id: '$cliente',
        nombreCliente: { $first: '$nombreCliente' },
        rubrosComprados: { $addToSet: '$rubros' },
        comprasAnalizadas: { $sum: 1 }
      }
    },

    // 4️⃣ Ordenar por actividad
    {
      $sort: { comprasAnalizadas: -1 }
    },

    { $limit: 20 }
  ]).toArray()
}