import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema({
  Fecha: { type: Date, required: true },   // <-- viene con F mayúscula

  // Datos del cliente
  Cliente: String,
  Nombre: String,
  CUIT: String,

  // Datos del artículo
  Articulo: String,
  NombreArticulo: String,
  Desc_Adicional: String,
  CodigoAlternativo1: String,
  CodigoAlternativo2: String,

  // Cantidades y valores
  Cantidad: Number,
  P_Unit: Number,
  Total: Number,
  "Total+Iva": Number,  // <-- campo con símbolo + (Mongoose lo permite)

  // Ubicación
  Localidad: String,
  "Nombre Provincia": String
});

export default mongoose.model("Sale", SaleSchema);
