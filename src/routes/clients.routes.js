import { Router } from 'express'
import { getClients } from '../controllers/clients/ClientsRead.js'
import { getClientsStats } from '../controllers/clients/ClientsStats.js'
import { getPriorityClients } from '../controllers/clients/ClientsPriority.js'

const router = Router()

router.get('/', getClients)
router.get('/stats', getClientsStats)
router.get('/priority', getPriorityClients)

export default router
