import { getHertracDb } from "../../db/mongo.native.js";

export async function filterValidProducts(products) {
  const db = getHertracDb();

  if (!products || products.length === 0) return [];

  // códigos recomendados por la IA
  const codes = products.map(p => p.cod);

  const validProducts = await db
    .collection("products")
    .find({
      cod: { $in: alternative_code_1 },
      price: { $gt: 0 }, 
      status: true
    })
    .project({
      cod: 1,
      price: 1
    })
    .toArray();

  const validCodes = validProducts.map(p => p.cod);

  // devolver solo los productos válidos
  return products.filter(p => validCodes.includes(p.cod));
}