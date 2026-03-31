import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, FlipHorizontal, Loader2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../camera/useCamera";

interface PhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export default function PhotoCapture({
  open,
  onClose,
  onCapture,
}: PhotoCaptureProps) {
  const [tab, setTab] = useState<"upload" | "camera">("upload");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const camera = useCamera({
    facingMode: "user",
    quality: 0.85,
    format: "image/jpeg",
  });

  // Keep a stable ref to stopCamera so we can call it on close without
  // re-running the effect whenever the camera object changes identity.
  const stopCameraRef = useRef(camera.stopCamera);
  stopCameraRef.current = camera.stopCamera;

  // Clean up when dialog closes
  useEffect(() => {
    if (!open) {
      stopCameraRef.current();
      setUploadPreview(null);
      setUploadFile(null);
      setTab("upload");
    }
  }, [open]);

  const handleTabChange = useCallback(
    async (val: string) => {
      setTab(val as "upload" | "camera");
      if (val === "camera") {
        await camera.startCamera();
      } else {
        await camera.stopCamera();
      }
    },
    [camera],
  );

  const handleCapture = useCallback(async () => {
    const file = await camera.capturePhoto();
    if (file) {
      onCapture(file);
      camera.stopCamera();
      onClose();
    }
  }, [camera, onCapture, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadPreview(url);
    setUploadFile(file);
  };

  const handleUploadConfirm = () => {
    if (uploadFile) {
      onCapture(uploadFile);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-lg"
        data-ocid="photo_capture.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-widest">
            Add Photo
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-2 bg-muted/30 border border-border w-full">
            <TabsTrigger value="upload" data-ocid="photo_capture.tab">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
            </TabsTrigger>
            <TabsTrigger value="camera" data-ocid="photo_capture.tab">
              <Camera className="w-3.5 h-3.5 mr-1.5" /> Camera
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            {uploadPreview ? (
              <div className="relative">
                <img
                  src={uploadPreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUploadPreview(null);
                    setUploadFile(null);
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-10 text-center hover:border-primary/50 transition-colors cursor-pointer"
                data-ocid="photo_capture.dropzone"
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to browse or drop an image
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  JPG, PNG, WEBP
                </p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-ocid="photo_capture.cancel_button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUploadConfirm}
                disabled={!uploadFile}
                className="gradient-primary text-white border-0"
                data-ocid="photo_capture.confirm_button"
              >
                Use This Photo
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4 mt-4">
            {camera.error ? (
              <div
                className="text-center py-10 text-destructive text-sm"
                data-ocid="photo_capture.error_state"
              >
                {camera.error.message}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 block mx-auto border-border"
                  onClick={camera.retry}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden bg-black border border-border">
                {camera.isLoading && (
                  <div
                    className="absolute inset-0 flex items-center justify-center z-10 bg-black/50"
                    data-ocid="photo_capture.loading_state"
                  >
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-64 object-cover"
                  style={{
                    transform:
                      camera.currentFacingMode === "user"
                        ? "scaleX(-1)"
                        : "none",
                  }}
                />
                <canvas ref={camera.canvasRef} className="hidden" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-ocid="photo_capture.cancel_button"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => camera.switchCamera()}
                  disabled={camera.isLoading}
                  className="border-border"
                  data-ocid="photo_capture.toggle"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleCapture}
                  disabled={!camera.isActive || camera.isLoading}
                  className="gradient-primary text-white border-0"
                  data-ocid="photo_capture.primary_button"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" /> Capture
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
