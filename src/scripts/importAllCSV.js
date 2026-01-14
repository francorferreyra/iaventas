import "dotenv/config";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";
import { getSaleModel } from "../models/index.js";

// ==========================
// Utils
// ==========================
function parseDate(value) {
  if (!value) return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function toNumber(value) {
  if (!value) return 0;
  return Number(
    String(value).replace(/\./g, "").replace(",", ".")
  ) || 0;
}

// ==========================
// Procesar CSV individual
// ==========================
async function processCSV(filePath, Sale) {
  return new Promise((resolve, reject) => {
    const batch = [];
    const BATCH_SIZE = 500;
    let processing = false;

    const stream = fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }));

    stream.on("data", async (row) => {
      stream.pause();

      try {
        const sale = {
          Fecha: parseDate(row.Fecha),

          Comprobante: row.Comprobante,
          Cliente: row.Cliente,
          NombreCliente: row.NombreCliente,
          CUIT: row.CUIT,

          Articulo: row.Artículo,
          NombreArticulo: row.NombreArticulo,
          Desc_Adicional: row["Desc.Adicional"],

          Cantidad: toNumber(row.Cantidad),
          P_Unit: toNumber(row["P. Unit."]),
          Total: toNumber(row.Total),

          NombreVendedor: row.NombreVendedor,
          NombreZona: row.NombreZona,

          NombreRubro: row.NombreRubro,
          NombreSubrubro: row.NombreSubrubro,
          NombreMarca: row.NombreMarca,
          NombreClase: row.NombreClase,

          CodigoAlternativo1: row["Código Alternativo 1"],
          CodigoAlternativo2: row["Código Alternativo 2"],

          Localidad: row.Localidad,
          NombreProvincia: row.NombreProvincia
        };

        batch.push(sale);

        if (batch.length >= BATCH_SIZE) {
          await Sale.insertMany(batch, { ordered: false });
          console.log(`📦 Insertados ${batch.length}`);
          batch.length = 0;
        }
      } catch (err) {
        console.error("❌ Error en fila:", err);
      } finally {
        stream.resume();
      }
    });

    stream.on("end", async () => {
      if (batch.length) {
        await Sale.insertMany(batch, { ordered: false });
        console.log(`📦 Insertados ${batch.length} (final)`);
      }

      console.log(`✔ Importado: ${path.basename(filePath)}`);
      resolve();
    });

    stream.on("error", reject);
  });
}


// ==========================
// Importar todos los CSV
// ==========================
async function importAllCSVs() {
  await connectMongo();

const conn = getMarketingConnection();
console.log("🔌 readyState marketingIA:", conn.readyState);

  const Sale = getSaleModel();

  const folder = path.join(process.cwd(), "data");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".csv"));

  if (!files.length) {
    console.log("⚠ No hay CSV en /data");
    return;
  }

  console.log(`📂 Archivos detectados: ${files.length}`);

  for (const file of files) {
    await processCSV(path.join(folder, file), Sale);
  }

  console.log("🎉 Importación completa");
  process.exit(0);
}

importAllCSVs();
