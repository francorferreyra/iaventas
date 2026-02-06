import mongoose from 'mongoose'

const ClientMetricsSchema = new mongoose.Schema(
  {
    _id: String,
    nombre: String,
    segmento: String,
    compras: Number,
    totalFacturado: Number,
    rubros: [String],
    marcas: [String],
    zonas: [String],
    anios: [Number],
    primeraCompra: Date,
    ultimaCompra: Date,
  },
  { collection: 'clients_metrics' }
)

export function ClientMetricsModel(conn) {
  return (
    conn.models.ClientMetrics ||
    conn.model(
      'ClientMetrics',
      ClientMetricsSchema,
      'clients_metrics'
    )
  )
}

