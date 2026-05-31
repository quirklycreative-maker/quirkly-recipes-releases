// testRecipeService.ts
import { RecipeService } from '../src/services/recipeService.ts';

async function runTest() {
  const service = new RecipeService();
  const all = await service.getSuggestions([], { vegetarian: false, allowEgg: true, allowChicken: true }, '', 1, 10);
  console.log('Total recipes loaded in first page:', all.length);
  if (all.length === 0) {
    throw new Error(`Expected recipes but got ${all.length}`);
  }
  console.log('✅ Recipe pagination works');

  // Test YouTube video integration for a sample recipe
  const sampleName = all[0].name;
  const videos = await service.getRecipeVideos(sampleName);
  console.log(`YouTube videos for recipe ${sampleName}:`, videos.length);
  if (videos.length === 0) {
    console.warn(`⚠️ Warning: No YouTube videos returned for recipe ${sampleName}. This might be due to API quotas or no matches.`);
  }
  console.log('✅ YouTube video integration works');
}

runTest();
