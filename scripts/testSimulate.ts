import { RecipeService } from '../src/services/recipeService.ts';

const run = async () => {
  const recipeService = new RecipeService();
  const searchQuery = "Pizza";
  let loadingMore = false;
  
  const fetchRecipes = async () => {
    if (loadingMore) return;
    loadingMore = true;
    const suggestions = await recipeService.getSuggestions([], {vegetarian: false, allowEgg: true, allowChicken: true}, searchQuery, 1, 10);
    console.log("Suggestions length:", suggestions.length);
    loadingMore = false;
  };
  
  await fetchRecipes();
}
run();
