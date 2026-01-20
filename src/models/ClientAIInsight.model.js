import mongoose from 'mongoose'

const ClientAIInsightSchema = new mongoose.Schema(
  {
    _id: String,
    resumenIA: String,
    accionIA: String,
    mensajeIA: String,
    accionSugerida: String,
    scoreRecompra: Number,
    prioridad: String,
    generadoEl: Date,
  },
  { collection: 'clients_ai_insights' }
)

export function ClientAIInsightModel(conn) {
  return conn.model('ClientAIInsight', ClientAIInsightSchema)
}
