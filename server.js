import express from "express";
import cors from "cors";
import "dotenv/config";

import salesRoutes from "./src/routes/sales.routes.js";
import ragRoutes from "./src/routes/rag.routes.js";

// IMPORTANTE: solo importar, no usar variables
import "./src/db/mongo.connections.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.get("/", (req, res) => {
  res.send("API de Marketing IA funcionando 🚀");
});

app.use("/api/sales", salesRoutes);
app.use("/api/rag", ragRoutes);

// Puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
