import React, { useState, useRef } from "react";
import axios from "axios";
import { FaSun, FaMoon } from "react-icons/fa";

const ImageUploader = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [filteredImages, setFilteredImages] = useState({});
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);

      // Send file to backend
      const formData = new FormData();
      formData.append("image", file);
      setLoading(true);

      axios
        .post("http://127.0.0.1:5000/upload", formData)
        .then((response) => {
          setFilteredImages(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
          setLoading(false);
        });
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const openCamera = () => {
    setCameraMode(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((error) => {
        console.error("Error accessing the camera:", error);
      });
  };

  const takePicture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");
    setUploadedImage(dataUrl);
    setCameraMode(false);

    // Stop the camera stream
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());

    // Send captured image to backend
    const formData = new FormData();
    formData.append("image", dataUrlToFile(dataUrl, "captured.jpg"));
    setLoading(true);

    axios
      .post("http://127.0.0.1:5000/upload", formData)
      .then((response) => {
        setFilteredImages(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error uploading image:", error);
        setLoading(false);
      });
  };

  const dataUrlToFile = (dataUrl, filename) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const themeStyles = {
    backgroundColor: darkMode ? "#121212" : "#f4f4f4",
    color: darkMode ? "#ffffff" : "#000000",
  };

  const buttonStyles = {
    backgroundColor: darkMode ? "#1f1f1f" : "#ffffff",
    color: darkMode ? "#ffffff" : "#000000",
    border: darkMode ? "1px solid #ffffff" : "1px solid #ccc",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  return (
    <div style={{ ...themeStyles, minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Photo Booth - Upload or Capture</h1>
        <button style={buttonStyles} onClick={toggleDarkMode}>
          {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      {/* Camera Mode */}
      {cameraMode && (
        <div style={{ textAlign: "center" }}>
          <video ref={videoRef} style={{ maxWidth: "100%", borderRadius: "10px" }}></video>
          <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
          <button style={{ ...buttonStyles, marginTop: "10px" }} onClick={takePicture}>
            Capture Photo
          </button>
        </div>
      )}

      {/* File Upload */}
      {!cameraMode && !uploadedImage && (
        <div style={{ textAlign: "center" }}>
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
            <p style={{ color: darkMode ? "#aaaaaa" : "#000000" }}>Click or drag & drop an image here</p>
          </div>
          <input
            id="file-input"
            type="file"
            style={{ display: "none" }}
            accept="image/*"
            onChange={handleFileChange}
          />
          <p style={{ margin: "10px 0" }}>Or</p>
          <button style={buttonStyles} onClick={openCamera}>
            Open Camera
          </button>
        </div>
      )}

      {/* Original Image Preview */}
      {uploadedImage && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <h3>Original Image:</h3>
          <img
            src={uploadedImage}
            alt="Uploaded or Captured"
            style={{
              maxWidth: "300px",
              maxHeight: "300px",
              marginBottom: "20px",
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

      {/* Filtered Images Grid */}
      {!loading && Object.keys(filteredImages).length > 0 && (
        <div>
          <h3>Filtered Images:</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {Object.keys(filteredImages).map((filterName) => (
              <div key={filterName} style={{ textAlign: "center" }}>
                <p style={{ marginBottom: "10px" }}>{filterName}</p>
                <img
                  src={`data:image/jpeg;base64,${filteredImages[filterName]}`}
                  alt={filterName}
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "10px",
                    boxShadow: darkMode
                      ? "0 4px 6px rgba(255, 255, 255, 0.1)"
                      : "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
