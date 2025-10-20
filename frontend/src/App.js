import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  const correctPassword = "admin123"; // Change this or load from env

  // Handle login
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsLoggedIn(true);
    } else {
      setError("Incorrect password");
    }
  };

  // Handle PDF file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle PDF upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF file first!");
      return;
    }
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResult(null);



      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.detail || "Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  // Show login form if not logged in
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

  // Main app after login
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🍖 Food Label Extractor</h1>

      <form onSubmit={handleUpload} style={styles.form}>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={styles.fileInput}
        />
        <button type="submit" style={styles.button}>
          Upload PDF
        </button>
      </form>

      {loading && <p style={styles.loading}>Processing PDF...</p>}

      {result && (
        <div style={styles.resultContainer}>
          <section style={styles.section}>
            <h2>Product Name</h2>
            <p>{result.product_name}</p>
          </section>

          <section style={styles.section}>
            <h2>Detected Language</h2>
            <p>{result.detected_language}</p>
          </section>

          <section style={styles.section}>
            <h2>Allergens</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Allergen</th>
                  <th style={styles.th}>Present?</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.allergens).map(([key, value]) => (
                  <tr key={key}>
                    <td style={styles.td}>{key}</td>
                    <td style={styles.td}>{value ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section style={styles.section}>
            <h2>Nutrition per 100g</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nutrient</th>
                  <th style={styles.th}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(result.nutritional_values_per_100g).map(
                  ([key, value]) => (
                    <tr key={key}>
                      <td style={styles.td}>{key}</td>
                      <td style={styles.td}>{value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </section>
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  fileInput: {
    marginRight: "1rem",
    padding: "0.5rem",
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
  loading: {
    textAlign: "center",
    fontStyle: "italic",
  },
  resultContainer: {
    marginTop: "2rem",
  },
  section: {
    marginBottom: "2rem",
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
