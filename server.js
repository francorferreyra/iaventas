import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import salesRoutes from "./src/routes/sales.routes.js";
import ragRoutes from "./src/routes/rag.routes.js";
import "dotenv/config";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const MONGO_URI = "mongodb+srv://zuka-company:jw7v466zHbaeSBxD@cluster0.bbmpq.mongodb.net/marketingia";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("📌 Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar:", err));

// Rutas
app.get("/", (req, res) => {
  res.send("API de Marketing IA funcionando 🚀");
});

app.use("/api/sales", salesRoutes);
app.use("/api/rag", ragRoutes);

// Puesto del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
