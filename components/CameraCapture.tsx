import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Prefer back camera
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions or try uploading a file.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const image = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(image);
        stopCamera();
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirm = () => {
    if (capturedImage) {
      // Remove data:image/jpeg;base64, prefix for API
      const base64Data = capturedImage.split(',')[1];
      onCapture(base64Data);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImage(result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
      {/* Header */}
      <div className="flex justify-between items-center text-white p-2">
        <h2 className="text-lg font-semibold">Snap Fridge</h2>
        <button onClick={onCancel} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
          <X size={24} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl relative bg-gray-900">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${error ? 'hidden' : 'block'}`}
            />
            {error && (
              <div className="text-white text-center p-6">
                <p className="mb-4">{error}</p>
                 <label className="flex flex-col items-center gap-2 cursor-pointer bg-green-600 px-6 py-3 rounded-full">
                  <Upload size={24} />
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            )}
          </>
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Controls */}
      <div className="pt-6 pb-4 flex justify-center items-center gap-8">
        {!capturedImage && !error && (
          <button
            onClick={capture}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform"
          >
            <div className="w-16 h-16 bg-white rounded-full border-2 border-black" />
          </button>
        )}

        {capturedImage && (
          <>
            <button
              onClick={retake}
              className="flex flex-col items-center text-white gap-2 hover:opacity-80"
            >
              <div className="p-4 bg-gray-700 rounded-full">
                <RefreshCw size={24} />
              </div>
              <span className="text-sm">Retake</span>
            </button>
            <button
              onClick={confirm}
              className="flex flex-col items-center text-white gap-2 hover:opacity-80"
            >
              <div className="p-4 bg-green-500 rounded-full">
                <Check size={24} />
              </div>
              <span className="text-sm">Use Photo</span>
            </button>
          </>
        )}
         
         {/* File Upload Fallback visible even when camera is active for convenience */}
         {!capturedImage && !error && (
            <label className="absolute bottom-8 right-8 text-white flex flex-col items-center cursor-pointer opacity-70 hover:opacity-100">
                <Upload size={24} />
                <span className="text-xs mt-1">Upload</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
         )}
      </div>
    </div>
  );
};

export default CameraCapture;