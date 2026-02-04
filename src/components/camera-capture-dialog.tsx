
'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface CameraCaptureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoCaptured: (dataUrl: string) => void;
}

export function CameraCaptureDialog({ isOpen, onOpenChange, onPhotoCaptured }: CameraCaptureDialogProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const enableCamera = async () => {
      setHasCameraPermission(null);
      setCapturedImage(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError') {
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings to use this feature.',
                });
            } else if (error.name === 'NotFoundError') {
                toast({
                    variant: 'destructive',
                    title: 'No Camera Found',
                    description: 'We could not find a camera on your device.',
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Camera Error',
                    description: 'An unexpected error occurred while accessing the camera.',
                });
            }
        }
      }
    };

    const disableCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (isOpen) {
      enableCamera();
    } else {
      disableCamera();
    }

    return () => {
      disableCamera();
    };
  }, [isOpen, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        setCapturedImage(canvas.toDataURL('image/jpeg'));
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onPhotoCaptured(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Take a Profile Photo</DialogTitle>
          <DialogDescription>
            Center your face in the frame and click capture.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-secondary">
          
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${capturedImage ? 'hidden' : ''}`}
            autoPlay
            muted
            playsInline
          />
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="h-full w-full object-cover" />
          )}

          {hasCameraPermission === null && (
            <div className="absolute inset-0 flex h-full w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Requesting camera access...</p>
            </div>
          )}

          {hasCameraPermission === false && (
             <div className="absolute inset-0 flex h-full w-full items-center justify-center p-4">
                 <Alert variant="destructive">
                     <Camera className="h-4 w-4" />
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please grant camera permissions in your browser settings to use this feature.
                    </AlertDescription>
                </Alert>
             </div>
          )}
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
        <DialogFooter>
          {capturedImage ? (
            <div className="flex w-full justify-between">
              <Button variant="outline" onClick={handleRetake}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Retake
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="mr-2 h-4 w-4" />
                Confirm Photo
              </Button>
            </div>
          ) : (
            <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
