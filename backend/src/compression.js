import axios from "axios";

export async function summarizeChunk(text) {
  try {
    const res = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2",
      prompt: `
Summarize the following text in 3 bullet points.
Keep only factual information.

Text:
${text}
`,
      stream: false,
    });

    if (!res.data || typeof res.data.response !== "string") {
      return ""; // IMPORTANT
    }

    return res.data.response.trim();
  } catch (err) {
    console.error("Summarization failed:", err.message);
    return "";
  }
}
