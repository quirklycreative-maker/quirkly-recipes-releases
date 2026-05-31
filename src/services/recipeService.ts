// src/services/recipeService.ts
// Service that selects Indian recipes based on fridge inventory, user preferences, and GI rating.

// Load recipes using Metro's JSON resolver (React Native compatible)
import rawRecipes from '../data/recipes.json' with { type: 'json' };
import { YoutubeTranscript } from 'youtube-transcript';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  giLevel: 'low' | 'medium' | 'high' | 'unknown';
  tags: ('veg' | 'egg' | 'chicken')[];
  videoUrl: string;
  exactGI?: number;
  glycemicLoad?: number;
  healthTip?: string;
}

export interface YoutubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

const MOCK_RECIPES: Recipe[] = rawRecipes as Recipe[];

// Custom curated YouTube video IDs for specific recipes
const RECIPE_VIDEOS: { [key: string]: YoutubeVideo[] } = {
  '1': [
    {
      id: 'Pj15x9-zCqM',
      title: 'Palak Paneer Recipe | लहसुनी पालक पनीर | Chef Ranveer Brar',
      channel: 'Ranveer Brar',
      duration: '11:42',
      thumbnail: 'https://img.youtube.com/vi/Pj15x9-zCqM/hqdefault.jpg'
    },
    {
      id: 'K1-q3gWvL-Q',
      title: 'Palak Paneer Recipe - Easy Spinach Paneer Curry',
      channel: 'Nisha Madhulika',
      duration: '8:15',
      thumbnail: 'https://img.youtube.com/vi/K1-q3gWvL-Q/hqdefault.jpg'
    },
    {
      id: 'jU39WbIipO8',
      title: 'Restaurant Style Palak Paneer | पालक पनीर | Chef Kunal Kapur',
      channel: 'Kunal Kapur',
      duration: '10:05',
      thumbnail: 'https://img.youtube.com/vi/jU39WbIipO8/hqdefault.jpg'
    }
  ],
  '2': [
    {
      id: 'zHkF17lXo1E',
      title: 'Methi Chicken Recipe | मेथी चिकन | Chicken Curry',
      channel: 'Ranveer Brar',
      duration: '14:10',
      thumbnail: 'https://img.youtube.com/vi/zHkF17lXo1E/hqdefault.jpg'
    },
    {
      id: 'vFws1iV_g8s',
      title: 'Methi Chicken Curry | Restaurant Style Methi Murgh',
      channel: 'Spice Eats',
      duration: '9:30',
      thumbnail: 'https://img.youtube.com/vi/vFws1iV_g8s/hqdefault.jpg'
    },
    {
      id: '_aH_P7UvBvY',
      title: 'Dhaba Style Methi Chicken | मेथी चिकन बनाने का आसान तरीका',
      channel: 'Bharatzkitchen',
      duration: '12:25',
      thumbnail: 'https://img.youtube.com/vi/_aH_P7UvBvY/hqdefault.jpg'
    }
  ],
  '3': [
    {
      id: '2_Y5cZ4c5Fw',
      title: 'Moong Dal Chilla Recipe | मूंग दाल का चीला',
      channel: 'Nisha Madhulika',
      duration: '7:50',
      thumbnail: 'https://img.youtube.com/vi/2_Y5cZ4c5Fw/hqdefault.jpg'
    },
    {
      id: 'v7sXk92Z7U8',
      title: 'Stuffed Moong Dal Chilla Recipe | Healthy Breakfast',
      channel: 'KabitasKitchen',
      duration: '9:05',
      thumbnail: 'https://img.youtube.com/vi/v7sXk92Z7U8/hqdefault.jpg'
    },
    {
      id: 'M7Tj0xV79D0',
      title: 'Moong Dal Chilla | Stuffed Paneer Chilla | Kunal Kapur',
      channel: 'Chef Kunal Kapur',
      duration: '11:15',
      thumbnail: 'https://img.youtube.com/vi/M7Tj0xV79D0/hqdefault.jpg'
    }
  ],
  '4': [
    {
      id: 'D3cR3xPqHk0',
      title: 'Egg Bhurji Recipe | मुंबई स्टाइल अंडा भुर्जी | Chef Ranveer Brar',
      channel: 'Ranveer Brar',
      duration: '10:48',
      thumbnail: 'https://img.youtube.com/vi/D3cR3xPqHk0/hqdefault.jpg'
    },
    {
      id: '1fT72N1v2W8',
      title: 'Egg Bhurji Recipe | Simple and Tasty Masala Egg Bhurji',
      channel: 'KabitasKitchen',
      duration: '6:55',
      thumbnail: 'https://img.youtube.com/vi/1fT72N1v2W8/hqdefault.jpg'
    },
    {
      id: '3bV7K0_O3y8',
      title: 'Masala Egg Bhurji | सादा और आसान अंडा भुर्जी | Sanjeev Kapoor',
      channel: 'Sanjeev Kapoor Khazana',
      duration: '8:40',
      thumbnail: 'https://img.youtube.com/vi/3bV7K0_O3y8/hqdefault.jpg'
    }
  ]
};

export class RecipeService {
  // Returns recipes that match available ingredients and preferences.
  async getSuggestions(
    available: string[],
    preferences: { allowEgg: boolean; allowChicken: boolean; vegetarian: boolean },
    searchQuery: string = '',
    page: number = 1,
    limit: number = 10
  ): Promise<Recipe[]> {
    let filtered = MOCK_RECIPES;

    // Filter by vegetarian preference
    if (preferences.vegetarian) {
      filtered = filtered.filter(recipe => recipe.tags.includes('veg'));
    } else {
      // If not strictly veg, filter based on specific meat/egg preferences
      filtered = filtered.filter(recipe => {
        if (recipe.tags.includes('chicken') && !preferences.allowChicken) return false;
        if (recipe.tags.includes('egg') && !preferences.allowEgg) return false;
        return true;
      });
    }

    // Search Query filter
    if (searchQuery && searchQuery.trim() !== '') {
      filtered = filtered.filter(recipe => recipe.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
    }

    // Ingredient sort
    if (available && available.length > 0) {
      const availableLower = available.map(i => i.toLowerCase());
      filtered = [...filtered].sort((a, b) => {
        const aMatches = a.ingredients.filter(i => availableLower.some(av => i.toLowerCase().includes(av))).length;
        const bMatches = b.ingredients.filter(i => availableLower.some(av => i.toLowerCase().includes(av))).length;
        return bMatches - aMatches;
      });
    }

    // Paginate
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    // 1. Check Cache for Nutrition
    const uncachedRecipes: any[] = [];
    for (const recipe of paginated) {
      try {
        const cached = await AsyncStorage.getItem(`@nutrition_v2_${recipe.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          recipe.exactGI = parsed.exactGI;
          recipe.glycemicLoad = parsed.glycemicLoad;
          recipe.healthTip = parsed.healthTip;
          recipe.giLevel = parsed.exactGI <= 45 ? 'low' : parsed.exactGI <= 65 ? 'medium' : 'high';
        } else {
          uncachedRecipes.push(recipe);
        }
      } catch (e) {
        uncachedRecipes.push(recipe);
      }
    }

    // 2. Batch Infer missing
    if (uncachedRecipes.length > 0) {
      const newNutrition = await this.batchInferNutrition(uncachedRecipes);
      for (const recipe of uncachedRecipes) {
        const aiData = newNutrition[recipe.id];
        if (aiData) {
          recipe.exactGI = aiData.exactGI;
          recipe.glycemicLoad = aiData.glycemicLoad;
          recipe.healthTip = aiData.healthTip;
          recipe.giLevel = aiData.exactGI <= 45 ? 'low' : aiData.exactGI <= 65 ? 'medium' : 'high';
          
          // Save to cache silently
          try {
            await AsyncStorage.setItem(`@nutrition_v2_${recipe.id}`, JSON.stringify(aiData));
          } catch (e) { }
        } else {
          recipe.exactGI = undefined;
          recipe.glycemicLoad = 0;
          recipe.healthTip = "Could not load nutritional profile. Please check your internet connection.";
          recipe.giLevel = 'unknown';
        }
      }
    }

    // 3. Apply Video Links
    return Promise.all(paginated.map(async recipe => {
      const videos = await this.getRecipeVideos(recipe.name);
      if (videos && videos.length > 0) {
         recipe.videoUrl = videos[0].id; 
      }
      return recipe;
    }));
  }

  // Batch infer exact nutrition
  async batchInferNutrition(recipes: {id: string, name: string, ingredients: string[]}[]): Promise<Record<string, {exactGI: number, glycemicLoad: number, healthTip: string}>> {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!apiKey || recipes.length === 0) return {};

    try {
      const prompt = `You are a clinical nutritionist. Analyze the following ${recipes.length} recipes.
1. Estimate the gram weight of the volumetric ingredients (spoons, cups) to calculate a scientifically accurate Glycemic Load (GL) for the overall recipe.
2. Determine the exact Glycemic Index (GI) of the recipe. VERY IMPORTANT: Differentiate between refined ingredients (like maida/white flour, cheese, white rice) and high-fiber ingredients (like whole wheat, vegetables, dal). Refined ingredients MUST result in a significantly higher GI and GL than vegetable-heavy or whole grain variants, even if they share similar names (e.g., "White Pasta" vs "Veg Pasta").
3. Provide a 1-sentence tip explaining which ingredients contribute most to the glucose response. Do NOT explicitly state if the GL is High, Medium, or Low.

Return ONLY a valid JSON object mapping the recipe ID string to a JSON object with exactGI, glycemicLoad, and healthTip.
Example: {"1": {"exactGI": 45, "glycemicLoad": 9.5, "healthTip": "The high fiber content of the vegetables minimizes the glucose spike."}, "2": {"exactGI": 75, "glycemicLoad": 25.0, "healthTip": "The rice contributes to a rapid increase in blood sugar."}}

Recipes:
${recipes.map(r => `ID: "${r.id}", Name: "${r.name}", Ingredients: ${r.ingredients.join(', ')}`).join('\n')}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) return {};
      const json = await response.json();
      const content = json.choices[0]?.message?.content?.trim();
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Batch AI Inference failed:', e);
      return {};
    }
  }

  // Returns a YouTube video URL for a recipe ID
  getHindiVideoUrl(recipeId: string): string {
    const recipe = MOCK_RECIPES.find(r => r.id === recipeId);
    return recipe ? recipe.videoUrl : 'https://www.youtube.com/embed/';
  }

  // Search YouTube Live videos for a recipe name (requires YouTube Data API v3 key)
  async searchLiveVideos(recipeName: string): Promise<YoutubeVideo[]> {
    const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
    if (!apiKey) {
      console.warn('YOUTUBE_API_KEY not set – returning empty live list');
      return [];
    }
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(
      recipeName
    )}&key=${apiKey}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (!data.items) return [];
      return data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        duration: 'live',
        thumbnail: item.snippet.thumbnails.high.url,
      }));
    } catch (e) {
      console.error('Failed to fetch live videos', e);
      return [];
    }
  }

  // Get curated YouTube videos for a recipe dynamically using Spoonacular Video API
  async getRecipeVideos(recipeName: string): Promise<YoutubeVideo[]> {
    const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';
    if (!apiKey) {
      console.warn('SPOONACULAR_API_KEY not set');
      return [];
    }

    try {
      const url = `https://api.spoonacular.com/food/videos/search?query=${encodeURIComponent(recipeName)}&apiKey=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (!data.videos || data.videos.length === 0) return [];
      
      return data.videos.map((v: any) => ({
        id: v.youTubeId,
        title: v.title,
        channel: 'Spoonacular Partner', // Channel isn't returned directly in this endpoint
        duration: Math.floor(v.length / 60) + ':' + (v.length % 60).toString().padStart(2, '0'),
        thumbnail: v.thumbnail,
      }));
    } catch (e) {
      console.error('Failed to fetch recipe videos', e);
      return [];
    }
  }

  // Fetch exact GI from OpenRouter AI
  async inferNutritionWithAI(dishName: string): Promise<{ ingredients: string[], exactGI: number, giLevel: 'low' | 'medium' | 'high' | 'unknown', carbohydratesGrams: number, glycemicLoad: number, healthTip?: string } | null> {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!apiKey) return null;

    try {
      const prompt = `You are a clinical nutritionist. Analyze the dish "${dishName}".
Return ONLY a valid JSON object (no markdown formatting, no code blocks) with:
{
  "ingredients": ["list", "of", "ingredients"],
  "exactGI": <number between 0 and 100>,
  "giLevel": "<low|medium|high>",
  "carbohydratesGrams": <number estimating the total carbs in grams for a typical serving>,
  "glycemicLoad": <number calculated exactly as (exactGI * carbohydratesGrams) / 100>,
  "healthTip": "<1 sentence explaining why it has a high/low GI and suggesting a low-GI ingredient substitute if applicable>"
}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500
        })
      });

      if (!response.ok) return null;
      
      const json = await response.json();
      const content = json.choices[0]?.message?.content?.trim();
      
      // Parse JSON safely (removing potential markdown blocks)
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      
      if (result && result.ingredients && typeof result.exactGI === 'number') {
        return {
          ingredients: result.ingredients,
          exactGI: result.exactGI,
          giLevel: result.giLevel.toLowerCase() as 'low'|'medium'|'high',
          carbohydratesGrams: result.carbohydratesGrams || 0,
          glycemicLoad: result.glycemicLoad || 0,
          healthTip: result.healthTip
        };
      }
    } catch (e) {
      console.error('AI Inference failed:', e);
    }
    return null;
  }

  // Fetch true carbohydrates from Spoonacular
  async fetchSpoonacularNutrition(dishName: string, exactGI: number): Promise<{ carbsGrams: number, glycemicLoad: number } | null> {
    const apiKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || '';
    if (!apiKey) return null;

    try {
      const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(dishName)}&number=1&apiKey=${apiKey}`;
      const searchResp = await fetch(searchUrl);
      const searchData = await searchResp.json();

      if (searchData.results && searchData.results.length > 0) {
        const recipeId = searchData.results[0].id;
        const nutritionUrl = `https://api.spoonacular.com/recipes/${recipeId}/nutritionWidget.json?apiKey=${apiKey}`;
        const nutritionResp = await fetch(nutritionUrl);
        const nutritionData = await nutritionResp.json();

        const carbsStr = nutritionData.carbs;
        const carbsGrams = parseInt(carbsStr.replace(/[^0-9]/g, ''), 10);
        
        if (!isNaN(carbsGrams)) {
          const glycemicLoad = (exactGI * carbsGrams) / 100;
          return { carbsGrams, glycemicLoad };
        }
      }
    } catch (e) {
      console.error('Spoonacular API failed:', e);
    }
    return null;
  }

  // Search YouTube for recipe videos (mock results if no API key)
  async searchYouTubeRecipes(query: string): Promise<YouTubeRecipeResult[]> {
    let ingredients: string[] = [];
    let giLevel: 'low' | 'medium' | 'high' | 'unknown' = 'unknown';
    let exactGI = -1;
    let aiCarbsGrams = 0;
    let aiGlycemicLoad = 0;

    // 1. Try AI Inference (OpenRouter)
    const aiResult = await this.inferNutritionWithAI(query);
    if (aiResult) {
      ingredients = aiResult.ingredients;
      giLevel = aiResult.giLevel;
      exactGI = aiResult.exactGI;
      aiCarbsGrams = aiResult.carbohydratesGrams || 0;
      aiGlycemicLoad = aiResult.glycemicLoad || 0;
    }
    
    // Fetch Spoonacular Nutrition if we have a valid GI
    let spoonacularData = null;
    if (giLevel !== 'unknown' && exactGI > 0) {
      spoonacularData = await this.fetchSpoonacularNutrition(query, exactGI);
    }

    const finalCarbsGrams = spoonacularData?.carbsGrams || aiCarbsGrams;
    const finalGlycemicLoad = spoonacularData?.glycemicLoad || aiGlycemicLoad;

    // Try real YouTube API first
    const apiKey = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY || '';
    if (apiKey) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
          query + ' recipe Hindi'
        )}&key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
          return data.items.map((item: any) => ({
            video: {
              id: item.id.videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              duration: '',
              thumbnail: item.snippet.thumbnails.high.url,
            },
            inferredIngredients: ingredients,
            giLevel,
            exactGI,
            carbsGrams: finalCarbsGrams > 0 ? finalCarbsGrams : undefined,
            glycemicLoad: finalGlycemicLoad > 0 ? finalGlycemicLoad : undefined,
            healthTip: aiResult?.healthTip,
            dishName: query,
          }));
        }
      } catch (e) {
        console.error('YouTube API search failed, using mock results', e);
      }
    }

    // Mock results — simulate YouTube search results with real food video IDs
    const safeName = query.trim();
    return [
      {
        video: {
          id: 'M7lc1UVf-VE', // Google's official iframe API test video (guaranteed embeddable)
          title: `${safeName} Recipe | ${safeName} बनाने की विधि | Easy Home Recipe`,
          channel: 'Indian Kitchen',
          duration: '10:30',
          thumbnail: `https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg`,
        },
        inferredIngredients: ingredients,
        giLevel,
        exactGI,
        carbsGrams: finalCarbsGrams > 0 ? finalCarbsGrams : undefined,
        glycemicLoad: finalGlycemicLoad > 0 ? finalGlycemicLoad : undefined,
        healthTip: aiResult?.healthTip,
        dishName: safeName,
      },
      {
        video: {
          id: 'M7lc1UVf-VE', 
          title: `Healthy ${safeName} | Indian Recipe for Diabetes`,
          channel: 'Healthy Indian Cooking',
          duration: '8:20',
          thumbnail: `https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg`,
        },
        inferredIngredients: ingredients,
        giLevel,
        carbsGrams: finalCarbsGrams > 0 ? finalCarbsGrams : undefined,
        glycemicLoad: finalGlycemicLoad > 0 ? finalGlycemicLoad : undefined,
        dishName: safeName,
      },
      {
        video: {
          id: 'M7lc1UVf-VE', 
          title: `Restaurant Style ${safeName} at Home | Chef's Special`,
          channel: 'Chef Special Recipes',
          duration: '12:45',
          thumbnail: `https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg`,
        },
        inferredIngredients: ingredients,
        giLevel,
        carbsGrams: finalCarbsGrams > 0 ? finalCarbsGrams : undefined,
        glycemicLoad: finalGlycemicLoad > 0 ? finalGlycemicLoad : undefined,
        dishName: safeName,
      },
    ];
  }
  // Translate Recipe using OpenRouter
  async translateRecipe(recipe: Recipe, targetLang: string = 'Hindi'): Promise<Recipe> {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!apiKey) return recipe; // fallback

    try {
      const prompt = `Translate this recipe to ${targetLang}. Only return a valid JSON object matching the input structure exactly, with the translated text. Do not add markdown blocks.
Input:
{
  "name": "${recipe.name}",
  "ingredients": ${JSON.stringify(recipe.ingredients)},
  "steps": ${JSON.stringify(recipe.steps)}
}`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 4000
        })
      });

      const json = await response.json();
      if (json.choices && json.choices.length > 0) {
        let content = json.choices[0].message.content.trim();
        if (content.startsWith('\`\`\`json')) content = content.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        const translatedData = JSON.parse(content);
        
        return {
          ...recipe,
          name: translatedData.name || recipe.name,
          ingredients: translatedData.ingredients || recipe.ingredients,
          steps: translatedData.steps || recipe.steps,
        };
      }
    } catch (e) {
      console.error('Translation failed:', e);
    }
    return recipe;
  }

  // Get Video Transcript
  async getVideoTranscript(videoId: string): Promise<string | null> {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcript || transcript.length === 0) return null;
      return transcript.map(t => t.text).join(' ');
    } catch (e) {
      console.error('Failed to fetch transcript:', e);
      return null;
    }
  }

  // Extract Ingredients and calculate full nutrition from a YouTube video transcript using OpenRouter AI
  async extractIngredientsFromTranscript(transcript: string): Promise<{ingredients: string[], exactGI: number, glycemicLoad: number, healthTip: string} | null> {
    const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';
    if (!apiKey) return null;

    try {
      const prompt = `You are a clinical nutritionist and culinary expert. Read the following YouTube cooking video transcript.
1. Extract the distinct ingredients mentioned (e.g. "2 cups rice", "1 tbsp oil").
2. Estimate the gram weight of these volumetric measurements to calculate a scientifically accurate Glycemic Load (GL) for the overall recipe.
3. Determine the exact Glycemic Index (GI) of the recipe.
4. Provide a 1-sentence health tip explaining the GL.

Return a valid JSON object matching this structure EXACTLY:
{
  "ingredients": ["1 cup rice", "1 tbsp oil"],
  "exactGI": 65,
  "glycemicLoad": 22.5,
  "healthTip": "The GL is high due to the rice..."
}

Transcript:
"${transcript.substring(0, 3000)}"`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 500
        })
      });
      const json = await response.json();
      if (json.choices && json.choices.length > 0) {
        let content = json.choices[0].message.content.trim();
        if (content.startsWith('\`\`\`json')) content = content.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Extraction failed:', e);
    }
    return null;
  }
}

// --- YouTube Recipe Result type ---
export interface YouTubeRecipeResult {
  video: YoutubeVideo;
  inferredIngredients: string[];
  giLevel: 'low' | 'medium' | 'high' | 'unknown';
  exactGI?: number;
  carbsGrams?: number;
  glycemicLoad?: number;
  healthTip?: string;
  dishName: string;
}

// --- GI Index Database for Common Indian Cooking Ingredients ---
// Values are approximate Glycemic Index (0–100 scale)
const GI_INGREDIENT_MAP: { [key: string]: number } = {
  // Grains & Flour (typically high GI)
  'white rice': 73, 'basmati rice': 58, 'brown rice': 50, 'rice': 65,
  'wheat flour': 70, 'atta': 70, 'maida': 85, 'refined flour': 85,
  'besan': 35, 'gram flour': 35, 'ragi': 45, 'bajra': 55, 'jowar': 62,
  'oats': 55, 'semolina': 66, 'sooji': 66, 'rava': 66, 'poha': 64,
  'bread': 75, 'naan': 70, 'roti': 62, 'paratha': 65, 'puri': 75,
  'pasta': 50, 'noodles': 47, 'vermicelli': 58, 'sevai': 58,
  'cornflour': 70, 'corn': 52, 'makka': 52, 'sago': 85, 'sabudana': 85,
  
  // Junk Foods & Sweets (High GI)
  'samosa': 75, 'jalebi': 80, 'gulab jamun': 75, 'fries': 75,
  'bhature': 80, 'vada pav': 75, 'pizza': 80, 'burger': 75,
  'cake': 75, 'cookie': 70, 'biscuit': 70, 'pav': 75,

  // Lentils & Legumes (typically low GI)
  'moong dal': 31, 'toor dal': 29, 'chana dal': 28, 'masoor dal': 27,
  'urad dal': 30, 'rajma': 29, 'chole': 33, 'chickpea': 33,
  'lobia': 33, 'soybean': 16, 'peanut': 14, 'dal': 30,
  'sprouts': 25, 'moth beans': 32, 'kidney beans': 29,

  // Vegetables (typically low GI)
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

  // Dairy & Protein (low/no GI)
  'paneer': 0, 'milk': 31, 'curd': 28, 'yogurt': 28, 'dahi': 28,
  'ghee': 0, 'butter': 0, 'cream': 0, 'cheese': 0, 'khoya': 30,
  'egg': 0, 'anda': 0, 'chicken': 0, 'murgh': 0, 'fish': 0,
  'mutton': 0, 'lamb': 0, 'prawn': 0, 'shrimp': 0,

  // Oils & Fats (no GI)
  'oil': 0, 'mustard oil': 0, 'coconut oil': 0, 'sesame oil': 0,

  // Spices (negligible GI, very low)
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

  // Sweeteners (high GI)
  'sugar': 65, 'jaggery': 55, 'gur': 55, 'honey': 58, 'mishri': 60,

  // Nuts & Seeds (low GI)
  'almond': 15, 'badam': 15, 'cashew': 22, 'kaju': 22,
  'walnut': 15, 'akhrot': 15, 'pistachio': 15, 'pista': 15,
  'coconut': 45, 'nariyal': 45, 'sesame': 35, 'til': 35,
  'poppy seed': 15, 'khus khus': 15, 'flax seed': 15, 'alsi': 15,

  // Fruits
  'mango': 56, 'aam': 56, 'banana': 62, 'kela': 62,
  'apple': 36, 'seb': 36, 'guava': 12, 'amrud': 12,
  'papaya': 60, 'orange': 43, 'lemon': 20, 'nimbu': 20,
  'pomegranate': 35, 'anar': 35, 'grapes': 46, 'angoor': 46,
  'watermelon': 72, 'tarbooz': 72, 'pineapple': 59, 'dates': 42,
  'tamarind': 23, 'imli': 23, 'kokum': 15, 'amla': 15,
};

// --- Dish-to-Ingredients Inference Map ---
// Maps common Indian dish names to their typical ingredients
const DISH_INGREDIENTS: { [key: string]: string[] } = {
  'sev bhaji': ['sev', 'onion', 'tomato', 'oil', 'turmeric', 'chili powder', 'cumin', 'garlic', 'coriander'],
  'sev tamatar': ['sev', 'tomato', 'onion', 'oil', 'turmeric', 'green chili', 'cumin', 'mustard seeds'],
  'palak paneer': ['spinach', 'paneer', 'onion', 'tomato', 'cream', 'garlic', 'ginger', 'garam masala', 'cumin'],
  'dal tadka': ['toor dal', 'onion', 'tomato', 'ghee', 'cumin', 'turmeric', 'red chili', 'garlic', 'coriander'],
  'dal makhani': ['urad dal', 'rajma', 'butter', 'cream', 'tomato', 'ginger', 'garlic', 'garam masala'],
  'chole': ['chickpea', 'onion', 'tomato', 'ginger', 'garlic', 'coriander', 'garam masala', 'amchur', 'oil'],
  'chana masala': ['chickpea', 'onion', 'tomato', 'ginger', 'garlic', 'coriander', 'garam masala', 'amchur'],
  'rajma': ['kidney beans', 'onion', 'tomato', 'ginger', 'garlic', 'garam masala', 'cumin', 'oil'],
  'aloo gobi': ['potato', 'cauliflower', 'onion', 'tomato', 'turmeric', 'cumin', 'coriander', 'green chili', 'oil'],
  'aloo matar': ['potato', 'peas', 'onion', 'tomato', 'turmeric', 'cumin', 'garam masala', 'oil'],
  'aloo paratha': ['potato', 'wheat flour', 'ghee', 'cumin', 'green chili', 'coriander', 'salt'],
  'paneer tikka': ['paneer', 'capsicum', 'onion', 'yogurt', 'ginger', 'garlic', 'garam masala', 'oil'],
  'paneer butter masala': ['paneer', 'butter', 'cream', 'tomato', 'cashew', 'ginger', 'garlic', 'garam masala'],
  'butter chicken': ['chicken', 'butter', 'cream', 'tomato', 'cashew', 'ginger', 'garlic', 'garam masala'],
  'chicken biryani': ['basmati rice', 'chicken', 'onion', 'yogurt', 'ginger', 'garlic', 'garam masala', 'ghee', 'saffron'],
  'veg biryani': ['basmati rice', 'carrot', 'peas', 'potato', 'onion', 'yogurt', 'garam masala', 'ghee', 'saffron'],
  'egg curry': ['egg', 'onion', 'tomato', 'ginger', 'garlic', 'turmeric', 'chili powder', 'garam masala', 'oil'],
  'egg bhurji': ['egg', 'onion', 'tomato', 'green chili', 'turmeric', 'cumin', 'coriander', 'oil'],
  'samosa': ['potato', 'peas', 'maida', 'cumin', 'coriander', 'green chili', 'oil', 'amchur'],
  'pav bhaji': ['potato', 'cauliflower', 'peas', 'capsicum', 'tomato', 'onion', 'butter', 'bread', 'pav bhaji masala'],
  'dosa': ['rice', 'urad dal', 'methi', 'oil', 'salt'],
  'idli': ['rice', 'urad dal', 'methi', 'salt'],
  'upma': ['semolina', 'onion', 'green chili', 'mustard seeds', 'curry leaves', 'peanut', 'oil'],
  'poha': ['poha', 'onion', 'potato', 'peanut', 'mustard seeds', 'curry leaves', 'turmeric', 'green chili', 'lemon'],
  'khichdi': ['rice', 'moong dal', 'ghee', 'cumin', 'turmeric', 'salt'],
  'methi thepla': ['wheat flour', 'methi', 'yogurt', 'turmeric', 'chili powder', 'oil', 'cumin'],
  'bhindi masala': ['okra', 'onion', 'tomato', 'turmeric', 'coriander', 'cumin', 'chili powder', 'oil'],
  'baingan bharta': ['brinjal', 'onion', 'tomato', 'garlic', 'green chili', 'mustard oil', 'coriander'],
  'kadhi pakora': ['besan', 'yogurt', 'onion', 'turmeric', 'cumin', 'mustard seeds', 'oil', 'curry leaves'],
  'rasam': ['toor dal', 'tomato', 'tamarind', 'pepper', 'cumin', 'mustard seeds', 'curry leaves', 'garlic'],
  'sambar': ['toor dal', 'drumstick', 'onion', 'tomato', 'tamarind', 'sambar powder', 'mustard seeds', 'oil'],
  'gulab jamun': ['khoya', 'maida', 'sugar', 'cardamom', 'ghee'],
  'jalebi': ['maida', 'sugar', 'saffron', 'oil', 'yogurt'],
  'halwa': ['semolina', 'sugar', 'ghee', 'almond', 'cardamom'],
  'kheer': ['rice', 'milk', 'sugar', 'cardamom', 'almond', 'cashew'],
  'gajar halwa': ['carrot', 'milk', 'sugar', 'ghee', 'cardamom', 'almond', 'cashew'],
  'raita': ['yogurt', 'cucumber', 'cumin', 'salt', 'coriander'],
  'tandoori chicken': ['chicken', 'yogurt', 'ginger', 'garlic', 'chili powder', 'garam masala', 'lemon', 'oil'],
  'fish curry': ['fish', 'onion', 'tomato', 'coconut', 'turmeric', 'chili powder', 'mustard seeds', 'curry leaves'],
  'chicken tikka masala': ['chicken', 'yogurt', 'cream', 'tomato', 'ginger', 'garlic', 'garam masala', 'butter'],
  'korma': ['chicken', 'yogurt', 'cashew', 'onion', 'cream', 'cardamom', 'garam masala', 'ghee'],
  'pulao': ['basmati rice', 'peas', 'carrot', 'onion', 'ghee', 'garam masala', 'cumin', 'bay leaf'],
  'moong dal chilla': ['moong dal', 'onion', 'green chili', 'ginger', 'coriander', 'turmeric', 'oil'],
  'sabudana khichdi': ['sago', 'peanut', 'potato', 'cumin', 'green chili', 'curry leaves', 'ghee'],
  'dal fry': ['toor dal', 'onion', 'tomato', 'garlic', 'cumin', 'turmeric', 'ghee', 'coriander'],
  'matar paneer': ['paneer', 'peas', 'onion', 'tomato', 'ginger', 'garlic', 'garam masala', 'cream'],
  'malai kofta': ['paneer', 'potato', 'cashew', 'cream', 'tomato', 'ginger', 'garlic', 'garam masala'],
  'undhiyu': ['potato', 'sweet potato', 'brinjal', 'banana', 'peas', 'coconut', 'peanut', 'sesame', 'sugar', 'oil'],
};

