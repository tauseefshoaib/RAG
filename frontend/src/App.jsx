import { useState } from "react";

const API = "http://localhost:3000";

function App() {
  const [file, setFile] = useState(null);
  const [docId, setDocId] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadPdf = async () => {
    if (!file) return alert("Select a PDF");

    const formData = new FormData();
    formData.append("pdf", file);

    setUploadProgress(5);
    setLoading(true);

    // Fake progress while backend chunks PDF
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 5 : p));
    }, 400);

    const res = await fetch(`${API}/upload-pdf`, {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);

    const data = await res.json();
    setDocId(data.docId);
    setUploadProgress(100);

    setTimeout(() => {
      setUploadProgress(0);
      setLoading(false);
    }, 500);
  };

  const askQuestion = async () => {
    if (!docId || !question) {
      return alert("Upload PDF and enter a question");
    }

    setAnswer("");
    setLoading(true);

    const res = await fetch(`${API}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId, question }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      setAnswer((prev) => prev + chunk); // 🚀 stream to UI
    }

    setLoading(false);
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
          <button onClick={uploadPdf} disabled={loading}>
            Upload PDF
          </button>

          {uploadProgress > 0 && (
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
            <strong>Document ID:</strong>
            <span>{docId}</span>
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
