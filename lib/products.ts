export type Product = {
  id: number;
  name: string;
  category: string;
  brand: string;
  role: string;
  origin: "Cambodian Botanical" | "Korean Skincare" | "Floralyn Signature";
  price: number;
  description: string;
  image: string;
  tag: string;
  detail: string;
  benefits: string[];
};

export const categories = [
  "All",
  "Cleansers",
  "Toners & Essences",
  "Serums & Ampoules",
  "Moisturizers & Creams",
  "Sun Protection",
  "Masks & Treatments",
];

export const brandFilters = [
  "All",
  "🇰🇭 Cambodian Heritage",
  "Beauty of Joseon",
  "Anua",
  "Mary & May",
  "K-Beauty Hits",
  "Floralyn Signature",
];

export const products: Product[] = [
  // --- FLORALYN CORE SIGNATURE ---
  {
    id: 1,
    name: "Dew Drop Serum",
    category: "Serums & Ampoules",
    brand: "Floralyn Signature",
    role: "Daily Hydration Plumper",
    origin: "Floralyn Signature",
    price: 28,
    description: "A lightweight glow-boosting daily serum.",
    detail:
      "A silky, fast-absorbing serum that floods skin with hyaluronic hydration and gives you that fresh, dewy finish without heaviness.",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85",
    tag: "BESTSELLER",
    benefits: ["Plumps skin", "Deep hydration", "Soft-focus glow"],
  },
  {
    id: 2,
    name: "Cloud Milk Cleanser",
    category: "Cleansers",
    brand: "Floralyn Signature",
    role: "Gentle Barrier-Friendly Cleanser",
    origin: "Floralyn Signature",
    price: 22,
    description: "A gentle, creamy cleanse for every morning.",
    detail:
      "A soft, milky cleanser that melts away daily impurities while staying soothing and balanced for sensitive, reactive skin.",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85",
    tag: "DAILY ESSENTIAL",
    benefits: ["Non-stripping", "Barrier-friendly", "Morning reset"],
  },
  {
    id: 3,
    name: "Petal Soft Moisturizer",
    category: "Moisturizers & Creams",
    brand: "Floralyn Signature",
    role: "Velvety Daily Barrier Shield",
    origin: "Floralyn Signature",
    price: 32,
    description: "Comforting moisture with a soft, dewy finish.",
    detail:
      "Nourishing and lightweight enough for daily wear, this cream leaves skin soft, calm, and comfortable all day long under makeup or bare.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85",
    tag: "CUSTOMER LOVE",
    benefits: ["Comforting moisture", "Velvety finish", "Everyday balance"],
  },
  {
    id: 4,
    name: "Green Garden Face Oil",
    category: "Serums & Ampoules",
    brand: "Floralyn Signature",
    role: "Evening Nutrient Seal Oil",
    origin: "Floralyn Signature",
    price: 35,
    description: "A silky finishing oil for your evening ritual.",
    detail:
      "A grounding blend of cold-pressed botanical oils that seals in hydration and leaves skin feeling lush, nourished, and thoroughly rested.",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85",
    tag: "BOTANICAL BLEND",
    benefits: ["Seals in moisture", "Radiant finish", "Evening ritual"],
  },
  {
    id: 5,
    name: "Rosewater Mist",
    category: "Toners & Essences",
    brand: "Floralyn Signature",
    role: "Hydration Reset & Setting Spray",
    origin: "Floralyn Signature",
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
    category: "Moisturizers & Creams",
    brand: "Floralyn Signature",
    role: "Overnight Barrier Restoration",
    origin: "Floralyn Signature",
    price: 38,
    description: "A rich night cream for your bedtime routine.",
    detail:
      "This rich overnight cream supports skin while you rest, helping you wake up comfortable, smooth, and beautifully rested.",
    image:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=85",
    tag: "NIGHT RITUAL",
    benefits: ["Overnight repair", "Silky texture", "Restorative comfort"],
  },

  // --- CAMBODIA LOCAL BOTANICAL HERITAGE ---
  {
    id: 7,
    name: "Angkor Sacred Lotus Calming Essence",
    category: "Toners & Essences",
    brand: "Floralyn Khmer Botanicals",
    role: "Anti-Inflammatory & Soothing Essence",
    origin: "Cambodian Botanical",
    price: 26,
    description: "Hand-harvested Banteay Srei pink lotus essence to soothe tropical heat.",
    detail:
      "Cultivated in Cambodia's historic lotus sanctuaries, sacred pink lotus petals are rich in restorative polyphenols and flavonoids. Calms heat-stressed skin, reduces flushing, and delivers weightless moisture.",
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85",
    tag: "CAMBODIAN BOTANICAL",
    benefits: ["Banteay Srei pink lotus", "Soothes heat irritation", "Weightless watery prep"],
  },
  {
    id: 8,
    name: "Battambang Jasmine Rice Bran Cleansing Oil",
    category: "Cleansers",
    brand: "Floralyn Khmer Botanicals",
    role: "Deep Pore & Waterproof Makeup Dissolver",
    origin: "Cambodian Botanical",
    price: 24,
    description: "Pure Phka Rumduol jasmine rice bran oil for effortless double cleansing.",
    detail:
      "Sourced directly from Battambang organic paddy fields, this nutrient-dense rice bran oil is naturally brimming with Vitamin E, ferulic acid, and squalene. Melts waterproof sunscreen and excess sebum without clogging pores.",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
    tag: "CAMBODIAN BOTANICAL",
    benefits: ["Phka Rumduol rice bran", "Zero pore clogging", "Instant milky rinse"],
  },
  {
    id: 9,
    name: "Kampot White Pepper & Lemongrass Purifying Clay Mask",
    category: "Masks & Treatments",
    brand: "Floralyn Khmer Botanicals",
    role: "Pore Refining & Detoxifying Mineral Treatment",
    origin: "Cambodian Botanical",
    price: 25,
    description: "Detoxifying French green clay infused with organic Kampot white pepper.",
    detail:
      "Protected-origin Kampot pepper micro-extracts boost microcirculation while Cambodian lemongrass purifies congested pores and controls excess shine. Leaves the complexion clean, bright, and clarified.",
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=85",
    tag: "KAMPOT HERITAGE",
    benefits: ["Kampot GI pepper extract", "Draws out impurities", "Refines uneven texture"],
  },
  {
    id: 10,
    name: "Mondulkiri Wild Forest Honey Barrier Balm",
    category: "Moisturizers & Creams",
    brand: "Floralyn Khmer Botanicals",
    role: "Intensive SOS Barrier & Moisture Recovery",
    origin: "Cambodian Botanical",
    price: 29,
    description: "Rich wild honey harvested from the pristine canopy of Mondulkiri.",
    detail:
      "Wild forest bees in Mondulkiri highlands pollinate native rainforest wildflowers, producing raw honey with remarkable restorative power. Blended with virgin beeswax and shea to heal dry, peeling, and sensitized skin.",
    image:
      "https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=800&q=85",
    tag: "WILD HIGHLAND HONEY",
    benefits: ["Mondulkiri raw honey", "Deep SOS barrier repair", "Rich restorative cushion"],
  },
  {
    id: 11,
    name: "Cardamom Rainforest Centella Soothing Gel",
    category: "Moisturizers & Creams",
    brand: "Floralyn Khmer Botanicals",
    role: "Cooling Post-Sun & Blemish Calming Gel",
    origin: "Cambodian Botanical",
    price: 21,
    description: "Oil-free cooling jelly infused with wild Gotu Kola (Centella Asiatica).",
    detail:
      "Formulated for warm tropical climates, this fast-absorbing green jelly calms sun-heated skin, eases active breakout inflammation, and delivers refreshing hydration with zero greasy residue.",
    image:
      "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=85",
    tag: "COOLING RELIEF",
    benefits: ["Cardamom wild cica", "Cooling -3°C sensation", "100% oil-free hydration"],
  },
  {
    id: 12,
    name: "Siem Reap Moringa & Virgin Coconut Glow Elixir",
    category: "Serums & Ampoules",
    brand: "Floralyn Khmer Botanicals",
    role: "Antioxidant Radiance & Pollution Defense",
    origin: "Cambodian Botanical",
    price: 30,
    description: "Cold-pressed Cambodian moringa seed oil and organic coconut lipids.",
    detail:
      "Known in Khmer tradition as the 'Miracle Tree', Moringa seed oil delivers 46 natural antioxidants to shield against airborne pollution and UV stress, leaving skin glowing with health and elasticity.",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85",
    tag: "INDIGENOUS SUPERFOOD",
    benefits: ["Cold-pressed moringa", "Shields urban pollution", "Golden silky luster"],
  },

  // --- KOREAN SKINCARE: BEAUTY OF JOSEON ---
  {
    id: 13,
    name: "Beauty of Joseon - Relief Sun: Rice + Probiotics SPF50+ PA++++",
    category: "Sun Protection",
    brand: "Beauty of Joseon",
    role: "Daily Chemical Sunscreen & Glow Shield",
    origin: "Korean Skincare",
    price: 19,
    description: "The viral Korean sunscreen formulated with 30% Rice Extract and Grain Probiotics.",
    detail:
      "A lightweight, creamy organic sunscreen that sits comfortably on skin without white cast, pilling, or greasy shine. Infused with grain ferment extracts to nourish the skin barrier while shielding against UVA and UVB rays.",
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85",
    tag: "GLOBAL BESTSELLER",
    benefits: ["30% Rice bran extract", "Zero white cast", "Broad spectrum SPF50+ PA++++"],
  },
  {
    id: 14,
    name: "Beauty of Joseon - Glow Serum: Propolis + Niacinamide",
    category: "Serums & Ampoules",
    brand: "Beauty of Joseon",
    role: "Pore Refining & Honey Glass Glow Serum",
    origin: "Korean Skincare",
    price: 17,
    description: "60% Propolis Extract and 2% Niacinamide for pore refinement and dewy radiance.",
    detail:
      "Inspired by traditional Hanbang herbal medicine, this honey-like serum delivers a healthy, non-sticky glass-skin glow. Propolis calms inflammation while niacinamide visibly refines enlarged pores and evens tone.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
    tag: "VIRAL K-BEAUTY",
    benefits: ["60% Propolis extract", "2% Niacinamide", "Pore refining & glass glow"],
  },
  {
    id: 15,
    name: "Beauty of Joseon - Dynasty Cream",
    category: "Moisturizers & Creams",
    brand: "Beauty of Joseon",
    role: "Hanbang Firming & Barrier Nourishing Cream",
    origin: "Korean Skincare",
    price: 24,
    description: "Enriched with Rice Bran Water, Ginseng Water, Squalane, and 2% Niacinamide.",
    detail:
      "The brand's inaugural icon delivers dense, long-lasting moisture with a distinct chewy, bouncy texture. Strengthens the moisture barrier while keeping dry or mature skin cushioned and nourished.",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
    tag: "HERITAGE CLASSIC",
    benefits: ["Rice bran & ginseng water", "Locks deep hydration", "Bouncy Hanbang finish"],
  },
  {
    id: 16,
    name: "Beauty of Joseon - Revive Eye Serum: Ginseng + Retinal",
    category: "Masks & Treatments",
    brand: "Beauty of Joseon",
    role: "Targeted Eye Contour & Fine Line Smoothing",
    origin: "Korean Skincare",
    price: 18,
    description: "Potent eye care combining 10% Ginseng Root Extract with 2% Retinal Liposome.",
    detail:
      "Retinal converts faster than retinol to visibly firm delicate undereye skin and smooth expression lines. Formulated with liposome technology to minimize irritation and maintain soothing hydration.",
    image:
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=85",
    tag: "RETINAL HERO",
    benefits: ["2% Stabilized retinal liposome", "10% Panax ginseng", "Smooths fine lines"],
  },

  // --- KOREAN SKINCARE: ANUA ---
  {
    id: 17,
    name: "Anua - Heartleaf 77% Soothing Toner",
    category: "Toners & Essences",
    brand: "Anua",
    role: "Skin Calming & Redness Relief Toner",
    origin: "Korean Skincare",
    price: 22,
    description: "Korea's #1 soothing toner powered by 77% Houttuynia Cordata (Heartleaf).",
    detail:
      "Celebrated across K-beauty for instant redness cooling and acne-calming efficacy. Hypoallergenic, non-comedogenic, and sub-acidic (pH 5.5) to keep irritated, sensitive skin tranquil and balanced.",
    image:
      "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=85",
    tag: "#1 KOREAN TONER",
    benefits: ["77% Heartleaf extract", "Instant redness cooling", "Acne-safe pH 5.5 balance"],
  },
  {
    id: 18,
    name: "Anua - Heartleaf Pore Control Cleansing Oil",
    category: "Cleansers",
    brand: "Anua",
    role: "Sebum & Blackhead Melting Cleansing Oil",
    origin: "Korean Skincare",
    price: 20,
    description: "Gentle pore-clearing oil that dissolves blackheads, waterproof SPF, and makeup.",
    detail:
      "Clinically tested non-comedogenic and infused with calming heartleaf extract, jojoba seed oil, and macadamia seed oil. Emulsifies milky-clean with zero eye stinging or oily residue.",
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85",
    tag: "PORE CONTROL",
    benefits: ["Dissolves blackheads", "Safe for acne-prone skin", "Silky non-greasy rinse"],
  },
  {
    id: 19,
    name: "Anua - Niacinamide 10% + TXA 4% Dark Spot Correcting Serum",
    category: "Serums & Ampoules",
    brand: "Anua",
    role: "Hyperpigmentation & Post-Acne Mark Eraser",
    origin: "Korean Skincare",
    price: 24,
    description: "Watery brightening serum with 10% Niacinamide, 4% Tranexamic Acid, and 2% Arbutin.",
    detail:
      "Targets stubborn post-acne erythema, dark sun spots, and uneven discoloration. Infused with 3-molecular-weight hyaluronic acid and ceramides to brighten without drying or sensitizing.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
    tag: "DARK SPOT HERO",
    benefits: ["10% Niacinamide + 4% TXA", "Fades post-acne marks", "Ceramide barrier shield"],
  },

  // --- KOREAN SKINCARE: MARY & MAY ---
  {
    id: 20,
    name: "Mary & May - Idebenone + Blackberry Complex Intensive Serum",
    category: "Serums & Ampoules",
    brand: "Mary & May",
    role: "High-Potency Antioxidant & Elasticity Serum",
    origin: "Korean Skincare",
    price: 19,
    description: "Packed with 1,000 ppm Idebenone and 20% Blackberry Extract for youthful bounce.",
    detail:
      "Idebenone delivers 4x the antioxidant power of Vitamin C and 10x that of CoQ10. Blended with rich anthocyanin-packed blackberry extract to shield against premature aging, firm skin, and brighten dull tones.",
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85",
    tag: "ANTIOXIDANT POWER",
    benefits: ["1,000 ppm Idebenone", "20% Blackberry extract", "4x stronger than Vitamin C"],
  },
  {
    id: 21,
    name: "Mary & May - Centella Asiatica Soothing Cream",
    category: "Moisturizers & Creams",
    brand: "Mary & May",
    role: "Fast Blemish Soothing & Sensitive Barrier Cream",
    origin: "Korean Skincare",
    price: 21,
    description: "Formulated with 71.8% Centella Asiatica extract and tea tree water for instant calm.",
    detail:
      "A soothing gel-cream that calms irritated, flushed, or blemish-prone complexions. Delivers refreshing non-greasy hydration with 100% EWG Green verified gentle ingredients.",
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85",
    tag: "VEGAN SOOTHING",
    benefits: ["71.8% Centella Asiatica", "Calms flare-ups fast", "EWG green certified"],
  },
  {
    id: 22,
    name: "Mary & May - Cica Soothing Sun Cream SPF50+ PA++++",
    category: "Sun Protection",
    brand: "Mary & May",
    role: "Hydrating Daily Sunscreen & Redness Shield",
    origin: "Korean Skincare",
    price: 18,
    description: "Ultra-lightweight soothing sunscreen infused with 10,000 ppm F-Cica Complex.",
    detail:
      "Glides on like a light morning lotion with zero stickiness and zero white cast. Protects against harsh UV radiation while continuously calming sensitive, redness-prone skin all day long.",
    image:
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85",
    tag: "REEF-SAFE SPF",
    benefits: ["10,000 ppm F-Cica complex", "Weightless lotion texture", "Reef-safe & vegan verified"],
  },

  // --- K-BEAUTY CULT FAVORITES ---
  {
    id: 23,
    name: "Skin1004 - Madagascar Centella Asiatica Ampoule",
    category: "Serums & Ampoules",
    brand: "Skin1004",
    role: "100% Pure Centella Barrier Recovery Ampoule",
    origin: "Korean Skincare",
    price: 19,
    description: "100% pure Centella Asiatica extract harvested from pristine Madagascar.",
    detail:
      "A holy grail minimalist ampoule with zero fillers or fragrances. Penetrates deep to calm inflamed skin, regulate sebum, reduce acne redness, and strengthen a compromised moisture barrier.",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85",
    tag: "HOLY GRAIL CICA",
    benefits: ["100% Madagascar Centella", "Calms sensitive barrier", "Non-sticky watery texture"],
  },
  {
    id: 24,
    name: "Round Lab - Birch Juice Moisturizing Sunscreen SPF50+ PA++++",
    category: "Sun Protection",
    brand: "Round Lab",
    role: "Deep Hyaluronic Sunscreen & Dehydration Shield",
    origin: "Korean Skincare",
    price: 21,
    description: "Award-winning Korean moisturizing sunscreen with Inje Birch Sap and Vita Hyaluronic Acid.",
    detail:
      "Clinically verified SPF50+ PA++++ that doubles as a morning moisturizer. Inje Silver Birch tree sap is packed with 17 amino acids, minerals, and proteins that quench dehydrated skin while shielding UV.",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85",
    tag: "AWARD WINNER",
    benefits: ["Inje Birch tree sap", "Hyaluronic hydration", "No white cast or stickiness"],
  },
  {
    id: 25,
    name: "COSRX - Advanced Snail 96 Mucin Power Essence",
    category: "Toners & Essences",
    brand: "COSRX",
    role: "Skin Repairing & Plumping Mucin Essence",
    origin: "Korean Skincare",
    price: 22,
    description: "Contains 96.3% Snail Secretion Filtrate to repair skin damage and plump elasticity.",
    detail:
      "A global skincare sensation that delivers intense cellular nutrition and bounce. Plumps dehydrated skin, softens rough patches, and soothes post-acne redness for that effortless glazed donut glow.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85",
    tag: "CULT FAVORITE",
    benefits: ["96.3% Snail secretion filtrate", "Plumps & firms skin", "Soothes post-breakout marks"],
  },
];

export function getProductById(id: number): Product | undefined {
  return products.find((product) => product.id === id);
}

export function mergeCatalog(live: Product[] = [], fallback: Product[] = products): Product[] {
  if (!live || live.length === 0) return fallback;
  const liveMap = new Map<number, Product>();
  for (const item of live) liveMap.set(item.id, item);
  for (const item of fallback) {
    if (!liveMap.has(item.id)) liveMap.set(item.id, item);
  }
  return Array.from(liveMap.values());
}
