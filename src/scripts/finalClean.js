import mongoose from "mongoose";

mongoose
  .connect("mongodb+srv://zuka-company:jw7v466zHbaeSBxD@cluster0.bbmpq.mongodb.net/marketingia")
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar:", err));

const Sale = mongoose.model("Sale", new mongoose.Schema({}, { strict: false }));

async function finalClean() {
  console.log("🧹 Ejecutando limpieza final...");

  await Sale.updateMany(
    {},
    {
      $unset: {
        "Desc": "",
        "P": "",
        "Total s/Dto": "",
        "Codigo Alternativo 1": "",
        "Codigo Alternativo 2": ""
      }
    }
  );

  console.log("✔ Campos innecesarios eliminados.");
  mongoose.connection.close();
}

finalClean();
