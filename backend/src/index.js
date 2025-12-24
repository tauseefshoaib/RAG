import express from "express";
import multer from "multer";
import cors from "cors";

import { processPdf } from "./pdf.js";
import { initCollection } from "./qdrant.js";
import { streamAnswer } from "./qa.js";

const app = express();

// Multer setup (disk storage)
const upload = multer({ dest: "uploads/" });

// Middleware
app.use(cors());
app.use(express.json());

// Init Qdrant collection on startup
await initCollection();

/**
 * ============================
 * Upload PDF
 * ============================
 */
app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const docId = await processPdf(req.file.path);
    res.json({ docId });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

/**
 * ============================
 * Ask Question (STREAMING)
 * ============================
 */
app.post("/ask", streamAnswer);

/**
 * ============================
 * Start Server
 * ============================
 */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
