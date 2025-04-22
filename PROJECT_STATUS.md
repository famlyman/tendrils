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
- [x] Replace hardcoded user ID with auth context (`home.tsx`)
- [ ] Coordinator/Team flows polish

    **Coordinator/Team Flows Polish Checklist**

    1. **User Roles & Permissions**
        - [x] Clearly define/document difference between coordinators and players (TypeScript interfaces & UI)
        - [x] Ensure only players can create teams and select teammates
        - [x] Coordinators only manage/approve teams, set schedules, etc.—not create teams

    2. **Team Creation & Invitation Flow (Player)**
        - [ ] Streamlined "Create Team" flow for players (clear CTA)
        - [ ] Simple teammate selection (search/invite/pick)
        - [ ] Confirmation and feedback after creation/invite
        - [ ] Handle edge cases (e.g., teammate already on another team)
        - [ ] Use animations/custom fonts for onboarding/team creation

    3. **Coordinator Tools**
        - [ ] Coordinator dashboard is visually distinct, only shows management actions
        - [ ] Easy access to approve teams, manage schedules, view stats
        - [ ] No ability for coordinators to create/edit teams directly

    4. **Navigation & State**
        - [ ] Use Expo Router for clear separation of player/coordinator flows
        - [ ] Persist relevant state (e.g., team creation progress) with AsyncStorage
        - [ ] Ensure back navigation and deep linking work as expected

    5. **Error Handling & Feedback**
        - [ ] Use ErrorBoundary and LoadingScreen for all async/team actions
        - [ ] Clear error messages for permission issues
        - [ ] Show loading indicators during network calls

    6. **UI/UX Consistency**
        - [ ] Apply centralized theme/typography to all Coordinator/Team screens
        - [ ] Consistent button placement, spacing, and feedback

    7. **Future Features**
        - [ ] In-app chat between all players (placeholder, not implemented yet)

        - [ ] Use confirmation dialogs for destructive actions

    7. **Backend Integration & Security**
        - [ ] Supabase RLS rules enforce correct permissions
        - [ ] All sensitive actions require authentication
        - [ ] Credentials/keys in environment variables

    8. **Testing & QA**
        - [ ] Add unit/integration tests for all flows
        - [ ] Test as both player and coordinator
        - [ ] Gather user feedback or run usability test
- [ ] More robust match/challenge logic
- [ ] Improved onboarding polish
- [ ] Real-vs-demo data handling
- [ ] Create a Team Profile page (view team info, members, stats)
- [ ] Improve the team creation process (better UX, validation, member selection)

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

## Challenge System Review

### What Could Be Improved
- Rename the `flowers` table to `challenges` or `matches` for clarity (if possible).
- Define a specific TypeScript type for the `result` (JSONB) field in the `Flower` interface.
- Use a TypeScript union or enum for the `status` field in the `Flower` interface (e.g., "pending" | "accepted" | "declined" | "completed").
- Reflect nullable fields in TypeScript interfaces (e.g., `score?: string | null`, `team_1_id?: string | null`).
- Standardize naming conventions across interfaces (e.g., `id` vs. `<entity>_id`).
- Consolidate challenge-related types/interfaces in a central location to avoid duplication.
- Ensure as much business logic as possible is in the backend (Supabase functions) to prevent cheating or inconsistency.
- Add or improve unit/integration tests for challenge flows (creation, acceptance, decline, scoring) both backend and frontend.

### What Might Be Missing
- Add an audit log table for challenge actions (who created/accepted/declined, when).
- Add logic for expiring stale challenges (e.g., auto-decline after X days).
- Implement notifications (push, email, or in-app) for challenge events.
- Ensure only authorized users can create/accept/decline challenges (use the `user_roles` table and enforce in code/backend).
- Make sure all Supabase errors are handled gracefully in the UI.
- Document challenge flows, both in code and in a developer README.
- Validate all user inputs before sending to Supabase (e.g., don’t allow challenges with missing IDs, invalid scores, etc.).
- Consider versioning Supabase functions or endpoints if challenge logic changes.


## App Code Review

### What Could Be Improved
- Ensure all major data flows use TypeScript interfaces/types, especially for navigation params, API responses, and context.
- Use stricter types for all props and state; avoid `any` except where truly necessary.
- Consider a more robust state management solution (React Context, Zustand, Jotai) as the app grows.
- Audit for duplicate UI logic or styles; move repeated patterns into shared components.
- Add unit and integration tests for business logic, reducers, and critical UI flows.
- Ensure all async calls (especially Supabase and navigation) have comprehensive error handling and user feedback.
- Move all secrets/keys to environment variables and enforce user roles/permissions in both UI and backend.
- For large data sets (ladders, matches), implement pagination or lazy loading.
- Optimize images and assets for performance.
- Audit for accessibility (labels, focus order, color contrast) and ensure responsive layouts.

### What Might Be Missing
- Automated testing setup (test/ directory, test scripts).
- CI/CD configuration for builds, linting, and deployment.
- Comprehensive documentation (README.md with setup, architecture, contribution guidelines).
- Analytics and error monitoring (e.g., Sentry).
- Internationalization (i18n) support if needed.
- Complete user settings/preferences coverage.

**Tip:** Update this file as you make progress or switch machines to keep track of your work!
