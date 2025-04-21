# Tendrils Project Status Dashboard

_Last updated: 2025-04-21 15:36 EDT_

## Git Status
- **Branch:** master
- **Up to date with remote:** Yes
- **Uncommitted changes:**
  - `app/(tabs)/home.tsx`

## Key Features
- [x] Multi-step onboarding (Welcome, Register, Join/Create Vine, Profile, Get Started)
- [x] Singles and Doubles ladder system
- [x] Team creation and management
- [x] Coordinator dashboard
- [x] Profile management (bio, rating, phone, profile picture)
- [x] Auth with Supabase
- [x] Demo mode & real mode toggle
- [x] Persistent onboarding state (AsyncStorage)
- [x] Custom theming, icons, and fonts
- [x] Error boundary and loading screens

## Features/Flows In Progress or Planned
- [ ] Replace hardcoded user ID with auth context (`home.tsx`)
- [ ] Coordinator/Team flows polish
- [ ] More robust match/challenge logic
- [ ] Improved onboarding polish
- [ ] Real-vs-demo data handling

## Refactor / Tech Debt
- [ ] Align Supabase tables with TypeScript interfaces and app flows
- [ ] Move Supabase credentials to environment variables
- [ ] Centralize and type-check theme/icons
- [ ] Improve error handling and loading feedback
- [ ] Ensure demo data and real data are clearly separated

## Supabase Schema Alignment
- **Current:** Tables may not fully match app data flows and interfaces.
- **Next Steps:**
  1. Export current schema from Supabase.
  2. Compare with TypeScript interfaces (profiles, vines, teams, matches, challenges, etc).
  3. Update tables as needed (backup first!).

## Next Suggested Actions
1. Commit or stash your changes in `home.tsx`.
2. Export your Supabase schema (I can guide you step-by-step).
3. Review and update your Supabase tables to match your app’s needs.
4. Replace hardcoded user IDs with actual auth context throughout the app.
5. Continue feature work or refactor as prioritized above.

---

**Tip:** Update this file as you make progress or switch machines to keep track of your work!
