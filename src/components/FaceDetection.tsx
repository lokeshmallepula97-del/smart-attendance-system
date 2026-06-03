import React, { useEffect, useRef, useState } from "react";
import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";

const FaceDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    let model: blazeface.BlazeFaceModel;

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    const loadModel = async () => {
      model = await blazeface.load();
      setStatus("Model Loaded");

      setInterval(async () => {
        if (!videoRef.current) return;

        const predictions = await model.estimateFaces(
          videoRef.current,
          false
        );

        if (predictions.length > 0) {
          setStatus("Face Detected ✅");
        } else {
          setStatus("No Face Found ❌");
        }
      }, 1000);
    };

    setupCamera();
    loadModel();
  }, []);

  return (
    <div>
      <h2>Face Detection</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width={400}
      />

      <p>{status}</p>
    </div>
  );
};

export default FaceDetection;