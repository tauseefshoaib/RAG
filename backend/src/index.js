import express from "express";
import multer from "multer";
import cors from "cors";

import { processPdf } from "./pdf.js";
import { initCollection } from "./qdrant.js";
import { streamAnswer } from "./qa.js";
import { documents } from "./document.js";

const app = express();

/**
 * ============================
 * File upload configuration
 * ============================
 * Using Multer with disk storage.
 * Uploaded PDFs are temporarily saved in /uploads
 * and later processed + embedded.
 */
const upload = multer({ dest: "uploads/" });

/**
 * ============================
 * Global middleware
 * ============================
 * - CORS: allows frontend to talk to backend
 * - JSON: parses JSON request bodies
 */
app.use(cors());
app.use(express.json());

/**
 * ============================
 * Initialize Vector Database
 * ============================
 * Ensure Qdrant collection exists before
 * serving any requests.
 */
await initCollection();

/**
 * ============================
 * Upload PDF Endpoint
 * ============================
 * - Accepts a PDF file
 * - Extracts text
 * - Chunks + embeds content
 * - Stores vectors in Qdrant
 * - Tracks document metadata in memory
 */
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    // Validate input
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    // Process PDF → embed → store vectors
    const docId = await processPdf(req.file.path);

    // Save document metadata (in-memory)
    documents.set(docId, {
      name: req.file.originalname,
      uploadedAt: Date.now(),
    });

    // Return document ID to frontend
    res.json({ docId });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

/**
 * ============================
 * Ask Question (Streaming)
 * ============================
 * - Accepts a question + docId (or "ALL")
 * - Retrieves relevant chunks from Qdrant
 * - Streams LLM response token-by-token
 */
app.post("/ask", streamAnswer);

/**
 * ============================
 * List Uploaded Documents
 * ============================
 * Returns all uploaded PDFs so the frontend
 * can populate the document dropdown.
 */
app.get("/documents", (req, res) => {
  const list = Array.from(documents.entries()).map(([id, meta]) => ({
    id,
    ...meta,
  }));

  res.json(list);
});

/**
 * ============================
 * Start Server
 * ============================
 */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
