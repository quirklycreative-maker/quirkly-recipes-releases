// src/models/GroceryRequest.ts
export interface GroceryRequest {
  id: string;
  householdId: string;
  items: string[]; // list of ingredient names to order
  createdAt: string; // ISO timestamp
  status: 'pending' | 'ordered' | 'completed';
  requestedBy: string; // user UID who made the request
}
