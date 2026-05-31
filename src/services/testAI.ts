import { RecipeService } from './recipeService.ts';
import * as dotenv from 'dotenv';
dotenv.config();

const test = async () => {
  const service = new RecipeService();
  console.log('KEY:', process.env.EXPO_PUBLIC_OPENROUTER_API_KEY);
  const result = await service.inferNutritionWithAI("Pizza");
  console.log("AI Result:", result);
};
test();
