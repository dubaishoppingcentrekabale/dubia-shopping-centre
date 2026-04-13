import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  rating: number | null;
  review_count: number | null;
  description: string | null;
  in_stock: boolean | null;
  is_flash_sale: boolean | null;
  stock_quantity: number | null;
  categories?: { name: string; slug: string } | null;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProduct[];
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!id,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbCategory[];
    },
  });
};

export const useFlashSaleProducts = () => {
  return useQuery({
    queryKey: ["flash-sale-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .eq("is_flash_sale", true);
      if (error) throw error;
      return data as DbProduct[];
    },
  });
};

export const useTrendingProducts = () => {
  return useQuery({
    queryKey: ["trending-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug)")
        .gte("rating", 4.7)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data as DbProduct[];
    },
  });
};

export interface DbBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

export const useBanners = () => {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as DbBanner[];
    },
  });
};
