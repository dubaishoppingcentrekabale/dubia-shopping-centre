import { useEffect } from "react";

const StoreJsonLd = () => {
  useEffect(() => {
    const id = "store-jsonld";
    if (document.getElementById(id)) return;

    const script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ElectronicsStore",
      name: "Dubai Shopping Centre",
      description:
        "Your trusted electronics store in Kabale, Uganda for phones, laptops, TVs, accessories, and everyday tech deals.",
      url: "https://dubaishoppingcentrekabale.com",
      logo: "https://dubaishoppingcentrekabale.com/logo.png",
      image: "https://dubaishoppingcentrekabale.com/logo.png",
      telephone: "+256706643297",
      priceRange: "$$",
      currenciesAccepted: "UGX",
      paymentAccepted: "Cash, Mobile Money, Card",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Main Street",
        addressLocality: "Kabale",
        addressRegion: "Western Region",
        addressCountry: "UG",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -1.2491,
        longitude: 29.9894,
      },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
      sameAs: [],
    });
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
};

export default StoreJsonLd;
