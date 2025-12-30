import cosine from "compute-cosine-similarity";

export function dedupeChunks(results, similarityThreshold = 0.9) {
  const kept = [];

  for (const r of results) {
    if (!Array.isArray(r.vector)) {
      kept.push(r);
      continue;
    }

    const isDuplicate = kept.some((k) => {
      if (!Array.isArray(k.vector)) return false;
      return cosine(k.vector, r.vector) > similarityThreshold;
    });

    if (!isDuplicate) kept.push(r);
  }

  return kept;
}

export function rankByDensity(results) {
  return results.sort((a, b) => b.payload.text.length - a.payload.text.length);
}
