import { getHertracDb } from "../db/mongo.native.js";

export async function getProductsForIndexing() {
  const db = getHertracDb();

  const products = await db
    .collection("products")
    .aggregate([
      { $match: { status: true } },

      {
        $lookup: {
          from: "headings",
          localField: "heading",
          foreignField: "_id",
          as: "heading"
        }
      },
      { $unwind: "$heading" },

      {
        $lookup: {
          from: "subheadings",
          localField: "subheading",
          foreignField: "_id",
          as: "subheading"
        }
      },
      { $unwind: "$subheading" },

      {
        $project: {
          cod: 1,
          name: 1,
          description: 1,
          brand: 1,
          class: 1,
          salient: 1,
          categoria: "$heading.name",
          subcategoria: "$subheading.name"
        }
      }
    ])
    .toArray();

  return products;
}
