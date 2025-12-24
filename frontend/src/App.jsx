import { useState } from "react";

const API = "http://localhost:3000";

function App() {
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPdf = async () => {
    if (!file) return alert("Select a PDF");

    const formData = new FormData();
    formData.append("pdf", file);

    // Start progress UI
    setUploading(true);
    setUploadProgress(5);

    // 🔑 Force React to paint progress bar before fetch
    await new Promise((r) => setTimeout(r, 100));

    // Fake progress while backend processes PDF
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 5 : p));
    }, 400);

    try {
      const res = await fetch(`${API}/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setDocId(data.docId);

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
      clearInterval(progressInterval);
    } finally {
      // Keep bar visible briefly at 100%
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const askQuestion = async () => {
    if (!docId || !question) {
      return alert("Upload PDF and enter a question");
    }

    setAnswer("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId, question }),
      });

      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get answer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="card">
        <h2>📄 PDF Q&A</h2>
        <p className="subtitle">
          Ask questions from your PDF using a local AI (Ollama + Qdrant)
        </p>

        {/* Upload */}
        <div className="section">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button onClick={uploadPdf} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload PDF"}
          </button>

          {uploading && (
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {docId && (
          <div className="doc-id">
            <strong>Document ID:</strong> {docId}
          </div>
        )}

        {/* Question */}
        <div className="section">
          <input
            type="text"
            placeholder="Ask a question from the document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button onClick={askQuestion} disabled={loading}>
            Ask
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loader">
            <div className="spinner" />
            <p>Thinking...</p>
          </div>
        )}

        {/* Answer */}
        {answer && (
          <div className="answer">
            <h4>Answer</h4>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
