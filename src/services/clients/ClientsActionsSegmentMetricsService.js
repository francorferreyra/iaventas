import { ClientActionTrackingModel } from '../../models/ClientActionTracking.model.js'

export async function getActionsEffectivenessBySegment(conn) {
  const Model = ClientActionTrackingModel(conn)

  return Model.aggregate([
    {
      $group: {
        _id: {
          segmento: '$segmento',
          outcome: '$outcome',
        },
        total: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.segmento',
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
        segmento: '$_id',
        total: 1,
        outcomes: 1,
      },
    },
    { $sort: { total: -1 } },
  ])
}
