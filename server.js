import "dotenv/config";
import express from "express";
import { connectMongo } from "./src/db/mongo.connections.js";
import cors from 'cors'
// import ragRoutes from "./src/routes/rag.routes.js";
import clientsRoutes from "./src/routes/clients.routes.js";

const app = express();
app.use(express.json());
app.use(cors());

// ⬅️ Conectar DB primero
await connectMongo();

// ⬅️ Rutas
// app.use("/api", ragRoutes);
app.use("/api/clients", clientsRoutes);

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
