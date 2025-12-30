export function applyTokenBudget(chunks, maxChars = 4000) {
  let total = 0;
  const final = [];

  for (const c of chunks) {
    if (typeof c !== "string" || c.length === 0) continue;

    if (total + c.length > maxChars) break;

    final.push(c);
    total += c.length;
  }

  return final;
}
