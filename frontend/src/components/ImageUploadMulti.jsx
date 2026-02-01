import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Upload, Trash2 } from "lucide-react";
import { compressImage, validateImageFile } from "../lib/imageUtils";
import { toast } from "sonner";

export default function ImageUploadMulti({ value = [], onChange, maxImages = 10, maxWidth = 800, maxHeight = 800, showLabel = true }) {
  const images = Array.isArray(value) ? value : [];
  const inputIdRef = useRef(`image-upload-multi-${Math.random().toString(36).substr(2, 9)}`);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }
    const toProcess = files.slice(0, remaining);

    const newImages = [...images];
    for (const file of toProcess) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }
      try {
        const compressed = await compressImage(file, maxWidth, maxHeight);
        newImages.push(compressed);
      } catch (err) {
        console.error("Error processing image:", err);
        toast.error("Error processing image");
      }
    }
    onChange(newImages);
  };

  const handleRemove = (index) => {
    const next = images.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div>
      {showLabel && <Label>Images</Label>}
      <div className={showLabel ? "mt-2" : ""}>
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            {images.map((src, idx) => (
              <div key={idx} className="relative group rounded-md overflow-hidden border bg-muted aspect-square">
                <img
                  src={src}
                  alt={`Upload ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => (e.target.style.display = "none")}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-90"
                  onClick={() => handleRemove(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputIdRef.current).click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {images.length ? "Add Photos" : "Upload Photos"}
          </Button>
        )}
        <input
          type="file"
          id={inputIdRef.current}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}
