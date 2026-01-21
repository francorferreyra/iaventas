import { Router } from 'express'
import { getClients } from '../controllers/clients/ClientsRead.js'
import { getClientsStats } from '../controllers/clients/ClientsStats.js'

const router = Router()

//GET
router.get('/', getClients)
router.get('/stats', getClientsStats)

export default router
