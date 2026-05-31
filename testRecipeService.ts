import * as dotenv from 'dotenv';
dotenv.config();
import { RecipeService } from './src/services/recipeService.ts';

async function runTests() {
  const service = new RecipeService();
  console.log("=== Testing AI Inference Directly ===");
  const testDishes = ["Cheesy Mayo Fries", "Vada Pav", "Oreo Shake"];
  
  for (const dish of testDishes) {
    console.log(`\nTesting: ${dish}`);
    const result = await service.inferNutritionWithAI(dish);
    if (result) {
      console.log(`  AI Result -> Ingredients: ${result.ingredients.join(', ')}`);
      console.log(`  AI Result -> Exact GI: ${result.exactGI}`);
      console.log(`  AI Result -> GI Level: ${result.giLevel.toUpperCase()}`);
    } else {
      console.log(`  AI Inference FAILED for ${dish}`);
    }
  }

  console.log("\n=== Testing Full YouTube Search Integration ===");
  console.log(`Searching for "Crispy Corn"...`);
  const ytResults = await service.searchYouTubeRecipes("Crispy Corn");
  
  if (ytResults && ytResults.length > 0) {
    const first = ytResults[0];
    console.log(`  Dish: ${first.dishName}`);
    console.log(`  Ingredients: ${first.inferredIngredients.join(', ')}`);
    console.log(`  GI Level: ${first.giLevel.toUpperCase()}`);
    console.log(`  Carbs (g): ${first.carbsGrams}`);
    console.log(`  Glycemic Load: ${first.glycemicLoad}`);
    console.log(`  Video Title: ${first.video.title}`);
  } else {
    console.log("  No YouTube results found.");
  }
}

runTests();
