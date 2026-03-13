import SaleSchema from '../../models/SaleModel.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import mongoose from 'mongoose'

/**
 * 1️⃣ Producto más vendido en un mes
 * @param {string} month - MM (01–12)
 */
export async function getTopProductsByMonth(conn, month, year) {
  if (!month) throw new Error('Mes requerido')
  if (!conn) throw new Error('Conexión requerida')

  const SaleModel =
    conn.models.Sale || conn.model('Sale', SaleSchema)

  const monthInt = parseInt(month, 10)
  const pipeline = []

  pipeline.push({
    $addFields: {
      month: { $month: '$Fecha' },
      year: { $year: '$Fecha' }
    }
  })

  const matchStage = { month: monthInt }

  if (year) {
    matchStage.year = parseInt(year, 10)
  }

  pipeline.push({ $match: matchStage })

  pipeline.push(
    {
      $group: {
        _id: '$NombreArticulo',
        totalVendido: { $sum: '$Cantidad' },
        totalFacturado: { $sum: '$Total' }
      }
    },
    { $sort: { totalVendido: -1 } },
    { $limit: 10 }
  )

  return await SaleModel.aggregate(pipeline)
}
/**
 * 2️⃣ Productos a promocionar
 * Criterio:
 * - pocas ventas
 * - pero presentes en historial
 */
export async function getProductsToPromote(conn, month) {
  if (!conn) throw new Error('Conexión requerida')

  const SaleModel =
    conn.models.Sale || conn.model('Sale', SaleSchema)

  const pipeline = []

  // Si viene mes → filtramos
  if (month) {
    const monthInt = parseInt(month, 10)

    pipeline.push({
      $addFields: { month: { $month: '$Fecha' } }
    })

    pipeline.push({
      $match: { month: monthInt }
    })
  }

  pipeline.push(
    {
      $group: {
        _id: '$NombreArticulo',
        ventas: { $sum: '$Cantidad' },
        facturacion: { $sum: '$Total' }
      }
    },
    {
      $match: {
        ventas: { $lte: 5 }
      }
    },
    {
      $sort: {
        ventas: 1,
        facturacion: -1
      }
    },
    { $limit: 10 }
  )

  return await SaleModel.aggregate(pipeline)
}

/**
 * 3️⃣ Productos que se venden juntos
 * Basado en comprobantes compartidos
 */
export async function getBundledProducts(conn, month) {
  if (!conn) throw new Error('Conexión requerida')

  const SaleModel =
    conn.models.Sale || conn.model('Sale', SaleSchema)

  const pipeline = []

  // Filtro opcional por mes
  if (month) {
    const monthInt = parseInt(month, 10)

    pipeline.push(
      { $addFields: { month: { $month: '$Fecha' } } },
      { $match: { month: monthInt } }
    )
  }

  pipeline.push(
    {
      $group: {
        _id: '$Comprobante',
        productos: { $addToSet: '$NombreArticulo' }
      }
    },
    {
      $match: {
        'productos.1': { $exists: true }
      }
    },
    {
      $unwind: '$productos'
    },
    {
      $group: {
        _id: '$productos',
        vecesEnCombo: { $sum: 1 }
      }
    },
    {
      $sort: { vecesEnCombo: -1 }
    },
    {
      $limit: 10
    }
  )

  return await SaleModel.aggregate(pipeline)
}

/**
 * 4️⃣ Clientes a los que ofrecer un producto
 * Criterio:
 * - compraron ese producto
 * - baja frecuencia o alta inactividad
 */
export async function getClientsForProduct(conn, productName) {
  if (!conn) throw new Error('Conexión requerida')
  if (!productName || typeof productName !== 'string') {
    throw new Error('Producto requerido')
  }

  const SaleModel =
    conn.models.Sale || conn.model('Sale', SaleSchema)

  const ClientMetrics =
    conn.models.ClientMetrics ||
    conn.model('ClientMetrics', ClientMetricsModel.schema)

  // 1️⃣ Clientes que compraron el producto
  const clientsWhoBought = await SaleModel.aggregate([
    {
      $match: {
        NombreArticulo: {
          $regex: productName,
          $options: 'i'
        }
      }
    },
    {
      $group: {
        _id: '$Cliente'
      }
    }
  ])

  if (!clientsWhoBought.length) return []

  const clientIds = clientsWhoBought.map(c => c._id)

  // 2️⃣ Clientes con alta inactividad
  const clients = await ClientMetrics.find({
    _id: { $in: clientIds },
    diasSinComprar: { $gte: 60 }
  })
    .sort({ diasSinComprar: -1 })
    .limit(20)
    .lean()

  return clients
}

export async function listProductsByMonth(conn, month, year, limit = 20) {
  if (!conn) throw new Error('Conexión requerida')
  if (!month) throw new Error('Mes requerido')

  const SaleModel =
    conn.models.Sale || conn.model('Sale', SaleSchema)

  const monthInt = parseInt(month, 10)

  const pipeline = [
    {
      $addFields: {
        month: { $month: '$Fecha' },
        year: { $year: '$Fecha' }
      }
    },
    {
      $match: {
        month: monthInt,
        ...(year ? { year: parseInt(year, 10) } : {})
      }
    },
    {
      $group: {
        _id: {
          codigo: '$CodigoAlternativo1',
          nombre: '$NombreArticulo',
          clase: '$NombreClase'
        }
      }
    },
    {
      $limit: parseInt(limit, 10) || 20
    },
    {
      $project: {
        _id: 0,
        codigo: '$_id.codigo',
        nombre: '$_id.nombre',
        clase: '$_id.clase'
      }
    }
  ]

  return await SaleModel.aggregate(pipeline)
}