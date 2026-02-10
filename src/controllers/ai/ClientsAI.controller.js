import { searchClientsAI } from '../../services/ai/searchClientsAI.service.js'

export const searchClients = async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ msg: "Query requerida" })
    }

    const result = await searchClientsAI(req.conn, query)

    res.json(result)

  } catch (error) {
    console.error("AI Search Error:", error)
    res.status(500).json({ msg: "Error en búsqueda IA" })
  }
}

