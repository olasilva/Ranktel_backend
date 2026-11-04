// Product catalogue. Edit prices/stock here (or swap for a database).
const sizes = [28, 30, 32, 34, 36, 38, 40].map((s) => ({ size: s, stock: s === 40 ? 0 : s === 38 ? 2 : 25 }));
export const MAIN = {
  slug: 'baggi-jeans',
  eyebrow: 'Unisex luxury denim',
  name: 'Baggi Jeans - Relaxed Fit',
  price: 48000, compareAt: 55000, rating: 4.9, reviewCount: 142,
  images: ['baggi-1.jpg', 'baggi-2.jpg', 'baggi-3.jpg', 'baggi-4.jpg', 'baggi-5.jpg'],
  colors: [
    { name: 'indigo', label: 'Washed Indigo', hex: '#2b3a67' },
    { name: 'black', label: 'Washed Black', hex: '#15151a' },
    { name: 'ecru', label: 'Ecru', hex: '#d9d2c2' },
    { name: 'grey', label: 'Stone Grey', hex: '#8b8d93' },
  ],
  sizes, sizeLabel: 'Waist size (inches)', sizeShort: 'Waist', defaultSize: 32,
  fitNote: 'Fits true to size. Relaxed unisex straight-leg profile.',
  stockNote: 'In Stock — Ships within 24 hours from Lagos Hub.',
  story: {
    eyebrow: 'Architectural silhouette',
    title: ['Born in', 'Lagos.', 'Refined in', 'Abuja.'],
    body: 'The Baggi is engineered to counteract throwaway fashion. Cut from 14.5oz ring-spun denim, it maintains structural rigidity along the outseam while preserving uninhibited thigh mobility. Tailored for humid nocturnal Lagos heat and sharp Abuja minimalist aesthetics.',
    stats: [{ value: '14.5', unit: 'OZ', label: 'Heavy twill denim' }, { value: '10.0', unit: 'IN', label: 'Ankle hem stance' }],
    images: [{ file: 'story-1.jpg', caption: 'Night movement // 01' }, { file: 'story-2.jpg', caption: 'Reinforced tension // 02' }],
  },
  // PLACEHOLDER copy – replace with Ranktel's real policies and measurements.
  accordions: [
    { title: 'Details & engineering', body: '14.5oz ring-spun heavy twill denim. Relaxed straight leg with a 10.0in ankle hem. Heavy brass rivets and reinforced stress points. Unisex cut.' },
    { title: 'Materials & garment care', body: '100% cotton denim. Wash cold, inside out, with similar colours. Hang dry. Expect gentle fading and character over time.' },
    { title: 'Shipping, delivery & returns', body: 'Ships within 24 hours from our Lagos Hub. Pick up free at our Kurudu, Abuja flagship within 2 hours. Contact us for returns and exchanges.' },
  ],
  sizeChart: { unit: 'inches', columns: ['Waist size', 'Waist', 'Hip', 'Inseam'], rows: [[28, 28, 40, 31], [30, 30, 42, 31], [32, 32, 44, 32], [34, 34, 46, 32], [36, 36, 48, 32], [38, 38, 50, 33], [40, 40, 52, 33]] },
  stats: [{ label: 'Fit accuracy', text: 'True to Size', pct: 96, tone: 'orange' }, { label: 'Weight & rigidity', text: 'Substantial Heavyweight (14.5oz)', pct: 98, tone: 'orange' }, { label: 'Would recommend', text: 'Verified Recommendation', pct: 99, tone: 'lav' }],
};

// ---------- Catalogue (powers the Clothing / Shoes / Bags / Accessories / Sale pages) ----------
export const COLORS = {
  indigo: { label: 'Washed Indigo', hex: '#2b3a67' }, black: { label: 'Black', hex: '#15151a' }, ecru: { label: 'Ecru', hex: '#d9d2c2' },
  grey: { label: 'Stone Grey', hex: '#8b8d93' }, white: { label: 'Off White', hex: '#f1eee8' }, navy: { label: 'Navy', hex: '#1d2a4a' },
  brown: { label: 'Tobacco', hex: '#7a5638' }, rust: { label: 'Rust', hex: '#b4511f' }, olive: { label: 'Olive', hex: '#5b5f48' },
  tan: { label: 'Sand', hex: '#b8956a' }, charcoal: { label: 'Charcoal', hex: '#3a3a40' },
};
export const SUBS = {
  clothing: [['baggi-jeans', 'Baggi Jeans'], ['luxury-jackets', 'Luxury Jackets'], ['short-joggers', 'Short Joggers'], ['waterproof', 'Waterproof'], ['shirts', 'Shirts'], ['combat-shorts', 'Combat Shorts'], ['longsleeves', 'Longsleeves']],
  shoes: [['sneakers', 'Sneakers'], ['crocs-mules', 'Crocs & Mules'], ['recovery-slides', 'Recovery Slides'], ['combat-boots', 'Combat Boots'], ['loafers', 'Loafers'], ['leather-sandals', 'Leather Sandals']],
};
const mk = (category, sub, drop, slug, name, kicker, spec, price, colors, o = {}) => ({ category, sub, drop, slug, name, kicker, spec, price, colors, img: `${slug}.jpg`, sizeType: { clothing: 'alpha', shoes: 'shoe', bags: 'one', accessories: 'belt' }[category], ...o });
const B = (text, tone) => ({ text, tone });
export const CATALOG = [
  // Clothing
  mk('clothing', 'baggi-jeans', 100, 'baggi-jeans', 'Baggi Jeans', 'Edition 01', 'Heavy 460gsm', 48000, ['indigo', 'black', 'grey', 'ecru'], { sizeType: 'waist', compareAt: 55000, badge: B('New', 'cobalt') }),
  mk('clothing', 'luxury-jackets', 99, 'luxury-jacket', 'Luxury Jacket', 'Outerwear', 'Runs relaxed', 85000, ['navy', 'brown'], { badge: B('Limited', 'accent') }),
  mk('clothing', 'short-joggers', 98, 'short-jogger', 'Short Jogger', 'Lounge & street', 'Organic terry', 32000, ['white'], { badge: B('Bestseller', 'dark') }),
  mk('clothing', 'waterproof', 97, 'water-proof-jacket', 'Water Proof Jacket', 'Techwear', 'Weatherproof', 74000, ['black', 'olive']),
  mk('clothing', 'shirts', 96, 'button-shirt', 'Button Shirt', 'Tailored boxy', 'Pure poplin', 36000, ['navy', 'white']),
  mk('clothing', 'longsleeves', 95, 'luxury-longsleeve', 'Luxury Longsleeve', 'Knitwear', 'Waffle 320gsm', 29000, ['black', 'tan']),
  mk('clothing', 'shirts', 94, 'cotton-shirt', 'Cotton Shirt', 'Tops & shirts', 'Dry touch', 34000, ['rust', 'navy']),
  mk('clothing', 'combat-shorts', 93, 'three-quarter-baggi', 'Three Quarter Baggi', 'Denim series', '14.5oz denim', 42000, ['indigo', 'black'], { sizeType: 'waist' }),
  mk('clothing', 'luxury-jackets', 90, 'cropped-utility-flight-jacket', 'Cropped Utility Flight Jacket', 'Tectonic series', 'Outerwear', 64000, ['black', 'olive']),
  mk('clothing', 'shirts', 89, 'raw-edge-boxy-cotton-tee', 'Raw Edge Boxy Cotton Tee', 'Essential', '300 GSM heavyweight', 22000, ['white', 'black']),
  mk('clothing', 'baggi-jeans', 88, 'kurudu-selvedge-raw-pant', 'Kurudu Selvedge Raw Pant', 'Raw denim', '15oz Japanese selvedge', 52000, ['indigo'], { sizeType: 'waist' }),
  mk('clothing', null, 87, 'pleated-garrison-cargo-trousers', 'Pleated Garrison Cargo Trousers', 'Tactical', 'Heavy poplin', 46000, ['olive', 'black'], { sizeType: 'waist' }),
  mk('clothing', null, 86, 'artisan-double-knee-pant', 'Artisan Double Knee Pant', 'Workwear', 'Duck canvas', 49500, ['tan', 'charcoal'], { sizeType: 'waist' }),
  mk('clothing', 'short-joggers', 85, 'sculptural-heavy-fleece-jogger', 'Sculptural Heavy Fleece Jogger', 'Lounge luxe', '450 GSM French terry', 38000, ['charcoal', 'black']),
  // Shoes (range = EU sizes)
  mk('shoes', 'sneakers', 200, 'chunky-white-monolith', 'Chunky White Monolith', 'Full grain calfskin', 'Calfskin core', 55000, ['white', 'grey'], { blurb: 'Sculpted geometric foam sole', range: [38, 46], badge: B('Bestseller', 'accent'), stock: 'low' }),
  mk('shoes', 'recovery-slides', 199, 'basalt-molded-slides', 'Basalt Molded Slides', 'Dual-density EVA', '', 42000, ['black', 'charcoal'], { blurb: 'Ergonomic deep arch contour', range: [39, 47], badge: B('Kurudu exclusive', 'cobalt') }),
  mk('shoes', 'crocs-mules', 198, 'black-streetwear-crocs', 'Black Streetwear Crocs', 'Molded polymer', '', 38000, ['black', 'rust'], { blurb: 'Heavyweight pivot backstrap', range: [37, 45], badge: B('Trending', 'accent') }),
  mk('shoes', 'sneakers', 197, 'monolith-court-sneaker', 'Monolith Court Sneaker', 'Italian nappa', '', 78000, ['white', 'navy'], { blurb: 'Reinforced vulcanized cupsole', range: [39, 46], badge: B('Limited', 'dark') }),
  mk('shoes', 'combat-boots', 196, 'tactical-combat-boot-v1', 'Tactical Combat Boot V1', 'Cordura & nubuck', '', 88000, ['black'], { blurb: 'Waterproof hybrid shell', range: [40, 47], badge: B('New', 'accent') }),
  mk('shoes', 'crocs-mules', 195, 'lagos-nocturne-mule', 'Lagos Nocturne Mule', 'Brushed suede', '', 46000, ['navy', 'tan'], { blurb: 'Minimalist seamless upper', range: [38, 45] }),
  mk('shoes', 'leather-sandals', 194, 'raw-edge-platform-sandal', 'Raw Edge Platform Sandal', 'Nylon webbing', '', 34000, ['black', 'tan'], { blurb: 'Heavy contoured anatomic footbed', range: [36, 46], badge: B('Restocked', 'peach') }),
  mk('shoes', 'sneakers', 193, 'architectural-slip-on-runner', 'Architectural Slip-On Runner', 'Tech mesh & carbon', '', 62000, ['charcoal', 'white'], { blurb: 'Exposed carbon propulsion plate', range: [39, 46] }),
  mk('shoes', 'sneakers', 192, 'basalt-high-top-trainer', 'Basalt High-Top Trainer', 'Ballistic nylon', '', 72000, ['charcoal'], { blurb: 'Reinforced ankle chassis', range: [40, 47], badge: B('New', 'accent') }),
  mk('shoes', 'loafers', 191, 'karu-minimalist-derby', 'Karu Minimalist Derby', 'Box calf leather', '', 80000, ['black', 'brown'], { blurb: 'Heavyweight commando lug sole', range: [39, 46] }),
  mk('shoes', 'recovery-slides', 190, 'nocturnal-recovery-clog', 'Nocturnal Recovery Clog', 'Anti-microbial EVA', '', 36000, ['navy', 'grey'], { blurb: 'Cellular shock-absorption base', range: [36, 45] }),
  mk('shoes', 'loafers', 189, 'abuja-desert-chelsea', 'Abuja Desert Chelsea', 'Brushed suede', '', 68000, ['tan', 'black'], { blurb: 'Heavy gauge tonal stretch gusset', range: [40, 46] }),
  // Bags and accessories
  mk('bags', null, 300, 'travelling-bag', 'Travelling Bag', '45L weekend transit', 'Ready to ship', 28000, ['black', 'olive']),
  mk('accessories', null, 400, 'brutalist-buckle-leather-belt', 'Brutalist Buckle Leather Belt', 'Full grain bridle', '', 19500, ['black', 'brown']),
];
const bySlug = Object.fromEntries(CATALOG.map((i) => [i.slug, i]));
export const stateOf = (i) => i.stock || 'in';
const metaOf = (i) => (i.range ? `Unisex • ${i.range[0]}-${i.range[1]}` : i.spec);
export const pub = (i) => ({ slug: i.slug, category: i.category, name: i.name, kicker: i.kicker, blurb: i.blurb, price: i.price, compareAt: i.compareAt, colors: i.colors.map((c) => COLORS[c].hex), badge: i.badge, meta: metaOf(i), img: i.img, stockState: stateOf(i) });

const sizeList = (i) => {
  if (i.sizeType === 'waist') return [28, 30, 32, 34, 36, 38, 40];
  if (i.sizeType === 'shoe') return Array.from({ length: i.range[1] - i.range[0] + 1 }, (_, n) => i.range[0] + n);
  if (i.sizeType === 'belt') return [30, 32, 34, 36, 38, 40];
  if (i.sizeType === 'one') return ['One size'];
  return ['S', 'M', 'L', 'XL', 'XXL'];
};
const LABELS = { waist: ['Waist size (inches)', 'Waist'], shoe: ['Shoe size (EU)', 'EU'], belt: ['Belt size (inches)', 'Size'], one: ['Size', 'Size'], alpha: ['Size', 'Size'] };
function build(i) {
  const list = sizeList(i), st = stateOf(i);
  const sizes = list.map((size, n) => ({ size, stock: st === 'out' ? 0 : st === 'low' && n >= list.length - 2 ? 2 : 20 }));
  return {
    slug: i.slug, eyebrow: i.kicker, name: i.name, price: i.price, compareAt: i.compareAt, images: [i.img],
    colors: i.colors.map((n) => ({ name: n, ...COLORS[n] })), sizes, sizeLabel: LABELS[i.sizeType][0], sizeShort: LABELS[i.sizeType][1],
    fitNote: 'Unisex proportions, cut to drape on all forms.',
    stockNote: st === 'low' ? 'Low stock — order soon.' : st === 'out' ? 'Currently out of stock.' : 'In Stock — ready at Kurudu, Abuja or shipped within 24 hours.',
    accordions: [
      { title: 'Details & engineering', body: [i.kicker, i.spec, i.blurb].filter(Boolean).join('. ') + '.' },
      { title: 'Materials & garment care', body: 'Follow the care label. Wash cold and hang dry to keep shape and colour.' },
      MAIN.accordions[2],
    ],
  };
}
export const getProduct = (slug) => (slug === MAIN.slug ? MAIN : bySlug[slug] ? build(bySlug[slug]) : null);

const row = (slug, tag, series) => ({ slug, tag, series, name: bySlug[slug].name, price: bySlug[slug].price, img: bySlug[slug].img });
export const LOOK = [row('cropped-utility-flight-jacket', 'Outerwear', 'Tectonic series'), row('raw-edge-boxy-cotton-tee', 'Essential', '300 GSM heavyweight'), row('monolith-court-sneaker', 'Footwear', 'Italian calfskin'), row('brutalist-buckle-leather-belt', 'Hardware', 'Full grain bridle')];
export const ALIKE = [row('kurudu-selvedge-raw-pant', 'Raw denim', '15oz Japanese selvedge'), row('pleated-garrison-cargo-trousers', 'Tactical', 'Heavy poplin'), row('artisan-double-knee-pant', 'Workwear', 'Duck canvas'), row('sculptural-heavy-fleece-jogger', 'Lounge luxe', '450 GSM French terry')];
export const ARRIVALS = [
  { slug: 'baggi-jeans', kicker: 'Relaxed cut', meta: 'Stock: Kurudu', badge: B('New', 'accent') },
  { slug: 'luxury-jacket', kicker: 'Modular shell', meta: 'Edition 04', badge: B('Exclusive', 'cobalt') },
  { slug: 'travelling-bag', kicker: '45L weekend transit', meta: 'Ready to ship' },
  { slug: 'chunky-white-monolith', name: 'Premium White Sneakers', kicker: 'Full grain calf', meta: 'Low stock' },
].map((a) => ({ ...pub(bySlug[a.slug]), ...a, badge: a.badge }));

const day = 864e5;
export const SEED_REVIEWS = [
  { id: 's1', name: 'Emeka O. Maitama', location: 'Abuja', size: 32, rating: 5, title: 'Unreal drape and weight', body: 'Picked these up at the Kurudu store in Abuja. The 14oz weight holds that sculptural barrel stack at the sneaker without feeling suffocating in the sun. COS quality at a fraction of the import hassle.', verified: true, createdAt: Date.now() - 2 * day },
  { id: 's2', name: 'Tunde B.', location: 'Lekki Phase 1, Lagos', size: 34, rating: 5, title: 'Best Nigerian denim right now', body: 'Lagos delivery was swift via DHL. The brass rivets feel heavy and industrial. Pairs effortlessly with boxy tees. It has that Balenciaga wide cut with tailored Nigerian sensibility.', verified: true, createdAt: Date.now() - 7 * day },
  { id: 's3', name: 'Damilola A.', location: 'GRA, Port Harcourt', size: 30, rating: 5, title: 'Unisex fit is flawless', body: 'Was hesitant about sizing as a woman (5\'8), but size 30 belted sits perfectly mid-rise. The indigo hue has subtle stone-wash undertones that look incredible under streetlights.', verified: true, createdAt: Date.now() - 14 * day },
];
