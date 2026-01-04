import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Upload, Trash2 } from "lucide-react";
import { compressImage, validateImageFile } from "../lib/imageUtils";
import { toast } from "sonner";

export default function ImageUpload({ value, onChange, preview: initialPreview, maxWidth = 800, maxHeight = 800 }) {
  const [preview, setPreview] = useState(initialPreview || value || null);
  const [imageError, setImageError] = useState(false);
  const inputIdRef = useRef(`image-upload-${Math.random().toString(36).substr(2, 9)}`);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        e.target.value = "";
        return;
      }

      try {
        const compressedBase64 = await compressImage(file, maxWidth, maxHeight);
        setPreview(compressedBase64);
        setImageError(false);
        onChange(compressedBase64);
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Error processing image");
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setImageError(false);
    onChange("");
  };

  // Sync preview with value prop
  useEffect(() => {
    if (value !== preview && value !== undefined) {
      setPreview(value || null);
    }
  }, [value]);

  return (
    <div>
      <Label>Image</Label>
      <div className="mt-2">
        {preview && (
          <div className="mb-2 border rounded-md overflow-hidden">
            {imageError ? (
              <div className="w-full h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted">
                Failed to load image
              </div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain bg-muted"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
              />
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputIdRef.current).click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {preview ? "Change Image" : "Upload Image"}
          </Button>
          <input
            type="file"
            id={inputIdRef.current}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          {preview && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

