import mongoose from 'mongoose'

const ClientActionTrackingSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: ['RECUPERAR', 'FIDELIZAR', 'UPSELL', 'MANTENER'],
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ['alta', 'media', 'baja'],
      required: true,
    },

    segmento: String,
    scoreRecompra: Number,

    outcome: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
      index: true,
    },

    triggeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    resolvedAt: Date,
    metadata: Object,
  },
  { timestamps: true }
)

export function ClientActionTrackingModel(conn) {

  const connection = conn || mongoose

  return connection.models.ClientActionTracking ||
    connection.model(
      'ClientActionTracking',
      ClientActionTrackingSchema
    )
}
