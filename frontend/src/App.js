import React, { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]); // Array of files
  const [results, setResults] = useState([]); // Array of {fileName, status, data, error}
  const [activeTab, setActiveTab] = useState(null); // Current selected tab
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const inputRef = useRef(null);
  const correctPassword = "admin123";

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsLoggedIn(true);
    } else {
      setError("Incorrect password");
    }
  };

  // Add files to state and initialize results
  const addFiles = (selectedFiles) => {
    const newResults = selectedFiles.map((file) => ({
      fileName: file.name,
      status: "pending",
      data: null,
      error: null,
    }));
    setFiles((prev) => [...prev, ...selectedFiles]);
    setResults((prev) => [...prev, ...newResults]);
    if (activeTab === null && selectedFiles.length > 0) {
      setActiveTab(selectedFiles[0].name);
    }
  };

  // Handle input selection
  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
  };

  // Handle drag-and-drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  };
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  // Sequential upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return;

    const updatedResults = [...results];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      updatedResults[i].status = "processing";
      setResults([...updatedResults]);

      if (file.type !== "application/pdf") {
        updatedResults[i].status = "error";
        updatedResults[i].error = "Not a PDF file";
        setResults([...updatedResults]);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post(
          "http://164.90.208.125:8000/process_pdf",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        updatedResults[i].status = "done";
        updatedResults[i].data = response.data;
      } catch (err) {
        console.error(err);
        updatedResults[i].status = "error";
        updatedResults[i].error = err.response?.data?.detail || "Upload failed";
      }

      setResults([...updatedResults]);
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>🔒 Login</h1>
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={styles.fileInput}
          />
          <button type="submit" style={styles.button}>
            Login
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  // Current active PDF result
  const activeResult = results.find((r) => r.fileName === activeTab);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍖 Food Label Extractor</h1>

      <form
        onSubmit={handleUpload}
        style={styles.form}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div
          style={{
            ...styles.dropZone,
            borderColor: dragActive ? "#4caf50" : "#aaa",
            backgroundColor: dragActive ? "#e8f5e9" : "#fff",
          }}
          onClick={() => inputRef.current.click()}
        >
          <p>Drag & drop PDFs here or click to choose files</p>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
        <button type="submit" style={styles.button}>
          Upload PDFs
        </button>
      </form>

{/* Tabs */}
{results.length > 0 && (
  <div style={styles.tabs}>
    {results.map((r) => {
      // Shortened filename
      const shortName =
        r.fileName.length > 10 ? r.fileName.slice(0, 10) + "…" : r.fileName;

      return (
        <div key={r.fileName} style={styles.tabWrapper}>
          <button
            style={{
              ...styles.tabButton,
              borderBottom:
                activeTab === r.fileName ? "3px solid #4caf50" : "none",
              fontWeight: activeTab === r.fileName ? "bold" : "normal",
              position: "relative",
              paddingRight: "1.5rem", // space for close button
            }}
            onClick={() => setActiveTab(r.fileName)}
          >
            {shortName}{" "}
            {r.status === "processing" && <span className="spinner"></span>}

            {r.status === "error" && " ❌"}
            {r.status === "done" && "" /* No checkmark */}
            {/* Close button inside tab */}
            <span
              style={styles.tabCloseButton}
              onClick={(e) => {
                e.stopPropagation(); // Prevent activating tab
                const newFiles = files.filter(f => f.name !== r.fileName);
                const newResults = results.filter(res => res.fileName !== r.fileName);
                setFiles(newFiles);
                setResults(newResults);
                if (activeTab === r.fileName) {
                  setActiveTab(newResults[0]?.fileName || null);
                }
              }}
            >
              ×
            </span>
          </button>
        </div>
      );
    })}
  </div>
)}


      {/* Active PDF details */}
      {activeResult && (
        <div style={styles.resultContainer}>
          <h2>{activeResult.fileName}</h2>
          <p>
            Status:{" "}
            {activeResult.status === "pending" && "⏳ Pending"}
            {activeResult.status === "processing" && "🔄 Processing..."}
            {activeResult.status === "done" && "✅ Done"}
            {activeResult.status === "error" && (
              <span style={{ color: "red" }}>❌ {activeResult.error}</span>
            )}
          </p>

          {activeResult.status === "done" && activeResult.data && (
            <div>
              <section style={styles.section}>
                <h3>Product Name</h3>
                <p>{activeResult.data.product_name}</p>
              </section>

              <section style={styles.section}>
                <h3>Detected Language</h3>
                <p>{activeResult.data.detected_language}</p>
              </section>

              <section style={styles.section}>
                <h3>Allergens</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Allergen</th>
                      <th style={styles.th}>Present?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(activeResult.data.allergens).map(
                      ([key, value]) => (
                        <tr key={key}>
                          <td style={styles.td}>{key}</td>
                          <td style={styles.td}>{value ? "✅" : "❌"}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </section>

              <section style={styles.section}>
                <h3>Nutrition per 100g</h3>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Nutrient</th>
                      <th style={styles.th}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(
                      activeResult.data.nutritional_values_per_100g
                    ).map(([key, value]) => (
                      <tr key={key}>
                        <td style={styles.td}>{key}</td>
                        <td style={styles.td}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: "2rem",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  dropZone: {
    width: "100%",
    padding: "2rem",
    border: "2px dashed #aaa",
    borderRadius: "6px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  button: {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#4caf50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    marginBottom: "1rem",
    gap: "0.5rem",
  },
  tabWrapper: {
    position: "relative",
  },
  tabButton: {
    padding: "0.4rem 0.8rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    position: "relative",
    paddingRight: "1.5rem", // space for close button
  },
  tabCloseButton: {
    position: "absolute",
    top: "2px",
    right: "4px",
    background: "transparent",
    border: "none",
    color: "#888",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  spinner: {
    width: "12px",
    height: "12px",
    border: "2px solid #ccc",
    borderTop: "2px solid #4caf50",
    borderRadius: "50%",
    display: "inline-block",
    marginLeft: "4px",
    animation: "spin 1s linear infinite",
  },
  resultContainer: {
    marginBottom: "2rem",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "6px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  section: {
    marginBottom: "1.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "0.5rem",
    borderBottom: "2px solid #333",
  },
  td: {
    textAlign: "left",
    padding: "0.5rem",
    borderBottom: "1px solid #ddd",
  },

};

export default App;
