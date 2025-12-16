import axios from "axios";
import { embedText } from "./embeddings.js";
import { searchVectors } from "./qdrant.js";

export async function askQuestion(docId, question) {
  const queryEmbedding = await embedText(question);
  const results = await searchVectors(queryEmbedding);

  const context = results
    .filter(r => r.payload.docId === docId)
    .map(r => r.payload.text)
    .join("\n");

  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt: `
Use only the context below to answer.

Context:
${context}

Question:
${question}
`,
    stream: false,
  });

  return res.data.response;
}
