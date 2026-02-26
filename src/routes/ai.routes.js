import { Router } from 'express'
import { searchClients } from '../controllers/ai/ClientsAI.controller.js'
import { useMarketingConn } from '../middlewares/useMarketingConn.js'
import { askAIAnalytics } from '../controllers/ai/AIAnalytics.controller.js'

const router = Router()

// 🔹 Ya existente (NO se toca)
router.post('/clients/search', useMarketingConn, searchClients)
router.post('/analytics/ask', useMarketingConn, askAIAnalytics)

// 🔹 Nuevas rutas IA

export default router