import type { ChatMessage, DietaryProfile, UserRole } from '@/types/app';

const privateHealthPattern = /(hba1c|hb a1c|weight|वजन|sugar|glucose|blood pressure|bp|resting hr|heart rate|steps|sleep|huawei)/i;

export function visibleProfileForRole(role: UserRole, profile: DietaryProfile): DietaryProfile {
  if (role === 'owner') {
    return profile;
  }

  return {
    weightKg: profile.weightKg,
    hba1c: profile.hba1c,
    preference: profile.preference,
    fastingGlucose: '',
    bloodPressure: '',
    restingHeartRate: '',
    steps: '',
    sleepHours: '',
    huaweiLinked: false,
  };
}

export function safeMessagesForRole(role: UserRole, messages: ChatMessage[]) {
  if (role === 'owner') {
    return messages;
  }

  return messages.filter((message) => message.sender !== 'owner' && !privateHealthPattern.test(message.text));
}
