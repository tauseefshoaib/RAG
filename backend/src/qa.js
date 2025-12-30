import axios from "axios";
import { embedText } from "./embeddings.js";
import { searchVectors } from "./qdrant.js";
import { dedupeChunks, rankByDensity } from "./retrieval.js";
import { summarizeChunk } from "./compression.js";
import { applyTokenBudget } from "./tokenBudget.js";
import { getCachedRetrieval, setCachedRetrieval } from "./cache.js";
import { verifyAnswer } from "./verifier.js";

export async function streamAnswer(req, res) {
  const { docId, question } = req.body;

  const queryEmbedding = await embedText(question);

  const cacheKey = `${docId}:${question}`;
  const cached = getCachedRetrieval(cacheKey);

  const results = cached ?? (await searchVectors(queryEmbedding, docId));

  if (!cached) {
    setCachedRetrieval(cacheKey, results);
  }

  if (!results.length) {
    res.write("No relevant context found.");
    return res.end();
  }

  let refined = dedupeChunks(results);
  refined = rankByDensity(refined);

  const summaries = [];

  for (const r of refined) {
    const summary = await summarizeChunk(r.payload.text);
    if (summary) summaries.push(summary);
  }

  const context = applyTokenBudget(summaries).join("\n");

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

  let finalAnswer = "";

  ollamaRes.data.on("data", (chunk) => {
    const lines = chunk.toString().split("\n");

    for (const line of lines) {
      if (!line) continue;

      const json = JSON.parse(line);
      if (json.response) {
        res.write(json.response);
        finalAnswer += json.response;
      }
    }
  });

  ollamaRes.data.on("end", async () => {
    const verdict = await verifyAnswer(finalAnswer, context);

    if (!verdict.grounded || verdict.confidence < 0.6) {
      res.write(
        "\n\n⚠️ Answer confidence is low. Please refine your question."
      );
    }

    res.end();
  });

  ollamaRes.data.on("error", () => {
    res.end();
  });
}
