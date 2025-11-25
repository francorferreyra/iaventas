import { Router } from "express";
import { askSalesRAG } from "../services/ragService.js";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "La pregunta es requerida" });
    }

    const answer = await askSalesRAG(question);

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error procesando la consulta" });
  }
});

export default router;
