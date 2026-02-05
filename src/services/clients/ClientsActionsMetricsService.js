import { ClientActionTrackingModel } from '../../models/ClientActionTracking.model.js'

export async function getActionsEffectiveness(conn) {
  const Model = ClientActionTrackingModel(conn)

  return Model.aggregate([
    {
      $group: {
        _id: {
          action: '$action',
          outcome: '$outcome',
        },
        total: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.action',
        outcomes: {
          $push: {
            outcome: '$_id.outcome',
            total: '$total',
          },
        },
        total: { $sum: '$total' },
      },
    },
    {
      $project: {
        _id: 0,
        action: '$_id',
        total: 1,
        outcomes: 1,
      },
    },
  ])
}
