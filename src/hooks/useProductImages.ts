import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ProductImage {
  id: string;
  product_id: string;
  image_path: string;
  display_order: number;
  created_at: string;
}

export const useProductImages = (productId: string) => {
  return useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("display_order");
      if (error) throw error;
      return data as ProductImage[];
    },
    enabled: !!productId,
  });
};

export const getPublicImageUrl = (path: string) => {
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
};

export const useUploadProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      file,
      displayOrder,
    }: {
      productId: string;
      file: File;
      displayOrder: number;
    }) => {
      const ext = file.name.split(".").pop();
      const filePath = `${productId}/${Date.now()}_${displayOrder}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("product_images").insert({
        product_id: productId,
        image_path: filePath,
        display_order: displayOrder,
      });
      if (dbError) throw dbError;

      return filePath;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["product-images", variables.productId] });
    },
  });
};

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image }: { image: ProductImage }) => {
      await supabase.storage.from("product-images").remove([image.image_path]);
      const { error } = await supabase.from("product_images").delete().eq("id", image.id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-images", variables.image.product_id],
      });
    },
  });
};
