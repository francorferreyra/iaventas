import mongoose from "mongoose";

// Conexión a marketingIA
export const marketingConnection = mongoose.createConnection(
  process.env.MONGODB_URI
);

// Conexión a hertrac
export const hertracConnection = mongoose.createConnection(
  process.env.MONGODB_URI_HT
);

// Logs
marketingConnection.on("connected", () => {
  console.log("✅ Conectado a MongoDB → marketingIA");
});

marketingConnection.on("error", (err) => {
  console.error("❌ Error Mongo marketingIA:", err);
});

hertracConnection.on("connected", () => {
  console.log("✅ Conectado a MongoDB → hertrac");
});

hertracConnection.on("error", (err) => {
  console.error("❌ Error Mongo hertrac:", err);
});
