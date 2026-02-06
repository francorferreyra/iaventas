import { Router } from 'express'
import {getClientsList} from '../controllers/clients/list/ClientsListController.js'
import {getClientsDashboard} from '../controllers/clients/dashboard/ClientsDashboardController.js'
// import {getTopClients} from '../controllers/clients/top/ClientsTopController.js';
import {getTopClients} from '../controllers/clients/riesgo/ClientsRiesgoController.js'
import {getClientsActions} from '../controllers/clients/actions/ClientsActionsController.js'
import {getClientsActionsMetrics} from '../controllers/clients/ClientsActionsMetricsController.js'
import { getClientsActionsSegmentMetrics } from '../controllers/clients/ClientsActionsSegmentMetricsController.js';
import {getClientsActionsScoreMetrics} from '../controllers/clients/ClientsActionsScoreMetricsController.js'
import { getClientsMetrics } from '../controllers/clients/ClientsController.js'

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
