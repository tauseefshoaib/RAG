import fs from "fs";
import { createRequire } from "module";
import { v4 as uuid } from "uuid";
import { embedText } from "./embeddings.js";
import { upsertVectors } from "./qdrant.js";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse"); // ✅ now this IS a function

export async function processPdf(filePath) {
  const buffer = fs.readFileSync(filePath);

  const data = await pdf(buffer); // ✅ works

  const chunks = chunkText(data.text);
  const docId = uuid();

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);

    await upsertVectors({
      id: uuid(),
      vector: embedding,
      payload: {
        docId,
        text: chunk,
      },
    });
  }

  return docId;
}

function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}
