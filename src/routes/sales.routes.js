// routes/sales.routes.js
import { Router } from "express";

import { getSales, getSaleById } from "../controllers/sales/SalesRead.js";
import {
  topProducts,
  topCustomers,
  salesByProvince,
  avgTicket,
  salesByMonth
} from "../controllers/sales/SalesStats.js";
import { getAIRecords } from "../controllers/sales/SalesAI.js";

const router = Router();

/* READ */
router.get("/", getSales);
router.get("/:id", getSaleById);

/* STATS */
router.get("/stats/top-products", topProducts);
router.get("/stats/top-customers", topCustomers);
router.get("/stats/by-province", salesByProvince);
router.get("/stats/avg-ticket", avgTicket);
router.get("/stats/by-month", salesByMonth);

/* AI */
router.get("/ai/records", getAIRecords);

export default router;
