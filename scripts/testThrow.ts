import { RecipeService } from '../src/services/recipeService.ts';

const run = async () => {
  try {
    const service = new RecipeService();
    const res = await service.getSuggestions([], {vegetarian: false, allowEgg: true, allowChicken: true}, "Pizza", 1, 10);
    console.log("Success:", res.length);
  } catch(e) {
    console.log("Error:", e);
  }
}
run();
