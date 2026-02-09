import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectMongo } from "./src/db/mongo.connections.js";
import clientsRoutes from "./src/routes/clients.routes.js";
import { startClientsSyncJob } from "./src/jobs/syncClients.job.js";

const app = express();

app.use(express.json());
app.use(cors());

async function bootstrap() {
  try {

    // ✅ Conectar Mongo
    await connectMongo()

    // ✅ Iniciar CRON
    startClientsSyncJob()

    // ✅ Rutas
    app.use("/api/clients", clientsRoutes)

    app.listen(3000, () => {
      console.log("🚀 Servidor corriendo en http://localhost:3000")
    })

  } catch (error) {
    console.error("❌ Error inicializando server:", error)
    process.exit(1)
  }
}

bootstrap()
