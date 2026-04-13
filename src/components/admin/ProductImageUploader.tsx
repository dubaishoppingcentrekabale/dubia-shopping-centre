import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useProductImages,
  useUploadProductImage,
  useDeleteProductImage,
  getPublicImageUrl,
} from "@/hooks/useProductImages";
import { useToast } from "@/components/ui/use-toast";

interface ProductImageUploaderProps {
  productId: string;
}

const MAX_IMAGES = 4;

const ProductImageUploader = ({ productId }: ProductImageUploaderProps) => {
  const { data: images = [], isLoading } = useProductImages(productId);
  const uploadMutation = useUploadProductImage();
  const deleteMutation = useDeleteProductImage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  const handleUpload = async (file: File, slot: number) => {
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid file", description: "Please upload an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 5MB per image." });
      return;
    }

    setUploadingSlot(slot);
    try {
      await uploadMutation.mutateAsync({ productId, file, displayOrder: slot });
      toast({ title: "Image uploaded", description: `Image ${slot + 1} uploaded successfully.` });
    } catch {
      toast({ variant: "destructive", title: "Upload failed", description: "Please try again." });
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleDelete = async (imageId: string, image: any) => {
    try {
      await deleteMutation.mutateAsync({ image });
      toast({ title: "Image removed" });
    } catch {
      toast({ variant: "destructive", title: "Delete failed" });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading images...</div>;
  }

  const slots = Array.from({ length: MAX_IMAGES }, (_, i) => {
    return images.find((img) => img.display_order === i) || null;
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        Product Images ({images.length}/{MAX_IMAGES})
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slots.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center group"
          >
            {image ? (
              <>
                <img
                  src={getPublicImageUrl(image.image_path)}
                  alt={`Product image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => handleDelete(image.id, image)}
                  disabled={deleteMutation.isPending}
                  className="absolute top-1 right-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium">
                  {index === 0 ? "Main" : `#${index + 1}`}
                </span>
              </>
            ) : (
              <label className="flex flex-col items-center gap-1 cursor-pointer p-2 text-center">
                {uploadingSlot === index ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">
                      {index === 0 ? "Main image" : `Image ${index + 1}`}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, index);
                    e.target.value = "";
                  }}
                  disabled={uploadingSlot !== null}
                />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductImageUploader;
