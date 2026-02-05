import { ClientActionTrackingModel } from '../../models/ClientActionTracking.model.js'

export async function trackClientAction(
  conn,
  {
    clientId,
    action,
    priority,
    segmento,
    scoreRecompra,
    metadata = {},
  }
) {
  const Model = ClientActionTrackingModel(conn)

  return Model.create({
    clientId,
    action,
    priority,
    segmento,
    scoreRecompra,
    metadata,
  })
}
