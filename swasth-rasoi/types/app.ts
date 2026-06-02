export type UserRole = 'owner' | 'helper';

export type LanguageCode = 'hi-IN' | 'ne-NP' | 'en-IN';

export type GroceryRequest = {
  id: string;
  createdAt: string;
  language: LanguageCode;
  items: string[];
  note: string;
  status: 'pending' | 'done';
};

export type DietaryProfile = {
  weightKg: number;
  hba1c: number;
  preference: 'mostly-veg' | 'veg-egg' | 'veg-chicken-egg';
  fastingGlucose?: string;
  bloodPressure?: string;
  restingHeartRate?: string;
  steps?: string;
  sleepHours?: string;
  huaweiLinked?: boolean;
};

export type Recipe = {
  id: string;
  titleHi: string;
  titleEn: string;
  tags: string[];
  ingredients: string[];
  coreIngredients: string[];
  stepsHi: string[];
  why: string;
  giNote: string;
  giScore: number;
  youtubeQuery: string;
  dietType: 'veg' | 'egg' | 'chicken';
};

export type RecipeMatch = Recipe & {
  matched: string[];
  missing: string[];
  score: number;
};

export type ChatAttachmentType = 'text' | 'image' | 'video' | 'camera' | 'youtube' | 'voice';

export type ChatMessage = {
  id: string;
  createdAt: string;
  sender: UserRole | 'ai';
  text: string;
  attachmentType: ChatAttachmentType;
  mediaLabel?: string;
  youtubeUrl?: string;
  youtubeGist?: string;
  giScore?: number;
  giLabel?: 'Low' | 'Medium' | 'High';
};
