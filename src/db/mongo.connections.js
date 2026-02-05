import "dotenv/config"
import mongoose from "mongoose"

let marketingConnection = null
let hertracConnection = null

export async function connectMongo() {
  if (!marketingConnection) {
    marketingConnection = mongoose.createConnection(
      process.env.MONGODB_URI,
      { dbName: "marketingia" }
    )

    await marketingConnection.asPromise()
    console.log("✅ Conectado a MongoDB → marketingia")
  }

  if (!hertracConnection) {
    hertracConnection = mongoose.createConnection(
      process.env.MONGODB_URI_HT,
      { dbName: "hertrac" }
    )

    await hertracConnection.asPromise()
    console.log("✅ Conectado a MongoDB → hertrac")
  }
}

export function getMarketingConnection() {
  if (!marketingConnection) {
    throw new Error("❌ marketingia no está conectado")
  }
  return marketingConnection
}

export function getHertracDb() {
  if (!hertracConnection) {
    throw new Error("❌ hertrac no está conectado")
  }
  return hertracConnection
}
