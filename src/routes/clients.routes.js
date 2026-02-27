import { Router } from 'express'
import {getClientsList,getClientsDashboard, getTopClients, getClientsActions, getClientsActionsMetrics, getClientsActionsSegmentMetrics, getClientsActionsScoreMetrics, getClientsMetrics } from '../controllers/clients/clients.controller.js'  
import { useMarketingConn } from '../middlewares/useMarketingConn.js'

const router = Router()

router.get('/list',useMarketingConn, getClientsList)
router.get('/dashboard',useMarketingConn, getClientsDashboard)
// router.get('/top', getTopClients)
router.get('/riesgo',useMarketingConn, getTopClients)
router.get('/actions',useMarketingConn, getClientsActions)
router.get('/actions/metrics',useMarketingConn, getClientsActionsMetrics)
router.get('/actions/metrics/segment',useMarketingConn, getClientsActionsSegmentMetrics)
router.get('/actions/metrics/score',useMarketingConn, getClientsActionsScoreMetrics)
router.get('/metrics',useMarketingConn, getClientsMetrics)

export default router
