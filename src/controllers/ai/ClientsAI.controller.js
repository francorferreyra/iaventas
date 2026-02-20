import { classifyClientsQuestion } from '../../services/ai/classifyClientsQuestion.service.js'
import { searchClientsAI } from '../../services/ai/searchClientsAI.service.js'
import { recommendProductsAI } from '../../services/ai/recommendProductsAI.service.js'

export const searchClients = async (req, res) => {
  try {
    const { query } = req.body
    if (!query) return res.status(400).json({ msg: "Query requerida" })

    const intent = await classifyClientsQuestion(query)

    if (intent === 'search_clients') {
      const clients = await searchClientsAI(req.conn, query)
      return res.json({ type: 'clients', data: clients })
    }

    if (intent === 'recommend_products' || intent === 'campaign_idea') {
      const recommendation = await recommendProductsAI(req.conn, query)
      return res.json({ type: 'recommendation', data: recommendation })
    }

    res.json({ type: 'unknown', msg: 'No se pudo interpretar la consulta' })

  } catch (error) {
    console.error("AI Search Error:", error)
    res.status(500).json({ msg: "Error en búsqueda IA" })
  }
}