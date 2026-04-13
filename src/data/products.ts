export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  seller: string;
  description: string;
  inStock: boolean;
  isFlashSale?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: "electronics", name: "Electronics", icon: "📱", count: 1240 },
  { id: "fashion", name: "Fashion", icon: "👗", count: 3560 },
  { id: "groceries", name: "Groceries", icon: "🛒", count: 890 },
  { id: "home", name: "Home & Living", icon: "🏠", count: 2100 },
  { id: "beauty", name: "Beauty", icon: "💄", count: 1780 },
  { id: "sports", name: "Sports", icon: "⚽", count: 960 },
  { id: "books", name: "Books", icon: "📚", count: 4200 },
  { id: "toys", name: "Toys & Games", icon: "🎮", count: 1100 },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Apple iPhone 15 Pro Max",
    price: 4999,
    originalPrice: 5499,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
    category: "electronics",
    rating: 4.8,
    reviews: 2340,
    seller: "TechWorld Dubai",
    description: "The latest iPhone with A17 Pro chip, titanium design, and the most powerful camera system ever in an iPhone.",
    inStock: true,
    isFlashSale: true,
  },
  {
    id: "2",
    name: "Designer Gold Silk Dress",
    price: 1299,
    originalPrice: 1899,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
    category: "fashion",
    rating: 4.6,
    reviews: 189,
    seller: "Luxe Fashion House",
    description: "Elegant gold silk evening dress with intricate embroidery, perfect for special occasions.",
    inStock: true,
    isFlashSale: true,
  },
  {
    id: "3",
    name: "Samsung 65\" OLED Smart TV",
    price: 3299,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    category: "electronics",
    rating: 4.7,
    reviews: 567,
    seller: "Electronics Store",
    description: "Stunning 4K OLED display with smart features, Dolby Atmos sound, and sleek design.",
    inStock: true,
  },
  {
    id: "4",
    name: "Premium Arabic Coffee Set",
    price: 249,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&h=400&fit=crop",
    category: "groceries",
    rating: 4.9,
    reviews: 892,
    seller: "Arabian Delights",
    description: "Premium Arabic coffee collection with traditional dallah and finjan cups.",
    inStock: true,
  },
  {
    id: "5",
    name: "Nike Air Jordan Limited Edition",
    price: 899,
    originalPrice: 1199,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    category: "sports",
    rating: 4.5,
    reviews: 1230,
    seller: "SneakerVault",
    description: "Limited edition Air Jordan sneakers in exclusive colorway.",
    inStock: true,
    isFlashSale: true,
  },
  {
    id: "6",
    name: "Luxury Oud Perfume Collection",
    price: 599,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
    category: "beauty",
    rating: 4.8,
    reviews: 445,
    seller: "Scent Palace",
    description: "Exquisite collection of premium Arabian oud perfumes in elegant packaging.",
    inStock: true,
  },
  {
    id: "7",
    name: "Modern Velvet Sofa Set",
    price: 2899,
    originalPrice: 3599,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    category: "home",
    rating: 4.4,
    reviews: 312,
    seller: "Home Elegance",
    description: "Luxurious velvet sofa set in emerald green with gold-finished legs.",
    inStock: true,
  },
  {
    id: "8",
    name: "MacBook Pro 16\" M3 Max",
    price: 9999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop",
    category: "electronics",
    rating: 4.9,
    reviews: 1567,
    seller: "TechWorld Dubai",
    description: "The most powerful MacBook ever with M3 Max chip, 36GB RAM, and stunning Liquid Retina XDR display.",
    inStock: true,
  },
  {
    id: "9",
    name: "Ray-Ban Aviator Gold",
    price: 699,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    category: "fashion",
    rating: 4.6,
    reviews: 789,
    seller: "Luxe Fashion House",
    description: "Classic Ray-Ban Aviator sunglasses with gold frame and green lenses.",
    inStock: true,
  },
  {
    id: "10",
    name: "PlayStation 5 Pro Bundle",
    price: 2499,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
    category: "toys",
    rating: 4.7,
    reviews: 2100,
    seller: "GameZone",
    description: "PS5 Pro console with extra controller, headset, and 3 top games.",
    inStock: true,
    isFlashSale: true,
  },
  {
    id: "11",
    name: "Organic Saffron Premium Pack",
    price: 189,
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    category: "groceries",
    rating: 4.9,
    reviews: 634,
    seller: "Arabian Delights",
    description: "Premium grade-1 organic saffron sourced from the finest farms.",
    inStock: true,
  },
  {
    id: "12",
    name: "Bestseller Book Collection",
    price: 149,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop",
    category: "books",
    rating: 4.5,
    reviews: 1890,
    seller: "BookWorld",
    description: "Curated collection of 5 international bestsellers in hardcover edition.",
    inStock: true,
  },
];
