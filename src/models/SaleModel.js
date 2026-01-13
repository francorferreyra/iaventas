import mongoose from "mongoose";

const SaleSchema = new mongoose.Schema(
  {
    Fecha: Date,
    Comprobante: String,

    Cliente: String,
    NombreCliente: String,
    CUIT: String,

    Articulo: String,
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

export default SaleSchema;
