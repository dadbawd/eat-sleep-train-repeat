/* Eat Sleep Train — canned data + lazy-input parsers.
   Plain JS, exported to window. Realistic-ish placeholder macros. */

// ── Single-item food table (per unit) ───────────────────────────────
// Keys are matched by longest-substring, so more specific keys (e.g.
// 'diet coke') win over generic ones ('coke').
const FOOD_DB = {
  // eggs / breakfast
  egg:            { kcal: 78,  protein: 6,  unit: 'egg' },
  toast:          { kcal: 90,  protein: 3,  unit: 'slice' },
  bread:          { kcal: 80,  protein: 3,  unit: 'slice' },
  bagel:          { kcal: 270, protein: 11, unit: '' },
  bacon:          { kcal: 43,  protein: 3,  unit: 'slice' },
  sausage:        { kcal: 90,  protein: 5,  unit: 'link' },
  oatmeal:        { kcal: 150, protein: 5,  unit: 'bowl' },
  cereal:         { kcal: 210, protein: 6,  unit: 'bowl' },
  granola:        { kcal: 230, protein: 6,  unit: 'cup' },
  pancakes:       { kcal: 350, protein: 8,  unit: '' },
  pancake:        { kcal: 175, protein: 4,  unit: '' },
  butter:         { kcal: 100, protein: 0,  unit: 'tbsp' },
  syrup:          { kcal: 105, protein: 0,  unit: 'tbsp' },
  'maple syrup':  { kcal: 105, protein: 0,  unit: 'tbsp' },
  waffle:         { kcal: 220, protein: 6,  unit: '' },
  // fruit / veg
  banana:         { kcal: 105, protein: 1,  unit: '' },
  apple:          { kcal: 95,  protein: 0,  unit: '' },
  orange:         { kcal: 62,  protein: 1,  unit: '' },
  pineapple:      { kcal: 80,  protein: 1,  unit: 'cup' },
  mango:          { kcal: 200, protein: 3,  unit: '' },
  grapes:         { kcal: 100, protein: 1,  unit: 'cup' },
  strawberries:   { kcal: 50,  protein: 1,  unit: 'cup' },
  berries:        { kcal: 70,  protein: 1,  unit: 'cup' },
  avocado:        { kcal: 240, protein: 3,  unit: '' },
  potato:         { kcal: 160, protein: 4,  unit: '' },
  'sweet potato': { kcal: 180, protein: 4,  unit: '' },
  broccoli:       { kcal: 55,  protein: 4,  unit: 'cup' },
  salad:          { kcal: 180, protein: 5,  unit: 'bowl' },
  // protein
  // chicken — distinct cuts (longest match wins over generic 'chicken')
  chicken:            { kcal: 220, protein: 35, unit: 'serving' },
  'chicken breast':   { kcal: 230, protein: 43, unit: '' },
  'chicken thigh':    { kcal: 210, protein: 26, unit: '' },
  'chicken leg':      { kcal: 265, protein: 28, unit: '' },
  'chicken drumstick':{ kcal: 120, protein: 14, unit: '' },
  drumstick:          { kcal: 120, protein: 14, unit: '' },
  'chicken wing':     { kcal: 100, protein: 9,  unit: '' },
  'chicken wings':    { kcal: 300, protein: 27, unit: 'order' },
  wings:              { kcal: 300, protein: 27, unit: 'order' },
  'chicken tenders':  { kcal: 290, protein: 24, unit: 'order' },
  'chicken tender':   { kcal: 95,  protein: 8,  unit: '' },
  'chicken nuggets':  { kcal: 280, protein: 15, unit: 'order' },
  'fried chicken':    { kcal: 320, protein: 22, unit: 'piece' },
  'rotisserie chicken':{ kcal: 250, protein: 30, unit: 'serving' },
  'ground chicken':   { kcal: 170, protein: 20, unit: 'serving' },
  'chicken sandwich': { kcal: 440, protein: 28, unit: '' },
  // beef — steak cuts
  steak:           { kcal: 380, protein: 46, unit: '' },
  ribeye:          { name: 'Ribeye',      kcal: 580, protein: 46, unit: '' },
  'rib eye':       { name: 'Ribeye',      kcal: 580, protein: 46, unit: '' },
  sirloin:         { name: 'Sirloin',     kcal: 400, protein: 52, unit: '' },
  'filet mignon':  { name: 'Filet Mignon',kcal: 380, protein: 48, unit: '' },
  filet:           { name: 'Filet Mignon',kcal: 380, protein: 48, unit: '' },
  tenderloin:      { name: 'Tenderloin',  kcal: 380, protein: 48, unit: '' },
  'ny strip':      { name: 'NY Strip',    kcal: 480, protein: 49, unit: '' },
  'new york strip':{ name: 'NY Strip',    kcal: 480, protein: 49, unit: '' },
  'strip steak':   { name: 'NY Strip',    kcal: 480, protein: 49, unit: '' },
  't-bone':        { name: 'T-Bone',      kcal: 500, protein: 45, unit: '' },
  tbone:           { name: 'T-Bone',      kcal: 500, protein: 45, unit: '' },
  porterhouse:     { name: 'Porterhouse', kcal: 540, protein: 46, unit: '' },
  'flank steak':   { name: 'Flank Steak', kcal: 350, protein: 48, unit: '' },
  flank:           { name: 'Flank Steak', kcal: 350, protein: 48, unit: '' },
  'skirt steak':   { name: 'Skirt Steak', kcal: 380, protein: 44, unit: '' },
  'flat iron':     { name: 'Flat Iron',   kcal: 380, protein: 43, unit: '' },
  'ground beef':   { name: 'Ground Beef', kcal: 290, protein: 26, unit: 'serving' },
  salmon:         { kcal: 280, protein: 34, unit: 'fillet' },
  tuna:           { kcal: 180, protein: 39, unit: 'can' },
  shrimp:         { kcal: 120, protein: 23, unit: 'serving' },
  turkey:         { kcal: 125, protein: 26, unit: 'serving' },
  ham:            { kcal: 150, protein: 21, unit: 'serving' },
  tofu:           { kcal: 180, protein: 20, unit: 'block' },
  beans:          { kcal: 220, protein: 14, unit: 'cup' },
  // carbs / staples
  rice:           { kcal: 205, protein: 4,  unit: 'cup' },
  pasta:          { kcal: 320, protein: 12, unit: 'plate' },
  // fast / mixed
  burrito:        { kcal: 600, protein: 26, unit: '' },
  taco:           { kcal: 210, protein: 9,  unit: '' },
  nachos:         { kcal: 560, protein: 14, unit: 'order' },
  pizza:          { kcal: 285, protein: 12, unit: 'slice' },
  cheeseburger:   { kcal: 520, protein: 27, unit: '' },
  hamburger:      { kcal: 480, protein: 24, unit: '' },
  burger:         { kcal: 500, protein: 25, unit: '' },
  'hot dog':      { kcal: 290, protein: 11, unit: '' },
  sandwich:       { kcal: 380, protein: 18, unit: '' },
  sushi:          { kcal: 350, protein: 18, unit: 'roll' },
  fries:          { kcal: 365, protein: 4,  unit: 'order' },
  'french fries': { kcal: 365, protein: 4,  unit: 'order' },
  // compound dishes whose name contains "and" (protected from the and-splitter)
  'mac and cheese':           { name: 'Mac and Cheese',          kcal: 460, protein: 16, unit: '' },
  'fish and chips':           { name: 'Fish and Chips',          kcal: 840, protein: 30, unit: '' },
  'peanut butter and jelly':  { name: 'Peanut Butter & Jelly',   kcal: 380, protein: 12, unit: '' },
  'pb and j':                 { name: 'Peanut Butter & Jelly',   kcal: 380, protein: 12, unit: '' },
  'spaghetti and meatballs':  { name: 'Spaghetti & Meatballs',   kcal: 670, protein: 30, unit: '' },
  'biscuits and gravy':       { name: 'Biscuits and Gravy',      kcal: 550, protein: 12, unit: '' },
  'chicken and waffles':      { name: 'Chicken & Waffles',       kcal: 680, protein: 28, unit: '' },
  'surf and turf':            { name: 'Surf and Turf',           kcal: 700, protein: 55, unit: '' },
  'chips and salsa':          { name: 'Chips and Salsa',         kcal: 320, protein: 5,  unit: '' },
  'chips and guac':           { name: 'Chips and Guac',          kcal: 480, protein: 6,  unit: '' },
  'chips and guacamole':      { name: 'Chips and Guac',          kcal: 480, protein: 6,  unit: '' },
  // cereals
  cheerios:       { kcal: 210, protein: 7,  unit: 'bowl' },
  'frosted flakes':{ kcal: 200, protein: 3, unit: 'bowl' },
  'raisin bran':  { kcal: 195, protein: 5,  unit: 'bowl' },
  'corn flakes':  { kcal: 150, protein: 3,  unit: 'bowl' },
  'rice krispies':{ kcal: 130, protein: 2,  unit: 'bowl' },
  'froot loops':  { kcal: 150, protein: 2,  unit: 'bowl' },
  'special k':    { kcal: 150, protein: 6,  unit: 'bowl' },
  oats:           { name: 'Oatmeal', kcal: 150, protein: 5, unit: 'bowl' },
  // more veg / grains
  quinoa:         { kcal: 220, protein: 8,  unit: 'cup', refOz: 6 },
  lentils:        { kcal: 230, protein: 18, unit: 'cup', refOz: 6 },
  chickpeas:      { kcal: 270, protein: 15, unit: 'cup', refOz: 6 },
  asparagus:      { kcal: 40,  protein: 4,  unit: 'serving' },
  spinach:        { kcal: 30,  protein: 4,  unit: 'serving' },
  carrots:        { kcal: 50,  protein: 1,  unit: 'serving' },
  corn:           { kcal: 130, protein: 4,  unit: 'cup' },
  'green beans':  { kcal: 45,  protein: 2,  unit: 'serving' },
  hummus:         { kcal: 70,  protein: 2,  unit: 'serving' },
  // vegetables (per typical serving)
  tomato:         { kcal: 22,  protein: 1,  unit: '' },
  cucumber:       { kcal: 16,  protein: 1,  unit: '' },
  lettuce:        { kcal: 10,  protein: 1,  unit: 'cup' },
  kale:           { kcal: 35,  protein: 3,  unit: 'cup' },
  cauliflower:    { kcal: 27,  protein: 2,  unit: 'cup' },
  'brussels sprouts':{ kcal: 40, protein: 3, unit: 'cup' },
  zucchini:       { kcal: 33,  protein: 2,  unit: '' },
  'bell pepper':  { kcal: 30,  protein: 1,  unit: '' },
  pepper:         { kcal: 30,  protein: 1,  unit: '' },
  onion:          { kcal: 44,  protein: 1,  unit: '' },
  mushrooms:      { kcal: 20,  protein: 3,  unit: 'cup' },
  celery:         { kcal: 16,  protein: 1,  unit: 'cup' },
  cabbage:        { kcal: 22,  protein: 1,  unit: 'cup' },
  peas:           { kcal: 120, protein: 8,  unit: 'cup' },
  'snap peas':    { kcal: 40,  protein: 3,  unit: 'cup' },
  'snow peas':    { kcal: 35,  protein: 2,  unit: 'cup' },
  edamame:        { kcal: 190, protein: 17, unit: 'cup' },
  eggplant:       { kcal: 35,  protein: 1,  unit: 'cup' },
  squash:         { kcal: 80,  protein: 2,  unit: 'cup' },
  'butternut squash':{ kcal: 80, protein: 2, unit: 'cup' },
  beets:          { kcal: 60,  protein: 2,  unit: 'cup' },
  artichoke:      { kcal: 60,  protein: 4,  unit: '' },
  'bok choy':     { kcal: 20,  protein: 2,  unit: 'cup' },
  arugula:        { kcal: 5,   protein: 1,  unit: 'cup' },
  'swiss chard':  { kcal: 35,  protein: 3,  unit: 'cup' },
  'collard greens':{ kcal: 30, protein: 3,  unit: 'cup' },
  okra:           { kcal: 35,  protein: 2,  unit: 'cup' },
  leek:           { kcal: 55,  protein: 1,  unit: '' },
  turnip:         { kcal: 35,  protein: 1,  unit: 'cup' },
  parsnip:        { kcal: 100, protein: 2,  unit: 'cup' },
  pumpkin:        { kcal: 50,  protein: 2,  unit: 'cup' },
  fennel:         { kcal: 27,  protein: 1,  unit: 'cup' },
  radish:         { kcal: 19,  protein: 1,  unit: 'cup' },
  'mixed vegetables':{ kcal: 70, protein: 3, unit: 'cup' },
  vegetables:     { name: 'Vegetables', kcal: 60, protein: 3, unit: 'serving' },
  veggies:        { name: 'Vegetables', kcal: 60, protein: 3, unit: 'serving' },
  // more proteins
  pork:           { kcal: 210, protein: 24, unit: 'serving', refOz: 4 },
  'pork chop':    { kcal: 230, protein: 26, unit: '', refOz: 4 },
  meatballs:      { kcal: 200, protein: 12, unit: 'serving' },
  jerky:          { kcal: 80,  protein: 13, unit: 'serving' },
  'cottage cheese':{ kcal: 110, protein: 14, unit: 'cup' },
  'string cheese':{ kcal: 80,  protein: 7,  unit: '' },
  'protein cookie':{ kcal: 280, protein: 16, unit: '' },
  // common meals / takeout
  ramen:          { kcal: 380, protein: 12, unit: 'bowl' },
  pho:            { kcal: 350, protein: 25, unit: 'bowl' },
  'pad thai':     { kcal: 600, protein: 20, unit: '' },
  curry:          { kcal: 450, protein: 20, unit: '' },
  dumplings:      { kcal: 300, protein: 10, unit: 'order' },
  'fried rice':   { kcal: 350, protein: 9,  unit: 'plate' },
  'lo mein':      { kcal: 400, protein: 12, unit: '' },
  quesadilla:     { kcal: 500, protein: 20, unit: '' },
  enchilada:      { kcal: 320, protein: 12, unit: '' },
  gyro:           { kcal: 590, protein: 30, unit: '' },
  falafel:        { kcal: 330, protein: 13, unit: 'serving' },
  lasagna:        { kcal: 380, protein: 20, unit: 'serving' },
  soup:           { kcal: 180, protein: 8,  unit: 'bowl' },
  chili:          { kcal: 280, protein: 18, unit: 'bowl' },
  'french toast': { kcal: 350, protein: 10, unit: '' },
  'english muffin':{ kcal: 130, protein: 5, unit: '' },
  'acai bowl':    { kcal: 400, protein: 8,  unit: '' },
  popcorn:        { kcal: 90,  protein: 3,  unit: 'serving' },
  crackers:       { kcal: 130, protein: 3,  unit: 'serving' },
  pretzels:       { kcal: 110, protein: 3,  unit: 'serving' },
  // snacks / dairy
  'greek yogurt': { kcal: 100, protein: 17, unit: 'cup' },
  yogurt:         { kcal: 110, protein: 9,  unit: 'cup' },
  cheese:         { kcal: 110, protein: 7,  unit: 'slice' },
  almonds:        { kcal: 160, protein: 6,  unit: 'handful' },
  'peanut butter':{ kcal: 190, protein: 8,  unit: 'tbsp' },
  'protein bar':  { kcal: 210, protein: 20, unit: '' },
  'granola bar':  { kcal: 130, protein: 3,  unit: '' },
  chips:          { kcal: 160, protein: 2,  unit: 'bag' },
  cookie:         { kcal: 160, protein: 2,  unit: '' },
  donut:          { kcal: 250, protein: 3,  unit: '' },
  'ice cream':    { kcal: 270, protein: 5,  unit: 'scoop' },
  chocolate:      { kcal: 230, protein: 3,  unit: 'bar' },
  // drinks
  'protein shake':{ kcal: 160, protein: 30, unit: '' },
  shake:          { kcal: 160, protein: 30, unit: '' },
  smoothie:       { kcal: 250, protein: 8,  unit: '' },
  milk:           { kcal: 120, protein: 8,  unit: 'glass' },
  'almond milk':  { kcal: 40,  protein: 1,  unit: 'glass' },
  'orange juice': { kcal: 110, protein: 2,  unit: 'glass' },
  juice:          { kcal: 120, protein: 0,  unit: 'glass' },
  'diet soda':    { kcal: 0,   protein: 0,  unit: '' },
  'diet coke':    { kcal: 0,   protein: 0,  unit: '' },
  soda:           { kcal: 150, protein: 0,  unit: '' },
  coke:           { kcal: 140, protein: 0,  unit: '' },
  beer:           { kcal: 150, protein: 2,  unit: '' },
  wine:           { kcal: 125, protein: 0,  unit: 'glass' },
  'energy drink': { kcal: 110, protein: 0,  unit: '' },
  water:          { kcal: 0,   protein: 0,  unit: '' },
  tea:            { kcal: 2,   protein: 0,  unit: '' },
  latte:          { kcal: 190, protein: 10, unit: '' },
  cappuccino:     { kcal: 120, protein: 7,  unit: '' },
  'black coffee': { kcal: 2,   protein: 0,  unit: '' },
  coffee:         { kcal: 5,   protein: 0,  unit: '' },
};

// Reference serving weight (oz) for weight-based foods → lets users log by
// ounces/grams ("8 oz chicken breast"). Base macros above correspond to refOz.
const REF_OZ = {
  chicken: 5, 'chicken breast': 6, 'chicken thigh': 4, 'chicken thighs': 4,
  'chicken leg': 5, 'chicken drumstick': 2.5, drumstick: 2.5, 'chicken wing': 1.5,
  'fried chicken': 4, 'rotisserie chicken': 4, 'ground chicken': 4,
  steak: 6, ribeye: 8, 'rib eye': 8, sirloin: 8, 'filet mignon': 7, filet: 7,
  tenderloin: 7, 'ny strip': 8, 'new york strip': 8, 'strip steak': 8,
  't-bone': 9, tbone: 9, porterhouse: 10, 'flank steak': 6, flank: 6,
  'skirt steak': 6, 'flat iron': 6, 'ground beef': 4,
  salmon: 5, tuna: 5, shrimp: 4, turkey: 4, ham: 4, tofu: 6,
  beans: 6, rice: 6, pasta: 8, broccoli: 5, potato: 6, 'sweet potato': 6,
  cheese: 1, bacon: 0.3,
};
for (const k in REF_OZ) if (FOOD_DB[k]) FOOD_DB[k].refOz = REF_OZ[k];

// ── Known chain dishes (resolve instantly) ──────────────────────────
const CHAIN_DISHES = {
  'chipotle chicken burrito': { name: 'Chipotle Chicken Burrito', kcal: 1075, protein: 50 },
  'chipotle steak burrito':   { name: 'Chipotle Steak Burrito',   kcal: 1085, protein: 46 },
  'chipotle bowl':            { name: 'Chipotle Chicken Bowl',     kcal: 705,  protein: 45 },
  'chipotle chicken bowl':    { name: 'Chipotle Chicken Bowl',     kcal: 705,  protein: 45 },
  'big mac':                  { name: "McDonald's Big Mac",        kcal: 563,  protein: 26 },
  'mcchicken':                { name: "McDonald's McChicken",      kcal: 400,  protein: 14 },
  'chick fil a sandwich':     { name: 'Chick-fil-A Sandwich',      kcal: 440,  protein: 28 },
  'sweetgreen':               { name: 'Sweetgreen Harvest Bowl',   kcal: 685,  protein: 27 },
};

// ── Ambiguous combos: chain → tappable clarify options ──────────────
const CHAIN_COMBOS = {
  mcdonalds: [
    { name: 'Quarter Pounder Meal',     kcal: 1110, protein: 37 },
    { name: 'Big Mac Meal',             kcal: 1080, protein: 30 },
    { name: '10pc McNuggets Meal',      kcal: 1010, protein: 35 },
  ],
  chipotle: [
    { name: 'Chicken Burrito',          kcal: 1075, protein: 50 },
    { name: 'Steak Bowl',               kcal: 720,  protein: 42 },
    { name: 'Veggie Bowl',              kcal: 600,  protein: 14 },
  ],
  panera: [
    { name: 'You Pick Two — Soup',      kcal: 640,  protein: 22 },
    { name: 'You Pick Two — Mac',       kcal: 830,  protein: 26 },
    { name: 'Half Sandwich + Salad',    kcal: 590,  protein: 24 },
  ],
};

const WORD_NUM = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6,
  seven:7, eight:8, nine:9, ten:10, couple:2, dozen:12, half:0.5 };

// filler / prep / quantity words that don't count as "unexplained" content
const STOP_WORDS = new Set([
  'a','an','the','of','and','with','plus','to','for','my','some','side','order','plate','bowl','cup','cups',
  'glass','piece','pieces','slice','slices','serving','servings','from','at','in','on','oz','ounce','ounces',
  'g','gram','grams','lb','lbs','pound','pounds','large','small','medium','big','little',
  'grilled','baked','fried','roasted','steamed','sauteed','sautéed','poached','boiled','scrambled','mashed',
  'raw','fresh','cooked','plain','organic','homemade','hot','cold','iced','spicy','lean','whole','half',
]);

const CHAIN_ALIASES = {
  mcdonalds: ['mcdonald', 'mcdonalds', "mcdonald's", 'mickey d'],
  chipotle:  ['chipotle'],
  panera:    ['panera'],
};

function titleCase(s){ return s.replace(/\b\w/g, c => c.toUpperCase()); }

// pretty label for a non-1 quantity (½ instead of 0.5×)
function qtyDisplay(q){
  const map = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };
  return map[q] || `${+q.toFixed(2)}×`;
}
// true if strings are within one edit (catches typos like potatoe→potato)
function within1(a, b){
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < la && j < lb){
    if (a[i] === b[j]){ i++; j++; continue; }
    if (++edits > 1) return false;
    if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
  }
  if (i < la || j < lb) edits++;
  return edits <= 1;
}

function detectChain(text){
  for (const [chain, aliases] of Object.entries(CHAIN_ALIASES))
    if (aliases.some(a => text.includes(a))) return chain;
  return null;
}

// Does the text look like an unresolved combo/number reference?
function looksAmbiguous(text){
  return /\b(combo|meal|number|no\.?|#)\s*\d+/.test(text)
      || /\bnumber\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(text)
      || /\bthe\s+usual\b/.test(text);
}

// ── EAT parser ──────────────────────────────────────────────────────
// Returns either {items:[{name,kcal,protein,qty}]} or
// {ambiguous:true, prompt, options:[{name,kcal,protein}]}
function parseFood(raw){
  const text = ' ' + raw.toLowerCase().trim().replace(/[.!]/g,' ') + ' ';
  const chain = detectChain(text);

  // ambiguous combo for a known chain → ask to clarify
  if (chain && looksAmbiguous(text) && CHAIN_COMBOS[chain]) {
    const CHAIN_LABEL = { mcdonalds: "McDonald's", chipotle: 'Chipotle', panera: 'Panera' };
    return {
      ambiguous: true,
      prompt: `Which ${CHAIN_LABEL[chain]} order?`,
      options: CHAIN_COMBOS[chain].map(o => ({ name: o.name, kcal: o.kcal, protein: o.protein })),
    };
  }
  // generic ambiguous with no chain context
  if (looksAmbiguous(text) && !chain) {
    return {
      ambiguous: true,
      prompt: 'Couldn’t pin that down. Roughly how big?',
      options: [
        { name: 'Light meal',  kcal: 400,  protein: 20 },
        { name: 'Normal meal', kcal: 700,  protein: 35 },
        { name: 'Big meal',    kcal: 1050, protein: 55 },
      ],
    };
  }

  const items = [];
  const unknown = [];
  let uncertain = false;   // matched only part of a chunk → composite/branded, prefer AI

  let working = raw.toLowerCase();

  // known chain dishes: resolve + strip, but keep parsing the rest of the
  // sentence so "big mac and large fries" doesn't lose the fries.
  for (const [key, dish] of Object.entries(CHAIN_DISHES)) {
    const re = new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(working)) {
      items.push({ name: dish.name, kcal: dish.kcal, protein: dish.protein, qty: 1 });
      working = working.replace(re, ' , ');   // remove so the remainder still splits
    }
  }

  // protect dish names containing "and" (mac and cheese) from the and-splitter
  for (const key of Object.keys(FOOD_DB)) {
    if (!key.includes(' and ')) continue;
    const re = new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(working)) {
      const f = FOOD_DB[key];
      items.push({ name: f.name || titleCase(key), kcal: f.kcal, protein: f.protein, qty: 1, id: undefined });
      working = working.replace(re, ' , ');   // remove so the rest still splits
    }
  }

  // free-form single items joined by and / , / with / +
  const chunks = working
    .split(/\band\b|,|\bwith\b|\+|&/)
    .map(c => c.trim()).filter(Boolean);
  for (const chunk of chunks) {
    let qty = 1, weightOz = null, qtyLabel = null, explicitQty = false;
    const words = chunk.replace(/[^a-z0-9\s']/g,' ').split(/\s+/).filter(Boolean);

    // weight quantity (oz / g / lb) takes precedence over a count
    const wq = chunk.match(/(\d*\.?\d+)\s*(oz|ounces?|g|grams?|lb|lbs|pounds?)\b/);
    if (wq) {
      const v = parseFloat(wq[1]), u = wq[2];
      weightOz = /^(oz|ounce)/.test(u) ? v : /^g/.test(u) ? v / 28.35 : v * 16;
      const shortU = /^(oz|ounce)/.test(u) ? 'oz' : /^g/.test(u) ? 'g' : 'lb';
      qtyLabel = `${wq[1]} ${shortU}`;
    } else {
      // fraction ("1/2"), decimal (".5", "0.5"), integer, or worded count
      const frac = chunk.match(/(\d+)\s*\/\s*(\d+)/);
      const dec = chunk.match(/(\d*\.?\d+)/);
      if (frac) { qty = (+frac[1]) / (+frac[2]); explicitQty = true; }
      else if (dec) { qty = parseFloat(dec[1]); explicitQty = true; }
      else for (const w of words) if (WORD_NUM[w] != null){ qty = WORD_NUM[w]; explicitQty = true; break; }
    }

    // best DB match: longest key that appears as a WHOLE word (plural ok),
    // so "apple" never matches inside "pineapple".
    let best = null, bestLen = 0;
    for (const key of Object.keys(FOOD_DB)) {
      const re = new RegExp('\\b' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:es|s)?\\b');
      if (re.test(chunk) && key.length > bestLen){ best = key; bestLen = key.length; }
    }
    // typo tolerance: fuzzy-match single words when nothing matched exactly
    if (!best) {
      for (const w of words) {
        if (w.length < 4 || WORD_NUM[w] != null) continue;
        for (const key of Object.keys(FOOD_DB)) {
          if (key.includes(' ') || Math.abs(key.length - w.length) > 1) continue;
          if (within1(w, key)) { best = key; break; }
        }
        if (best) break;
      }
    }
    // explicit count + plural serving entry ("2 pancakes", "6 chicken wings")
    // → use the per-piece singular entry so we don't double-count
    if (best && explicitQty && qty !== 1) {
      const singular = best.endsWith('es') && FOOD_DB[best.slice(0, -2)] ? best.slice(0, -2)
                     : best.endsWith('s') && FOOD_DB[best.slice(0, -1)] ? best.slice(0, -1) : null;
      if (singular) best = singular;
    }
    if (best) {
      const f = FOOD_DB[best];
      // weight-based scaling when the food supports it; else fall back to count
      let factor = qty, label = qty !== 1 ? qtyDisplay(qty) : null;
      if (weightOz != null) {
        label = qtyLabel;
        factor = f.refOz ? weightOz / f.refOz : 1;
      }
      items.push({
        name: f.name || titleCase(best),
        kcal: Math.round(f.kcal * factor),
        protein: Math.round(f.protein * factor),
        qty,
        qtyLabel: label,
      });
      // did we explain the whole chunk, or only one word of a bigger dish?
      const sig = words.filter(w => !STOP_WORDS.has(w) && !/\d/.test(w) && WORD_NUM[w] == null);
      const leftover = sig.filter(w => !best.includes(w) && !within1(w, best.split(' ').slice(-1)[0]));
      if (leftover.length >= 1) uncertain = true;
    } else {
      // unrecognized chunk in a list — don't silently drop it
      const nm = chunk
        .replace(/[0-9]/g, ' ')
        .replace(/\b(a|an|some|of|the|side|order|plate|bowl|cup|cups|piece|pieces|slice|slices|with|plus|my|i|had|ate|oz|ounces?|g|grams?|lb|lbs|pounds?)\b/g, ' ')
        .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (nm.length >= 2) unknown.push({ nm: titleCase(nm), qty, qtyLabel });
    }
  }

  // if we recognized at least one thing, log the unknowns as estimates
  // rather than dropping them (keeps multi-item lists complete)
  if (items.length && unknown.length) {
    for (const u of unknown) {
      items.push({
        name: u.nm,
        kcal: 200, protein: 8, est: true,
        qty: u.qty, qtyLabel: u.qtyLabel || (u.qty !== 1 ? qtyDisplay(u.qty) : null),
      });
    }
  }

  if (!items.length) {
    // genuinely unrecognized → don't fabricate macros, ask instead
    const label = raw.trim().length > 22 ? 'that' : `“${raw.trim()}”`;
    const log = titleCase(raw.trim());
    return {
      ambiguous: true,
      prompt: `Don’t have ${label} yet — roughly how much?`,
      options: [
        { name: 'A little',  kcal: 200, protein: 8,  log, est: true },
        { name: 'A meal',    kcal: 550, protein: 25, log, est: true },
        { name: 'A lot',     kcal: 900, protein: 40, log, est: true },
      ],
    };
  }
  return { items, uncertain };
}

// ── TRAIN parser ────────────────────────────────────────────────────
const LIFT_NAMES = {
  // ── CHEST ──
  bench: 'Bench Press', 'bench press': 'Bench Press', 'barbell bench': 'Bench Press',
  'incline bench': 'Incline Bench Press', 'incline bench press': 'Incline Bench Press', 'incline press': 'Incline Bench Press',
  'decline bench': 'Decline Bench Press', 'decline press': 'Decline Bench Press',
  'close grip bench': 'Close-Grip Bench', 'close grip': 'Close-Grip Bench',
  'dumbbell bench': 'Dumbbell Bench Press', 'db bench': 'Dumbbell Bench Press',
  'incline dumbbell press': 'Incline Dumbbell Press', 'incline db press': 'Incline Dumbbell Press',
  'chest press': 'Chest Press (Machine)', 'machine chest press': 'Chest Press (Machine)',
  'smith machine bench': 'Smith Machine Bench', 'landmine press': 'Landmine Press',
  'chest fly': 'Chest Fly', 'dumbbell fly': 'Dumbbell Fly', 'incline fly': 'Incline Fly',
  'pec deck': 'Pec Deck', 'machine fly': 'Pec Deck',
  'cable fly': 'Cable Fly', 'cable crossover': 'Cable Crossover', crossover: 'Cable Crossover',
  // ── BACK ──
  deadlift: 'Deadlift', dead: 'Deadlift', dl: 'Deadlift',
  'sumo deadlift': 'Sumo Deadlift', 'trap bar deadlift': 'Trap Bar Deadlift', 'rack pull': 'Rack Pull',
  'romanian deadlift': 'Romanian Deadlift', rdl: 'Romanian Deadlift', 'stiff leg deadlift': 'Stiff-Leg Deadlift',
  row: 'Barbell Row', rows: 'Barbell Row', 'barbell row': 'Barbell Row', 'pendlay row': 'Pendlay Row',
  'dumbbell row': 'Dumbbell Row', 'db row': 'Dumbbell Row', 'one arm row': 'One-Arm Dumbbell Row',
  't bar row': 'T-Bar Row', 't-bar row': 'T-Bar Row', 'tbar row': 'T-Bar Row',
  'seated row': 'Seated Cable Row', 'seated cable row': 'Seated Cable Row', 'cable row': 'Seated Cable Row',
  'chest supported row': 'Chest-Supported Row', 'machine row': 'Machine Row',
  'lat pulldown': 'Lat Pulldown', pulldown: 'Lat Pulldown', 'wide grip pulldown': 'Wide-Grip Pulldown',
  'close grip pulldown': 'Close-Grip Pulldown', 'straight arm pulldown': 'Straight-Arm Pulldown',
  pullup: 'Pull-ups', 'pull up': 'Pull-ups', 'pull ups': 'Pull-ups', pullups: 'Pull-ups',
  'chin up': 'Chin-ups', 'chin ups': 'Chin-ups', chinup: 'Chin-ups',
  pullover: 'Pullover', 'good morning': 'Good Morning', hyperextension: 'Hyperextension',
  'back extension': 'Back Extension', 'face pull': 'Face Pull',
  shrug: 'Shrugs', shrugs: 'Shrugs', 'dumbbell shrug': 'Dumbbell Shrugs',
  // ── SHOULDERS ──
  ohp: 'Overhead Press', press: 'Overhead Press', 'overhead press': 'Overhead Press', 'military press': 'Military Press',
  'shoulder press': 'Shoulder Press', 'dumbbell shoulder press': 'Dumbbell Shoulder Press',
  'arnold press': 'Arnold Press', 'push press': 'Push Press', 'machine shoulder press': 'Machine Shoulder Press',
  'lateral raise': 'Lateral Raise', 'lat raise': 'Lateral Raise', 'side raise': 'Lateral Raise',
  'cable lateral raise': 'Cable Lateral Raise', 'front raise': 'Front Raise',
  'rear delt fly': 'Rear Delt Fly', 'reverse fly': 'Rear Delt Fly', 'reverse pec deck': 'Reverse Pec Deck',
  'upright row': 'Upright Row',
  // ── LEGS ──
  squat: 'Back Squat', 'back squat': 'Back Squat', 'front squat': 'Front Squat',
  'hack squat': 'Hack Squat', 'goblet squat': 'Goblet Squat', 'box squat': 'Box Squat',
  'smith machine squat': 'Smith Machine Squat', 'pendulum squat': 'Pendulum Squat', 'sissy squat': 'Sissy Squat',
  'bulgarian split squat': 'Bulgarian Split Squat', 'split squat': 'Split Squat',
  'leg press': 'Leg Press', 'leg extension': 'Leg Extension', 'leg extensions': 'Leg Extension',
  'leg curl': 'Leg Curl', 'leg curls': 'Leg Curl',
  'lying leg curl': 'Lying Leg Curl', 'lying leg curls': 'Lying Leg Curl', 'lying hamstring curl': 'Lying Leg Curl',
  'seated leg curl': 'Seated Leg Curl', 'seated leg curls': 'Seated Leg Curl', 'hamstring curl': 'Lying Leg Curl',
  'calf raise': 'Calf Raise', 'seated calf raise': 'Seated Calf Raise', 'standing calf raise': 'Standing Calf Raise',
  lunge: 'Lunges', lunges: 'Lunges', 'walking lunge': 'Walking Lunges', 'reverse lunge': 'Reverse Lunges',
  'step up': 'Step-ups', 'step ups': 'Step-ups',
  'hip thrust': 'Hip Thrust', hip: 'Hip Thrust', 'glute bridge': 'Glute Bridge',
  'hip abduction': 'Hip Abduction', abductor: 'Hip Abduction', 'hip adduction': 'Hip Adduction', adductor: 'Hip Adduction',
  // ── ARMS ──
  curl: 'Curls', curls: 'Curls', 'bicep curl': 'Bicep Curl', 'barbell curl': 'Barbell Curl',
  'dumbbell curl': 'Dumbbell Curl', 'db curl': 'Dumbbell Curl', 'hammer curl': 'Hammer Curl',
  'preacher curl': 'Preacher Curl', 'concentration curl': 'Concentration Curl', 'cable curl': 'Cable Curl',
  'incline curl': 'Incline Curl', 'spider curl': 'Spider Curl', 'ez bar curl': 'EZ-Bar Curl',
  tricep: 'Tricep Extension', 'tricep extension': 'Tricep Extension', 'overhead tricep extension': 'Overhead Tricep Extension',
  'tricep pushdown': 'Tricep Pushdown', 'pushdown': 'Tricep Pushdown', 'rope pushdown': 'Rope Pushdown',
  'skull crusher': 'Skull Crushers', 'skullcrusher': 'Skull Crushers', 'tricep kickback': 'Tricep Kickback', kickback: 'Tricep Kickback',
  // ── CORE ──
  plank: 'Plank', crunch: 'Crunches', crunches: 'Crunches', 'cable crunch': 'Cable Crunch',
  'sit up': 'Sit-ups', 'sit ups': 'Sit-ups', situp: 'Sit-ups',
  'leg raise': 'Leg Raises', 'leg raises': 'Leg Raises', 'hanging leg raise': 'Hanging Leg Raises',
  'russian twist': 'Russian Twists', 'ab wheel': 'Ab Wheel', woodchopper: 'Cable Woodchopper',
  // ── BODYWEIGHT ──
  pushup: 'Push-ups', 'push up': 'Push-ups', 'push ups': 'Push-ups',
  dip: 'Dips', dips: 'Dips', 'muscle up': 'Muscle-ups',
};
const CARDIO_NAMES = {
  run: 'Run', running: 'Run', jog: 'Run', ran: 'Run', treadmill: 'Treadmill',
  bike: 'Bike', cycling: 'Bike', cycle: 'Bike', 'assault bike': 'Assault Bike', 'spin bike': 'Spin Bike', 'stationary bike': 'Bike',
  row: 'Row (erg)', rowing: 'Row (erg)', erg: 'Row (erg)', swim: 'Swim', walk: 'Walk', hike: 'Hike',
  incline: 'Incline Walk', stairs: 'Stairmaster', stairmaster: 'Stairmaster', 'stair climber': 'Stairmaster',
  elliptical: 'Elliptical', 'jump rope': 'Jump Rope', 'ski erg': 'Ski Erg', 'arc trainer': 'Arc Trainer',
};

// ── Cardio item builder: time + distance + derived pace ─────────────
function fmtMins(m){
  if (m == null) return null;
  return m >= 60 ? `${Math.floor(m / 60)}h ${Math.round(m % 60)}m` : `${Math.round(m * 10) / 10} min`;
}
function makeCardio(name, mins, dist, distUnit){
  const unit = distUnit || (dist != null ? 'mi' : null);
  let pace = null;
  if (mins && dist) {
    const p = mins / dist;
    pace = `${Math.floor(p)}:${String(Math.round((p - Math.floor(p)) * 60)).padStart(2, '0')}`;
  }
  const detail = [
    mins != null ? fmtMins(mins) : '',
    dist != null ? `${dist} ${unit}` : '',
    pace ? `${pace} /${unit}` : '',
  ].filter(Boolean).join('  ·  ');
  return { kind: 'cardio', name, mins: mins ?? null, dist: dist ?? null, distUnit: unit, pace, detail, volume: 0 };
}

function parseWorkout(raw){
  const lines = raw.split(/[\n,]|\band\b|\bthen\b/i).map(s => s.trim()).filter(Boolean);
  const items = [];
  for (const line of lines) {
    const low = line.toLowerCase();

    // cardio: "run 30 min" / "5k run" / "ran 3 miles in 25 min" / "bike 45 min 12 mi"
    let cardio = null, clen = 0;
    for (const k of Object.keys(CARDIO_NAMES)) if (low.includes(k) && k.length > clen) { cardio = CARDIO_NAMES[k]; clen = k.length; }
    const timeM  = low.match(/(\d+(?:\.\d+)?)\s*(?:min(?:ute)?s?)\b/);
    const hourM  = low.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
    const distMi = low.match(/(\d+(?:\.\d+)?)\s*(?:miles?|mi)\b/);
    const distKm = low.match(/(\d+(?:\.\d+)?)\s*(?:km|k)\b/);
    if (cardio && (timeM || hourM || distMi || distKm || /\b(run|jog|ran|swim|walk|hike|bike)\b/.test(low))) {
      let mins = null;
      if (timeM) mins = (mins || 0) + parseFloat(timeM[1]);
      if (hourM) mins = (mins || 0) + parseFloat(hourM[1]) * 60;
      let dist = null, distUnit = null;
      if (distMi) { dist = parseFloat(distMi[1]); distUnit = 'mi'; }
      else if (distKm) { dist = parseFloat(distKm[1]); distUnit = 'km'; }
      items.push(makeCardio(cardio, mins, dist, distUnit));
      continue;
    }

    // strength — works for ANY exercise, known or not:
    //   "incline bench 3x10 at 150", "3 sets of dumbell raises 15 lb 12 reps", "squat 5x5 315"
    {
      let s = ' ' + low + ' ';
      let weight = null, sets = null, reps = null, m;

      // explicit weight: @150 / at 150 / 150 lb
      m = s.match(/(?:@|\bat)\s*(\d+(?:\.\d+)?)\s*(?:lb|lbs|kg|pounds?)?/);
      if (m) { weight = +m[1]; s = s.replace(m[0], ' '); }

      // sets × reps
      m = s.match(/(\d+)\s*[x×]\s*(\d+)/);
      if (m) { sets = +m[1]; reps = +m[2]; s = s.replace(m[0], ' '); }
      else {
        // "3 sets of 10" idiom → sets & reps together
        const setsOf = s.match(/(\d+)\s*sets?\s+of\s+(\d+)/);
        if (setsOf) { sets = +setsOf[1]; reps = +setsOf[2]; s = s.replace(setsOf[0], ' '); }
        else {
          const sm = s.match(/(\d+)\s*sets?/);            if (sm) { sets = +sm[1]; s = s.replace(sm[0], ' '); }
        }
        if (reps == null) {
          const rm = s.match(/(\d+)\s*reps?/) || s.match(/\bfor\s*(\d+)/);
                                                          if (rm) { reps = +rm[1]; s = s.replace(rm[0], ' '); }
        }
      }

      // weight fallback: explicit unit, else a leftover standalone number
      if (weight == null) {
        const um = s.match(/(\d+(?:\.\d+)?)\s*(?:lb|lbs|kg|pounds?|pouns?)\b/);
        if (um) { weight = +um[1]; s = s.replace(um[0], ' '); }
        else { const nm = s.match(/\b(\d{1,4})\b/); if (nm) { weight = +nm[1]; s = s.replace(nm[0], ' '); } }
      }

      // treat as a lift if we found any structure
      if (sets != null || reps != null) {
        // canonical name from dictionary, else derive from the leftover words
        let lift = null, bestLen = 0;
        for (const k of Object.keys(LIFT_NAMES)) if (low.includes(k) && k.length > bestLen){ lift = LIFT_NAMES[k]; bestLen = k.length; }
        let name = lift;
        if (!name) {
          const cleaned = s
            .replace(/\b(sets?|reps?|rep|of|at|x|by|lbs?|kgs?|pounds?|pouns?|for|each|side|per|a|the)\b/g, ' ')
            .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
          name = cleaned ? titleCase(cleaned) : 'Exercise';
        }
        const setRows = makeSetRows(sets, reps, weight);
        const d = liftDerived(setRows);
        items.push({ kind: 'lift', name, setRows, e1rm: d.e1rm, volume: d.volume });
        continue;
      }

      // a bare known lift with no numbers ("bench") → minimal lift entry
      let known = null, kl = 0;
      for (const k of Object.keys(LIFT_NAMES)) if (low.includes(k) && k.length > kl){ known = LIFT_NAMES[k]; kl = k.length; }
      if (known) {
        items.push({ kind: 'lift', name: known, setRows: makeSetRows(null, null, null), e1rm: null, volume: 0 });
        continue;
      }
    }

    // unknown → log raw
    items.push({ kind: 'other', name: titleCase(line), detail: '', volume: 0 });
  }
  return { items };
}

// ── 7-day canned history (today filled live by the app) ─────────────
// kcal, protein (g), sleep (hrs), train (relative volume 0–100)
const GOALS = { kcal: 2400, protein: 170 };

// ════════════════════════════════════════════════════════════════════
//  PERSISTED MULTI-DAY HISTORY + DAILY ROLLOVER
//  Real data only. Today's working logs live in est-state-v1; completed
//  days are snapshotted here on rollover. Reconciled on load + focus.
// ════════════════════════════════════════════════════════════════════
const HIST_KEY = 'est-history-v1';
const WORKOUTS_KEY = 'est-workouts-v1';
const DAY_MS = 86400000;
const EMPTY_WORKING = { foodLog: [], trainLog: [], sleep: { sleeping: false, bedAt: null, lastDuration: null, lastEnd: null } };

// ── per-set lift model ──────────────────────────────────────────────
// A lift carries setRows: [{ reps, weight }]. weight === null = bodyweight.
// Older logs stored a single sets/reps/weight triple — normalizeLift expands
// those into uniform rows so every consumer sees the same shape.
function makeSetRows(sets, reps, weight){
  const n = Math.max(1, Math.round(sets) || 1);
  return Array.from({ length: n }, () => ({ reps: reps ?? null, weight: weight ?? null }));
}
function liftDerived(setRows){
  const rows = Array.isArray(setRows) ? setRows : [];
  let volume = 0, e1rm = null, totalReps = 0, anyWeight = false;
  for (const r of rows){
    const reps = +r.reps || 0;
    const w = r.weight == null ? null : +r.weight;
    totalReps += reps;
    if (w != null){
      anyWeight = true;
      volume += reps * w;
      if (reps){ const e = Math.round(w * (1 + reps / 30)); if (e1rm == null || e > e1rm) e1rm = e; }
    }
  }
  return { volume, e1rm, totalReps, anyWeight, sets: rows.length };
}
function normalizeLift(t){
  if (!t || t.kind !== 'lift') return t;
  const rows = (Array.isArray(t.setRows) && t.setRows.length)
    ? t.setRows.map(r => ({ reps: r.reps ?? null, weight: r.weight ?? null }))
    : makeSetRows(t.sets, t.reps, t.weight);
  const d = liftDerived(rows);
  // drop legacy scalar fields so the shape stays clean going forward
  const { sets, reps, weight, ...rest } = t;
  return { ...rest, setRows: rows, e1rm: d.e1rm, volume: d.volume };
}

// ── saved workouts (user-curated templates) ─────────────────────────
function loadWorkouts(){
  try { const w = JSON.parse(localStorage.getItem(WORKOUTS_KEY)); if (Array.isArray(w)) return w; } catch (e) {}
  return [];
}
function saveWorkouts(list){ localStorage.setItem(WORKOUTS_KEY, JSON.stringify(list || [])); }

// date helpers (honor a debug override so rollover can be simulated)
function todayDate(){
  try { const o = localStorage.getItem('est-debug-today');
    if (o){ const [y,m,d] = o.split('-').map(Number); return new Date(y, m-1, d); } } catch (e) {}
  return new Date();
}
function dateKey(d){ d = d || todayDate();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function keyToDate(k){ const [y,m,d] = k.split('-').map(Number); return new Date(y, m-1, d); }
function dowShort(k){ return keyToDate(k).toLocaleDateString('en-US', { weekday: 'short' }); }
function daysBetween(aKey, bKey){ return Math.round((keyToDate(bKey) - keyToDate(aKey)) / DAY_MS); }
function nfmt(n){ return Math.round(n).toLocaleString('en-US'); }

function loadHistory(){
  try { const h = JSON.parse(localStorage.getItem(HIST_KEY)); if (h && Array.isArray(h.days)) return h; } catch (e) {}
  return null;
}
function saveHistory(h){ localStorage.setItem(HIST_KEY, JSON.stringify(h)); }

// compute a day's totals from working logs (matches the live "today" math)
function computeTotals(foodLog, trainLog, sleep){
  const kcal = (foodLog || []).reduce((s, f) => s + (f.kcal || 0), 0);
  const protein = (foodLog || []).reduce((s, f) => s + (f.protein || 0), 0);
  const vol = (trainLog || []).reduce((s, x) => s + (x.volume || 0), 0);
  const train = (trainLog && trainLog.length) ? Math.max(35, Math.min(100, Math.round(vol / 120))) : 0;
  const sleepHrs = (sleep && sleep.lastDuration) ? +(sleep.lastDuration / 3600000).toFixed(1) : 0;
  const hasData = (foodLog || []).length > 0 || (trainLog || []).length > 0 || !!(sleep && sleep.lastDuration);
  return { kcal, protein, sleep: sleepHrs, train, hasData };
}

// build a re-loggable session (lifts + cardio) from a day's trainLog
function buildSession(dKey, trainLog){
  const ex = (trainLog || []).filter(t => t.kind === 'lift' || t.kind === 'cardio').map(t =>
    t.kind === 'lift'
      ? { kind: 'lift', name: t.name,
          setRows: (t.setRows && t.setRows.length ? t.setRows : makeSetRows(t.sets, t.reps, t.weight))
            .map(r => ({ reps: r.reps ?? null, weight: r.weight ?? null })) }
      : { kind: 'cardio', name: t.name, mins: t.mins ?? null, dist: t.dist ?? null, distUnit: t.distUnit ?? null });
  if (!ex.length) return null;
  return { id: 'sess_' + dKey, date: dKey, day: dowShort(dKey).toUpperCase(),
    label: keyToDate(dKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), exercises: ex };
}
function emptyDay(dKey){ return { date: dKey, dow: dowShort(dKey), kcal: 0, protein: 0, sleep: 0, train: 0, hasData: false, session: null }; }

// Reconcile on load/focus. Returns { history, reset }.
// reset !== null  → the date advanced; caller must replace working state.
function reconcileHistory(working){
  const tKey = dateKey();
  let h = loadHistory();
  if (!h){ h = { days: [], lastDate: tKey }; saveHistory(h); return { history: h, reset: null }; }
  if (h.lastDate === tKey) return { history: h, reset: null };
  if (daysBetween(h.lastDate, tKey) <= 0){ h.lastDate = tKey; saveHistory(h); return { history: h, reset: null }; }

  // snapshot the previous day from the working state
  const t = computeTotals(working.foodLog, working.trainLog, working.sleep);
  h.days.push({ date: h.lastDate, dow: dowShort(h.lastDate), kcal: t.kcal, protein: t.protein,
    sleep: t.sleep, train: t.train, hasData: t.hasData, session: buildSession(h.lastDate, working.trainLog) });
  // backfill any days the app wasn't opened, as honest empty days
  const gap = daysBetween(h.lastDate, tKey);
  for (let i = 1; i < gap; i++)
    h.days.push(emptyDay(dateKey(new Date(keyToDate(h.lastDate).getTime() + i * DAY_MS))));
  h.days = h.days.slice(-14);
  h.lastDate = tKey;
  saveHistory(h);
  return { history: h, reset: EMPTY_WORKING };
}

// recent re-loggable sessions, most recent first (real workouts only)
function recentSessions(history){
  const h = history || loadHistory(); if (!h) return [];
  return h.days.filter(d => d.session).map(d => d.session).reverse().slice(0, 4);
}

// real insight — only when genuinely supported by enough real days, else null
function computeInsight(history, today){
  const h = history || loadHistory(); if (!h) return null;
  const tl = [...h.days];
  if (today && today.hasData) tl.push({ ...today, hasData: true });
  const dataDays = tl.filter(d => d.hasData);
  if (dataDays.length < 4) return null;

  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  // previous-night sleep → next-day training
  const pairs = [];
  for (let i = 1; i < tl.length; i++){
    const prev = tl[i-1], cur = tl[i];
    if (prev && prev.sleep > 0 && cur && cur.hasData) pairs.push({ s: prev.sleep, train: cur.train });
  }
  const good = pairs.filter(p => p.s >= 7.5).map(p => p.train);
  const poor = pairs.filter(p => p.s > 0 && p.s < 6.5).map(p => p.train);
  if (good.length >= 2 && poor.length >= 2){
    const g = avg(good), p = avg(poor);
    if (g - p >= 12) return 'Your hardest training follows your best sleep — sessions run bigger the day after 7.5h+ nights.';
    if (p - g >= 12) return 'Lately your bigger sessions have come after shorter nights — keep an eye on recovery.';
  }
  // factual fallback (literally true from the user's own days)
  const sleepVals = dataDays.filter(d => d.sleep > 0).map(d => d.sleep);
  const kcalVals = dataDays.filter(d => d.kcal > 0).map(d => d.kcal);
  const trainCount = dataDays.filter(d => d.train > 0).length;
  const bits = [`${dataDays.length} days logged`];
  if (sleepVals.length) bits.push(`avg ${avg(sleepVals).toFixed(1)}h sleep`);
  if (kcalVals.length) bits.push(`avg ${nfmt(avg(kcalVals))} kcal`);
  if (trainCount) bits.push(`trained ${trainCount} of ${dataDays.length} days`);
  return bits.join(' · ');
}

// ── debug hooks for testing rollover (see notes) ────────────────────
// Dev-only: stripped from production builds so the shipped app exposes no
// state-manipulation hooks on the global window object.
if (import.meta.env.DEV && typeof window !== 'undefined'){
  window.EST_setToday = s => { localStorage.setItem('est-debug-today', s); location.reload(); };
  window.EST_simulateNextDay = () => { const n = dateKey(new Date(keyToDate(dateKey()).getTime() + DAY_MS)); localStorage.setItem('est-debug-today', n); location.reload(); };
  window.EST_clearSim = () => { localStorage.removeItem('est-debug-today'); location.reload(); };
}

export { parseFood, parseWorkout, GOALS, FOOD_DB, LIFT_NAMES, CARDIO_NAMES, titleCase, makeCardio, fmtMins,
  reconcileHistory, recentSessions, computeInsight, computeTotals, loadHistory, dateKey, EMPTY_WORKING,
  makeSetRows, liftDerived, normalizeLift, loadWorkouts, saveWorkouts };
