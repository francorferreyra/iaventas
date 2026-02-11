import "dotenv/config";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js";
import { getSaleModel } from "../models/index.js";

/* =========================
   Utils
========================= */

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
  return Number(String(value).replace(/\./g, "").replace(",", ".")) || 0;
}

function clean(value) {
  return value ? String(value).trim() : "";
}

/* =========================
   Procesar CSV
========================= */

async function processCSV(filePath, Sale) {
  return new Promise((resolve, reject) => {

    const operations = [];
    const BATCH_SIZE = 500;

    const stream = fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }));

    stream.on("data", async (row) => {
      stream.pause();

      try {

        const sale = {
          Fecha: parseDate(row.Fecha),

          Comprobante: clean(row.Comprobante),
          Cliente: clean(row.Cliente),

          NombreCliente: clean(row.NombreCliente),
          CUIT: clean(row.CUIT),

          Articulo: clean(row["Artículo"]),
          NombreArticulo: clean(row.NombreArticulo),
          Desc_Adicional: clean(row["Desc.Adicional"]),

          Cantidad: toNumber(row.Cantidad),
          P_Unit: toNumber(row["P. Unit."]),
          Total: toNumber(row.Total),

          NombreVendedor: clean(row.NombreVendedor),
          NombreZona: clean(row.NombreZona),

          NombreRubro: clean(row.NombreRubro),
          NombreSubrubro: clean(row.NombreSubrubro),
          NombreMarca: clean(row.NombreMarca),
          NombreClase: clean(row.NombreClase),

          CodigoAlternativo1: clean(row["Código Alternativo 1"]),
          CodigoAlternativo2: clean(row["Código Alternativo 2"]),

          Localidad: clean(row.Localidad),
          NombreProvincia: clean(row.NombreProvincia)
        };

        operations.push({
          updateOne: {
            filter: {
              Comprobante: sale.Comprobante,
              Cliente: sale.Cliente,
              Articulo: sale.Articulo,
              Cantidad: sale.Cantidad,
              P_Unit: sale.P_Unit
            },
            update: { $setOnInsert: sale },
            upsert: true
          }
        });

        if (operations.length >= BATCH_SIZE) {
          await Sale.bulkWrite(operations, { ordered: false });
          console.log(`📦 Batch ${operations.length}`);
          operations.length = 0;
        }

      } catch (err) {
        console.error("❌ Error fila:", err);
      } finally {
        stream.resume();
      }

    });

    stream.on("end", async () => {

      if (operations.length) {
        await Sale.bulkWrite(operations, { ordered: false });
        console.log(`📦 Batch final ${operations.length}`);
      }

      console.log(`✔ Importado: ${path.basename(filePath)}`);
      resolve();
    });

    stream.on("error", reject);

  });
}

/* =========================
   Importar todos los CSV
========================= */

async function importAllCSVs() {

  await connectMongo();

  const conn = getMarketingConnection();
  const Sale = getSaleModel(conn);

  const folder = path.join(process.cwd(), "data");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".csv"));

  console.log(`📂 CSV encontrados: ${files.length}`);

  for (const file of files) {
    await processCSV(path.join(folder, file), Sale);
  }

  console.log("🎉 Importación completa");
  process.exit(0);
}

importAllCSVs();
