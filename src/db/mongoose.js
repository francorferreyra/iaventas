import mongoose from "mongoose";

export async function connectMarketing() {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "marketingia"
  });

  console.log("✅ Mongoose conectado → marketingIA");
}
