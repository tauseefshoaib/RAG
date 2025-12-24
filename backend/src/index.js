import express from "express";
import multer from "multer";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

import { processPdf } from "./pdf.js";
import { initCollection } from "./qdrant.js";
import { streamAnswer } from "./qa.js";

const app = express();
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
/**
 * @swagger
 * /upload-pdf:
 *   post:
 *     summary: Upload a PDF and index it into Qdrant
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: PDF processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 docId:
 *                   type: string
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
/**
 * @swagger
 * /ask:
 *   post:
 *     summary: Ask a question (streamed response)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - docId
 *               - question
 *             properties:
 *               docId:
 *                 type: string
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: Streamed text response
 */
app.post("/ask", streamAnswer);

/**
 * ============================
 * Swagger Docs
 * ============================
 */
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * ============================
 * Start Server
 * ============================
 */
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger → http://localhost:${PORT}/docs`);
});
