const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatPrice = (value: number) => currencyFormatter.format(value);

export const formatCompactNumber = (value: number) => compactNumberFormatter.format(value);

export const getDiscountPercent = (price: number, originalPrice: number | null) => {
  if (!originalPrice || originalPrice <= price) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

export const getSavingsAmount = (price: number, originalPrice: number | null) => {
  if (!originalPrice || originalPrice <= price) {
    return 0;
  }

  return originalPrice - price;
};
