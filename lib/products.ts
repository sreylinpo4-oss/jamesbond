export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  tag: string;
  detail: string;
  benefits: string[];
};

export const categories = [
  "All",
  "Serums",
  "Cleansers",
  "Moisturizers",
  "Essentials",
];

export const products: Product[] = [
  {
    id: 1,
    name: "Dew Drop Serum",
    category: "Serums",
    price: 28,
    description: "A lightweight glow-boosting daily serum.",
    detail:
      "A silky, fast-absorbing serum that floods skin with hydration and gives you that fresh, dewy finish without heaviness.",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85",
    tag: "BESTSELLER",
    benefits: ["Plumps skin", "Deep hydration", "Soft-focus glow"],
  },
  {
    id: 2,
    name: "Cloud Milk Cleanser",
    category: "Cleansers",
    price: 22,
    description: "A gentle, creamy cleanse for every morning.",
    detail:
      "A soft, milky cleanser that melts away the day while staying comforting and balanced for sensitive skin.",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85",
    tag: "DAILY ESSENTIAL",
    benefits: ["Non-stripping", "Barrier-friendly", "Morning reset"],
  },
  {
    id: 3,
    name: "Petal Soft Moisturizer",
    category: "Moisturizers",
    price: 32,
    description: "Comforting moisture with a soft, dewy finish.",
    detail:
      "Nourishing and lightweight enough for daily wear, this cream leaves skin soft, calm, and comfortable all day long.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85",
    tag: "CUSTOMER LOVE",
    benefits: ["Comforting moisture", "Velvety finish", "Everyday balance"],
  },
  {
    id: 4,
    name: "Green Garden Face Oil",
    category: "Serums",
    price: 35,
    description: "A silky finishing oil for your evening ritual.",
    detail:
      "A grounding blend of botanical oils that seals in hydration and leaves skin feeling lush, nourished, and rested.",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85",
    tag: "BOTANICAL BLEND",
    benefits: ["Seals in moisture", "Radiant finish", "Evening ritual"],
  },
  {
    id: 5,
    name: "Rosewater Mist",
    category: "Essentials",
    price: 18,
    description: "A refreshing facial mist for a little reset.",
    detail:
      "A delicate spray that refreshes, hydrates, and brings a moment of calm to your skin between steps or throughout the day.",
    image:
      "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=85",
    tag: "FRESH PICK",
    benefits: ["Instant refresh", "Hydration boost", "Travel-friendly"],
  },
  {
    id: 6,
    name: "Velvet Night Cream",
    category: "Moisturizers",
    price: 38,
    description: "A rich night cream for your bedtime routine.",
    detail:
      "This rich overnight cream supports skin while you rest, helping you wake up comfortable, smooth, and beautifully rested.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1600&q=90",
    tag: "NIGHT RITUAL",
    benefits: ["Overnight repair", "Silky texture", "Restorative comfort"],
  },
];

export function getProductById(id: number) {
  return products.find((product) => product.id === id);
}
