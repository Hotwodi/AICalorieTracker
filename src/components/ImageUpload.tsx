import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  selectedImage: File | null;
  onImageSelect: (file: File | null) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const ImageUpload = ({ selectedImage, onImageSelect, onAnalyze, isAnalyzing }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { toast } = useToast();

  const validateImage = (file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleImageSelect = (file: File | null) => {
    if (file && validateImage(file)) {
      onImageSelect(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsCameraActive(false);
    } else {
      onImageSelect(null);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleImageSelect(file);
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] || null;
    handleImageSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const clearImage = () => {
    onImageSelect(null);
    setPreviewUrl(null);
    setIsCameraActive(false);
  };

  const openCamera = () => {
    setIsCameraActive(true);
  };

  useEffect(() => {
    // Cleanup preview URL to prevent memory leaks
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          const video = document.getElementById('camera-preview');
          video.srcObject = stream;
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
        });
    }
  }, [isCameraActive]);

  return (
    <div className="space-y-4">
      {isCameraActive ? (
        <div className="relative w-full aspect-video bg-black">
          <video 
            id="camera-preview" 
            autoPlay 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <Button 
              variant="destructive" 
              onClick={() => setIsCameraActive(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const video = document.getElementById('camera-preview') as HTMLVideoElement;
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
                    handleImageSelect(file);
                  }
                }, 'image/jpeg');
              }}
            >
              Capture
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6
            ${previewUrl ? 'border-primary' : 'border-muted-foreground/25'}
            hover:border-primary/50 transition-colors
            flex flex-col items-center justify-center gap-4
            cursor-pointer
          `}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {previewUrl ? (
            <div className="relative w-full max-w-sm aspect-video">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  clearImage();
                }}
              >
                ×
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-full bg-primary/10">
                <ImageIcon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  Drag & drop an image, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPEG, PNG, and WebP (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </Button>

        <Button
          variant="outline"
          onClick={openCamera}
          className="flex gap-2"
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </Button>

        {selectedImage && (
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Analyze Meal
              </>
            )}
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
};