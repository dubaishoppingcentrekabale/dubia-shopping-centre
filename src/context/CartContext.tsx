import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DbProduct } from "@/hooks/useProducts";

export interface CartItem {
  product: DbProduct;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: DbProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = "dubai-shopping-hub-cart";

const readStoredCart = () => {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedValue) {
      return [] as CartItem[];
    }

    const parsed = JSON.parse(storedValue) as CartItem[];

    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }

    return parsed.filter(
      (item) =>
        !!item?.product?.id &&
        typeof item.product.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [] as CartItem[];
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  const addToCart = useCallback((product: DbProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncCart = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) {
        return;
      }

      setItems(readStoredCart());
    };

    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
