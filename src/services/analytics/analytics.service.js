import SaleModel from '../../models/SaleModel.js'
import { ClientMetricsModel } from '../../models/ClientMetrics.model.js'
import mongoose from 'mongoose'

/**
 * 1️⃣ Producto más vendido en un mes
 * @param {string} month - MM (01–12)
 */
export async function getTopProductsByMonth(month) {
  if (!month) throw new Error('Mes requerido')

  const monthInt = parseInt(month, 10)

  const result = await SaleModel.aggregate([
    {
      $addFields: {
        month: { $month: '$Fecha' }
      }
    },
    {
      $match: { month: monthInt }
    },
    {
      $group: {
        _id: '$NombreArticulo',
        totalVendido: { $sum: '$Cantidad' },
        totalFacturado: { $sum: '$Total' }
      }
    },
    {
      $sort: { totalVendido: -1 }
    },
    {
      $limit: 10
    }
  ])

  return result
}

/**
 * 2️⃣ Productos a promocionar
 * Criterio:
 * - pocas ventas
 * - pero presentes en historial
 */
export async function getProductsToPromote() {
  const result = await SaleModel.aggregate([
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
    {
      $limit: 10
    }
  ])

  return result
}

/**
 * 3️⃣ Productos que se venden juntos
 * Basado en comprobantes compartidos
 */
export async function getBundledProducts() {
  const result = await SaleModel.aggregate([
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
  ])

  return result
}

/**
 * 4️⃣ Clientes a los que ofrecer un producto
 * Criterio:
 * - compraron ese producto
 * - baja frecuencia o alta inactividad
 */
export async function getClientsForProduct(productName) {
  if (!productName) throw new Error('Producto requerido')

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

  const clientIds = clientsWhoBought.map(c => c._id)

  const clients = await ClientMetrics.find({
    _id: { $in: clientIds },
    diasSinComprar: { $gte: 60 }
  })
    .sort({ diasSinComprar: -1 })
    .limit(20)
    .lean()

  return clients
}