import { MongoClient } from "mongodb";

let client;
let hertracDb;

export async function connectHertracNative() {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI_HT);
    await client.connect();

    hertracDb = client.db("hertrac");
    console.log("✅ MongoDB Nativo conectado → hertrac");
  }
}

export function getHertracDb() {
  if (!hertracDb) {
    throw new Error("❌ hertrac no está conectado");
  }
  return hertracDb;
}
