import "dotenv/config";
import express from "express";
import { connectMongo } from "./src/db/mongo.connections.js";
import ragRoutes from "./src/routes/rag.routes.js";

const app = express();
app.use(express.json());

// ⬅️ CONECTAR PRIMERO
await connectMongo();

// ⬅️ DESPUÉS rutas
app.use("/api", ragRoutes);

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
