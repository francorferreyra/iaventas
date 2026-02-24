import { Router } from 'express'
import { searchClients } from '../controllers/ai/ClientsAI.controller.js'
import { getAIQuestions } from '../controllers/ai/AIQuestions.controller.js'
import { processAIAnswers } from '../controllers/ai/AIAnswers.controller.js'
import { useMarketingConn } from '../middlewares/useMarketingConn.js'

const router = Router()

// 🔹 Ya existente (NO se toca)
router.post('/clients/search', useMarketingConn, searchClients)

// 🔹 Nuevas rutas IA
router.get('/questions', useMarketingConn, getAIQuestions)
router.post('/answers', useMarketingConn, processAIAnswers)

export default router