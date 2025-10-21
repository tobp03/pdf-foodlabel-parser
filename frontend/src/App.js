import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import axios from "axios";

// --- Global Variable & Library Loading Fix ---
const Chart = window.Chart; // Reference to Chart.js global object
const CHART_JS_CDN = "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";
const CHART_DATALABELS_CDN = "https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js";

// --- Color & Style Constants (C for Colors, S for Styles) ---
const C = {
    P: '#047857', // Primary: emerald-600
    PH: '#059669', // Primary Hover: emerald-700
    G: '#6b7280', // Gray Text
    GB: '#d1d5db', // Gray Border
    B: '#f9fafb', // Background
    W: '#ffffff', // Card/White
    DB: '#1f2937', // Dark Blue/Gray-900
    R: '#ef4444', // Red
    RB: '#fef2f2', // Red Background
    GBG: '#ecfdf5', // Green Background
    YBG: '#fffbe5', // Yellow Background
    BBG: '#eff6ff', // Blue Background
};

// Base style for all primary and secondary buttons
const buttonBase = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
    border: 'none',
};

const S = {
  // Upload Area
  dropZone: (drag) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    border: `2px dashed ${drag ? C.P : C.GB}`,
    borderRadius: '0.5rem',
    cursor: 'pointer',
    backgroundColor: drag ? C.GBG : C.W,
    transition: 'all 0.3s ease',
  }),

  // Buttons
  primaryBtn: (d) => ({
    ...buttonBase,
    backgroundColor: d ? '#9ca3af' : C.P,
    color: C.W,
    cursor: d ? 'not-allowed' : 'pointer',
  }),
  secondaryBtn: {
    ...buttonBase,
    backgroundColor: C.W,
    color: C.P,
    border: `1px solid ${C.P}`,
  },
  
  // Tab Styles
  tabBtn: (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1.5rem 0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    borderRadius: '0.5rem 0.5rem 0 0',
    transition: 'all 0.2s ease',
    backgroundColor: isActive ? C.W : 'transparent',
    color: isActive ? C.P : C.G,
    border: 'none',
    borderBottom: isActive ? `3px solid ${C.P}` : '1px solid transparent',
    cursor: 'pointer',
  }),
  tabClose: {
    position: 'absolute',
    top: '50%',
    right: '0.15rem',
    transform: 'translateY(-50%)',
    padding: '0.25rem',
    fontSize: '0.75rem',
    color: '#9ca3af',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'color 0.15s ease',
  },
  
  // Login Screen Styles
  loginCard: {
    backgroundColor: C.W,
    padding: '2.5rem',
    borderRadius: '0.75rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #e5e7eb',
  },
  loginInput: (error) => ({
    padding: '0.75rem 1rem',
    border: `1px solid ${error ? C.R : C.GB}`,
    borderRadius: '0.5rem',
    fontSize: '1rem',
    width: '100%',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: error ? '0 0 0 2px #fee2e2' : 'none',
  }),
  loginErr: {
    color: C.R,
    fontSize: '0.875rem',
    marginTop: '0.75rem',
    textAlign: 'center',
    padding: '0.5rem',
    backgroundColor: C.RB,
    borderRadius: '0.5rem',
  },
};

// --- Utility Icons (Using Lucide-like structure with inline SVG) ---
const IconBase = ({ children, ...props }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const UploadIcon = (p) => (<IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></IconBase>);
const DownloadIcon = (p) => (<IconBase {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3" /></IconBase>);
const LockIcon = (p) => (<IconBase {...p}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></IconBase>);
const XIcon = (p) => (<IconBase {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></IconBase>);
const LoaderIcon = (p) => (<IconBase {...p} style={{...p.style, animation: 'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></IconBase>);
const CheckCircleIcon = (p) => (<IconBase {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14 9 11"/></IconBase>);
const AlertCircleIcon = (p) => (<IconBase {...p}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></IconBase>);


// --- Status Badge Component ---
const StatusBadge = ({ status, errorText }) => {
    let badgeStyle, text;
    switch (status) {
      case "pending":
        badgeStyle = { backgroundColor: C.YBG, color: '#a16207', borderColor: '#fef3c7' };
        text = "⏳ Pending";
        break;
      case "processing":
        badgeStyle = { backgroundColor: C.BBG, color: '#1d4ed8', borderColor: '#dbeafe' };
        text = <> <LoaderIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Processing...</>;
        break;
      case "done":
        badgeStyle = { backgroundColor: C.GBG, color: '#065f46', borderColor: '#d1fae5' };
        text = <> <CheckCircleIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Done</>;
        break;
      case "error":
        badgeStyle = { backgroundColor: C.RB, color: '#b91c1c', borderColor: '#fca5a5' };
        text = <> <AlertCircleIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} /> Error</>;
        break;
      default:
        return null;
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: '500', borderRadius: '9999px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid', ...badgeStyle }} title={errorText}>
        {text}
      </span>
    );
};

// --- Radar Chart Constants and Logic ---
const CHART_COLORS = ['rgba(4, 120, 87, 0.8)', 'rgba(37, 99, 235, 0.8)', 'rgba(234, 88, 12, 0.8)'];
const BORDER_COLORS = ['#047857', '#2563eb', '#ea580c'];

// Mapping chart labels (with units) to the actual key in the JSON data
const NUTRIENT_KEY_MAP = {
    "Energy_kcal": "Energy_kcal",
    "Fat_g": "Fat",
    "Carbohydrate_g": "Carbohydrate",
    "Sugar_g": "Sugar",
    "Protein_g": "Protein",
    "Sodium_mg": "Sodium"
};
const CHART_NUTRIENT_KEYS = Object.keys(NUTRIENT_KEY_MAP);


// Helper function to process data for the radar chart
const processChartData = (results) => {
    const doneResults = results.filter(r => r.status === "done" && r.data);
    
    // 1. Gather all numerical nutrient data for min/max calculation
    const allNutrientData = {};
    CHART_NUTRIENT_KEYS.forEach(key => allNutrientData[key] = []);

    doneResults.forEach(r => {
        const n = r.data.nutritional_values_per_100g;
        CHART_NUTRIENT_KEYS.forEach(chartKey => {
            const jsonKey = NUTRIENT_KEY_MAP[chartKey]; 
            const value = parseFloat(n[jsonKey] || 0) || 0; 
            allNutrientData[chartKey].push(value);
        });
    });

    // 2. Determine the maximum value for each nutrient category
    const maxMap = {};
    CHART_NUTRIENT_KEYS.forEach(key => {
        const values = allNutrientData[key].filter(v => typeof v === 'number');
        // Max is the highest recorded value for that nutrient, default to 1 if no data or max is 0
        maxMap[key] = (values.length > 0) 
            ? Math.max(...values, 1) // Ensure max is at least 1 to prevent division by zero/zero scale
            : 1;
    });

    // 3. Create datasets using scaled values (0-100) and store raw values for tooltips/labels
    const datasets = doneResults.map((r, index) => {
        const rawValues = [];
        const scaledData = CHART_NUTRIENT_KEYS.map(chartKey => {
            const n = r.data.nutritional_values_per_100g;
            const jsonKey = NUTRIENT_KEY_MAP[chartKey];
            
            const rawValue = parseFloat(n[jsonKey] || 0) || 0;
            rawValues.push(rawValue);

            // Scale value based on the max in that category (0-100%)
            const maxVal = maxMap[chartKey];
            const scaled = (rawValue / maxVal) * 100;
            return scaled;
        });
        
        const label = r.data.product_name_english || r.data.product_name || r.fileName;
        const colorIndex = index % CHART_COLORS.length;
        
        return {
            label: label,
            data: scaledData,
            rawValues: rawValues, // Store raw values to be used in tooltips/ticks
            backgroundColor: CHART_COLORS[colorIndex].replace('0.8', '0.2'),
            borderColor: BORDER_COLORS[colorIndex],
            pointBackgroundColor: BORDER_COLORS[colorIndex],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: BORDER_COLORS[colorIndex],
            borderWidth: 2,
        };
    });

    // 4. Create labels
    const labels = CHART_NUTRIENT_KEYS.map(key => {
        const unit = key.endsWith('_g') ? ' (g)' : key.endsWith('_mg') ? ' (mg)' : key.includes('kcal') ? ' (kcal)' : '';
        const name = key.replace(/_g$/, '').replace(/_mg$/, '').replace('Energy_kcal', 'Energy');
        const maxVal = maxMap[key];
        // Display the dynamic max value as part of the label for clarity
        return `${name}${unit} (Max: ${maxVal.toFixed(1)}${unit.replace(/[\(\)]/g, '')})`;
    });

    return { datasets, labels, maxMap };
};


// --- NutrientRadarChart Component (Wrapped in memo for performance) ---
const NutrientRadarChart = memo(({ results, isChartJsLoaded }) => {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!isChartJsLoaded || !window.Chart || !canvasRef.current) return;
        
        const Chart = window.Chart;
        const { datasets, labels, maxMap } = processChartData(results);

        if (chartInstance.current) chartInstance.current.destroy();

        if (datasets.length === 0) return;

        if (window.ChartDataLabels) Chart.register(window.ChartDataLabels);

        // Function to determine the unit based on the key map index
        const getUnit = (dataIndex) => {
            const nutrientKey = CHART_NUTRIENT_KEYS[dataIndex];
            if (nutrientKey.endsWith('_g')) return 'g';
            if (nutrientKey.endsWith('_mg')) return 'mg';
            if (nutrientKey.includes('kcal')) return 'kcal';
            return '';
        };

        chartInstance.current = new Chart(canvasRef.current, {
            type: 'radar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                elements: { line: { tension: 0.4, borderWidth: 3 } },
                scales: {
                    r: {
                        angleLines: { display: true },
                        grid: { color: C.GB },
                        suggestedMin: 0, 
                        suggestedMax: 100, // Maximum is 100% since data is scaled
                        pointLabels: { color: C.DB, font: { size: 12, weight: '600' } },
                        ticks: {
                            color: C.G,
                            backdropColor: C.W,
                            showLabelBackdrop: true,
                            font: { size: 10 },
                            // Custom callback to convert the scaled 0-100% value back to a raw number
                            callback: function(value) {
                                // We display the tick value as a percentage of the max for the spoke
                                return `${value.toFixed(0)}%`; 
                            },
                        },
                    },
                },
                plugins: {
                    legend: { position: 'top', labels: { color: '#374151', font: { size: 12 } } },
                    tooltip: {
                        callbacks: {
                            // Display the raw value and unit in the tooltip
                            label: (ctx) => {
                                // ctx.dataIndex is the spoke index
                                const rawValue = ctx.dataset.rawValues[ctx.dataIndex];
                                const unit = getUnit(ctx.dataIndex);
                                return `${ctx.dataset.label}: ${rawValue.toFixed(1)}${unit}`;
                            },
                            // Override the title to show the specific nutrient's maximum value
                            title: (ctx) => {
                                const nutrientKey = CHART_NUTRIENT_KEYS[ctx[0].dataIndex];
                                const maxVal = maxMap[nutrientKey];
                                const unit = getUnit(ctx[0].dataIndex);
                                return `${ctx[0].label.split(' (Max:')[0]} (Max: ${maxVal.toFixed(1)}${unit})`;
                            }
                        }
                    },
                    datalabels: { display: false }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [results, isChartJsLoaded]); // Dependencies ensure it only runs when data or loading status changes
    
    if (!isChartJsLoaded || results.filter(r => r.status === "done").length < 1) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem', border: `1px dashed ${C.GB}`, borderRadius: '0.5rem', color: C.G }}>
                {isChartJsLoaded ? "Upload and process at least one PDF to view the nutritional chart comparison." : "Loading chart libraries..."}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%' }}></canvas>
        </div>
    );
}); // <-- Wrapped in React.memo here!

// --- Login Screen Component ---
const LoginScreen = ({ passwordInput, setPasswordInput, handleLogin, loginError }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: C.B }}>
      <div style={S.loginCard}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <LockIcon style={{ width: '2.5rem', height: '2.5rem', color: C.P, marginBottom: '0.75rem' }} />
          <h1 style={{ fontSize: '1.875rem', fontWeight: '800', color: C.DB }}>Secure Access</h1>
          <p style={{ color: C.G, marginTop: '0.25rem' }}>Enter your password to proceed.</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={S.loginInput(!!loginError)}
            autoFocus
          />
          <button type="submit" style={S.primaryBtn(false)} onMouseOver={e => e.currentTarget.style.backgroundColor = C.PH} onMouseOut={e => e.currentTarget.style.backgroundColor = C.P}>
            Sign In
          </button>
        </form>
        {loginError && (<p style={S.loginErr}>{loginError}</p>)}
      </div>
    </div>
);

// --- Main App Component ---
function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChartJsLoaded, setIsChartJsLoaded] = useState(false);

  const inputRef = useRef(null);
  const correctPassword = "admin123";

  // --- CHART.JS SCRIPT LOADING EFFECT ---
  useEffect(() => {
    if (window.Chart || isChartJsLoaded) { if (window.Chart) setIsChartJsLoaded(true); return; }

    const loadScript = (src, onLoad, onError) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = onLoad;
        script.onerror = onError;
        document.head.appendChild(script);
        return script;
    }
    
    // Load main Chart.js
    loadScript(CHART_JS_CDN, () => {
        // Load plugin after main library
        loadScript(CHART_DATALABELS_CDN, () => setIsChartJsLoaded(true), () => {
            console.error("Failed to load Chart.js Datalabels plugin.");
            setIsChartJsLoaded(true); 
        });
    }, () => console.error("Failed to load Chart.js main library."));
  }, []); 

  // Login handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect password ");
      setPasswordInput("");
    }
  };

  // Add files to state and initialize results
  const addFiles = (selectedFiles) => {
    const newFileObjects = Array.from(selectedFiles).filter(
      (file) => !files.some((f) => f.name === file.name)
    );

    const newResults = newFileObjects.map((file) => ({
      fileName: file.name,
      status: "pending",
      data: null,
      error: null,
    }));

    setFiles((prev) => [...prev, ...newFileObjects]);
    setResults((prev) => [...prev, ...newResults]);
    if (activeTab === null && newFileObjects.length > 0) setActiveTab(newFileObjects[0].name);
  };

  // Handle input selection
  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = null;
  };

  // Handle drag-and-drop
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  // Sequential upload
  const handleUpload = async (e) => {
    e.preventDefault();
    const filesToProcess = results.filter(r => r.status === "pending" || r.status === "error");
    if (!filesToProcess.length || isUploading) return;
    
    setIsUploading(true);
    const updatedResults = [...results];

    for (const resultToProcess of filesToProcess) {
      const file = files.find(f => f.name === resultToProcess.fileName);
      const resultIndex = updatedResults.findIndex(r => r.fileName === resultToProcess.fileName);

      if (!file || resultIndex === -1) continue; // Should not happen if state is consistent
      
      updatedResults[resultIndex].status = "processing";
      setResults([...updatedResults]);

      if (file.type !== "application/pdf") {
        updatedResults[resultIndex].status = "error";
        updatedResults[resultIndex].error = "Not a PDF file. Please upload PDF documents only.";
        setResults([...updatedResults]);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post("/api/process_pdf", formData, { headers: { "Content-Type": "multipart/form-data" } });
        updatedResults[resultIndex].status = "done";
        updatedResults[resultIndex].data = response.data;
        updatedResults[resultIndex].error = null;
      } catch (err) {
        console.error("Upload Error:", err);
        updatedResults[resultIndex].status = "error";
        updatedResults[resultIndex].error = err.response?.data?.detail || "The API service is currently unreachable or failed to process the PDF.";
      }
      setResults([...updatedResults]);
    }
    
    setIsUploading(false);
  };

  // CSV Generation and Download
  const downloadCsv = useCallback(() => {
    const doneResults = results.filter(r => r.status === "done" && r.data);
    if (!doneResults.length) return;

    const headers = ["filename", "product_name", "product_name_english", "Gluten", "Egg", "Crustaceans", "Fish", "Peanut", "Soy", "Milk", "Tree_nuts", "Celery", "Mustard", "Energy_KJ", "Energy_kcal", "Fat_g", "Carbohydrate_g", "Sugar_g", "Protein_g", "Sodium_mg"];

    const escapeCsv = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const rows = doneResults.map(r => {
      const { allergens: a, nutritional_values_per_100g: n } = r.data;
      return [
        escapeCsv(r.fileName), escapeCsv(r.data.product_name || "N/A"), escapeCsv(r.data.product_name_english || "N/A"),
        a.Gluten ? "Yes" : "No", a.Egg ? "Yes" : "No", a.Crustaceans ? "Yes" : "No", a.Fish ? "Yes" : "No", 
        a.Peanut ? "Yes" : "No", a.Soy ? "Yes" : "No", a.Milk ? "Yes" : "No", a.Tree_nuts ? "Yes" : "No", 
        a.Celery ? "Yes" : "No", a.Mustard ? "Yes" : "No",
        n.Energy_KJ ?? "NA", n.Energy_kcal ?? "NA", n.Fat ?? "NA", n.Carbohydrate ?? "NA", n.Sugar ?? "NA", n.Protein ?? "NA", n.Sodium ?? "NA"
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `food_label_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results]);

  // Remove file handler
  const removeFile = (fileName) => {
    const newFiles = files.filter(f => f.name !== fileName);
    const newResults = results.filter(res => res.fileName !== fileName);
    setFiles(newFiles);
    setResults(newResults);
    if (activeTab === fileName) setActiveTab(newResults[0]?.fileName || null);
  };

  // --- Main App Render ---
  if (!isLoggedIn) {
    return <LoginScreen passwordInput={passwordInput} setPasswordInput={setPasswordInput} handleLogin={handleLogin} loginError={loginError} />;
  }

  const activeResult = results.find((r) => r.fileName === activeTab);
  const doneResults = results.filter(r => r.status === "done" && r.data);
  // Calculate files that are pending or errored and need processing/re-processing
  const filesToProcess = results.filter(r => r.status === "pending" || r.status === "error");
  const processCount = filesToProcess.length;


  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.B, padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: C.DB, textAlign: 'center', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="https://placehold.co/40x40/047857/ffffff?text=FL" alt="Logo" style={{ marginRight: '0.75rem', borderRadius: '0.375rem' }} />
            Food Label Extractor
        </h1>
        <p style={{ textAlign: 'center', color: C.G, marginBottom: '1.5rem' }}>Automate the extraction of nutritional and allergen data from PDF food labels.</p>
        
        {/* Upload/Action Area */}
        <div style={{ backgroundColor: C.W, padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}>
            <div style={{ ...S.dropZone(dragActive), marginBottom: '1rem' }} onClick={() => inputRef.current.click()}>
              <UploadIcon style={{ width: '2rem', height: '2rem', color: '#9ca3af', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4b5563', textAlign: 'center' }}>
                Drag & drop PDF files here, or <span style={{ color: C.P, fontWeight: '600' }}>click to browse</span>.
              </p>
              <input ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: "none" }} onChange={handleFileChange} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                {/* Updated the disabled logic and the count displayed in the button */}
                <button type="submit" disabled={!processCount || isUploading} style={S.primaryBtn(!processCount || isUploading)} 
                    onMouseOver={(e) => { if (!processCount || isUploading) return; e.currentTarget.style.backgroundColor = C.PH; e.currentTarget.style.transform = 'scale(1.01)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = C.P; e.currentTarget.style.transform = 'scale(1)'; }}>
                {isUploading ? (<><LoaderIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: C.W }} />Processing...</>) : (<><UploadIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: C.W }} />Process {processCount} File(s)</>)}
                </button>

                {doneResults.length > 0 && (
                    <button onClick={downloadCsv} style={S.secondaryBtn} onMouseOver={(e) => e.currentTarget.style.backgroundColor = C.GBG} onMouseOut={(e) => e.currentTarget.style.backgroundColor = C.W}>
                        <DownloadIcon style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                        Download CSV
                    </button>
                )}
            </div>
          </form>
        </div>
        
        {/* Radar Chart Comparison Section */}
        <div style={{ backgroundColor: C.W, padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: C.P, marginBottom: '0.75rem', borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>Nutrition Comparison</h3>
            {/* The component is memoized now to prevent unnecessary re-renders */}
            <NutrientRadarChart results={doneResults} isChartJsLoaded={isChartJsLoaded} /> 
            <p style={{marginTop: '1rem', fontSize: '0.875rem', color: C.G, textAlign: 'center'}}>
                *Chart shows values scaled to each category's max (100%). Hover to see actual values in g, mg, or kcal.
            </p>
        </div>

        {/* Tabs for File Results */}
        {results.length > 0 && (
          <div style={{ marginBottom: '1.5rem', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.GB}` }}>
            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '2px' }}>
              {results.map((r) => {
                const isActive = activeTab === r.fileName;
                const shortName = r.fileName.length > 20 ? r.fileName.slice(0, 17) + "..." : r.fileName;
                return (
                  <div key={r.fileName} style={{ display: 'inline-block', position: 'relative' }}>
                    <button style={S.tabBtn(isActive)} onClick={() => setActiveTab(r.fileName)} title={r.fileName}>
                      {shortName}
                      {r.status === 'done' && <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: C.P, marginLeft: '0.25rem' }} />}
                      {r.status === 'error' && <AlertCircleIcon style={{ width: '1rem', height: '1rem', color: C.R, marginLeft: '0.25rem' }} />}
                      {r.status === 'processing' && <LoaderIcon style={{ width: '1rem', height: '1rem', color: '#2563eb', marginLeft: '0.25rem' }} />}
                    </button>
                    <button style={{...S.tabClose, color: isActive ? C.G : '#9ca3af'}} onClick={(e) => { e.stopPropagation(); removeFile(r.fileName); }} title="Remove file" onMouseOver={(e) => e.currentTarget.style.color = C.R} onMouseOut={(e) => e.currentTarget.style.color = isActive ? C.G : '#9ca3af'}>
                        <XIcon style={{ width: '1rem', height: '1rem' }} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Result View */}
        {activeResult && (
          <div style={{ backgroundColor: C.W, padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid #e5e7eb`, paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: C.DB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeResult.fileName}>
                    {activeResult.fileName}
                </h2>
                <StatusBadge status={activeResult.status} errorText={activeResult.error} />
            </div>

            {activeResult.status === "error" && (
                <div style={{ padding: '1rem', backgroundColor: C.RB, border: '1px solid #fecaca', color: C.R, borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Processing Failed</h4>
                    <p style={{ fontSize: '0.875rem' }}>{activeResult.error}</p>
                    <button onClick={() => removeFile(activeResult.fileName)} style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: C.R, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Remove this file
                    </button>
                </div>
            )}

            {activeResult.status === "done" && activeResult.data && (
              <div style={{ marginBottom: '2rem' }}>
                {/* Product Section */}
                <section>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: C.P, marginBottom: '0.75rem', borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>Product Identification</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: C.B, borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: C.G }}>Product Name (Local)</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: '700', color: C.DB }}>{activeResult.data.product_name || "N/A"}</p>
                        </div>
                        <div style={{ padding: '0.75rem', backgroundColor: C.B, borderRadius: '0.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                            <p style={{ fontSize: '0.875rem', fontWeight: '500', color: C.G }}>Product Name (English)</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: '700', color: C.DB }}>{activeResult.data.product_name_english || "N/A"}</p>
                        </div>
                    </div>
                </section>

                {/* Allergens Section */}
                <section>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: C.P, marginBottom: '0.75rem', borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>Allergens Summary</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                    {Object.entries(activeResult.data.allergens).map(([key, value]) => {
                        const isDetected = !!value;
                        const itemStyle = { padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                            backgroundColor: isDetected ? C.RB : C.GBG, border: `1px solid ${isDetected ? '#fca5a5' : '#a7f3d0'}` };
                        return (
                        <div key={key} style={itemStyle}>
                            <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>{isDetected ? "⚠️" : "✔️"}</span>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>{key}</p>
                                <p style={{ fontSize: '0.75rem', color: C.G }}>{isDetected ? "Detected" : "Not Found"}</p>
                            </div>
                        </div>
                    )})}
                  </div>
                </section>

                {/* Nutrition Section */}
                <section style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: C.P, marginBottom: '0.75rem', borderBottom: '1px solid #dcfce7', paddingBottom: '0.5rem' }}>Nutritional Values (per 100g)</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ minWidth: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                      <thead style={{ backgroundColor: C.B, borderBottom: '1px solid #e5e7eb' }}>
                        <tr>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: C.G, textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '0.5rem' }}>Nutrient</th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: C.G, textTransform: 'uppercase', letterSpacing: '0.05em', borderTopRightRadius: '0.5rem' }}>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(activeResult.data.nutritional_values_per_100g).map(([key, value], index) => (
                            <tr 
                              key={key} 
                              style={{ 
                                backgroundColor: index % 2 === 0 ? C.W : C.B,
                                transition: 'background-color 0.1s ease',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? C.W : C.B}
                            >
                              <td style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', borderBottom: `1px solid #f3f4f6`, fontWeight: '500', color: C.DB }}>{key.replace(/_/g, ' ')}</td>
                              <td style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', borderBottom: `1px solid #f3f4f6`, color: C.G, fontFamily: 'monospace' }}>{value ?? "NA"}</td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
