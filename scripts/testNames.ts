import rawRecipes from '../src/data/recipes.json' with { type: 'json' };

const run = async () => {
  console.log(rawRecipes.map(r => r.name));
}
run();
