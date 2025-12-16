import axios from "axios";
import { embedText } from "./embeddings.js";
import { searchVectors } from "./qdrant.js";

export async function streamAnswer(req, res) {
  const { docId, question } = req.body;

  const queryEmbedding = await embedText(question);
  const results = await searchVectors(queryEmbedding, docId);

  if (!results.length) {
    res.write("No relevant context found.");
    return res.end();
  }

  const context = results.map((r) => r.payload.text).join("\n");

  // Important headers for streaming
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  const ollamaRes = await axios.post(
    "http://localhost:11434/api/generate",
    {
      model: "llama3.2",
      prompt: `
Answer using ONLY the context below.

Context:
${context}

Question:
${question}
`,
      stream: true,
    },
    { responseType: "stream" }
  );

  ollamaRes.data.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");

    for (const line of lines) {
      if (!line) continue;

      const json = JSON.parse(line);
      if (json.response) {
        res.write(json.response); // 🚀 stream token
      }
    }
  });

  ollamaRes.data.on("end", () => {
    res.end();
  });

  ollamaRes.data.on("error", () => {
    res.end();
  });
}
