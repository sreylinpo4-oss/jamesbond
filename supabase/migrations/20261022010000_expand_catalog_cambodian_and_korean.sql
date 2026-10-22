-- Migration: 20261022010000_expand_catalog_cambodian_and_korean.sql
-- Add brand, role, and origin columns to products table and seed Cambodian & Korean catalog

alter table public.products
  add column if not exists brand text,
  add column if not exists role text,
  add column if not exists origin text;

-- Insert or update Cambodian Botanical and Korean Skincare catalog
insert into public.products (id, name, category, sku, price_cents, description, detail, image_url, tag, benefits, brand, role, origin, active)
values
  -- Cambodian Local Botanicals
  (7, 'Angkor Sacred Lotus Calming Essence', 'Toners & Essences', 'KH-007', 2600,
   'Hand-harvested Banteay Srei pink lotus essence to soothe tropical heat.',
   'Cultivated in Cambodia historic lotus sanctuaries, sacred pink lotus petals are rich in restorative polyphenols and flavonoids. Calms heat-stressed skin, reduces flushing, and delivers weightless moisture.',
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85',
   'CAMBODIAN BOTANICAL', array['Banteay Srei pink lotus', 'Soothes heat irritation', 'Weightless watery prep'],
   'Floralyn Khmer Botanicals', 'Anti-Inflammatory & Soothing Essence', 'Cambodian Botanical', true),

  (8, 'Battambang Jasmine Rice Bran Cleansing Oil', 'Cleansers', 'KH-008', 2400,
   'Pure Phka Rumduol jasmine rice bran oil for effortless double cleansing.',
   'Sourced directly from Battambang organic paddy fields, this nutrient-dense rice bran oil is naturally brimming with Vitamin E, ferulic acid, and squalene. Melts waterproof sunscreen and excess sebum without clogging pores.',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85',
   'CAMBODIAN BOTANICAL', array['Phka Rumduol rice bran', 'Zero pore clogging', 'Instant milky rinse'],
   'Floralyn Khmer Botanicals', 'Deep Pore & Waterproof Makeup Dissolver', 'Cambodian Botanical', true),

  (9, 'Kampot White Pepper & Lemongrass Purifying Clay Mask', 'Masks & Treatments', 'KH-009', 2500,
   'Detoxifying French green clay infused with organic Kampot white pepper.',
   'Protected-origin Kampot pepper micro-extracts boost microcirculation while Cambodian lemongrass purifies congested pores and controls excess shine. Leaves the complexion clean, bright, and clarified.',
   'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=85',
   'KAMPOT HERITAGE', array['Kampot GI pepper extract', 'Draws out impurities', 'Refines uneven texture'],
   'Floralyn Khmer Botanicals', 'Pore Refining & Detoxifying Mineral Treatment', 'Cambodian Botanical', true),

  (10, 'Mondulkiri Wild Forest Honey Barrier Balm', 'Moisturizers & Creams', 'KH-010', 2900,
   'Rich wild honey harvested from the pristine canopy of Mondulkiri.',
   'Wild forest bees in Mondulkiri highlands pollinate native rainforest wildflowers, producing raw honey with remarkable restorative power. Blended with virgin beeswax and shea to heal dry, peeling, and sensitized skin.',
   'https://images.unsplash.com/photo-1556760544-74068565f05c?auto=format&fit=crop&w=800&q=85',
   'WILD HIGHLAND HONEY', array['Mondulkiri raw honey', 'Deep SOS barrier repair', 'Rich restorative cushion'],
   'Floralyn Khmer Botanicals', 'Intensive SOS Barrier & Moisture Recovery', 'Cambodian Botanical', true),

  (11, 'Cardamom Rainforest Centella Soothing Gel', 'Moisturizers & Creams', 'KH-011', 2100,
   'Oil-free cooling jelly infused with wild Gotu Kola (Centella Asiatica).',
   'Formulated for warm tropical climates, this fast-absorbing green jelly calms sun-heated skin, eases active breakout inflammation, and delivers refreshing hydration with zero greasy residue.',
   'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=85',
   'COOLING RELIEF', array['Cardamom wild cica', 'Cooling -3°C sensation', '100% oil-free hydration'],
   'Floralyn Khmer Botanicals', 'Cooling Post-Sun & Blemish Calming Gel', 'Cambodian Botanical', true),

  (12, 'Siem Reap Moringa & Virgin Coconut Glow Elixir', 'Serums & Ampoules', 'KH-012', 3000,
   'Cold-pressed Cambodian moringa seed oil and organic coconut lipids.',
   'Known in Khmer tradition as the Miracle Tree, Moringa seed oil delivers 46 natural antioxidants to shield against airborne pollution and UV stress, leaving skin glowing with health and elasticity.',
   'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85',
   'INDIGENOUS SUPERFOOD', array['Cold-pressed moringa', 'Shields urban pollution', 'Golden silky luster'],
   'Floralyn Khmer Botanicals', 'Antioxidant Radiance & Pollution Defense', 'Cambodian Botanical', true),

  -- Korean Skincare: Beauty of Joseon
  (13, 'Beauty of Joseon - Relief Sun: Rice + Probiotics SPF50+ PA++++', 'Sun Protection', 'BOJ-013', 1900,
   'The viral Korean sunscreen formulated with 30% Rice Extract and Grain Probiotics.',
   'A lightweight, creamy organic sunscreen that sits comfortably on skin without white cast, pilling, or greasy shine. Infused with grain ferment extracts to nourish the skin barrier while shielding against UVA and UVB rays.',
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85',
   'GLOBAL BESTSELLER', array['30% Rice bran extract', 'Zero white cast', 'Broad spectrum SPF50+ PA++++'],
   'Beauty of Joseon', 'Daily Chemical Sunscreen & Glow Shield', 'Korean Skincare', true),

  (14, 'Beauty of Joseon - Glow Serum: Propolis + Niacinamide', 'Serums & Ampoules', 'BOJ-014', 1700,
   '60% Propolis Extract and 2% Niacinamide for pore refinement and dewy radiance.',
   'Inspired by traditional Hanbang herbal medicine, this honey-like serum delivers a healthy, non-sticky glass-skin glow. Propolis calms inflammation while niacinamide visibly refines enlarged pores and evens tone.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85',
   'VIRAL K-BEAUTY', array['60% Propolis extract', '2% Niacinamide', 'Pore refining & glass glow'],
   'Beauty of Joseon', 'Pore Refining & Honey Glass Glow Serum', 'Korean Skincare', true),

  (15, 'Beauty of Joseon - Dynasty Cream', 'Moisturizers & Creams', 'BOJ-015', 2400,
   'Enriched with Rice Bran Water, Ginseng Water, Squalane, and 2% Niacinamide.',
   'The brand inaugural icon delivers dense, long-lasting moisture with a distinct chewy, bouncy texture. Strengthens the moisture barrier while keeping dry or mature skin cushioned and nourished.',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85',
   'HERITAGE CLASSIC', array['Rice bran & ginseng water', 'Locks deep hydration', 'Bouncy Hanbang finish'],
   'Beauty of Joseon', 'Hanbang Firming & Barrier Nourishing Cream', 'Korean Skincare', true),

  (16, 'Beauty of Joseon - Revive Eye Serum: Ginseng + Retinal', 'Masks & Treatments', 'BOJ-016', 1800,
   'Potent eye care combining 10% Ginseng Root Extract with 2% Retinal Liposome.',
   'Retinal converts faster than retinol to visibly firm delicate undereye skin and smooth expression lines. Formulated with liposome technology to minimize irritation and maintain soothing hydration.',
   'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=85',
   'RETINAL HERO', array['2% Stabilized retinal liposome', '10% Panax ginseng', 'Smooths fine lines'],
   'Beauty of Joseon', 'Targeted Eye Contour & Fine Line Smoothing', 'Korean Skincare', true),

  -- Korean Skincare: Anua
  (17, 'Anua - Heartleaf 77% Soothing Toner', 'Toners & Essences', 'ANU-017', 2200,
   'Korea #1 soothing toner powered by 77% Houttuynia Cordata (Heartleaf).',
   'Celebrated across K-beauty for instant redness cooling and acne-calming efficacy. Hypoallergenic, non-comedogenic, and sub-acidic (pH 5.5) to keep irritated, sensitive skin tranquil and balanced.',
   'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=85',
   '#1 KOREAN TONER', array['77% Heartleaf extract', 'Instant redness cooling', 'Acne-safe pH 5.5 balance'],
   'Anua', 'Skin Calming & Redness Relief Toner', 'Korean Skincare', true),

  (18, 'Anua - Heartleaf Pore Control Cleansing Oil', 'Cleansers', 'ANU-018', 2000,
   'Gentle pore-clearing oil that dissolves blackheads, waterproof SPF, and makeup.',
   'Clinically tested non-comedogenic and infused with calming heartleaf extract, jojoba seed oil, and macadamia seed oil. Emulsifies milky-clean with zero eye stinging or oily residue.',
   'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=800&q=85',
   'PORE CONTROL', array['Dissolves blackheads', 'Safe for acne-prone skin', 'Silky non-greasy rinse'],
   'Anua', 'Sebum & Blackhead Melting Cleansing Oil', 'Korean Skincare', true),

  (19, 'Anua - Niacinamide 10% + TXA 4% Dark Spot Correcting Serum', 'Serums & Ampoules', 'ANU-019', 2400,
   'Watery brightening serum with 10% Niacinamide, 4% Tranexamic Acid, and 2% Arbutin.',
   'Targets stubborn post-acne erythema, dark sun spots, and uneven discoloration. Infused with 3-molecular-weight hyaluronic acid and ceramides to brighten without drying or sensitizing.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85',
   'DARK SPOT HERO', array['10% Niacinamide + 4% TXA', 'Fades post-acne marks', 'Ceramide barrier shield'],
   'Anua', 'Hyperpigmentation & Post-Acne Mark Eraser', 'Korean Skincare', true),

  -- Korean Skincare: Mary & May
  (20, 'Mary & May - Idebenone + Blackberry Complex Intensive Serum', 'Serums & Ampoules', 'MM-020', 1900,
   'Packed with 1,000 ppm Idebenone and 20% Blackberry Extract for youthful bounce.',
   'Idebenone delivers 4x the antioxidant power of Vitamin C and 10x that of CoQ10. Blended with rich anthocyanin-packed blackberry extract to shield against premature aging, firm skin, and brighten dull tones.',
   'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=85',
   'ANTIOXIDANT POWER', array['1,000 ppm Idebenone', '20% Blackberry extract', '4x stronger than Vitamin C'],
   'Mary & May', 'High-Potency Antioxidant & Elasticity Serum', 'Korean Skincare', true),

  (21, 'Mary & May - Centella Asiatica Soothing Cream', 'Moisturizers & Creams', 'MM-021', 2100,
   'Formulated with 71.8% Centella Asiatica extract and tea tree water for instant calm.',
   'A soothing gel-cream that calms irritated, flushed, or blemish-prone complexions. Delivers refreshing non-greasy hydration with 100% EWG Green verified gentle ingredients.',
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=85',
   'VEGAN SOOTHING', array['71.8% Centella Asiatica', 'Calms flare-ups fast', 'EWG green certified'],
   'Mary & May', 'Fast Blemish Soothing & Sensitive Barrier Cream', 'Korean Skincare', true),

  (22, 'Mary & May - Cica Soothing Sun Cream SPF50+ PA++++', 'Sun Protection', 'MM-022', 1800,
   'Ultra-lightweight soothing sunscreen infused with 10,000 ppm F-Cica Complex.',
   'Glides on like a light morning lotion with zero stickiness and zero white cast. Protects against harsh UV radiation while continuously calming sensitive, redness-prone skin all day long.',
   'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=85',
   'REEF-SAFE SPF', array['10,000 ppm F-Cica complex', 'Weightless lotion texture', 'Reef-safe & vegan verified'],
   'Mary & May', 'Hydrating Daily Sunscreen & Redness Shield', 'Korean Skincare', true),

  -- K-Beauty Cult Favorites
  (23, 'Skin1004 - Madagascar Centella Asiatica Ampoule', 'Serums & Ampoules', 'SK-023', 1900,
   '100% pure Centella Asiatica extract harvested from pristine Madagascar.',
   'A holy grail minimalist ampoule with zero fillers or fragrances. Penetrates deep to calm inflamed skin, regulate sebum, reduce acne redness, and strengthen a compromised moisture barrier.',
   'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=85',
   'HOLY GRAIL CICA', array['100% Madagascar Centella', 'Calms sensitive barrier', 'Non-sticky watery texture'],
   'Skin1004', '100% Pure Centella Barrier Recovery Ampoule', 'Korean Skincare', true),

  (24, 'Round Lab - Birch Juice Moisturizing Sunscreen SPF50+ PA++++', 'Sun Protection', 'RL-024', 2100,
   'Award-winning Korean moisturizing sunscreen with Inje Birch Sap and Vita Hyaluronic Acid.',
   'Clinically verified SPF50+ PA++++ that doubles as a morning moisturizer. Inje Silver Birch tree sap is packed with 17 amino acids, minerals, and proteins that quench dehydrated skin while shielding UV.',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=85',
   'AWARD WINNER', array['Inje Birch tree sap', 'Hyaluronic hydration', 'No white cast or stickiness'],
   'Round Lab', 'Deep Hyaluronic Sunscreen & Dehydration Shield', 'Korean Skincare', true),

  (25, 'COSRX - Advanced Snail 96 Mucin Power Essence', 'Toners & Essences', 'COS-025', 2200,
   'Contains 96.3% Snail Secretion Filtrate to repair skin damage and plump elasticity.',
   'A global skincare sensation that delivers intense cellular nutrition and bounce. Plumps dehydrated skin, softens rough patches, and soothes post-acne redness for that effortless glazed donut glow.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=85',
   'CULT FAVORITE', array['96.3% Snail secretion filtrate', 'Plumps & firms skin', 'Soothes post-breakout marks'],
   'COSRX', 'Skin Repairing & Plumping Mucin Essence', 'Korean Skincare', true)
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

-- Initialize inventory rows for all new products
insert into public.inventory (product_id, warehouse_id, quantity, low_stock_threshold)
select id, 'main', 25, 6 from public.products
where id >= 7
on conflict (product_id, warehouse_id) do nothing;
