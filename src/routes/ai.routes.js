import { Router } from 'express'
import { searchClients } from '../controllers/ai/ClientsAI.controller.js'
import { useMarketingConn } from '../middlewares/useMarketingConn.js'

const router = Router()

router.post('/clients/search', useMarketingConn, searchClients)

export default router
