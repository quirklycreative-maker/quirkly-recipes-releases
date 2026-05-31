const https = require('https');

async function testComplex(query) {
  return new Promise((resolve) => {
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&fillIngredients=true&addRecipeNutrition=true&number=1&apiKey=b75518fc32434ad3a62f076876be2a05`;
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            const recipe = json.results[0];
            const ingredients = recipe.missedIngredients.map(i => i.name).concat(recipe.usedIngredients.map(i => i.name));
            const carbs = recipe.nutrition.nutrients.find(n => n.name === 'Carbohydrates').amount;
            console.log(`Query: ${query}`);
            console.log(`Ingredients:`, ingredients);
            console.log(`Carbs:`, carbs);
          } else {
            console.log(`No results for ${query}`);
          }
          resolve();
        } catch (e) {
          console.error(e);
          resolve();
        }
      });
    }).on("error", (err) => resolve());
  });
}

async function run() {
  await testComplex('Vada Pav');
  await testComplex('Crispy Corn');
}
run();
