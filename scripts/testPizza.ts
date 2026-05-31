import { RecipeService } from '../src/services/recipeService.ts';

const run = async () => {
  const service = new RecipeService();
  const res = await service.getSuggestions([], {vegetarian: false, allowEgg: true, allowChicken: true}, "Pizza", 1, 10);
  console.log("Results for Pizza:", res.map(r => r.name));
}
run();
