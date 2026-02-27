import { classifyIntent } from '../../services/ai/classifyIntent.service.js'

import {
  getTopProductsByMonth,
  getProductsToPromote,
  getBundledProducts,
  getClientsForProduct
} from '../../services/analytics/analytics.service.js'

import { searchClientsAI } from '../../services/ai/searchClientsAI.service.js'
import { recommendProductsAI } from '../../services/ai/recommendProductsAI.service.js'

export const askAI = async (req, res) => {
  try {
    const { question, query } = req.body
    const input = question || query

    if (!input) {
      return res.status(400).json({ msg: 'Consulta requerida' })
    }

    // 1️⃣ Clasificación global
    const intent = await classifyIntent(input)
console.log('INTENT:', intent)
    let data = null

    // 2️⃣ Router interno por dominio
    if (intent.domain === 'analytics') {

      switch (intent.type) {

        case 'TOP_PRODUCTS_BY_MONTH':
          data = await getTopProductsByMonth(intent.params?.month)
          break

        case 'PRODUCTS_TO_PROMOTE':
          data = await getProductsToPromote()
          break

        case 'BUNDLE_PRODUCTS':
          data = await getBundledProducts()
          break

        case 'CLIENTS_FOR_PRODUCT':
          data = await getClientsForProduct(intent.params?.product)
          break

        default:
          return res.json({ msg: 'No entendí la consulta', intent })
      }

    } else if (intent.domain === 'clients') {

      switch (intent.type) {

        case 'search_clients':
          data = await searchClientsAI(req.conn, input)
          break

        case 'recommend_products':
        case 'campaign_idea':
          data = await recommendProductsAI(req.conn, input)
          break

        default:
          return res.json({ msg: 'No entendí la consulta', intent })
      }
    }

    return res.json({
      intent,
      data
    })

  } catch (error) {
    console.error('AI Unified Error:', error)
    return res.status(500).json({ msg: 'Error IA' })
  }
}