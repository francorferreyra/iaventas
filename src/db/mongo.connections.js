import mongoose from "mongoose";

let marketingConnection = null;
let hertracConnection = null;

export async function connectMongo() {
  if (!marketingConnection) {
    marketingConnection = await mongoose.createConnection(
      process.env.MONGODB_URI,
      {
        dbName: "marketingia"
      }
    );

    console.log("✅ Conectado a MongoDB → marketingIA");
  }

  if (!hertracConnection) {
    hertracConnection = await mongoose.createConnection(
      process.env.MONGODB_URI_HT,
      {
        dbName: "hertrac"
      }
    );

    console.log("✅ Conectado a MongoDB → hertrac");
  }
}

export function getMarketingConnection() {
  if (!marketingConnection) {
    throw new Error("❌ marketingIA no está conectado");
  }
  return marketingConnection;
}

export function getHertracDb() {
  if (!hertracConnection) {
    throw new Error("❌ hertrac no está conectado");
  }
  return hertracConnection;
}
