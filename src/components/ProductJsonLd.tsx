import { useEffect } from "react";
import type { DbProduct } from "@/hooks/useProducts";

const STORE_NAME = "Dubai Shopping Centre";
const CURRENCY = "UGX";

const buildProductJsonLd = (product: DbProduct) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  description: product.description || `${product.name} available at ${STORE_NAME}, Kabale Uganda`,
  image: product.image_url || "/placeholder.svg",
  sku: product.id,
  brand: { "@type": "Brand", name: STORE_NAME },
  offers: {
    "@type": "Offer",
    url: `https://dubaishoppingcentrekabale.com/product/${product.id}`,
    priceCurrency: CURRENCY,
    price: product.price,
    availability: product.in_stock !== false
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    seller: { "@type": "Organization", name: STORE_NAME },
  },
  ...(product.rating != null && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.review_count || 1,
    },
  }),
});

interface Props {
  products: DbProduct[];
}

const ProductJsonLd = ({ products }: Props) => {
  useEffect(() => {
    const id = "product-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const data = products.length === 1
      ? buildProductJsonLd(products[0])
      : {
          "@context": "https://schema.org",
          "@graph": products.map(buildProductJsonLd),
        };

    script.textContent = JSON.stringify(data);

    return () => {
      script?.remove();
    };
  }, [products]);

  return null;
};

export default ProductJsonLd;
