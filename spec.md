# ModForge

## Current State
ModForge is a full-stack mod creation and sharing platform. Users can create mods (Config Builder, Script Editor, file upload), manage characters/NPCs with group/culture assignments, and download mods as .zip packages. The app has authorization, blob storage, user profiles (character cards), and a public mod library. Mods have a `game` field (free text string).

## Requested Changes (Diff)

### Add
- `UserGame` type: `{ id: Nat, name: Text, platform: Text }` (platform = "mobile" | "pc" | "console" | "other")
- Backend: `addUserGame(name, platform)` → GameId, `removeUserGame(id)`, `listUserGames()` → [UserGame] per caller
- "My Games" section in the Workshop page: users can add/remove games they own
- "Open With" button on mod cards in Workshop and Explore pages, shown after download
  - If mod's `game` field exactly matches a game name in the user's library → show only that game
  - If no exact match → show full user game list as options
  - Opens a dialog/popover listing the applicable games with their platform badges
- When creating/editing a mod, user can pick a game from their personal library OR type a custom game name

### Modify
- `CreateModPage` and `EditModPage`: game field should offer autocomplete from user's game library (still free text fallback)
- `WorkshopPage`: add My Games management section; add Open With button on mod cards
- `ExplorePage`: add Open With button (uses user's game library if logged in, otherwise prompts to add games)
- `ModCard`: add optional `onOpenWith` prop and button
- `zipBuilder`: no changes needed — game field is already in mod.json

### Remove
- Nothing removed

## Implementation Plan
1. Add `UserGame` data type and CRUD methods to `main.mo`
2. Update `backend.d.ts` with new types and methods
3. Add `useUserGames`, `useAddUserGame`, `useRemoveUserGame` hooks in `useQueries.ts`
4. Add "My Games" panel to `WorkshopPage` with add/remove UI
5. Add "Open With" dialog component (`OpenWithDialog.tsx`)
6. Wire Open With button into `ModCard` and both Workshop/Explore pages
7. Update game field in CreateModPage and EditModPage with library suggestions
