import { RecipeService } from '../src/services/recipeService.ts';
import rawRecipes from '../src/data/recipes.json' assert { type: 'json' };

const run = async () => {
  let count = 0;
  for (let r of rawRecipes) {
    if (!r.name) {
       console.log("Found recipe without name:", r);
       count++;
    }
  }
  console.log("Recipes without name:", count);
}
run();
