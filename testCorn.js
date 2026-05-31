const fetch = require('node-fetch'); // wait node-fetch might not be installed globally, but we can use native fetch if node > 18
async function test() {
  const url = `https://api.spoonacular.com/recipes/guessNutrition?title=crispy%20corn&apiKey=b75518fc32434ad3a62f076876be2a05`;
  const response = await fetch(url);
  const data = await response.json();
  console.log('Spoonacular Data:', data);
}
test();
