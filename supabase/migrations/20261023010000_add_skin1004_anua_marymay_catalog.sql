-- Migration: 20261023010000_add_skin1004_anua_marymay_catalog.sql
-- Expand Korean Skincare catalog with Skin1004, Mary & May, and Anua products with designated routine roles

insert into public.products (id, name, category, sku, price_cents, description, detail, image_url, tag, benefits, brand, role, origin, active)
values
  -- Skin1004 Collection
  (26, 'Skin1004 - Madagascar Centella Light Cleansing Oil', 'Cleansers', 'SK-026', 2000,
   'Ultra-lightweight botanical cleansing oil with Centella Asiatica to melt stubborn sebum and pore debris.',
   'Formulated with pure Madagascar Centella extract and 6 plant-based botanical oils. Effortlessly dissolves waterproof sunscreen, makeup, and blackheads without clouding vision or leaving heavy residue. Emulsifies instantly upon water contact.',
   '/products/skin1004-cleansing-oil.jpg',
   'GENTLE CICA CLEANSE', array['Pure Madagascar Centella', 'Melts blackheads & SPF', 'Zero greasy film'],
   'Skin1004', 'Gentle Sebum & Water-Resistant Makeup Dissolver', 'Korean Skincare', true),

  (27, 'Skin1004 - Madagascar Centella Toning Toner', 'Toners & Essences', 'SK-027', 1900,
   'Gentle daily exfoliating toner infused with 84% Centella Asiatica and gentle PHA for sensitive skin.',
   'Combines 84% Centella Asiatica with non-irritating Polyhydroxy Acid (PHA) to gently lift dead skin cells, refine texture, and replenish hydration. Sub-acidic pH maintains a tranquil skin barrier.',
   '/products/skin1004-toning-toner.jpg',
   'DAILY GENTLE PEEL', array['84% Centella extract', 'Gentle micro-exfoliating PHA', 'Balances sub-acidic pH'],
   'Skin1004', 'Mild PHA Exfoliating & Daily Redness Soother', 'Korean Skincare', true),

  (28, 'Skin1004 - Madagascar Centella Soothing Cream', 'Moisturizers & Creams', 'SK-028', 2100,
   'Lightweight cooling gel-cream formulated with 72% Centella and 4 botanical ceramide complexes.',
   'Specifically engineered for hot climates and barrier-compromised skin. Quadruple ceramides mimic skin natural lipid structure while Madagascar Centella rapidly pacifies heat, redness, and irritation with a silky matte finish.',
   '/products/skin1004-soothing-cream.jpg',
   'BARRIER REPAIR', array['72% Centella Asiatica', 'Quadruple bio-ceramides', 'Non-sticky cooling finish'],
   'Skin1004', 'Quadruple Ceramide Barrier Repair & Cooling Gel Shield', 'Korean Skincare', true),

  (29, 'Skin1004 - Madagascar Centella Hyalu-Cica Water-Fit Sun Serum SPF50+ PA++++', 'Sun Protection', 'SK-029', 1900,
   'The global cult-favorite chemical sunscreen that glides on like a featherlight moisturizing serum.',
   'Infused with Skin1004 proprietary Hyalu-Cica formula (Centella Asiatica + 3 Hyaluronic Acids) to deeply hydrate and soothe while blocking UVA/UVB rays and digital blue light. Leaves zero white cast and zero sticky buildup.',
   '/products/skin1004-hyalu-cica-sun.jpg',
   'VIRAL SUN SERUM', array['Hyalu-Cica hydration complex', 'Featherlight serum feel', 'Reef-safe SPF50+ PA++++'],
   'Skin1004', 'Weightless Hyalu-Cica Daily Sun Serum & Blue Light Defense', 'Korean Skincare', true),

  (30, 'Skin1004 - Madagascar Centella Poremizing Fresh Ampoule', 'Serums & Ampoules', 'SK-030', 2200,
   'Clarifying ampoule with Himalayan Pink Salt and Peptide 9 Complex to tighten enlarged pores.',
   'Rich in 80 mineral-dense Himalayan pink salt ions to flush micro-impurities from pores. Blended with Peptide 9 Complex to restore elasticity around stretched pores, promoting tight, smooth, glass skin.',
   '/products/skin1004-poremizing.jpg',
   'PORE MINIMIZER', array['Himalayan pink salt minerals', 'Peptide 9 elasticity blend', 'Tightens enlarged pores'],
   'Skin1004', 'Himalayan Pink Salt Sebum Balancing & Pore Minimizer', 'Korean Skincare', true),

  (31, 'Skin1004 - Madagascar Centella Tea-Trica Relief Ampoule', 'Serums & Ampoules', 'SK-031', 2000,
   'SOS soothing ampoule formulated with Needle Leaf Tea Tree Water and Centella for breakout-prone skin.',
   'Rapidly calms active hormonal breakouts, redness, and sebum congestion without drying out skin. The non-comedogenic blend of Tea-Trica (Tea tree + Centella + Pine tree) diminishes inflammation and speeds healing.',
   '/products/skin1004-tea-trica.jpg',
   'ACNE SOS HERO', array['Needle leaf tea tree water', 'Emergency blemish calming', 'Non-comedogenic certified'],
   'Skin1004', 'Blemish Emergency Calming & Acne Flare Relief', 'Korean Skincare', true),

  (32, 'Skin1004 - Madagascar Centella Probio-Cica Enrich Cream', 'Moisturizers & Creams', 'SK-032', 2500,
   'Intensive biome barrier cream infused with fermented Centella and vegan TECA for compromised skin.',
   'Fermented with plant-derived Lactobacillus to optimize the cutaneous microbiome. Delivers rich, cushiony moisture that repairs severe flaking, barrier damage, and irritation from harsh treatments or retinoids.',
   '/products/skin1004-probio-cream.jpg',
   'PROBIOTIC RESTORE', array['Fermented Centella biome', 'Vegan TECA lipid complex', 'Overnight barrier renewal'],
   'Skin1004', 'Fermented Microbiome & Deep Intensive Skin Recovery Cream', 'Korean Skincare', true),

  -- Mary & May Active Clean Line
  (33, 'Mary & May - Vegan Blackberry Complex Cream Essence', 'Toners & Essences', 'MM-033', 2400,
   'Dual-layer antioxidant milky essence with 50,000 ppm Blackberry extract and Blue Lotus water.',
   'Shakes into a creamy emulsion that floods skin with deep hydration and anthocyanin antioxidants. Strengthens the moisture barrier with phytosphingosine and ceramides, leaving a plump, radiant glass skin luster.',
   '/products/mary-may-blackberry-essence.jpg',
   'BI-PHASE GLOW', array['50,000 ppm Blackberry extract', 'Ceramide NP milk emulsion', 'Long-lasting glass glow'],
   'Mary & May', 'Bi-Phase Milky Antioxidant Ceramide Glow Essence', 'Korean Skincare', true),

  (34, 'Mary & May - Tranexamic Acid + Glutathione Eye Cream', 'Masks & Treatments', 'MM-034', 1900,
   'Targeted undereye cream blending Tranexamic Acid and Glutathione to brighten stubborn dark circles.',
   'Formulated with gold-standard brightening actives to inhibit melanin transfer under the fragile eye contour. Lightweight, non-milia forming cream absorbs smoothly under concealer and softens dehydration fine lines.',
   '/products/mary-may-eye-cream.jpg',
   'DARK CIRCLE HERO', array['Tranexamic acid + Glutathione', 'Fades undereye shadows', 'Prevents milia formation'],
   'Mary & May', 'Dark Circle & Undereye Hyperpigmentation Brightener', 'Korean Skincare', true),

  (35, 'Mary & May - 6 Peptide Complex Serum', 'Serums & Ampoules', 'MM-035', 1800,
   'High-concentration 6 Peptide matrix serum designed to stimulate collagen and firm facial contours.',
   'Delivers 6 specialized peptides (Copper Tripeptide-1, Hexapeptide-11, Hexapeptide-9, Palmitoyl Pentapeptide-4, Palmitoyl Tripeptide-1, Tripeptide-1) deep into dermis layers to promote skin bounce, elasticity, and youthful density.',
   '/products/mary-may-peptide-serum.jpg',
   'PEPTIDE FIRMING', array['6 Synergistic peptides', 'Boosts collagen production', 'Fast-absorbing watery serum'],
   'Mary & May', 'Multi-Peptide Elasticity & Collagen Synthesis Serum', 'Korean Skincare', true),

  (36, 'Mary & May - Vegan Cica Tea Tree AHA BHA PHA Toner', 'Toners & Essences', 'MM-036', 2100,
   'Low-irritation clarifying toner combining AHA, BHA, PHA with Centella and Tea Tree Leaf water.',
   'Gently dissolves dead keratin buildup and sebum plugs without disrupting skin pH. Enriched with Centella and Tea Tree to rapidly pacify redness and prevent future congestion.',
   '/products/mary-may-cica-toner.jpg',
   'TRIPLE ACID CLEAR', array['AHA, BHA & PHA micro-peel', 'Centella & Tea Tree calm', 'Pore refining sub-acidic pH'],
   'Mary & May', 'Triple Acid Clarifying & Pore Purifying Soothing Toner', 'Korean Skincare', true),

  (37, 'Mary & May - Rose Hyaluronic Hydra Wash-Off Mask Pack', 'Masks & Treatments', 'MM-037', 2200,
   'Luxurious wash-off treatment packed with real French blooming rose petals and 5 types of hyaluronic acid.',
   'Unlike drying clay masks, this creamy formula detoxifies pores while simultaneously drenching dehydrated skin in moisture. Real damask rose petals gently polish texture and impart a rosy, refreshed radiance.',
   '/products/mary-may-rose-mask.jpg',
   'ROSE SPA PACK', array['Real French rose petals', '5 Hyaluronic acid weights', 'Detoxifies without drying'],
   'Mary & May', 'French Rose Petal & Deep Moisture Mineral Clay Pack', 'Korean Skincare', true),

  -- Anua Heartleaf Essentials
  (38, 'Anua - Heartleaf Quercetinol Pore Deep Cleansing Foam', 'Cleansers', 'ANU-038', 1800,
   'Gentle micro-foam with 33.4% Heartleaf extract, Quercetinol, and 0.5% BHA for pore-deep cleansing.',
   'Features finely ground Heartleaf powder and mild salicylic acid (BHA) to sweep away pore waste, excess sebum, and makeup remnants. Anti-sebum P patent prevents excess oiliness while maintaining the acid mantle.',
   '/products/anua-cleansing-foam.jpg',
   'PORE DEEP WASH', array['33.4% Heartleaf + Quercetinol', '0.5% BHA micro-exfoliation', 'Anti-Sebum P patent formula'],
   'Anua', 'Deep Pore Exfoliating & Blemish Clarifying Foam Cleanser', 'Korean Skincare', true),

  (39, 'Anua - Heartleaf 70% Daily Relief Lotion', 'Moisturizers & Creams', 'ANU-039', 2300,
   'Daily lightweight soothing lotion containing 70% Heartleaf extract and triple hyaluronic acid.',
   'Formulated with sub-acidic pH to restore equilibrium to reactive, redness-prone skin. Glides on effortlessly with zero pore clogging or oiliness, making it an ideal day moisturizer under makeup or SPF.',
   '/products/anua-70-lotion.jpg',
   'DAILY CALM LOTION', array['70% Heartleaf extract', 'Triple hyaluronic cushion', 'Non-comedogenic lotion texture'],
   'Anua', 'Lightweight Daily Soothing & Barrier Hydration Lotion', 'Korean Skincare', true)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  sku = excluded.sku,
  price_cents = excluded.price_cents,
  description = excluded.description,
  detail = excluded.detail,
  image_url = excluded.image_url,
  tag = excluded.tag,
  benefits = excluded.benefits,
  brand = excluded.brand,
  role = excluded.role,
  origin = excluded.origin,
  active = excluded.active;

-- Initialize inventory rows for new products
insert into public.inventory (product_id, warehouse_id, quantity, low_stock_threshold)
select id, 'main', 25, 6 from public.products
where id between 26 and 39
on conflict (product_id, warehouse_id) do nothing;

-- Deactivate Velvet Night Cream
update public.products
set active = false
where id = 6 or name ilike '%Velvet Night Cream%';
