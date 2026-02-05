import "dotenv/config";
import { connectMongo, getMarketingConnection } from "../../db/mongo.connections.js";

async function run() {
  console.log("🔌 Conectando a MongoDB...");
  await connectMongo();

  const conn = getMarketingConnection();
  const db = conn.db;

  const metrics = db.collection("clients_metrics");
  const sales = db.collection("sales");

  console.log("🔍 Buscando clientes sin nombre...");

  const clientsWithoutName = await metrics.find({
    $or: [{ nombre: null }, { nombre: "" }],
  }).toArray();

  console.log(`👀 Clientes sin nombre: ${clientsWithoutName.length}`);

  let updated = 0;

  for (const c of clientsWithoutName) {
    const sale = await sales.findOne(
      { CUIT: c._id, NombreCliente: { $ne: null } },
      { projection: { NombreCliente: 1 } }
    );

    if (!sale?.NombreCliente) continue;

    const nombreLimpio = sale.NombreCliente.trim();

    await metrics.updateOne(
      { _id: c._id },
      { $set: { nombre: nombreLimpio } }
    );

    updated++;
    console.log(`✔ ${c._id} → ${nombreLimpio}`);
  }

  console.log(`🎉 Nombres actualizados: ${updated}`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
