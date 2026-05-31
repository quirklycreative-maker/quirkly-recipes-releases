const fs = require('fs');

const GIMap = {
  'white rice': 73, 'basmati rice': 58, 'brown rice': 50, 'rice': 65,
  'wheat flour': 70, 'atta': 70, 'maida': 85, 'refined flour': 85,
  'besan': 35, 'gram flour': 35, 'ragi': 45, 'bajra': 55, 'jowar': 62,
  'oats': 55, 'semolina': 66, 'sooji': 66, 'rava': 66, 'poha': 64,
  'bread': 75, 'naan': 70, 'roti': 62, 'paratha': 65, 'puri': 75,
  'pasta': 50, 'noodles': 47, 'vermicelli': 58, 'sevai': 58,
  'cornflour': 70, 'corn': 52, 'makka': 52, 'sago': 85, 'sabudana': 85,

  'moong dal': 31, 'toor dal': 29, 'chana dal': 28, 'masoor dal': 27,
  'urad dal': 30, 'rajma': 29, 'chole': 33, 'chickpea': 33,
  'lobia': 33, 'soybean': 16, 'peanut': 14, 'dal': 30,
  'sprouts': 25, 'moth beans': 32, 'kidney beans': 29,

  'potato': 78, 'aloo': 78, 'sweet potato': 63, 'shakarkand': 63,
  'spinach': 15, 'palak': 15, 'methi': 15, 'fenugreek': 15,
  'onion': 10, 'tomato': 15, 'capsicum': 15, 'shimla mirch': 15,
  'cauliflower': 15, 'gobi': 15, 'brinjal': 15, 'baingan': 15,
  'okra': 20, 'bhindi': 20, 'cabbage': 10, 'patta gobi': 10,
  'carrot': 39, 'gajar': 39, 'peas': 48, 'matar': 48,
  'bottle gourd': 15, 'lauki': 15, 'bitter gourd': 15, 'karela': 15,
  'ridge gourd': 15, 'tori': 15, 'drumstick': 15, 'moringa': 15,
  'mushroom': 10, 'beetroot': 64, 'chukandar': 64, 'radish': 15,
  'cucumber': 15, 'pumpkin': 75, 'kaddu': 75, 'jackfruit': 50,
  'raw banana': 55, 'kachha kela': 55, 'sev': 70,

  'paneer': 0, 'milk': 31, 'curd': 28, 'yogurt': 28, 'dahi': 28,
  'ghee': 0, 'butter': 0, 'cream': 0, 'cheese': 0, 'khoya': 30,
  'egg': 0, 'anda': 0, 'chicken': 0, 'murgh': 0, 'fish': 0,
  'mutton': 0, 'lamb': 0, 'prawn': 0, 'shrimp': 0,

  'oil': 0, 'mustard oil': 0, 'coconut oil': 0, 'sesame oil': 0,

  'turmeric': 5, 'haldi': 5, 'cumin': 5, 'jeera': 5,
  'coriander': 5, 'dhaniya': 5, 'garam masala': 5,
  'mustard seeds': 5, 'rai': 5, 'curry leaves': 5,
  'chili powder': 5, 'red chili': 5, 'green chili': 5,
  'ginger': 5, 'adrak': 5, 'garlic': 5, 'lahsun': 5,
  'cinnamon': 5, 'dalchini': 5, 'clove': 5, 'laung': 5,
  'cardamom': 5, 'elaichi': 5, 'bay leaf': 5, 'tej patta': 5,
  'asafoetida': 5, 'hing': 5, 'fennel': 5, 'saunf': 5,
  'salt': 0, 'pepper': 5, 'kali mirch': 5,
  'amchur': 5, 'chaat masala': 5, 'kasuri methi': 5,

  'sugar': 65, 'jaggery': 55, 'gur': 55, 'honey': 58, 'mishri': 60,

  'almond': 15, 'badam': 15, 'cashew': 22, 'kaju': 22,
  'walnut': 15, 'akhrot': 15, 'pistachio': 15, 'pista': 15,
  'coconut': 45, 'nariyal': 45, 'sesame': 35, 'til': 35,
  'poppy seed': 15, 'khus khus': 15, 'flax seed': 15, 'alsi': 15,

  'mango': 56, 'aam': 56, 'banana': 62, 'kela': 62,
  'apple': 36, 'seb': 36, 'guava': 12, 'amrud': 12,
  'papaya': 60, 'orange': 43, 'lemon': 20, 'nimbu': 20,
  'pomegranate': 35, 'anar': 35, 'grapes': 46, 'angoor': 46,
  'watermelon': 72, 'tarbooz': 72, 'pineapple': 59, 'dates': 42,
  'tamarind': 23, 'imli': 23, 'kokum': 15, 'amla': 15,
};

const DISH_INGREDIENTS = {
  'sev bhaji': ['sev', 'onion', 'tomato', 'oil', 'turmeric', 'chili powder', 'cumin', 'garlic', 'coriander'],
};

function inferIngredients(dishName) {
  const key = dishName.toLowerCase().trim();
  for (const [dish, ingredients] of Object.entries(DISH_INGREDIENTS)) {
    if (key.includes(dish) || dish.includes(key)) {
      return ingredients;
    }
  }
  const searchWords = key.split(/\s+/).filter(w => w.length > 2);
  return [...searchWords, 'oil', 'onion', 'tomato', 'salt', 'turmeric', 'cumin', 'chili powder'];
}

function computeGILevel(ingredients) {
  if (ingredients.length === 0) return { level: 'medium', exactGI: 55 };

  let totalGI = 0;
  let matchedMajorIngredients = 0;
  let highestGI = 0;

  for (const ingredient of ingredients) {
    const ingLower = ingredient.toLowerCase();
    
    if (GIMap[ingLower] !== undefined) {
      const giValue = GIMap[ingLower];
      if (giValue > highestGI) highestGI = giValue;
      if (giValue > 15) {
        totalGI += giValue;
        matchedMajorIngredients++;
      }
      continue;
    }

    for (const [giIngredient, giValue] of Object.entries(GIMap)) {
      if (ingLower.includes(giIngredient) || giIngredient.includes(ingLower)) {
        if (giValue > highestGI) highestGI = giValue;
        if (giValue > 15) {
          totalGI += giValue;
          matchedMajorIngredients++;
        }
        break;
      }
    }
  }

  const effectiveGI = matchedMajorIngredients > 0 ? (totalGI / matchedMajorIngredients) : highestGI;
  let level = 'high';
  if (effectiveGI <= 45) level = 'low';
  else if (effectiveGI <= 65) level = 'medium';
  return { level, exactGI: effectiveGI };
}

const https = require('https');

async function getCarbs(dish) {
  return new Promise((resolve) => {
    https.get(`https://api.spoonacular.com/recipes/guessNutrition?title=${encodeURIComponent(dish)}&apiKey=b75518fc32434ad3a62f076876be2a05`, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          resolve(JSON.parse(data).carbs.value);
        } catch {
          resolve(30); // fallback
        }
      });
    }).on("error", (err) => resolve(30));
  });
}

async function testAll() {
  const items = ["Jalebi", "Samosa", "Gulab Jamun", "French Fries", "Chole Bhature", "Vada Pav"];
  
  for (const item of items) {
    const ingredients = inferIngredients(item);
    const { exactGI } = computeGILevel(ingredients);
    const carbs = await getCarbs(item);
    const gl = (exactGI * carbs) / 100;
    
    let glText = gl <= 10 ? 'LOW' : gl <= 19 ? 'MED' : 'HIGH';
    console.log(`${item} -> GI: ${exactGI.toFixed(1)}, Carbs: ${carbs}g, GL: ${gl.toFixed(1)} (${glText})`);
    
    if (gl <= 19) {
      console.log(`   [WARNING] This is unhealthy but showing as ${glText}! Missing ingredients: ${ingredients.join(', ')}`);
    }
  }
}

testAll();
