const embeddingCache = new Map();
const retrievalCache = new Map();

export function getCachedEmbedding(key) {
  return embeddingCache.get(key);
}

export function setCachedEmbedding(key, value) {
  embeddingCache.set(key, value);
}

export function getCachedRetrieval(key) {
  return retrievalCache.get(key);
}

export function setCachedRetrieval(key, value) {
  retrievalCache.set(key, value);
}
