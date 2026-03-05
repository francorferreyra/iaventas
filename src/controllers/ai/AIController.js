import { classifyIntent } from '../../services/ai/classifyIntent.service.js'
import { generateAnalyticsExplanation } from '../../services/ai/generateAnalyticsExplanation.service.js'

import {
  getTopProductsByMonth,
  getProductsToPromote,
  getBundledProducts,
  getClientsForProduct,
  listProductsByMonth
} from '../../services/analytics/analytics.service.js'

import { searchClientsAI } from '../../services/ai/searchClientsAI.service.js'
import { recommendProductsAI } from '../../services/ai/recommendProductsAI.service.js'
import { generateExecutiveAnalysis } from '../../services/ai/generateExecutiveAnalysis.service.js'


export const askAI = async (req, res) => {

  try {

    const { question, query } = req.body
    const input = question || query

    if (!input) {
      return res.status(400).json({ msg: 'Consulta requerida' })
    }

    // 🧠 1️⃣ Detectar intención
    const intent = await classifyIntent(input)

    console.log('Intent detectado:', intent)

    let data = null

    // =============================
    // 📊 ANALYTICS DOMAIN
    // =============================

    if (intent.domain === 'analytics') {

      switch (intent.type) {

        case 'TOP_PRODUCTS_BY_MONTH':

          data = await getTopProductsByMonth(
            req.conn,
            intent.params?.month,
            intent.params?.year
          )

          break


        case 'PRODUCTS_TO_PROMOTE':

          data = await getProductsToPromote(
            req.conn,
            intent.params?.month
          )

          break


        case 'BUNDLE_PRODUCTS':

          data = await getBundledProducts(
            req.conn,
            intent.params?.month
          )

          break


        case 'CLIENTS_FOR_PRODUCT':

          data = await getClientsForProduct(
            req.conn,
            intent.params?.product
          )

          break


        case 'LIST_PRODUCTS_BY_MONTH':

          data = await listProductsByMonth(
            req.conn,
            intent.params?.month,
            intent.params?.year,
            intent.params?.limit || 20
          )

          break


        default:

          return res.json({
            msg: 'No entendí la consulta',
            intent
          })

      }

    }

    // =============================
    // 👥 CLIENT DOMAIN
    // =============================

    else if (intent.domain === 'clients') {

      switch (intent.type) {

        case 'search_clients':

          data = await searchClientsAI(req.conn, input)

          break


        case 'recommend_products':

          data = await recommendProductsAI(req.conn, input)

          break


        case 'campaign_idea':

          data = await recommendProductsAI(req.conn, input)

          break


        default:

          return res.json({
            msg: 'No entendí la consulta',
            intent
          })

      }

    }


    // =============================
    // 🧠 ANALISIS EJECUTIVO IA
    // =============================

    let analysis = null

    if (intent.domain === 'analytics' && data) {

      analysis = await generateExecutiveAnalysis({
        intent,
        data
      })

    }


    // =============================
    // 📤 RESPUESTA FINAL
    // =============================

    return res.json({

      intent,
      data,
      analysis

    })


  } catch (error) {

    console.error('AI Unified Error:', error)

    return res.status(500).json({
      msg: 'Error IA'
    })

  }

}