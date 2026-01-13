import SaleSchema from "./SaleModel.js";
import { getMarketingConnection } from "../db/mongo.connections.js";

let SaleModel;

export function getSaleModel() {
  if (!SaleModel) {
    const conn = getMarketingConnection();
    SaleModel = conn.model("Sale", SaleSchema, "sales"); 
  }
  return SaleModel;
}
