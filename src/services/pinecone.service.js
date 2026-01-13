import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const index = pinecone.index(process.env.PINECONE_INDEX);
