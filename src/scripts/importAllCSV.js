import fs from "fs";
import path from "path";
import csv from "csv-parser";
import mongoose from "mongoose";

// 📌 Conexión a MongoDB Atlas
mongoose
  .connect("mongodb+srv://zuka-company:jw7v466zHbaeSBxD@cluster0.bbmpq.mongodb.net/marketingia?retryWrites=true&w=majority")
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar MongoDB Atlas:", err));

// 📌 Modelo simple para guardar las ventas
const saleSchema = new mongoose.Schema({}, { strict: false });
const Sale = mongoose.model("Sale", saleSchema);

// 📌 Función para normalizar fechas
function parseDate(value) {
  if (!value) return null;

  const regexDMY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (regexDMY.test(value)) {
    const [, dd, mm, yyyy] = value.match(regexDMY);
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) return isoDate;

  return null;
}

// 📌 Procesar un archivo CSV individual
async function processCSV(filePath) {
  return new Promise((resolve) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))  // 👈 CORREGIDO
      .on("data", (row) => {
        if (row.Fecha) {
          const parsed = parseDate(row.Fecha);

          if (!parsed) {
            console.warn("⚠ Fecha inválida, fila saltada.", row);
            return;
          }

          row.Fecha = parsed;
        }

        results.push(row);
      })
      .on("end", async () => {
        if (results.length > 0) {
          await Sale.insertMany(results);
          console.log(`✔ Importado: ${filePath} (${results.length} filas)`);
        } else {
          console.log(`⚠ No se importaron filas desde: ${filePath}`);
        }
        resolve();
      });
  });
}

// 📌 Procesar todos los CSV dentro de /data
async function importAllCSVs() {
  const folder = path.join(process.cwd(), "data"); // 👈 CORREGIDO

  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".csv"));

  if (files.length === 0) {
    console.log("⚠ No hay archivos CSV en la carpeta /data");
    return;
  }

  console.log(`📂 Archivos detectados: ${files.length}`);

  for (const file of files) {
    await processCSV(path.join(folder, file));
  }

  console.log("🎉 Importación completa.");
  mongoose.connection.close();
}

importAllCSVs();
