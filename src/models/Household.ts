// src/models/Household.ts
export interface Household {
  id: string;
  ownerId: string; // UID of the owner user
  name: string; // e.g., "Family" or "Roommates"
}
