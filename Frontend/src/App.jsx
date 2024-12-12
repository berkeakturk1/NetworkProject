import React, { useState, useRef } from "react";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";

const ImageUploader = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filteredImage, setFilteredImage] = useState(null); // Single filtered image
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("image", file);
      setLoading(true);

      axios.post("http://34.29.116.18:5000/upload", formData)
  .then((response) => {
    const filtered = response.data["Circle Eyes"];
    setFilteredImage(filtered);  // No prefix added here
    setLoading(false);
  })
  .catch((error) => {
    console.error("Error uploading image:", error);
    setLoading(false);
  });




    }
  };

  const resetUploader = () => {
    setUploadedImage(null);
    setFilteredImage(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileChange(file);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const themeStyles = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#ffffff" : "#000000",
  };

  const buttonStyles = {
    backgroundColor: darkMode ? "#1f1f1f" : "#ffffff",
    color: darkMode ? "#ffffff" : "#000000",
    border: darkMode ? "1px solid #ffffff" : "1px solid #ccc",
    padding: "10px 15px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    marginTop: "15px",
  };

  return (
    <div style={{ ...themeStyles, minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Photo Booth - Upload Image</h1>
        <button style={buttonStyles} onClick={toggleDarkMode}>
          {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Drag-and-Drop or File Upload */}
      {!uploadedImage && (
        <div>
          <div
            style={{
              border: `2px dashed ${darkMode ? "#ffffff" : "#007bff"}`,
              borderRadius: "10px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: darkMode ? "#1f1f1f" : "#ffffff",
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input").click()}
          >
            <p style={{ color: darkMode ? "#aaaaaa" : "#000000" }}>Drag & drop an image here, or click to upload</p>
            <input
              id="file-input"
              type="file"
              style={{ display: "none" }}
              accept="image/*"
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {/* Display Uploaded Image */}
      {uploadedImage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>Original Image:</h3>
          <img
            src={uploadedImage}
            alt="Uploaded"
            style={{
              maxWidth: "300px",
              maxHeight: "300px",
              marginBottom: "15px",
              borderRadius: "10px",
              boxShadow: darkMode
                ? "0 4px 6px rgba(255, 255, 255, 0.1)"
                : "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && <p style={{ textAlign: "center", marginTop: "20px" }}>Processing image...</p>}

      {/* Display Filtered Image */}
      {filteredImage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>Filtered Image (Circle Eyes):</h3>
          <img
            src={`data:image/jpeg;base64,${filteredImage}`}
            alt="Filtered"
            style={{
              maxWidth: "300px",
              maxHeight: "300px",
              borderRadius: "10px",
              boxShadow: darkMode
                ? "0 4px 6px rgba(255, 255, 255, 0.1)"
                : "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: "15px" }}>
            <button style={buttonStyles} onClick={resetUploader}>
              Upload New Picture
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
