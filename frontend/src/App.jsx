import { useEffect, useState } from "react";

const API = "http://localhost:3000";

function App() {
  const [file, setFile] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("ALL");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /* ============================
     Fetch uploaded documents
     ============================ */
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API}/documents`);
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  /* ============================
     Upload PDF
     ============================ */

  const uploadFile = async () => {
    if (!file) return alert("Select a file");

    setAnswer("");
    setQuestion("");

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadProgress(5);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p < 90 ? p + 5 : p));
    }, 400);

    try {
      const res = await fetch(`${API}/upload-file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setSelectedDoc(data.docId);

      await fetchDocuments();

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
      clearInterval(progressInterval);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  /* ============================
     Ask Question (Streaming)
     ============================ */
  const askQuestion = async () => {
    if (!question.trim()) {
      return alert("Enter a question");
    }

    setAnswer("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: selectedDoc,
          question,
        }),
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

  /* ============================
     UI
     ============================ */
  return (
    <div className="app">
      <div className="card">
        <div className="header">
          <h2>📄 PDF Q&A</h2>

          {documents.length > 0 && (
            <select
              className="doc-selector"
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              disabled={uploading}
            >
              <option value="ALL">📚 All Documents</option>

              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  📄 {doc.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="context">
          <p className="subtitle">
            Ask questions from uploaded PDFs using local AI
          </p>

          {documents.length > 0 && (
            <div className="doc-id">
              <strong>Context:</strong>
              {selectedDoc === "ALL"
                ? "All Documents"
                : documents.find((d) => d.id === selectedDoc)?.name ||
                  selectedDoc}
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="section">
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button onClick={uploadFile} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload PDF / Image"}
          </button>
        </div>

        {uploading && (
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Active context */}
        {/* <div className="doc-id">
          <strong>Context:</strong>{" "}
          {selectedDoc === "ALL"
            ? "All Documents"
            : documents.find((d) => d.id === selectedDoc)?.name || selectedDoc}
        </div> */}

        {/* Question */}
        <div className="section">
          <input
            type="text"
            placeholder="Ask a question..."
            value={question}
            disabled={uploading}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && !uploading) {
                e.preventDefault();
                askQuestion();
              }
            }}
          />
          <button onClick={askQuestion} disabled={loading || uploading}>
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
