const rawRecipes = require('./src/data/recipes.json');
const searchQuery = 'p';
const filtered = rawRecipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()));
console.log(filtered.map(r => r.name));
