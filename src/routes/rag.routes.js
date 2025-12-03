import { Router } from "express";
import { askAI } from "../services/askAI.js";

const router = Router();

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Falta el campo 'question'" });
    }

    const result = await askAI(question);

    res.json({ answer: result });

  } catch (err) {
    console.error("❌ Error en /api/rag/ask:", err);
    res.status(500).json({ error: "Error procesando la pregunta" });
  }
});

export default router;
