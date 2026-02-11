import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    Fecha: { type: Date, index: true },

    Comprobante: { type: String, required: true },
    Cliente: { type: String, required: true, index: true },

    NombreCliente: String,
    CUIT: String,

    Articulo: { type: String, required: true },
    NombreArticulo: String,
    Desc_Adicional: String,

    Cantidad: Number,
    P_Unit: Number,
    Total: Number,

    NombreVendedor: String,
    NombreZona: String,

    NombreRubro: String,
    NombreSubrubro: String,
    NombreMarca: String,
    NombreClase: String,

    CodigoAlternativo1: String,
    CodigoAlternativo2: String,

    Localidad: String,
    NombreProvincia: String
  },
  { collection: "sales" }
);

/*
🔥 Índice único de línea de factura
*/
SaleSchema.index(
  {
    Comprobante: 1,
    Cliente: 1,
    Articulo: 1,
    Cantidad: 1,
    P_Unit: 1
  },
  { unique: true }
);

export default SaleSchema;
