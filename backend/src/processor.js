import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { v4 as uuid } from "uuid";
import Tesseract from "tesseract.js";

import { embedText } from "./embeddings.js";
import { upsertVectors } from "./qdrant.js";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

export async function processFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  let extractedText = "";

  if (ext === ".pdf") {
    extractedText = await extractPdfText(filePath);
  } else if (IMAGE_EXTENSIONS.includes(ext)) {
    extractedText = await extractImageText(filePath);
  } else {
    throw new Error("Unsupported file type");
  }

  return embedAndStore(extractedText);
}

/* ============================
   PDF text extraction
   ============================ */
async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdf(buffer);
  return data.text;
}

/* ============================
   Image OCR (Tesseract.js)
   ============================ */
// async function extractImageText(filePath) {
//   const result = await Tesseract.recognize(filePath, "eng", {
//     logger: () => {}, // disable noisy logs
//   });

//   return result.data.text;
// }

export async function extractImageText(imageBuffer) {
  try {
    const processed = await preprocessImage(imageBuffer);
    const { data } = await Tesseract.recognize(processed, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
        }
      },
    });

    console.log(data.text);
    return data.text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    throw new Error("Failed to extract text from image");
  }
}

async function preprocessImage(imageBuffer) {
  try {
    const processed = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .resize(2000, 2000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .toBuffer();
    return processed;
  } catch (error) {
    console.error("Image preprocessing error:", error);
    return imageBuffer;
  }
}

/* ============================
   Chunk → Embed → Store
   ============================ */
async function embedAndStore(text) {
  const chunks = chunkText(text);
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
