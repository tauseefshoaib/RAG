import axios from "axios";

const QDRANT_URL = "http://localhost:6333";
const COLLECTION = "pdf_docs";

/**
 * Create collection if it doesn't exist
 */
export async function initCollection() {
  try {
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
      vectors: {
        size: 768, // nomic-embed-text
        distance: "Cosine",
      },
    });
    console.log("✅ Qdrant collection ready:", COLLECTION);
  } catch (err) {
    // Collection already exists → ignore
    if (err.response?.status !== 409) {
      throw err;
    }
  }
}

/**
 * Insert or update vectors
 */
export async function upsertVectors(point) {
  await axios.put(`${QDRANT_URL}/collections/${COLLECTION}/points`, {
    points: [point],
  });
}

/**
 * Search vectors by similarity + docId
 */
export async function searchVectors(vector, docId) {
  const body = {
    vector,
    limit: 4,
    with_payload: true,
  };

  if (docId !== "ALL") {
    body.filter = {
      must: [
        {
          key: "docId",
          match: { value: docId },
        },
      ],
    };
  }

  const res = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
    body
  );

  return res.data.result;
}
