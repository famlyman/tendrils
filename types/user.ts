// app/types/user.ts

export type UserRole = 'player' | 'coordinator';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  // Add other shared fields as needed
}

export interface Player extends BaseUser {
  role: 'player';
  teamId?: string;
  // Add player-specific fields here
}

export interface Coordinator extends BaseUser {
  role: 'coordinator';
  managedLadders: string[];
  // Add coordinator-specific fields here
}

export type AppUser = Player | Coordinator;
