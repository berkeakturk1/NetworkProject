import React, { useState, useRef } from "react";
import axios from "axios";
import { FaSun, FaMoon, FaCamera } from "react-icons/fa";

const ImageUploader = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filteredImages, setFilteredImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);

      uploadImage(file);
    }
  };

  const uploadImage = (file) => {
    const formData = new FormData();
    formData.append("image", file);
    setLoading(true);

    axios
      .post("http://34.29.116.18:5000/upload", formData)
      .then((response) => {
        setFilteredImages(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        setLoading(false);
      });
  };

  const startCamera = () => {
    setCameraMode(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, 300, 300);
    const imageDataUrl = canvasRef.current.toDataURL("image/png");
    setUploadedImage(imageDataUrl);

    // Convert data URL to a file object for upload
    fetch(imageDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "captured_image.png", { type: "image/png" });
        uploadImage(file);
      });

    // Stop the camera
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setCameraMode(false);
  };

  const resetUploader = () => {
    setUploadedImage(null);
    setFilteredImages({});
    setCameraMode(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const themeStyles = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#ffffff" : "#000000",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
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
    marginRight: "10px",
  };

  const imagesContainer = {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    marginTop: "20px",
  };

  return (
    <div style={themeStyles}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Photo Booth - Upload Image</h1>
        <div>
          <button style={buttonStyles} onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
          <button style={buttonStyles} onClick={startCamera}>
            <FaCamera /> Take Picture
          </button>
        </div>
      </div>

      {!uploadedImage && !cameraMode && (
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

      {cameraMode && (
        <div style={{ textAlign: "center" }}>
          <video ref={videoRef} autoPlay style={{ maxWidth: "100%", borderRadius: "10px" }} />
          <canvas ref={canvasRef} width="300" height="300" style={{ display: "none" }} />
          <button style={buttonStyles} onClick={capturePhoto}>
            Capture Photo
          </button>
        </div>
      )}

      {uploadedImage && (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <h3>Original Image:</h3>
          <img src={uploadedImage} alt="Uploaded" style={{ maxWidth: "300px", maxHeight: "300px", borderRadius: "10px" }} />
        </div>
      )}

      {loading && <p style={{ textAlign: "center", marginTop: "20px" }}>Processing image...</p>}

      <div style={imagesContainer}>
        {Object.entries(filteredImages).map(([filterName, imageData]) => (
          imageData && (
            <div key={filterName} style={{ textAlign: "center" }}>
              <h3>{filterName}:</h3>
              <img src={`data:image/jpeg;base64,${imageData}`} alt={filterName} style={{ maxWidth: "300px", maxHeight: "300px", borderRadius: "10px" }} />
            </div>
          )
        ))}
      </div>

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
