// src/services/preferenceService.ts
// Handles reading/writing the user's dietary preferences to Firestore.

export interface PreferenceProfile {
  vegetarian: boolean;
  allowEgg: boolean;
  allowChicken: boolean;
  preferredCuisine: 'Indian' | 'Other';
  giPriority: 'low' | 'medium' | 'any';
}

export class PreferenceService {
  async getProfile(userId: string): Promise<PreferenceProfile> {
    // TODO: fetch from Firestore
    return {
      vegetarian: true,
      allowEgg: true,
      allowChicken: false,
      preferredCuisine: 'Indian',
      giPriority: 'low',
    };
  }

  async saveProfile(userId: string, profile: PreferenceProfile): Promise<void> {
    // TODO: write to Firestore
  }
}
