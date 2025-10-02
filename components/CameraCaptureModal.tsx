import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, X, Loader2, Zap, ZapOff, Sun, FileText } from 'lucide-react';
import Button from './ui/Button';
import { api } from '../services/api';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string, mimeType: string) => void;
  captureGuidance?: 'document' | 'profile' | 'none';
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture, captureGuidance = 'none' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFlashSupported, setIsFlashSupported] = useState(false);
  const [isScreenFlashOn, setIsScreenFlashOn] = useState(false);
  const [isScreenFlashActive, setIsScreenFlashActive] = useState(false);
  const [facingMode, setFacingMode] = useState<string | undefined>();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    stopCamera();
    setCapturedImage(null);
    setIsFlashOn(false);
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        // FIX: Cast `capabilities` to `any` to access the `torch` property, which may not be in the default TypeScript lib definition.
        setIsFlashSupported(!!(capabilities as any).torch);
        setFacingMode(videoTrack.getSettings().facingMode);
      } else {
        setIsFlashSupported(false);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions and ensure it is not in use by another app.");
    }
  }, [stopCamera]);

  useEffect(() => {
    const initialize = async () => {
        if (isOpen) {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameras(videoDevices);
                if (videoDevices.length > 0) {
                    const backCameraIndex = videoDevices.findIndex(d => d.label.toLowerCase().includes('back'));
                    const initialIndex = backCameraIndex !== -1 ? backCameraIndex : 0;
                    setCurrentCameraIndex(initialIndex);
                } else {
                    setError("No camera found on this device.");
                }
            } catch (err) {
                setError("Could not enumerate devices. Please check permissions.");
            }
        } else {
            stopCamera();
        }
    };
    initialize();
    return () => stopCamera();
  }, [isOpen, stopCamera]);
  
  useEffect(() => {
      if (isOpen && cameras.length > 0) {
          startCamera(cameras[currentCameraIndex].deviceId);
      }
  }, [isOpen, currentCameraIndex, cameras, startCamera]);


  const captureImageFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
    }
  };

  const handleCapture = () => {
    if (facingMode === 'user' && isScreenFlashOn) {
        setIsScreenFlashActive(true);
        setTimeout(() => {
            captureImageFromVideo();
            setIsScreenFlashActive(false);
        }, 100);
    } else {
        captureImageFromVideo();
    }
  };

  const handleRetake = () => {
    setError(null);
    setCapturedImage(null);
    startCamera(cameras[currentCameraIndex]?.deviceId);
  };
  
  const handleToggleFlash = async () => {
    if (!streamRef.current || !isFlashSupported) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    try {
        // FIX: Cast the constraint object to 'any' to allow the non-standard 'torch' property.
        await videoTrack.applyConstraints({
            advanced: [{ torch: !isFlashOn } as any]
        });
        setIsFlashOn(!isFlashOn);
    } catch (err) {
        console.error('Failed to toggle flash', err);
        setError('Could not control the flash.');
    }
  };

  const handleUsePhoto = async () => {
    if (capturedImage) {
        setIsProcessing(true);
        try {
            const originalBase64 = capturedImage.split(',')[1];
            
            setProcessingMessage("Enhancing photo with AI...");
            const enhancedBase64 = captureGuidance === 'document' 
                ? await api.enhanceDocumentPhoto(originalBase64, 'image/jpeg')
                : null;
            
            const finalBase64 = enhancedBase64 || originalBase64;
            if (enhancedBase64) {
              setCapturedImage(`data:image/jpeg;base64,${enhancedBase64}`);
            }

            setProcessingMessage("Processing...");
            await onCapture(finalBase64, 'image/jpeg');
            onClose();

        } catch (err: any) {
            setError(err.message || 'Processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal="true" aria-labelledby="camera-modal-title">
        {isScreenFlashActive && <div className="absolute inset-0 bg-white z-50"></div>}
        
        {isProcessing && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-white" />
            <p className="mt-4 text-lg font-semibold">{processingMessage}</p>
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-20 flex justify-between items-center">
            <h3 id="camera-modal-title" className="text-lg font-bold">Capture Photo</h3>
            <Button variant="icon" className="!text-white hover:!bg-white/20" size="sm" onClick={onClose} aria-label="Close camera"><X className="h-6 w-6"/></Button>
        </div>

        <div className="flex-grow relative flex items-center justify-center overflow-hidden">
          {!capturedImage && captureGuidance === 'document' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none p-8">
              <div className="w-full h-full max-w-md max-h-[300px] border-4 border-dashed border-white/70 rounded-2xl flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
                <FileText className="h-12 w-12 text-white/70 mb-4" />
                <p className="text-white/90 font-semibold text-center">Position document inside the frame</p>
              </div>
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center bg-black/50 z-10">{error}</div>}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`} title="Live camera feed" />
          {capturedImage && <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
            {error && <div className="mb-2 p-3 bg-red-500/30 text-white text-sm rounded-lg text-center">{error}</div>}

            <div className="flex justify-around items-center">
              {capturedImage ? (
                  <>
                      <Button onClick={handleRetake} variant="secondary" size="lg" className="!rounded-full !p-4"><RefreshCw className="h-6 w-6" /></Button>
                      <Button onClick={handleUsePhoto} size="lg" className="!rounded-full !p-4"><Check className="h-6 w-6" /></Button>
                  </>
              ) : (
                  <>
                      <div className="w-16 h-16 flex items-center justify-center">
                          {facingMode === 'environment' && isFlashSupported && (
                              <Button onClick={handleToggleFlash} variant="icon" className="!text-white hover:!bg-white/20 !rounded-full !p-3" aria-label={isFlashOn ? "Turn off flash" : "Turn on flash"}>
                                  {isFlashOn ? <ZapOff className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                              </Button>
                          )}
                          {facingMode === 'user' && (
                              <Button onClick={() => setIsScreenFlashOn(!isScreenFlashOn)} variant="icon" className={`!rounded-full !p-3 ${isScreenFlashOn ? '!text-yellow-400' : '!text-white'} hover:!bg-white/20`} aria-label={isScreenFlashOn ? "Turn off screen flash" : "Turn on screen flash"}>
                                  <Sun className="h-6 w-6" />
                              </Button>
                          )}
                      </div>
                      <Button onClick={handleCapture} disabled={!!error && !streamRef.current} size="lg" className="!rounded-full !w-20 !h-20" aria-label="Capture photo">
                          <Camera className="h-8 w-8" />
                      </Button>
                      <div className="w-16 h-16 flex items-center justify-center">
                          {cameras.length > 1 && (
                              <Button onClick={() => setCurrentCameraIndex(i => (i + 1) % cameras.length)} variant="icon" className="!text-white hover:!bg-white/20 !rounded-full !p-3" aria-label="Switch camera">
                                  <RefreshCw className="h-6 w-6" />
                              </Button>
                          )}
                      </div>
                  </>
              )}
            </div>
        </div>
    </div>
  );
};
export default CameraCaptureModal;