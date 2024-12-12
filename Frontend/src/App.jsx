import React, { useState, useRef } from "react";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";

const ImageUploader = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filteredImages, setFilteredImages] = useState({}); // Multiple filtered images
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("image", file);
      setLoading(true);

      axios
        .post("http://34.29.116.18:5000/upload", formData)
        .then((response) => {
          setFilteredImages(response.data); // Set all filtered images
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
    setFilteredImages({});
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Photo Booth - Upload Image</h1>
        <button style={buttonStyles} onClick={toggleDarkMode}>
          {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {!uploadedImage && (
        <div
          style={{
            border: `2px dashed ${darkMode ? "#ffffff" : "#007bff"}`,
            borderRadius: "10px",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: darkMode ? "#1f1f1f" : "#ffffff",
          }}
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
      )}

      {uploadedImage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>Original Image:</h3>
          <img
            src={uploadedImage}
            alt="Uploaded"
            style={{ maxWidth: "300px", maxHeight: "300px", borderRadius: "10px" }}
          />
        </div>
      )}

      {loading && <p style={{ textAlign: "center", marginTop: "20px" }}>Processing image...</p>}

      {Object.entries(filteredImages).map(([filterName, imageData]) => (
        imageData && (
          <div key={filterName} style={{ textAlign: "center", marginTop: "20px" }}>
            <h3>{filterName}:</h3>
            <img
              src={`data:image/jpeg;base64,${imageData}`}
              alt={filterName}
              style={{ maxWidth: "300px", maxHeight: "300px", borderRadius: "10px" }}
            />
          </div>
        )
      ))}

      {uploadedImage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button style={buttonStyles} onClick={resetUploader}>
            Upload New Picture
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
