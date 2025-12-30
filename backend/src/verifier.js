import axios from "axios";

export async function verifyAnswer(answer, context) {
  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "llama3.2",
    prompt: `
You are a strict JSON validator.

ONLY output valid JSON.
DO NOT add explanations.
DO NOT add markdown.
DO NOT add text before or after JSON.

Evaluate whether the answer is supported by the context.

Context:
${context}

Answer:
${answer}

Output EXACTLY in this format:
{
  "grounded": true | false,
  "confidence": number,
  "unsupported_claims": string[]
}
`,
    stream: false,
  });

  return safeJsonParse(res.data?.response);
}

function safeJsonParse(text) {
  if (!text || typeof text !== "string") {
    return fallbackVerdict("Empty verifier response");
  }

  try {
    return JSON.parse(text);
  } catch {
    // Try extracting JSON from text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return fallbackVerdict("No JSON found in verifier output");
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return fallbackVerdict("Malformed JSON from verifier");
    }
  }
}

function fallbackVerdict(reason) {
  return {
    grounded: false,
    confidence: 0,
    unsupported_claims: [reason],
  };
}
