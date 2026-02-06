import { getMarketingConnection } from '../db/mongo.connections.js'

export function useMarketingConn(req, res, next) {
  try {
    req.conn = getMarketingConnection()
    next()
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
