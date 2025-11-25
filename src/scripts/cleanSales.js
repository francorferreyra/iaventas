import mongoose from "mongoose";

mongoose
  .connect("mongodb+srv://zuka-company:jw7v466zHbaeSBxD@cluster0.bbmpq.mongodb.net/marketingia")
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar:", err));

const Sale = mongoose.model("Sale", new mongoose.Schema({}, { strict: false }));

function toNumber(value) {
  if (value == null) return null;

  if (typeof value === "number") return value;

  if (value.$numberDecimal) {
    return parseFloat(value.$numberDecimal);
  }

  if (typeof value === "object") return null;

  if (typeof value !== "string") return null;

  const normalized = value.replace(",", ".");
  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

function cleanString(value) {
  if (!value) return value;
  if (typeof value !== "string") return value;
  return value.trim();
}

function fixEncoding(value) {
  if (typeof value !== "string") return value;
  return value
    .replace("C�rdoba", "Córdoba")
    .replace("�", "ñ");
}

function flattenFields(doc) {
  if (doc.Desc && doc.Desc["Adicional"]) {
    doc.Desc_Adicional = cleanString(doc.Desc["Adicional"]);
  }

  if (doc.P && doc.P[" Unit"]) {
    doc.P_Unit = toNumber(doc.P[" Unit"]);
  }

  delete doc.Desc;
  delete doc.P;

  return doc;
}

async function runCleaning() {
  console.log("🔄 Iniciando limpieza...");

  const docs = await Sale.find();

  for (const doc of docs) {
    let updated = doc.toObject();

    for (const key of Object.keys(updated)) {
      updated[key] = cleanString(updated[key]);
      updated[key] = fixEncoding(updated[key]);
    }

    updated.Cantidad = toNumber(updated.Cantidad);
    updated.Total = toNumber(updated.Total);
    updated["Total+Iva"] = toNumber(updated["Total+Iva"]);

    updated = flattenFields(updated);

    updated.CodigoAlternativo1 = cleanString(updated["Codigo Alternativo 1"]);
    updated.CodigoAlternativo2 = cleanString(updated["Codigo Alternativo 2"]);

    delete updated["Codigo Alternativo 1"];
    delete updated["Codigo Alternativo 2"];
    delete updated["Total s/Dto"];

    await Sale.updateOne({ _id: doc._id }, { $set: updated });
  }

  console.log("🎉 Limpieza completada");
  mongoose.connection.close();
}

runCleaning();
