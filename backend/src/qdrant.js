import axios from "axios";

const QDRANT_URL = "http://localhost:6333";
const COLLECTION = "pdf_docs";

export async function initCollection() {
  await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
    vectors: {
      size: 768,
      distance: "Cosine",
    },
  }).catch(() => {});
}

export async function upsertVectors(point) {
  await axios.put(
    `${QDRANT_URL}/collections/${COLLECTION}/points`,
    { points: [point] }
  );
}

export async function searchVectors(vector) {
  const res = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
    {
      vector,
      limit: 4,
    }
  );

  return res.data.result;
}
