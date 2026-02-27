import { Router } from 'express'
import { askAI } from '../controllers/ai/AIController.js'
import { useMarketingConn } from '../middlewares/useMarketingConn.js'

const router = Router()

// 🔹 Ruta unificada
router.post('/ask', useMarketingConn, askAI)

export default router