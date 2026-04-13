import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  robots: string;
};

const CANONICAL_ORIGIN = "https://dubaishoppingcentrekabale.com";
const DEFAULT_IMAGE_PATH = "/logo.png";
const INDEX_ROBOTS = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow";

const DEFAULT_SEO: SeoConfig = {
  title: "Dubai Shopping Centre - Electronics Store, Kabale Uganda",
  description:
    "Dubai Shopping Centre is your trusted electronics store in Kabale, Uganda. Shop phones, laptops, TVs, accessories, and everyday tech deals with local delivery.",
  robots: INDEX_ROBOTS,
};

const ROUTE_SEO: Array<{ pattern: RegExp; config: SeoConfig }> = [
  {
    pattern: /^\/$/,
    config: DEFAULT_SEO,
  },
  {
    pattern: /^\/product\/[^/]+$/,
    config: {
      title: "Product Details | Dubai Shopping Centre Kabale",
      description:
        "View product details, pricing, and availability for electronics and accessories at Dubai Shopping Centre in Kabale, Uganda.",
      robots: INDEX_ROBOTS,
    },
  },
  {
    pattern: /^\/categories$/,
    config: {
      title: "Browse Categories | Dubai Shopping Centre Kabale",
      description:
        "Explore electronics categories including phones, laptops, TVs, accessories, and more at Dubai Shopping Centre Kabale.",
      robots: INDEX_ROBOTS,
    },
  },
  {
    pattern: /^\/deals$/,
    config: {
      title: "Latest Deals & Flash Sales | Dubai Shopping Centre Kabale",
      description:
        "Discover current electronics deals and flash sale offers from Dubai Shopping Centre in Kabale, Uganda. Save on phones, laptops, and accessories.",
      robots: INDEX_ROBOTS,
    },
  },
  {
    pattern: /^\/search$/,
    config: {
      title: "Search Products | Dubai Shopping Centre Kabale",
      description: "Search products at Dubai Shopping Centre Kabale.",
      robots: NOINDEX_ROBOTS,
    },
  },
  {
    pattern: /^\/(cart|auth|reset-password|checkout|orders|account|admin|wishlist)$/,
    config: {
      title: "Customer Account | Dubai Shopping Centre",
      description: "Customer and account area for Dubai Shopping Centre Kabale.",
      robots: NOINDEX_ROBOTS,
    },
  },
];

const ensureMeta = (selector: string, create: () => HTMLMetaElement) => {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;
  const meta = create();
  document.head.appendChild(meta);
  return meta;
};

const setMetaByName = (name: string, content: string) => {
  const meta = ensureMeta(`meta[name="${name}"]`, () => {
    const element = document.createElement("meta");
    element.setAttribute("name", name);
    return element;
  });
  meta.setAttribute("content", content);
};

const setMetaByProperty = (property: string, content: string) => {
  const meta = ensureMeta(`meta[property="${property}"]`, () => {
    const element = document.createElement("meta");
    element.setAttribute("property", property);
    return element;
  });
  meta.setAttribute("content", content);
};

const setCanonical = (href: string) => {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (existing) {
    existing.setAttribute("href", href);
    return;
  }
  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
  document.head.appendChild(link);
};

const getSeoForPath = (pathname: string) => {
  return ROUTE_SEO.find((entry) => entry.pattern.test(pathname))?.config ?? DEFAULT_SEO;
};

const SeoHead = () => {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const seo = getSeoForPath(pathname);
    const canonicalUrl = `${CANONICAL_ORIGIN}${pathname === "/" ? "/" : pathname.replace(/\/+$/, "")}`;
    const socialImage = `${CANONICAL_ORIGIN}${DEFAULT_IMAGE_PATH}`;

    document.title = seo.title;
    setCanonical(canonicalUrl);
    setMetaByName("description", seo.description);
    setMetaByName("robots", seo.robots);
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", seo.title);
    setMetaByName("twitter:description", seo.description);
    setMetaByName("twitter:image", socialImage);

    setMetaByProperty("og:title", seo.title);
    setMetaByProperty("og:description", seo.description);
    setMetaByProperty("og:type", "website");
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:image", socialImage);
    setMetaByProperty("og:site_name", "Dubai Shopping Centre");
  }, [location]);

  return null;
};

export default SeoHead;
