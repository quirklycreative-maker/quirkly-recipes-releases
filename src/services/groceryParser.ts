// src/services/groceryParser.ts
// Parses spoken Hindi/Nepali text to extract ingredient names and grocery‑request intents.

export interface ParsedResult {
  ingredients: string[]; // e.g., ["dahi", "tamatar"]
  requestGrocery: boolean; // true if user said something like "yeh order karna hai"
}

export class GroceryParser {
  parse(text: string): ParsedResult {
    // Very naive implementation – real version would use NLP/regex.
    const lower = text.toLowerCase();
    const request = lower.includes('order') || lower.includes('order karna') || lower.includes('order karna hai');
    const words = lower.split(/\s+/);
    const ingredients = words.filter(w => w.length > 2 && !request); // placeholder filter
    return { ingredients, requestGrocery: request };
  }
}
