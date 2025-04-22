# Tendrils Pickleball Ladder App

## Overview
Tendrils is a React Native/Expo app for managing pickleball ladders, teams, and matches. It uses Supabase for backend/auth, TypeScript for type safety, Expo Router for navigation, and features a multi-step onboarding flow, custom theming, and robust error handling.

## User Roles

Tendrils supports two primary user roles:

- **Player**: Can create teams, select teammates, join ladders, and participate in matches.
- **Coordinator**: Manages ladders, approves teams, sets schedules, and oversees the competition, but cannot create teams or assign teammates.

### TypeScript Role Definitions

User roles and their properties are defined in [`app/types/user.ts`](./app/types/user.ts):

```typescript
export type UserRole = 'player' | 'coordinator';

export interface BaseUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
}

export interface Player extends BaseUser {
  role: 'player';
  teamId?: string;
}

export interface Coordinator extends BaseUser {
  role: 'coordinator';
  managedLadders: string[];
}

export type AppUser = Player | Coordinator;
```

- Use `user.role` throughout the app to conditionally render UI and enforce permissions.
- See the [Coordinator/Team Flows Polish Checklist](./PROJECT_STATUS.md) for more on role-based flows.

## Key Features
- Multi-step onboarding
- Singles and doubles ladder system
- Team creation and management (by players)
- Coordinator dashboard (management only)
- Profile management
- Auth with Supabase
- Demo/real mode toggle
- Persistent onboarding state
- Custom theming, icons, and fonts
- Error boundary and loading screens

---

For more details, see the codebase and the [PROJECT_STATUS.md](./PROJECT_STATUS.md) for planned improvements.
