import { classifyAnalyticsQuestion } from '../../services/ai/classifyAnalyticsQuestion.service.js'
import {
  getTopProductsByMonth,
  getProductsToPromote,
  getBundledProducts,
  getClientsForProduct
} from '../../services/analytics/analytics.service.js'

export const askAIAnalytics = async (req, res) => {
  try {
    const { question } = req.body

    if (!question) {
      return res.status(400).json({ msg: 'Pregunta requerida' })
    }

    // 1️⃣ Clasificamos la pregunta
    const intent = await classifyAnalyticsQuestion(question)

    let data = null

    // 2️⃣ Ejecutamos lógica concreta
    switch (intent.type) {
      case 'TOP_PRODUCTS_BY_MONTH':
        data = await getTopProductsByMonth(intent.month)
        break

      case 'PRODUCTS_TO_PROMOTE':
        data = await getProductsToPromote()
        break

      case 'BUNDLE_PRODUCTS':
        data = await getBundledProducts()
        break

      case 'CLIENTS_FOR_PRODUCT':
        data = await getClientsForProduct(intent.product)
        break

      default:
        return res.json({
          msg: 'No entendí la consulta',
          intent
        })
    }

    res.json({
      intent,
      data
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ msg: 'Error IA Analytics' })
  }
}