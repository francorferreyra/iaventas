import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },

  // Datos del cliente
  cliente: String,
  nombre: String,
  cuit: String,

  // Datos del artículo
  articulo: String,
  nombreArticulo: String,
  descripcionAdicional: String, // “Desc_Adicional”
  codigoAlternativo1: String,
  codigoAlternativo2: String,

  // Cantidades y valores
  cantidad: Number,
  precioUnitario: Number, // “P_Unit”
  total: Number,
  totalIva: Number, // “Total+Iva”

  // Ubicación
  localidad: String,
  nombreProvincia: String
});

export default mongoose.model("Sale", SaleSchema);
