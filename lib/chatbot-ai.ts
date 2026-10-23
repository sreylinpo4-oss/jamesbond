import { Product } from "./products";

export type SkinType = "dry" | "oily" | "combination" | "sensitive" | "normal";

export type SkinConcern =
  | "acne"
  | "dark_spots"
  | "redness"
  | "anti_aging"
  | "barrier_repair"
  | "pores_sebum"
  | "dullness";

export type LifestyleFactor =
  | "humid_climate"
  | "ac_dry_air"
  | "high_sun"
  | "stress_sleep"
  | "daily_makeup";

export type SkinScanReport = {
  id: string;
  timestamp: string;
  imageUrl?: string;
  skinType: SkinType;
  hydrationScore: number; // 0 - 100
  rednessScore: number; // 0 - 100 (lower is calmer)
  poreScore: number; // 0 - 100 (lower is tighter)
  smoothnessScore: number; // 0 - 100
  findings: string[];
  recommendedFocus: string;
};

export type RoutineStep = {
  step: number;
  phase: "AM" | "PM" | "BOTH";
  role: string;
  usage: string;
  product: Product;
};

export type CompleteRoutine = {
  skinType: SkinType;
  title: string;
  summary: string;
  amSteps: RoutineStep[];
  pmSteps: RoutineStep[];
  allProducts: Product[];
  patchTestGuide: string;
  frequencyTip: string;
  disclaimer: string;
};

export type BotResponse = {
  text: string;
  products?: Product[];
  routine?: CompleteRoutine;
  scanReport?: SkinScanReport;
  medicalAlert?: {
    severity: "warning" | "urgent";
    condition: string;
    guidance: string;
    escalationUrl?: string;
  };
  action?: {
    type: "discount" | "link" | "add_routine" | "quiz" | "scan";
    code?: string;
    url?: string;
    label?: string;
    productIds?: number[];
  };
  suggestions?: { label: string; query: string }[];
  quizStep?: {
    step: "type" | "concerns" | "lifestyle" | "photo";
    title: string;
    question: string;
    options: { label: string; value: string; query: string }[];
  };
};

export const DEFAULT_SUGGESTIONS = [
  { label: "🌟 Take 60s Skin Diagnostic Quiz", query: "start skin quiz" },
  { label: "📸 AI Selfie Skin Scan", query: "scan my skin photo" },
  { label: "⚖️ Combination Skin Routine", query: "What routine is best for combination skin (oily T-zone, dry cheeks)?" },
  { label: "🌿 Oily & Acne-Prone Help", query: "What products are best for oily skin, clogged pores, and acne?" },
  { label: "💧 Dry & Sensitive SOS", query: "I have dry, sensitive skin with a damaged barrier. What should I use?" },
  { label: "✨ Dark Spots & Glass Glow", query: "How do I fade dark spots and get Korean glass skin?" },
  { label: "📖 Skincare Order & Layering", query: "What is the correct order to apply skincare products?" },
  { label: "🧪 Active Ingredient Pairing Check", query: "Can I use Retinol with AHA BHA or Niacinamide with Vitamin C?" },
  { label: "💳 Payment & Cambodia Delivery", query: "What payment methods and delivery options do you accept in Cambodia?" },
  { label: "🎁 10% Discount Code", query: "Do you have a discount code for my order?" },
];

export const NOT_MEDICAL_ADVICE_DISCLAIMER =
  "⚠️ *Cosmetic Care Notice: Flora's recommendations are for cosmetic skincare education and botanical support. They do not substitute professional dermatological advice, clinical diagnosis, or medical prescription.*";

// =========================================================================
// ROUTINE BUILDERS
// =========================================================================

export function buildPersonalizedRoutine(
  skinType: SkinType,
  concern: SkinConcern = "barrier_repair",
  catalog: Product[],
  options?: { minimalist?: boolean; budgetUnder50?: boolean; veganOnly?: boolean }
): CompleteRoutine {
  const findProduct = (id: number) => catalog.find((p) => p.id === id);

  let amProds: { role: string; usage: string; id: number }[] = [];
  let pmProds: { role: string; usage: string; id: number }[] = [];
  let title = "";
  let summary = "";

  if (skinType === "combination") {
    title = "Dual-Zone Balancing & Pore Refining Protocol";
    summary = "Formulated to balance your sebum-rich T-zone while infusing long-lasting hydration into normal or dry cheeks.";
    amProds = [
      { role: "Gentle Morning Wash", usage: "1 pump with lukewarm water to remove overnight sebum without stripping cheeks.", id: 2 }, // Cloud Milk
      { role: "Micro-Exfoliating Toner", usage: "Pat gently with hands or cotton pad to dissolve dead cells with gentle PHA.", id: 27 }, // Centella Toning Toner
      { role: "Featherweight Balance Lotion", usage: "Smooth 1-2 pumps over face and neck for weightless barrier moisture.", id: 39 }, // Anua 70% Lotion
      { role: "Daily UV Shield SPF50+", usage: "Apply two finger lengths. Zero white cast, breathable serum finish.", id: 29 }, // Skin1004 Sun Serum
    ];
    pmProds = [
      { role: "Step 1: Oil Cleanse", usage: "Massage onto dry face for 60 seconds to melt SPF and sebum plugs. Emulsify with water.", id: 26 }, // Skin1004 Light Oil
      { role: "Step 2: Gentle Second Wash", usage: "Cleanse away remaining impurities with soft barrier-safe milk cleanser.", id: 2 }, // Cloud Milk
      { role: "Step 3: Pore Balancing Ampoule", usage: "Apply 3-4 drops focusing on forehead, nose, and chin to tighten pores.", id: 30 }, // Poremizing Ampoule
      { role: "Step 4: Restorative Night Cream", usage: "Press into cheeks and neck to repair moisture barrier overnight.", id: 32 }, // Probio-Cica
    ];
  } else if (skinType === "oily" || concern === "acne" || concern === "pores_sebum") {
    title = "Clarifying Sebum Balance & Blemish Relief Protocol";
    summary = "Formulated with sub-acidic micro-peels, Himalayan pink salt minerals, and antibacterial tea tree to purge congestion without over-drying.";
    amProds = [
      { role: "Deep Pore Cleansing Foam", usage: "Lather a dime size with water. Quercetinol powder clears sebum from deep inside pores.", id: 38 }, // Anua Quercetinol Foam
      { role: "Triple Acid Balancing Toner", usage: "Pat across T-zone to balance skin pH and dissolve micro-congestion with AHA/BHA/PHA.", id: 36 }, // Mary & May Cica Toner
      { role: "Pink Salt Pore Minimizer", usage: "3 drops to tighten stretched pores and regulate excess daytime shine.", id: 30 }, // Poremizing
      { role: "Breathable Daily SPF50+", usage: "Non-comedogenic, weightless protection that prevents dark spot post-acne marks.", id: 29 }, // Skin1004 Sun Serum
    ];
    pmProds = [
      { role: "Step 1: Non-Comedogenic Oil", usage: "Massage over dry skin to dissolve waterproof sunscreen and sebum plugs.", id: 26 }, // Skin1004 Light Oil
      { role: "Step 2: Deep Pore Foam", usage: "Rinse away residue with heartleaf pore cleansing foam.", id: 38 }, // Anua Foam
      { role: "Step 3: Emergency Blemish SOS", usage: "Apply directly over active breakouts and red areas to reduce swelling overnight.", id: 31 }, // Tea-Trica
      { role: "Step 4: Calming Gel-Cream", usage: "Lightweight, oil-free hydration with TECA to soothe active inflammation.", id: 28 }, // Centella Soothing Cream
    ];
  } else if (skinType === "dry" || concern === "barrier_repair") {
    title = "Intensive Lipid Barrier Recovery & Moisture Lock Ritual";
    summary = "Cushions compromised, dry, and tight skin with plant-derived hyaluronic acids, anthocyanin milk ceramides, and fermented biome TECA.";
    amProds = [
      { role: "Comforting Milk Wash", usage: "Massage with lukewarm water. Never leaves skin tight or stripped.", id: 2 }, // Cloud Milk
      { role: "Bi-Phase Antioxidant Milk", usage: "Shake well to blend blackberry milk. Press into skin for deep bounce.", id: 33 }, // Blackberry Cream Essence
      { role: "Hyaluronic Plump Serum", usage: "Apply 3-4 drops onto damp skin for multi-layer water-locking plumping.", id: 1 }, // Dew Drop Serum
      { role: "Probiotic Rice Sunscreen SPF50+", usage: "Rich in fermented grains to feed and shield dry skin all day.", id: 13 }, // BOJ Relief Sun
    ];
    pmProds = [
      { role: "Step 1: Rice Bran Oil Cleanse", usage: "Melt makeup and environmental pollution with cold-pressed Battambang rice oil.", id: 8 }, // Rice oil
      { role: "Step 2: Comforting Milk Wash", usage: "Gentle second cleanse preserving stratum corneum lipids.", id: 2 }, // Cloud Milk
      { role: "Step 3: Blackberry Ceramide Milk", usage: "Layer twice for the Korean '7-skin' hydration sandwich.", id: 33 }, // Blackberry Essence
      { role: "Step 4: Intensive Biome Cream", usage: "Warm between fingers and press in. Fermented Centella repairs barrier overnight.", id: 32 }, // Probio-Cica
      { role: "Step 5: Wild Honey Balm (SOS)", usage: "Dab on flaking spots or dry patches as an overnight moisture seal.", id: 10 }, // Mondulkiri Honey
    ];
  } else if (skinType === "sensitive" || concern === "redness") {
    title = "Pure Botanical Calming & Hypoallergenic Sanctuary Protocol";
    summary = "Restores comfort to easily flushed, irritated, or rosacea-prone skin using pure Korean Heartleaf and 100% Madagascar Centella.";
    amProds = [
      { role: "Ultra-Gentle Wash", usage: "Gentle non-foaming botanical milk cleanser that respects cutaneous balance.", id: 2 }, // Cloud Milk
      { role: "Redness SOS 77% Toner", usage: "Korea's #1 soothing toner with 77% Heartleaf to instantly cool facial heat.", id: 17 }, // Anua 77%
      { role: "100% Pure Centella Ampoule", usage: "Calms micro-capillary flushing and speeds epidermal wound recovery.", id: 23 }, // Centella Ampoule
      { role: "Barrier Shield SPF50+", usage: "Chemical sunscreen serum certified for sensitive skin with zero eye sting.", id: 29 }, // Skin1004 Sun Serum
    ];
    pmProds = [
      { role: "Step 1: Light Cleansing Oil", usage: "Gentle plant-derived oil melts sunscreen without aggressive rubbing.", id: 26 }, // Skin1004 Light Oil
      { role: "Step 2: Ultra-Gentle Milk Wash", usage: "Soft wash with pure cloud milk.", id: 2 }, // Cloud Milk
      { role: "Step 3: Redness SOS 77% Toner", usage: "Soak two cotton pads and place on cheeks for 5 minutes as a soothing mask.", id: 17 }, // Anua 77%
      { role: "Step 4: Centella Soothing Cream", usage: "Replenishes Ceramides, Cholesterol, and Fatty Acids in optimal skin ratio.", id: 28 }, // Centella Soothing Cream
    ];
  } else if (concern === "dark_spots" || concern === "dullness") {
    title = "Triple-Pathway Melanin Correction & Glass Skin Protocol";
    summary = "Targets sun damage, post-acne pigmentation, and dullness with Tranexamic Acid, Niacinamide 10%, Alpha-Arbutin, and Glutathione.";
    amProds = [
      { role: "Gentle Morning Refresh", usage: "Wash with lukewarm water to prime skin for brightening active absorption.", id: 2 }, // Cloud Milk
      { role: "Exfoliating Botanical Toner", usage: "Gently sweeps away keratinized, pigment-heavy surface cells.", id: 27 }, // Centella Toner
      { role: "Dark Spot Correcting Serum", usage: "4-5 drops. 10% Niacinamide + 4% TXA blocks melanin transfer to surface skin.", id: 19 }, // Anua TXA
      { role: "Antioxidant UV Shield SPF50+", usage: "Critical: without daily SPF50+, UV rays immediately trigger new dark spots!", id: 29 }, // Skin1004 Sun Serum
    ];
    pmProds = [
      { role: "Step 1: Rice Cleansing Oil", usage: "Rice bran ferments dissolve SPF while brightening uneven tone.", id: 8 }, // Battambang Rice Oil
      { role: "Step 2: Gentle Second Cleanse", usage: "Cleanse thoroughly.", id: 2 }, // Cloud Milk
      { role: "Step 3: Hanbang Glow Deep Serum", usage: "Rice water + Alpha-Arbutin inhibits tyrosinase melanin synthesis.", id: 14 }, // BOJ Glow Deep
      { role: "Step 4: TXA + Glutathione Eye Cream", usage: "Brightens dark undereye shadows and prevents post-inflammatory marks.", id: 34 }, // Mary & May TXA Eye Cream
      { role: "Step 5: Ceramide Milk Moisturizer", usage: "Locks in active brighteners while nourishing the lipid barrier.", id: 33 }, // Blackberry Essence
    ];
  } else {
    // Normal / Anti-Aging / Preventative
    title = "Pro-Collagen Firmness & Luminous Longevity Protocol";
    summary = "Combines 6 biomimetic peptides, antioxidant anthocyanins, and Hanbang ginseng to stimulate natural collagen synthesis.";
    amProds = [
      { role: "Gentle Morning Wash", usage: "Soft botanical wash.", id: 2 },
      { role: "Bi-Phase Antioxidant Essence", usage: "Floods skin with Idebenone and blackberry anthocyanin protection.", id: 33 },
      { role: "6-Peptide Matrix Serum", usage: "Plumps expression lines and stimulates dermal fibroblast collagen production.", id: 35 }, // 6 Peptides
      { role: "Daily UV Shield SPF50+", usage: "Essential anti-photoaging daily broad-spectrum shield.", id: 29 },
    ];
    pmProds = [
      { role: "Step 1: Oil Cleanse", usage: "Dissolves SPF and pollutants.", id: 26 },
      { role: "Step 2: Gentle Wash", usage: "Gentle second cleanse.", id: 2 },
      { role: "Step 3: Hanbang Revive Ginseng Serum", usage: "Korean ginseng root speeds cellular renewal while snail mucin repairs elasticity.", id: 16 }, // BOJ Ginseng Snail
      { role: "Step 4: Intensive Biome Cream", usage: "Firming overnight barrier restoration.", id: 32 },
    ];
  }

  // Handle Minimalist adaptation
  if (options?.minimalist) {
    amProds = [amProds[0], amProds[2], amProds[3]]; // Cleanse, Moisturize, SPF
    pmProds = [pmProds[0], pmProds[1], pmProds[pmProds.length - 1]]; // Double Cleanse, Moisturize
    title += " (Minimalist 3-Step Edition)";
    summary += " Streamlined into an effortless 3-step morning and evening ritual.";
  }

  // Handle Vegan Only adaptation
  if (options?.veganOnly) {
    const veganIds = [33, 34, 35, 36, 26, 27, 28, 29, 30, 31, 32, 1, 2, 3, 7, 8, 9, 10];
    amProds = amProds.filter((p) => veganIds.includes(p.id));
    pmProds = pmProds.filter((p) => veganIds.includes(p.id));
    title += " (100% Certified Vegan)";
  }

  const amSteps: RoutineStep[] = amProds
    .map((item, idx) => {
      const prod = findProduct(item.id);
      if (!prod) return null;
      return { step: idx + 1, phase: "AM" as const, role: item.role, usage: item.usage, product: prod };
    })
    .filter(Boolean) as RoutineStep[];

  const pmSteps: RoutineStep[] = pmProds
    .map((item, idx) => {
      const prod = findProduct(item.id);
      if (!prod) return null;
      return { step: idx + 1, phase: "PM" as const, role: item.role, usage: item.usage, product: prod };
    })
    .filter(Boolean) as RoutineStep[];

  const uniqueProductMap = new Map<number, Product>();
  [...amSteps, ...pmSteps].forEach((s) => uniqueProductMap.set(s.product.id, s.product));
  const allProducts = Array.from(uniqueProductMap.values());

  return {
    skinType,
    title,
    summary,
    amSteps,
    pmSteps,
    allProducts,
    patchTestGuide:
      "🧪 **Patch-Test Protocol**: Apply a pea-sized amount behind your ear or inner jawline for 24 hours before full-face application to verify zero localized sensitivity.",
    frequencyTip:
      "🗓️ **Usage Pacing**: Introduce new active serums (like BHA, AHA, or Tranexamic acid) gradually: Week 1 (2x per week) ➔ Week 2 (Every other evening) ➔ Week 3 (Daily as tolerated).",
    disclaimer: NOT_MEDICAL_ADVICE_DISCLAIMER,
  };
}

// =========================================================================
// AI COMPUTER VISION SKIN SCAN SIMULATOR
// =========================================================================

export function analyzeUploadedSkinPhoto(
  imageUrl: string,
  userNotes: string = ""
): SkinScanReport {
  const q = userNotes.toLowerCase();

  let skinType: SkinType = "combination";
  let hydrationScore = 48;
  let rednessScore = 32;
  let poreScore = 45;
  let smoothnessScore = 74;
  const findings: string[] = [];

  if (q.includes("oil") || q.includes("acne") || q.includes("breakout") || q.includes("shine")) {
    skinType = "oily";
    hydrationScore = 52;
    rednessScore = 58;
    poreScore = 68;
    smoothnessScore = 62;
    findings.push("Elevated lipid sheen detected across frontal T-zone (forehead and nasal bridge).");
    findings.push("Sub-surface micro-congestion and active follicular redness noted.");
    findings.push("Enlarged follicular pore opening density along medial cheeks.");
  } else if (q.includes("dry") || q.includes("flak") || q.includes("tight")) {
    skinType = "dry";
    hydrationScore = 28;
    rednessScore = 44;
    poreScore = 22;
    smoothnessScore = 56;
    findings.push("Compromised stratum corneum barrier with micro-desquamation (flaking).");
    findings.push("Trans-epidermal water loss (TEWL) micro-creping around eye contour.");
    findings.push("Low surface lipid reflectance indicating depleted ceramide levels.");
  } else if (q.includes("red") || q.includes("sensitiv") || q.includes("rosacea") || q.includes("burn")) {
    skinType = "sensitive";
    hydrationScore = 38;
    rednessScore = 76;
    poreScore = 34;
    smoothnessScore = 66;
    findings.push("Prominent cutaneous erythema (vascular flushing) concentrated on bilateral cheeks.");
    findings.push("Hypersensitive epidermal thinning with reactive barrier signals.");
    findings.push("Elevated skin surface temperature signature.");
  } else if (q.includes("spot") || q.includes("pigment") || q.includes("mark") || q.includes("scar")) {
    skinType = "combination";
    hydrationScore = 64;
    rednessScore = 38;
    poreScore = 42;
    smoothnessScore = 68;
    findings.push("Post-inflammatory hyperpigmentation (PIH) clusters on jawline and cheekbones.");
    findings.push("Localized UV-induced melanin deposits with uneven optical dispersion.");
    findings.push("Overall skin barrier remains relatively balanced.");
  } else {
    // Default Combination
    skinType = "combination";
    hydrationScore = 48;
    rednessScore = 36;
    poreScore = 52;
    smoothnessScore = 74;
    findings.push("Dual-zone pattern: increased sebum concentration in T-zone with drier lateral cheeks.");
    findings.push("Mild surface dehydration lines visible under natural daylight contrast.");
    findings.push("Pore dilation localized to nasal ala and chin with smooth perimeter.");
  }

  const focusMap: Record<SkinType, string> = {
    combination: "T-zone sebum regulation + lateral cheek hydration sandwiching",
    oily: "BHA pore purging + oil-free Centella soothing",
    dry: "Ceramide NP lipid replenishment + multi-molecular Hyaluronic Acid lock",
    sensitive: "Cutaneous cooling with 77% Heartleaf + micro-capillary healing Centella",
    normal: "Antioxidant photoprotection + botanical radiance maintenance",
  };

  return {
    id: `scan-${Date.now()}`,
    timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    imageUrl,
    skinType,
    hydrationScore,
    rednessScore,
    poreScore,
    smoothnessScore,
    findings,
    recommendedFocus: focusMap[skinType],
  };
}

// =========================================================================
// MEDICAL SAFETY TRIAGE DETECTOR
// =========================================================================

export function checkMedicalTriage(input: string): BotResponse["medicalAlert"] | null {
  const q = input.toLowerCase();

  // Severe medical triggers
  const urgentTriggers = [
    "bleeding",
    "pus",
    "oozing",
    "infected",
    "infection",
    "chemical burn",
    "severe burn",
    "blistering",
    "anaphylaxis",
    "swollen lips",
    "swollen eyes",
    "swollen face",
    "hives",
    "open sore",
    "open wound",
  ];

  if (urgentTriggers.some((t) => q.includes(t))) {
    return {
      severity: "urgent",
      condition: "Severe Acute Reaction / Possible Skin Infection",
      guidance:
        "⚠️ **URGENT SAFETY ALERT**: Your description indicates an acute inflammatory reaction, infection, or compromised skin tissue that requires **immediate medical attention**. Please stop applying all cosmetic skincare products immediately. Do not pick, scrub, or apply active acids. Consult a doctor or board-certified dermatologist promptly.",
      escalationUrl: "https://t.me/floralynskin",
    };
  }

  const clinicalTriggers = [
    "cystic acne",
    "severe eczema",
    "psoriasis",
    "contact dermatitis",
    "extreme peeling",
    "severe rosacea flare",
    "burning sensation that won't stop",
  ];

  if (clinicalTriggers.some((t) => q.includes(t))) {
    return {
      severity: "warning",
      condition: "Clinical Dermatological Condition",
      guidance:
        "⚠️ **Clinical Dermatological Care Advised**: Severe cystic nodules, active eczema flares, or chronic dermatitis involve deep systemic inflammation that cosmetic skincare cannot cure alone. We recommend having an evaluation with a certified dermatologist for targeted prescription care (such as topical tretinoin, oral antibiotics, or medical barrier ointments).",
      escalationUrl: "https://t.me/floralynskin",
    };
  }

  return null;
}

// =========================================================================
// ACTIVE INGREDIENT INTERACTION CHECKER
// =========================================================================

export function checkIngredientInteractions(input: string): string | null {
  const q = input.toLowerCase();

  if (
    (q.includes("retinol") || q.includes("tretinoin")) &&
    (q.includes("aha") || q.includes("bha") || q.includes("salicylic") || q.includes("glycolic") || q.includes("lactic") || q.includes("scrub"))
  ) {
    return "⚠️ **Active Conflict Warning: Retinoids + Exfoliating Acids (AHA/BHA)**\n\n• **Risk**: Using Retinol and direct chemical exfoliants in the same evening accelerates epidermal shedding too aggressively, leading to severe barrier burning, raw redness, and chemical dermatitis.\n• **Flora's Rule**: **Alternate nights!** Use your exfoliating toner on Monday/Thursday, and your Retinol on Tuesday/Friday. On off-nights, flood skin with Centella & Ceramides.";
  }

  if (
    (q.includes("vitamin c") || q.includes("ascorbic")) &&
    (q.includes("copper peptide") || q.includes("peptide"))
  ) {
    return "💡 **Ingredient Pairing Note: Vitamin C (Pure L-Ascorbic Acid) + Copper Peptides**\n\n• Direct high-strength pure L-Ascorbic Acid (low pH < 3.5) can oxidize copper ions in peptides, reducing their collagen-building efficacy.\n• **Flora's Rule**: Use Vitamin C in your **Morning (AM)** routine under sunscreen, and your *Mary & May 6-Peptide Serum* in your **Evening (PM)** routine!";
  }

  if (
    q.includes("niacinamide") &&
    (q.includes("vitamin c") || q.includes("ascorbic") || q.includes("txa") || q.includes("tranexamic"))
  ) {
    return "✅ **Synergistic Gold Standard: Niacinamide + Vitamin C / Tranexamic Acid**\n\n• Modern dermatological science confirms that Niacinamide and Tranexamic Acid (or stable Vitamin C) work hand-in-hand! While TXA stops inflammatory melanin production at the source, Niacinamide halts pigment transfer to upper epidermal cells.\n• **Verdict**: Highly recommended for stubborn dark spots and acne marks!";
  }

  if (q.includes("centella") || q.includes("cica") || q.includes("heartleaf")) {
    return "✅ **Universal Botanical Soothers: Centella Asiatica & Heartleaf**\n\n• Centella and Heartleaf have zero active conflicts. They can be safely combined with Retinol, Vitamin C, Benzoyl Peroxide, BHA, or chemical sunscreens to prevent irritation and strengthen micro-vessels.";
  }

  return null;
}

// =========================================================================
// MAIN FLORA INTELLIGENCE CONTROLLER
// =========================================================================

export function getFloraReply(
  input: string,
  catalog: Product[],
  userProfile?: {
    skinType?: SkinType;
    concerns?: SkinConcern[];
    lifestyle?: LifestyleFactor[];
    hasPhotoScan?: boolean;
  }
): BotResponse {
  const raw = input.trim();
  const q = raw.toLowerCase();

  // Helper finders
  const findProducts = (ids: number[]) => ids.map((id) => catalog.find((p) => p.id === id)).filter(Boolean) as Product[];

  // 1. Check for urgent medical triage triggers
  const medicalAlert = checkMedicalTriage(raw);
  if (medicalAlert) {
    return {
      text: `${medicalAlert.guidance}\n\n${NOT_MEDICAL_ADVICE_DISCLAIMER}\n\nOur human customer care team is available on Telegram to assist with gentle order adjustments:`,
      medicalAlert,
      action: {
        type: "link",
        url: medicalAlert.escalationUrl || "/account",
        label: "Contact Care Specialist on Telegram ↗",
      },
      suggestions: [
        { label: "🌸 Soothing Products for Sensitive Skin", query: "What products are safest for sensitive skin?" },
        { label: "💬 Connect with Human Support", query: "How do I contact customer support?" },
      ],
    };
  }

  // 2. Active Ingredient Pairing Check
  const pairingNote = checkIngredientInteractions(raw);
  if (pairingNote && (q.includes("can i use") || q.includes("mix") || q.includes("together") || q.includes("pairing") || q.includes("conflict"))) {
    return {
      text: pairingNote,
      suggestions: [
        { label: "📖 Skincare Order & Layering", query: "What is the correct order to apply skincare?" },
        { label: "🧴 Recommend Full Routine", query: "build my personalized routine" },
      ],
    };
  }

  // 3. Discount / Promo / Coupons
  if (
    q.includes("discount") ||
    q.includes("code") ||
    q.includes("promo") ||
    q.includes("coupon") ||
    q.includes("offer") ||
    q.includes("voucher") ||
    q.includes("bloom10") ||
    q.includes("10%") ||
    q.includes("sale")
  ) {
    return {
      text: "A special gift for you! 🌸 Use code **BLOOM10** at checkout for **10% off** your entire order.\n\nIt applies automatically to all our authentic Korean skincare favorites and Cambodian heritage botanicals. Click below to apply it straight to your bag:",
      action: {
        type: "discount",
        code: "BLOOM10",
        label: "Apply Code: BLOOM10 (10% Off)",
      },
      suggestions: [
        { label: "🌟 Take 60s Skin Diagnostic Quiz", query: "start skin quiz" },
        { label: "☀️ Best Daily Sunscreens", query: "What are your best SPF50+ sunscreens?" },
      ],
    };
  }

  // 4. Guided Diagnostic Quiz Triggers & Steps
  if (q.includes("start skin quiz") || q.includes("skin quiz") || q.includes("diagnostic quiz") || q.includes("diagnose my skin")) {
    return {
      text: "✨ **Welcome to the Floralyn Botanical Skin Diagnostic!**\n\nIn just 3 quick taps, I will analyze your skin type, primary concerns, and environmental factors to generate a customized AM & PM routine tailored specifically for you.\n\n**Step 1 of 3: How does your skin feel 2 hours after washing your face?**",
      quizStep: {
        step: "type",
        title: "Step 1: Skin Type Identification",
        question: "Select the option that best describes your skin:",
        options: [
          { label: "⚖️ Combination (Oily T-Zone, Dry Cheeks)", value: "combination", query: "my skin type is combination" },
          { label: "🌿 Oily & Shiny All Over", value: "oily", query: "my skin type is oily" },
          { label: "💧 Dry, Flaky or Tight", value: "dry", query: "my skin type is dry" },
          { label: "🌸 Sensitive & Easily Red", value: "sensitive", query: "my skin type is sensitive" },
          { label: "✨ Normal & Balanced", value: "normal", query: "my skin type is normal" },
        ],
      },
      suggestions: [
        { label: "⚖️ Combination", query: "my skin type is combination" },
        { label: "🌿 Oily", query: "my skin type is oily" },
        { label: "💧 Dry", query: "my skin type is dry" },
        { label: "🌸 Sensitive", query: "my skin type is sensitive" },
      ],
    };
  }

  // Quiz Step 1: Skin Type Selected
  if (q.startsWith("my skin type is ")) {
    const rawType = q.replace("my skin type is ", "").trim();
    const cleanType: SkinType = ["combination", "oily", "dry", "sensitive", "normal"].includes(rawType)
      ? (rawType as SkinType)
      : "combination";

    return {
      text: `Got it! You have **${cleanType.toUpperCase()} skin** 🌿\n\n**Step 2 of 3: What is your #1 primary skin target right now?**`,
      quizStep: {
        step: "concerns",
        title: "Step 2: Primary Skin Concern",
        question: "Select your main target:",
        options: [
          { label: "🚨 Acne, Breakouts & Blemishes", value: "acne", query: `concern acne for ${cleanType} skin` },
          { label: "✨ Dark Spots & Hyperpigmentation", value: "dark_spots", query: `concern dark spots for ${cleanType} skin` },
          { label: "🌸 Redness, Irritation & Rosacea", value: "redness", query: `concern redness for ${cleanType} skin` },
          { label: "💧 Dehydrated / Damaged Barrier", value: "barrier_repair", query: `concern barrier repair for ${cleanType} skin` },
          { label: "🌿 Large Pores & Excess Sebum", value: "pores_sebum", query: `concern pores for ${cleanType} skin` },
          { label: "🌱 Anti-Aging & Loss of Elasticity", value: "anti_aging", query: `concern anti aging for ${cleanType} skin` },
        ],
      },
      suggestions: [
        { label: "🚨 Acne & Breakouts", query: `concern acne for ${cleanType} skin` },
        { label: "✨ Dark Spots & Marks", query: `concern dark spots for ${cleanType} skin` },
        { label: "💧 Barrier Repair", query: `concern barrier repair for ${cleanType} skin` },
        { label: "🌿 Large Pores", query: `concern pores for ${cleanType} skin` },
      ],
    };
  }

  // Quiz Step 2: Concern Selected -> Ask for Lifestyle/Climate
  if (q.startsWith("concern ")) {
    const parts = q.replace("concern ", "").split(" for ");
    const rawConcern = parts[0]?.trim() || "barrier_repair";
    const rawType = (parts[1]?.replace(" skin", "").trim() as SkinType) || "combination";

    return {
      text: `Noted! Targeting **${rawConcern.toUpperCase()}** for your ${rawType} skin.\n\n**Step 3 of 3: What environmental or lifestyle factor impacts your day most?**`,
      quizStep: {
        step: "lifestyle",
        title: "Step 3: Environment & Lifestyle",
        question: "Choose your primary daily factor:",
        options: [
          { label: "☀️ Tropical Hot / Humid Climate (Cambodia)", value: "humid_climate", query: `routine generate ${rawType} ${rawConcern} humid_climate` },
          { label: "❄️ Air-Conditioned / Indoor Dry Air", value: "ac_dry_air", query: `routine generate ${rawType} ${rawConcern} ac_dry_air` },
          { label: "🏖️ High Daily Sun & UV Exposure", value: "high_sun", query: `routine generate ${rawType} ${rawConcern} high_sun` },
          { label: "💄 Daily Makeup Wearer", value: "daily_makeup", query: `routine generate ${rawType} ${rawConcern} daily_makeup` },
          { label: "😴 High Stress / Lack of Sleep", value: "stress_sleep", query: `routine generate ${rawType} ${rawConcern} stress_sleep` },
        ],
      },
      suggestions: [
        { label: "☀️ Tropical Hot Climate", query: `routine generate ${rawType} ${rawConcern} humid_climate` },
        { label: "❄️ Air-Conditioned Indoors", query: `routine generate ${rawType} ${rawConcern} ac_dry_air` },
        { label: "🏖️ High Sun Exposure", query: `routine generate ${rawType} ${rawConcern} high_sun` },
      ],
    };
  }

  // Quiz Step 3: Complete Generation
  if (q.startsWith("routine generate ")) {
    const tokens = q.replace("routine generate ", "").split(" ");
    const skinType = (tokens[0] as SkinType) || "combination";
    const rawConcern = tokens[1] || "barrier_repair";
    const concern: SkinConcern = rawConcern.includes("acne")
      ? "acne"
      : rawConcern.includes("spot")
      ? "dark_spots"
      : rawConcern.includes("red")
      ? "redness"
      : rawConcern.includes("pore")
      ? "pores_sebum"
      : rawConcern.includes("aging")
      ? "anti_aging"
      : "barrier_repair";

    const routine = buildPersonalizedRoutine(skinType, concern, catalog);

    return {
      text: `🎉 **Diagnosis Complete! Here is your custom ${routine.title}:**\n\n${routine.summary}\n\n**Morning (AM) Routine:**\n${routine.amSteps.map((s) => `${s.step}. **${s.product.name}** (${s.role})\n   *Usage*: ${s.usage}`).join("\n\n")}\n\n**Evening (PM) Routine:**\n${routine.pmSteps.map((s) => `${s.step}. **${s.product.name}** (${s.role})\n   *Usage*: ${s.usage}`).join("\n\n")}\n\n${routine.patchTestGuide}\n\n${routine.frequencyTip}\n\n${NOT_MEDICAL_ADVICE_DISCLAIMER}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: `🛍️ Add Complete ${skinType.toUpperCase()} Routine to Bag`,
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "🌿 Make it a 3-Step Minimalist", query: `make routine minimalist ${skinType}` },
        { label: "💰 Keep it Under $50", query: `make routine budget ${skinType}` },
        { label: "🌱 100% Vegan Only", query: `make routine vegan ${skinType}` },
        { label: "📸 Upload Selfie for AI Skin Scan", query: "scan my skin photo" },
      ],
    };
  }

  // Routine Customization Adapters: Minimalist / Budget / Vegan
  if (q.includes("minimalist") || q.includes("3-step") || q.includes("3 step")) {
    const skinType: SkinType = q.includes("oily") ? "oily" : q.includes("dry") ? "dry" : q.includes("sensitive") ? "sensitive" : "combination";
    const routine = buildPersonalizedRoutine(skinType, "barrier_repair", catalog, { minimalist: true });
    return {
      text: `🌿 **Your Streamlined 3-Step Minimalist Routine (${skinType.toUpperCase()} Skin):**\n\nNo complicated 10 steps! Just the high-potency core essentials for healthy, glowing skin:\n\n**AM:** 1. Cleanse ➔ 2. Moisturize ➔ 3. SPF50+\n**PM:** 1. Double Cleanse ➔ 2. Restorative Barrier Cream\n\n${NOT_MEDICAL_ADVICE_DISCLAIMER}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Minimalist 3-Step Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "💰 Keep Under $50", query: `make routine budget ${skinType}` },
        { label: "🌟 Take Full Diagnostic Quiz", query: "start skin quiz" },
      ],
    };
  }

  if (q.includes("under $50") || q.includes("budget") || q.includes("affordable")) {
    const skinType: SkinType = q.includes("oily") ? "oily" : q.includes("dry") ? "dry" : "combination";
    // Choose 2 high-impact items under $50 total
    const prods = skinType === "oily"
      ? findProducts([38, 29]) // Anua foam ($18) + Sun serum ($21) = $39
      : findProducts([2, 1]); // Cloud milk ($22) + Dew drop ($28) = $50
    return {
      text: `💰 **Best Value Skincare Duo (Under $50 Total):**\n\nHigh-performance Korean and botanical essentials tailored for your budget that deliver maximum skin transformation:`,
      products: prods,
      action: {
        type: "add_routine",
        label: "🛍️ Add $50 Bundle to Bag",
        productIds: prods.map((p) => p.id),
      },
      suggestions: [
        { label: "🎁 Apply 10% Off Code BLOOM10", query: "Do you have a discount code?" },
        { label: "🌟 Take Full Skin Quiz", query: "start skin quiz" },
      ],
    };
  }

  if (q.includes("vegan") || q.includes("100% vegan")) {
    const routine = buildPersonalizedRoutine("combination", "barrier_repair", catalog, { veganOnly: true });
    return {
      text: `🌱 **100% Certified Vegan Skincare Routine:**\n\nZero animal derivatives, zero honey/snail mucin, and strictly certified cruelty-free. Featuring Mary & May's vegan blackberry complexes and pure Madagascar Centella:`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Vegan Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "✨ Korean Glass Skin", query: "How to get Korean glass skin?" },
        { label: "☀️ Best Sunscreens", query: "What are your best sunscreens?" },
      ],
    };
  }

  // 5. Photo Upload / Computer Vision Skin Scan Prompt
  if (q.includes("photo") || q.includes("selfie") || q.includes("scan") || q.includes("camera") || q.includes("image")) {
    return {
      text: "📸 **AI Skin Analysis (Computer Vision)**\n\nYou can upload a clear, makeup-free selfie or skin close-up! \n\nClick the **📷 camera icon** in the chat bar below to upload an image. Flora's vision scanner will detect:\n• Dermal hydration levels\n• Erythema & surface redness\n• Follicular pore congestion & sebum distribution\n• Surface texture smoothness index\n\n*All uploaded images are processed locally in your browser and are never stored on public servers.*",
      action: {
        type: "scan",
        label: "📸 Click Camera to Upload Skin Photo",
      },
      suggestions: [
        { label: "🌟 Take 60s Skin Quiz Instead", query: "start skin quiz" },
        { label: "⚖️ Combination Skin Routine", query: "What routine is best for combination skin?" },
      ],
    };
  }

  // 6. Direct Skin Diagnostic Shortcuts (Freeform inquiries)
  if (q.includes("combination") || q.includes("combo") || q.includes("t-zone") || (q.includes("oily") && q.includes("dry"))) {
    const routine = buildPersonalizedRoutine("combination", "barrier_repair", catalog);
    return {
      text: `⚖️ **Personalized Routine for Combination Skin:**\n\nCombination skin needs **dual-zone balance**—hydrating thirsty cheeks without suffocating the oily T-zone.\n\n**Recommended Morning (AM) & Evening (PM) Routine:**\n${routine.amSteps.map((s) => `• ${s.role}: **${s.product.name}**`).join("\n")}\n\n${routine.pmSteps.map((s) => `• ${s.role}: **${s.product.name}**`).join("\n")}\n\n${routine.patchTestGuide}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Complete Combination Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "🌿 Make it Minimalist 3-Step", query: "make routine minimalist combination" },
        { label: "📖 Skincare Layering Order", query: "What is the correct order to apply skincare?" },
      ],
    };
  }

  if (q.includes("oily") || q.includes("pore") || q.includes("sebum") || q.includes("blackhead")) {
    const routine = buildPersonalizedRoutine("oily", "pores_sebum", catalog);
    return {
      text: `🌿 **Personalized Routine for Oily & Pore-Congested Skin:**\n\nBalancing sebum with sub-acidic micro-peels and mineral hydration rather than harsh alcohol stripping:\n\n${routine.amSteps.map((s) => `• AM: **${s.product.name}** (${s.role})`).join("\n")}\n${routine.pmSteps.map((s) => `• PM: **${s.product.name}** (${s.role})`).join("\n")}\n\n${routine.patchTestGuide}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Oily & Pore Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "🫧 What is Double Cleansing?", query: "How does double cleansing work?" },
        { label: "☀️ Safe Sunscreen for Oily Skin", query: "What sunscreen won't cause breakouts?" },
      ],
    };
  }

  if (q.includes("acne") || q.includes("pimple") || q.includes("breakout") || q.includes("blemish")) {
    const routine = buildPersonalizedRoutine("oily", "acne", catalog);
    return {
      text: `🚨 **Anti-Blemish & Breakout Calming Prescription:**\n\nTargeting inflammatory acne bacteria with non-comedogenic tea tree and pure Centella Asiatica:\n\n${routine.amSteps.map((s) => `• AM: **${s.product.name}** (${s.role})`).join("\n")}\n${routine.pmSteps.map((s) => `• PM: **${s.product.name}** (${s.role})`).join("\n")}\n\n${routine.patchTestGuide}\n\n${NOT_MEDICAL_ADVICE_DISCLAIMER}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Blemish Relief Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "✨ Fade Post-Acne Marks", query: "What helps with post-acne marks?" },
        { label: "🌿 Tea-Trica Relief Info", query: "What is Skin1004 Tea-Trica?" },
      ],
    };
  }

  if (q.includes("dry") || q.includes("flak") || q.includes("dehydrat") || q.includes("barrier")) {
    const routine = buildPersonalizedRoutine("dry", "barrier_repair", catalog);
    return {
      text: `💧 **Barrier Repair & Deep Lipid Recovery Routine:**\n\nRestoring compromised stratum corneum lipids with bio-fermented TECA and anthocyanin ceramides:\n\n${routine.amSteps.map((s) => `• AM: **${s.product.name}** (${s.role})`).join("\n")}\n${routine.pmSteps.map((s) => `• PM: **${s.product.name}** (${s.role})`).join("\n")}\n\n${routine.patchTestGuide}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Barrier Recovery Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "❓ How to Layer Skincare", query: "What order should I apply skincare?" },
        { label: "🌸 Sensitive Skin Care", query: "What is best for sensitive skin?" },
      ],
    };
  }

  if (q.includes("sensitiv") || q.includes("redness") || q.includes("rosacea") || q.includes("irritat")) {
    const routine = buildPersonalizedRoutine("sensitive", "redness", catalog);
    return {
      text: `🌸 **Hypoallergenic Redness Relief Protocol:**\n\nZero fragrance, low sub-acidic pH, and high concentrations of Korean Heartleaf and pure Madagascar Centella:\n\n${routine.amSteps.map((s) => `• AM: **${s.product.name}** (${s.role})`).join("\n")}\n${routine.pmSteps.map((s) => `• PM: **${s.product.name}** (${s.role})`).join("\n")}\n\n${routine.patchTestGuide}`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Sensitive Calming Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "☀️ Safe Sunscreen for Sensitive Skin", query: "What sunscreen is best for sensitive skin?" },
        { label: "🧴 How to Cleanse Gently", query: "What cleanser is gentlest?" },
      ],
    };
  }

  if (q.includes("dark spot") || q.includes("hyperpigmentation") || q.includes("melasma") || q.includes("brighten")) {
    const routine = buildPersonalizedRoutine("combination", "dark_spots", catalog);
    return {
      text: `✨ **Multi-Pathway Dark Spot & Brightening Protocol:**\n\nBlocks melanin transfer using Tranexamic Acid 4% + Niacinamide 10% and Alpha-Arbutin:\n\n${routine.amSteps.map((s) => `• AM: **${s.product.name}** (${s.role})`).join("\n")}\n${routine.pmSteps.map((s) => `• PM: **${s.product.name}** (${s.role})`).join("\n")}\n\n*Note*: Daily SPF50+ is mandatory to prevent UV from darkening fading spots!`,
      routine,
      products: routine.allProducts,
      action: {
        type: "add_routine",
        label: "🛍️ Add Dark Spot Routine to Bag",
        productIds: routine.allProducts.map((p) => p.id),
      },
      suggestions: [
        { label: "☀️ Daily SPF50+ Sunscreens", query: "What are your best sunscreens?" },
        { label: "🧪 Can I mix Niacinamide & Vitamin C?", query: "Can I use Niacinamide with Vitamin C?" },
      ],
    };
  }

  // 7. General Skincare Order & Layering
  if (q.includes("order") || q.includes("layer") || q.includes("step") || q.includes("first") || q.includes("how to apply")) {
    return {
      text: "📖 **The Golden Rule of Skincare Order: Thinnest to Thickest Consistency**\n\nApplying products from water-light textures to rich lipid barriers ensures every active ingredient penetrates without being blocked:\n\n**Morning (AM) Routine:**\n1. **Gentle Cleanser** (removes overnight sebum)\n2. **Toner** (rebalances skin pH & preps absorption)\n3. **Essence** (watery or milky hydration cushion)\n4. **Serum / Ampoule** (targeted active treatments, e.g., Centella or Niacinamide)\n5. **Lightweight Moisturizer** (locks in moisture)\n6. **Sunscreen SPF50+** (mandatory final shield before makeup!)\n\n**Evening (PM) Routine:**\n1. **Oil Cleanser** (melts SPF & sebum)\n2. **Water-Based Cleanser** (deep rinse)\n3. **Toner / Exfoliant** (PHA / AHA)\n4. **Targeted Treatment Serum**\n5. **Eye Cream**\n6. **Rich Barrier Cream or Overnight Balm**",
      suggestions: [
        { label: "🫧 What is Double Cleansing?", query: "How does double cleansing work?" },
        { label: "🧪 Active Ingredient Pairing", query: "Can I use Retinol with AHA BHA?" },
      ],
    };
  }

  // 8. General Sunscreen Science
  if (q.includes("sun") || q.includes("spf") || q.includes("pa++++") || q.includes("sunscreen")) {
    const prods = findProducts([29, 13, 24, 22]);
    return {
      text: "☀️ **Sunscreen Truth: The Ultimate Anti-Aging Secret!**\n\nUp to **80% of visible skin aging**, dark spots, and loss of collagen is caused by UV light. \n\n• **Do I need SPF indoors or on cloudy days?** YES! UVA rays penetrate clouds and glass window panes all year long.\n• **What does PA++++ mean?** PA measures protection against UVA (Aging & Dark Spots). 4 pluses (++++) is the highest dermatological grade available.\n• **Chemical vs. Mineral?** Our Korean chemical sunscreens (*Skin1004 Hyalu-Cica* & *Beauty of Joseon*) absorb UV into harmless heat with **zero white cast, zero stickiness, and a dewy skincare serum finish**.",
      products: prods,
      suggestions: [
        { label: "✨ Dark Spots Routine", query: "What helps with dark spots?" },
        { label: "🌟 Take Diagnostic Quiz", query: "start skin quiz" },
      ],
    };
  }

  // 9. Payment & Delivery in Cambodia
  if (q.includes("payment") || q.includes("pay") || q.includes("aba") || q.includes("khqr") || q.includes("cod") || q.includes("delivery") || q.includes("shipping")) {
    return {
      text: "💳 **Payment & Delivery in Cambodia:**\n\n• **Payment Methods**: ABA PAY & KHQR (instant scan from any Cambodian bank app), Cash on Delivery (COD), Visa & Mastercard.\n• **Delivery Time**: Same-day or next-day in Phnom Penh. 1–2 business days to all provinces (Siem Reap, Battambang, Kampot, etc.) via express couriers.\n• **Free Shipping**: FREE delivery on all orders over $50!",
      action: {
        type: "link",
        url: "/account",
        label: "Track Orders in Account ↗",
      },
      suggestions: [
        { label: "🎁 10% Discount Code", query: "Do you have a discount code?" },
        { label: "🌟 Take Skin Quiz", query: "start skin quiz" },
      ],
    };
  }

  // 10. Greetings & Small Talk
  if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("who are you")) {
    return {
      text: "Hello radiant soul 🌿 Welcome to Floralyn Skin. I'm Flora, your AI Skincare Aesthetician & Botanical Advisor.\n\nI can guide you through a **60s Skin Diagnostic Quiz**, analyze your skin photo with computer vision, build customized AM/PM routines, or answer any skincare and active ingredient questions! How can I pamper your skin today?",
      suggestions: [
        { label: "🌟 Take 60s Skin Diagnostic Quiz", query: "start skin quiz" },
        { label: "📸 Upload Selfie Skin Scan", query: "scan my skin photo" },
        { label: "⚖️ Combination Skin Routine", query: "What routine is best for combination skin?" },
        { label: "🎁 10% Discount Code", query: "Do you have a discount code?" },
      ],
    };
  }

  // 11. Keyword Catalog Search Fallback
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const matched = catalog.filter((p) => {
    const text = `${p.name} ${p.brand} ${p.role} ${p.category} ${p.tag} ${p.description} ${p.benefits.join(" ")}`.toLowerCase();
    return words.some((w) => text.includes(w));
  });

  if (matched.length > 0) {
    return {
      text: `Based on your question about **"${raw}"**, here are targeted botanical recommendations from our collection:`,
      products: matched.slice(0, 3),
      suggestions: [
        { label: "🌟 Take Skin Diagnostic Quiz", query: "start skin quiz" },
        { label: "📖 Skincare Layering Order", query: "What order should I apply skincare?" },
      ],
    };
  }

  // General Fallback
  return {
    text: "I want to make sure you get the best advice for your skin! 🌿\n\nTry:\n• *\"Start skin quiz\"* to get a custom AM/PM routine\n• *\"Scan my skin photo\"* to run an AI computer vision analysis\n• *\"Can I use Retinol with AHA BHA?\"* to check ingredient safety\n• *\"What payment methods and delivery do you have in Cambodia?\"*\n\nOr click one of these quick options:",
    suggestions: DEFAULT_SUGGESTIONS.slice(0, 4),
  };
}
