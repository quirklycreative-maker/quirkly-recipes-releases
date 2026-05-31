// src/models/User.ts
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'owner' | 'helper';
}
