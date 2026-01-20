import { Router } from 'express'
import { getClients } from '../controllers/clients/ClientsRead.js'

const router = Router()

router.get('/', getClients)

export default router
