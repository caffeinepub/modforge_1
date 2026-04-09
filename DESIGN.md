# Design Brief

## Direction
ModForge — A dark gaming mod creation platform for mobile, PC, and consoles with electric cyan/purple accents and console-friendly responsive UI.

## Tone
Cyberpunk futuristic with gaming precision — bold electric cyan cuts through deep navy blues for clarity and energy, never generic or safe.

## Differentiation
Glow-bordered cards and cyan focus rings make controller navigation on Xbox/PlayStation browsers as immersive as the mod-building experience itself.

## Color Palette

| Token      | OKLCH           | Role                              |
| ---------- | --------------- | --------------------------------- |
| background | 0.13 0.018 230  | Deep navy-blue canvas             |
| foreground | 0.93 0.01 230   | High-contrast off-white text      |
| card       | 0.17 0.022 228  | Elevated content surface          |
| primary    | 0.82 0.12 195   | Electric cyan — highlights, CTAs  |
| accent     | 0.45 0.22 280   | Deep purple — secondary actions   |
| muted      | 0.2 0.025 228   | Subdued backgrounds, placeholders |

## Typography

- Display: Bricolage Grotesque (200–800 weight) — mod titles, section headers, eye-catching UI
- Mono: JetBrains Mono (300–700 weight) — mod scripts, code snippets, system tags
- Scale: hero `text-3xl font-bold`, h2 `text-xl font-bold`, label `text-sm font-mono`, body `text-base leading-relaxed`

## Elevation & Depth

Cards use layered glowing cyan borders (0 0 20px) at 30% opacity, elevated surfaces have 2px offset shadow, no blur-heavy drops.

## Structural Zones

| Zone    | Background           | Border      | Notes                                    |
| ------- | -------------------- | ----------- | ---------------------------------------- |
| Header  | bg-card              | border-glow | Navigation with cyan focus rings         |
| Content | bg-background        | —           | Cards with glow-cyan shadow              |
| Sidebar | bg-sidebar (0.15)    | sidebar-border | Workshop left nav, mod collections      |
| Footer  | bg-card / muted/40   | border-t    | Links, copyright, responsive mobile-hide |

## Spacing & Rhythm

12px micro-spacing, 24px section gutters, card grid 2-column mobile → 4-column desktop, 1440px+ TV mode scales typography to 17px base.

## Component Patterns

- Buttons: `bg-primary text-primary-foreground rounded-lg touch-target`, hover cyan glow, active accent
- Cards: `bg-card border-glow rounded-lg shadow-lg`, system badge badges with platform colors
- Badges: Platform system tags (Xbox, PlayStation, PC, Switch, Android, iOS) with distinct colors, pill-shaped

## Motion

- Entrance: Fade + 200ms cubic-bezier(0.4, 0, 0.2, 1)
- Hover: Glow intensify (0 0 40px) + subtle 150ms lift
- Controller focus: Cyan outline (2px, 2px offset) on all interactive elements for Xbox/PS5 browser navigation

## Constraints

- Min touch target 48px × 48px for mobile and controller navigation
- No warm colors—all accents cyan or purple, destructive stays red
- Cyan must reach 0.7+ contrast on dark backgrounds; never use below 0.6 lightness
- TV-friendly: scale to 17px base at 1440px+, increase button/toggle hit areas

## Signature Detail

Glowing cyan border cards with OKLCH glow shadows — instantly recognizable mod-building surfaces that feel gamified and immersive.
