// src/models/FridgeItem.ts
export interface FridgeItem {
  id: string;
  name: string; // ingredient name, e.g., "dahi"
  quantity?: number; // optional amount
  unit?: string; // e.g., "grams", "pieces"
  expiryDate?: string; // ISO date string, optional
}
