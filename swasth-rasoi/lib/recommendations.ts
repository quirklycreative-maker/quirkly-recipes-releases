import type { DietaryProfile, Recipe, RecipeMatch } from '@/types/app';

export const pantryStaples = [
  'moong dal',
  'chana dal',
  'besan',
  'curd',
  'paneer',
  'tofu',
  'spinach',
  'bhindi',
  'lauki',
  'methi',
  'capsicum',
  'cucumber',
  'tomato',
  'onion',
  'eggs',
  'chicken',
  'millets',
  'brown rice',
  'olive oil',
  'peanuts',
];

export const synonymMap: Record<string, string[]> = {
  bhindi: ['bhindi', 'okra', 'भिंडी', 'भिन्डी'],
  lauki: ['lauki', 'bottle gourd', 'ghiya', 'लौकी', 'घिया'],
  spinach: ['spinach', 'palak', 'पालक', 'साग'],
  methi: ['methi', 'fenugreek', 'मेथी'],
  paneer: ['paneer', 'पनीर'],
  tofu: ['tofu', 'टोफू'],
  'moong dal': ['moong', 'moong dal', 'mung', 'मूंग', 'मूंग दाल'],
  'chana dal': ['chana dal', 'चना दाल', 'dal', 'दाल'],
  besan: ['besan', 'gram flour', 'बेसन'],
  curd: ['curd', 'yogurt', 'dahi', 'दही'],
  capsicum: ['capsicum', 'shimla mirch', 'शिमला मिर्च'],
  cabbage: ['cabbage', 'patta gobhi', 'पत्ता गोभी'],
  tomato: ['tomato', 'टमाटर', 'tamatar'],
  onion: ['onion', 'प्याज', 'pyaaz'],
  cucumber: ['cucumber', 'खीरा', 'kheera'],
  eggs: ['egg', 'eggs', 'anda', 'अंडा', 'अंडे'],
  chicken: ['chicken', 'मुर्गी', 'चिकन', 'kukra', 'कुखुरा'],
  millets: ['millet', 'millets', 'ragi', 'jowar', 'bajra', 'रागी', 'ज्वार', 'बाजरा'],
  'brown rice': ['brown rice', 'ब्राउन राइस'],
  peanuts: ['peanut', 'peanuts', 'मूंगफली'],
};

const grocerySplitPattern = /[,;\n]+/;

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{M}\p{N}\s.,;|/+&-]/gu, ' ');
}

function addCanonicalMatch(found: Set<string>, item: string) {
  const normalized = item.toLowerCase().trim();
  if (!normalized) {
    return;
  }

  const canonical = Object.entries(synonymMap).find(([, words]) =>
    words.some((word) => normalized === word.toLowerCase())
  )?.[0];

  found.add(canonical ?? normalized);
}

function itemMatchesInventory(item: string, inventory: string[]) {
  const normalized = item.toLowerCase();
  return inventory.some(
    (entry) =>
      entry === normalized ||
      synonymMap[item]?.includes(entry) ||
      synonymMap[entry]?.includes(normalized)
  );
}

export const recipes: Recipe[] = [
  {
    id: 'moong-chilla',
    titleHi: 'मूंग दाल चीला दही के साथ',
    titleEn: 'Moong dal chilla with curd',
    dietType: 'veg',
    tags: ['breakfast', 'high protein', 'low gi'],
    ingredients: ['moong dal', 'curd', 'onion', 'tomato', 'spinach'],
    coreIngredients: ['moong dal', 'curd'],
    stepsHi: [
      'मूंग दाल को भिगोकर पीसें और नमक, प्याज, टमाटर, पालक मिलाएं.',
      'नॉन-स्टिक तवे पर कम तेल में पतला चीला बनाएं.',
      'दही और खीरे के साथ परोसें.',
    ],
    why: 'Protein aur fiber se pet bharta hai, portion control easy hota hai.',
    giNote: 'Low-GI leaning: dal, dahi aur sabzi par focus.',
    giScore: 34,
    youtubeQuery: 'मूंग दाल चीला diabetes friendly recipe Hindi',
  },
  {
    id: 'lauki-chana',
    titleHi: 'लौकी चना दाल',
    titleEn: 'Lauki chana dal',
    dietType: 'veg',
    tags: ['lunch', 'fiber', 'low gi'],
    ingredients: ['lauki', 'chana dal', 'tomato', 'onion', 'curd'],
    coreIngredients: ['lauki', 'chana dal'],
    stepsHi: [
      'चना दाल को भिगोकर लौकी के साथ कुकर में पकाएं.',
      'टमाटर, प्याज और हल्के मसालों का तड़का लगाएं.',
      'छोटी बाजरा/ज्वार रोटी या सलाद के साथ लें.',
    ],
    why: 'Lauki volume deti hai aur dal protein-fiber balance banati hai.',
    giNote: 'Low-GI leaning when paired with salad and small roti portion.',
    giScore: 38,
    youtubeQuery: 'लौकी चना दाल diabetes friendly Hindi recipe',
  },
  {
    id: 'palak-paneer-tofu',
    titleHi: 'पालक पनीर या टोफू',
    titleEn: 'Palak paneer or tofu',
    dietType: 'veg',
    tags: ['dinner', 'protein', 'low carb'],
    ingredients: ['spinach', 'paneer', 'tofu', 'onion', 'tomato', 'curd'],
    coreIngredients: ['spinach', 'paneer'],
    stepsHi: [
      'पालक उबालकर प्यूरी बनाएं.',
      'कम तेल में प्याज-टमाटर मसाला पकाकर पनीर या टोफू डालें.',
      'सलाद और छोटी ज्वार/बाजरा रोटी के साथ परोसें.',
    ],
    why: 'Leafy greens plus protein dinner ko lighter rakhte hain.',
    giNote: 'Low-GI leaning: leafy vegetable and protein-heavy meal.',
    giScore: 28,
    youtubeQuery: 'पालक पनीर diabetes friendly Hindi recipe',
  },
  {
    id: 'bhindi-besan',
    titleHi: 'भिंडी बेसन मसाला',
    titleEn: 'Bhindi besan masala',
    dietType: 'veg',
    tags: ['lunch', 'veg', 'fiber'],
    ingredients: ['bhindi', 'besan', 'curd', 'onion', 'tomato'],
    coreIngredients: ['bhindi', 'besan'],
    stepsHi: [
      'भिंडी को लंबा काटकर कम तेल में पकाएं.',
      'थोड़ा बेसन भूनकर हल्के मसाले मिलाएं.',
      'दही-खीरा रायता के साथ खाएं.',
    ],
    why: 'Bhindi non-starchy vegetable hai, besan se satiety badhti hai.',
    giNote: 'Low-GI leaning when eaten without fried sides.',
    giScore: 35,
    youtubeQuery: 'भिंडी बेसन मसाला healthy Hindi recipe',
  },
  {
    id: 'methi-egg',
    titleHi: 'मेथी अंडा भुर्जी',
    titleEn: 'Methi egg bhurji',
    dietType: 'egg',
    tags: ['breakfast', 'egg', 'protein'],
    ingredients: ['eggs', 'methi', 'onion', 'tomato', 'capsicum'],
    coreIngredients: ['eggs', 'methi'],
    stepsHi: [
      'मेथी, प्याज, टमाटर और शिमला मिर्च को कम तेल में पकाएं.',
      'अंडे डालकर नरम भुर्जी बनाएं.',
      'सलाद या दही के साथ परोसें.',
    ],
    why: 'Egg protein ke saath methi aur capsicum fiber add karte hain.',
    giNote: 'Very low-carb meal; bread/paratha portion avoid or keep small.',
    giScore: 18,
    youtubeQuery: 'मेथी अंडा भुर्जी healthy Hindi recipe',
  },
  {
    id: 'chicken-salad',
    titleHi: 'ग्रिल्ड चिकन सलाद बाउल',
    titleEn: 'Grilled chicken salad bowl',
    dietType: 'chicken',
    tags: ['dinner', 'chicken', 'high protein'],
    ingredients: ['chicken', 'curd', 'cucumber', 'tomato', 'capsicum', 'spinach'],
    coreIngredients: ['chicken', 'curd'],
    stepsHi: [
      'चिकन को दही, अदरक-लहसुन और मसालों में मैरिनेट करें.',
      'ग्रिल या पैन पर कम तेल में पकाएं.',
      'पालक, खीरा, टमाटर और शिमला मिर्च के साथ बाउल बनाएं.',
    ],
    why: 'Lean protein aur salad se dinner filling rehta hai.',
    giNote: 'Low-GI leaning if rice/roti portion small or skipped.',
    giScore: 16,
    youtubeQuery: 'ग्रिल्ड चिकन सलाद Hindi healthy recipe',
  },
];

export function normalizeInventory(input: string) {
  const lower = normalizeText(input);
  const found = new Set<string>();

  Object.entries(synonymMap).forEach(([canonical, words]) => {
    if (words.some((word) => lower.includes(word.toLowerCase()))) {
      found.add(canonical);
    }
  });

  input
    .split(grocerySplitPattern)
    .map((item) => normalizeText(item).trim())
    .filter(Boolean)
    .forEach((item) => addCanonicalMatch(found, item));

  return Array.from(found);
}

export function recipeMatches(input: string, profile: DietaryProfile): RecipeMatch[] {
  const inventory = normalizeInventory(input);
  const allowed = recipes.filter((recipe) => {
    if (recipe.dietType === 'veg') {
      return true;
    }
    if (recipe.dietType === 'egg') {
      return profile.preference !== 'mostly-veg';
    }
    return profile.preference === 'veg-chicken-egg';
  });

  return allowed
    .map((recipe) => {
      const matched = recipe.ingredients.filter((item) => itemMatchesInventory(item, inventory));
      const missing = recipe.coreIngredients.filter((item) => !itemMatchesInventory(item, inventory));
      const coreMatchBonus = recipe.coreIngredients.length - missing.length;
      return {
        ...recipe,
        matched,
        missing,
        score: matched.length * 2 + coreMatchBonus * 3 - missing.length,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function parseGroceryItems(input: string) {
  const removableWords = [
    'order',
    'mangwana',
    'mangwao',
    'chahiye',
    'लाना',
    'चाहिए',
    'मंगाना',
    'किन्नु',
    'चाहिन्छ',
  ];
  const cleaned = normalizeText(
    removableWords.reduce((current, word) => current.split(word).join(' '), input)
  );
  const separated = cleaned
    .replace(/\s+and\s+/gi, ',')
    .split(' और ')
    .join(',')
    .split(' तथा ')
    .join(',');

  return separated
    .split(grocerySplitPattern)
    .map((item) =>
      item
        .replace(/[|]/g, ' ')
        .replace(/[^\p{L}\p{M}\p{N}\s.-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((item) => item.length > 1 && /[\p{L}\p{N}]/u.test(item))
    .map((item) => {
      const canonical = Object.entries(synonymMap).find(([, words]) =>
        words.some((word) => word.toLowerCase() === item.toLowerCase())
      )?.[0];
      return canonical ? canonical : item;
    })
    .filter((item, index, items) => items.indexOf(item) === index);
}

export function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function giLabelForScore(score: number): 'Low' | 'Medium' | 'High' {
  if (score <= 55) {
    return 'Low';
  }
  if (score <= 69) {
    return 'Medium';
  }
  return 'High';
}

export function estimateGiFromText(text: string) {
  const lower = text.toLowerCase();
  let score = 42;

  if (/(moong|dal|चना|दाल|मूंग|besan|बेसन|palak|पालक|bhindi|भिंडी|lauki|लौकी|tofu|paneer|पनीर)/i.test(lower)) {
    score -= 10;
  }
  if (/(egg|अंड|chicken|चिकन|salad|खीरा|curd|दही)/i.test(lower)) {
    score -= 8;
  }
  if (/(rice|चावल|potato|आलू|bread|paratha|पराठा|sugar|चीनी|juice)/i.test(lower)) {
    score += 18;
  }
  if (/(fried|deep fry|पूरी|pakora|पकौड़ा)/i.test(lower)) {
    score += 10;
  }

  const bounded = Math.max(10, Math.min(85, score));
  return {
    score: bounded,
    label: giLabelForScore(bounded),
  };
}

export function summarizeYoutubeRecipe(text: string) {
  const lower = text.toLowerCase();
  if (/(moong|मूंग|chilla|चीला)/i.test(lower)) {
    return 'Likely shows soaked moong dal batter cooked as chilla with vegetables and curd pairing.';
  }
  if (/(palak|पालक|paneer|पनीर)/i.test(lower)) {
    return 'Likely covers a spinach gravy with paneer/tofu; keep oil modest and pair with salad or small millet roti.';
  }
  if (/(lauki|लौकी|चना)/i.test(lower)) {
    return 'Likely explains lauki chana dal: pressure-cooked dal and bottle gourd with light tadka.';
  }
  return 'Recipe video shared in chat. AI can summarize title/notes here; full transcript support needs a backend video-transcript service.';
}
