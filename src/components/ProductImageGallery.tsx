import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProductImages, getPublicImageUrl } from "@/hooks/useProductImages";

interface ProductImageGalleryProps {
  productId: string;
  fallbackImage?: string | null;
  productName: string;
}

const ProductImageGallery = ({ productId, fallbackImage, productName }: ProductImageGalleryProps) => {
  const { data: images = [] } = useProductImages(productId);
  const [activeIndex, setActiveIndex] = useState(0);

  const imageUrls =
    images.length > 0
      ? images.map((img) => getPublicImageUrl(img.image_path))
      : [fallbackImage || "/placeholder.svg"];

  const goTo = (index: number) => {
    setActiveIndex((index + imageUrls.length) % imageUrls.length);
  };

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-border group">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={imageUrls[activeIndex]}
            alt={`${productName} - Image ${activeIndex + 1}`}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {imageUrls.length > 1 && (
          <>
            <button
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2">
          {imageUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative aspect-square w-16 md:w-20 rounded-lg overflow-hidden border-2 transition-all ${
                i === activeIndex
                  ? "border-primary shadow-md"
                  : "border-border opacity-60 hover:opacity-100"
              }`}
            >
              <img src={url} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
