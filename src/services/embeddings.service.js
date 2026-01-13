import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const embedModel = genAI.getGenerativeModel({
  model: "text-embedding-004",
});

export async function getEmbedding(text) {
  const result = await embedModel.embedContent({
    content: { parts: [{ text }] },
  });

  return result.embedding.values;
}
