import { pineconeIndex } from "./PineconeClient.js"
import { buildClientVector } from "./ClientsVectorBuilder.js"

export async function findSimilarClients(client) {

  const vector = await buildClientVector(client)

  const result = await pineconeIndex.query({
    vector,
    topK: 5,
    includeMetadata: true
  })

  return result.matches
}
