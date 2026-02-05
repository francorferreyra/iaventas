import { ClientActionTrackingModel } from '../../models/ClientActionTracking.model.js'

export async function getActionsEffectivenessByScore(
  conn
) {
  const Model = ClientActionTrackingModel(conn)

  return Model.aggregate([
    {
      $addFields: {
        scoreRange: {
          $switch: {
            branches: [
              {
                case: { $lte: ['$scoreRecompra', 20] },
                then: '0-20',
              },
              {
                case: {
                  $and: [
                    { $gt: ['$scoreRecompra', 20] },
                    { $lte: ['$scoreRecompra', 40] },
                  ],
                },
                then: '21-40',
              },
              {
                case: {
                  $and: [
                    { $gt: ['$scoreRecompra', 40] },
                    { $lte: ['$scoreRecompra', 60] },
                  ],
                },
                then: '41-60',
              },
              {
                case: {
                  $and: [
                    { $gt: ['$scoreRecompra', 60] },
                    { $lte: ['$scoreRecompra', 80] },
                  ],
                },
                then: '61-80',
              },
              {
                case: {
                  $gt: ['$scoreRecompra', 80] },
                then: '81-100',
              },
            ],
            default: 'SIN_SCORE',
          },
        },
      },
    },
    {
      $group: {
        _id: {
          scoreRange: '$scoreRange',
          outcome: '$outcome',
        },
        total: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.scoreRange',
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
        scoreRange: '$_id',
        total: 1,
        outcomes: 1,
      },
    },
    {
      $sort: {
        scoreRange: 1,
      },
    },
  ])
}
