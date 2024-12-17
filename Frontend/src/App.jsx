import React, { useState, useRef } from "react";
import axios from "axios";
import { FaSun, FaMoon, FaCamera } from "react-icons/fa";
import logo from "./assets/img.png"; // Import the logo using a relative path

// Inside the JSX:


const ImageUploader = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filteredImages, setFilteredImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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

    axios.post('https://networkbackend.duckdns.org/upload', formData)
      .then((response) => {
        setFilteredImages(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        setLoading(false);
      });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
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

    fetch(imageDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "captured_image.png", { type: "image/png" });
        uploadImage(file);
      });

    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setCameraMode(false);
  };

  const resetUploader = () => {
    setUploadedImage(null);
    setFilteredImages({});
    setCameraMode(false);
    setSelectedImage(null);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleImageClick = (imageData) => {
    setSelectedImage(`data:image/jpeg;base64,${imageData}`);
  };

  const downloadImage = () => {
    const link = document.createElement("a");
    link.href = selectedImage;
    link.download = "filtered_image.jpg";
    link.click();
    setSelectedImage(null);
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
        <div style={{ display: "flex", alignItems: "center" }}>
        <img
  src={logo}
  alt="Logo"
  style={{ width: "100px", height: "100px", marginRight: "15px" }}
/>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Welcome to Photo Booth! 👋</h1>
        </div>
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
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
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
            <div key={filterName} style={{ textAlign: "center", cursor: "pointer" }} onClick={() => handleImageClick(imageData)}>
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

      {selectedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Enlarged" style={{ maxWidth: "80%", maxHeight: "80%", borderRadius: "10px" }} />
          <button style={{ ...buttonStyles, position: "absolute", top: "20px", right: "20px" }} onClick={downloadImage}>
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
