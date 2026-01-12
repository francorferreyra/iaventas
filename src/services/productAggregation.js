import { hertracConnection } from "../db/mongo.connections.js";

export async function getProductsForIndexing() {
  return hertracConnection
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
      {
        $lookup: {
          from: "subheadings",
          localField: "subheading",
          foreignField: "_id",
          as: "subheading"
        }
      },

      { $unwind: "$heading" },
      { $unwind: "$subheading" },

      {
        $project: {
          cod: 1,
          name: 1,
          description: 1,
          alternative_code_1: 1,
          alternative_code_2: 1,
          brand: 1,
          class: 1,
          salient: 1,
          categoria: "$heading.name",
          subcategoria: "$subheading.name"
        }
      }
    ])
    .toArray();
}
