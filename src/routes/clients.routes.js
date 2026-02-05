import { Router } from 'express'
import {getClientsList} from '../controllers/clients/list/ClientsListController.js'
import {getClientsDashboard} from '../controllers/clients/ClientsDashboardController.js'
// import {getTopClients} from '../controllers/clients/top/ClientsTopController.js';
import {getTopClients} from '../controllers/clients/riesgo/ClientsRiesgoController.js'
import {getClientsActions} from '../controllers/clients/actions/ClientsActionsController.js'
import {getClientsActionsMetrics} from '../controllers/clients/ClientsActionsMetricsController.js'
import { getClientsActionsSegmentMetrics } from '../controllers/clients/ClientsActionsSegmentMetricsController.js';
import {getClientsActionsScoreMetrics} from '../controllers/clients/ClientsActionsScoreMetricsController.js'
import { getClientsMetrics } from '../controllers/clients/ClientsController.js'

const router = Router()

router.get('/list', getClientsList)
router.get('/dashboard', getClientsDashboard)
// router.get('/top', getTopClients)
router.get('/riesgo', getTopClients)
router.get('/actions', getClientsActions)
router.get('/actions/metrics', getClientsActionsMetrics)
router.get('/actions/metrics/segment', getClientsActionsSegmentMetrics)
router.get('/actions/metrics/score', getClientsActionsScoreMetrics)
router.get('/metrics', getClientsMetrics)

export default router
