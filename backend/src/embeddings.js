import axios from "axios";
import { getCachedEmbedding, setCachedEmbedding } from "./cache.js";

export async function embedText(text) {
  const key = text.trim();
  const cached = getCachedEmbedding(key);
  if (cached) return cached;

  const res = await axios.post("http://localhost:11434/api/embeddings", {
    model: "nomic-embed-text",
    prompt: text,
  });

  setCachedEmbedding(key, res.data.embedding);
  return res.data.embedding;
}
