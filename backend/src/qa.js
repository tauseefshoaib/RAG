import axios from "axios";
import { embedText } from "./embeddings.js";
import { searchVectors } from "./qdrant.js";

export async function askQuestion(docId, question) {
  const queryEmbedding = await embedText(question);

  const results = await searchVectors(queryEmbedding, docId);

  if (!results.length) {
    return "No relevant context found in the document.";
  }

  const context = results.map((r) => r.payload.text).join("\n");

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt: `
Answer strictly using the context below.

Context:
${context}

Question:
${question}
`,
    stream: false,
  });

  return res.data.response;
}
