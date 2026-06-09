# Recoverse Design System

## Design Direction

Recoverse is a space archive app for exploring memories.

The home screen should feel like a memory map where the user's capsules float as planets. The first impression should not be a productivity tool or a generic retrospective app. It should feel like entering a quiet, warm personal universe.

Core visual keywords:

- Space archive
- Memory planets
- Warm night sky
- Small exploration
- Discovery
- Self-understanding
- Cosmic garden

Avoid:

- Sci-fi game styling
- Cyberpunk
- Cold neon
- Complex 3D
- Combat-like or mechanical HUDs
- Flat note-app list screens

## Colors

The base background should use deep space tones, while accents should come from warm gold, peach, and lavender.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Space Black | `space.black` | `#08070F` | Global background |
| Warm Night | `space.warmNight` | `#15111F` | Panels, depth |
| Archive Navy | `space.archiveNavy` | `#1D2438` | Secondary background |
| Dust Purple | `space.dustPurple` | `#6D5A8D` | Orbit lines, secondary accents |
| Soft Lavender | `space.softLavender` | `#B9A7E8` | Selected states, small stars |
| Memory Gold | `memory.gold` | `#F4C56A` | Primary CTAs, discovery states |
| Sunset Peach | `memory.peach` | `#F2A27E` | Warm planet surfaces |
| Rose Fog | `memory.roseFog` | `#E8A8B8` | Emotional highlights |
| Moon Paper | `text.moonPaper` | `#F6EEDC` | Primary text |
| Star White | `text.starWhite` | `#FFF9EA` | Titles and emphasis |
| Muted Star | `text.mutedStar` | `#BDB4C8` | Secondary text |

Usage rules:

- Do not let a screen become only purple. Mix gold, peach, and navy.
- Avoid neon blue, fluorescent green, and cyberpunk pink.
- The background is dark, but the emotional tone must not feel cold.
- Important actions should use `Memory Gold` or `Sunset Peach`.

## Typography

Korean is the default language. English appears only when selected in settings.

Recommended tone:

- Short and emotional
- Discovery-oriented rather than feature-explaining
- Calm and non-pressuring

Example copy:

- `My Memory Universe`
- `Today's Rediscovered Memory`
- `Create a New Memory Planet`
- `Open this capsule again?`
- `Unanswered Memory Cards`

Size rules:

| Role | Mobile | Desktop | Rule |
| --- | --- | --- | --- |
| Screen title | 24-28px | 28-36px | Defines the home identity |
| Section title | 17-20px | 20-24px | Short and clear |
| Card title | 15-18px | 16-20px | Two lines maximum |
| Body | 14-16px | 15-17px | Prioritize answer readability |
| Metadata | 12-13px | 12-14px | Dates, progress, type |

Typography rules:

- Use default letter spacing.
- Allow mobile headings to wrap.
- Keep button text to one line where possible. On narrow screens, prefer icon + short label.
- Decorative fonts are allowed only for the logo or very short emotional phrases.

## Button Rules

Buttons should make commands clear without overplaying the space concept.

### Primary Buttons

Usage:

- Create a new memory planet
- Save answer
- Reopen memory

Rules:

- Use `Memory Gold` or `Sunset Peach` backgrounds.
- Use a dark text color near `#08070F`.
- Minimum mobile height is 44px.
- Use either a 999px pill or 12-16px radius.

### Secondary Buttons

Usage:

- Import
- Export
- Filter
- Refresh

Rules:

- Use transparent or dark translucent backgrounds.
- Use low-contrast lavender or gold outlines.
- If an icon is present, keep the label short.

### Destructive Buttons

Usage:

- Delete capsule
- Delete memory card

Rules:

- Do not blend destructive actions into the space theme.
- Use a clear warning color and confirmation flow.
- Do not expose destructive actions on the first home screen.

## Card Rules

General cards are information surfaces. On the home screen, cards should not dominate the experience. The memory map and planet capsules are the main elements.

Common rules:

- Use translucent dark backgrounds.
- Use low-contrast lavender or gold borders.
- Avoid heavy drop shadows. Prefer subtle inner glow.
- Radius should be between 16px and 24px.
- Do not nest cards inside cards.

Today's Discovery card:

- It is the emotional entry point of the home screen.
- Include one old answer fragment, capsule name, and a reopen action.
- A short quote should be the focus, not long explanatory copy.
- Small stars, petals, or subtle planet details are allowed.

My Capsules list:

- Place it as a supporting area below the map.
- Avoid a management-tool look. Use planet icons, progress, and recent edit status.
- On mobile, use a simple list. On desktop, compact card grids are allowed.

## Planet Card Rules

Planet cards are the core home component of Recoverse.

Meaning:

```text
Planet = Capsule
Brightness / ring / stars = record state
Planet click = start exploring the capsule
```

Elements:

- Circular planet visual
- Capsule title
- Capsule type
- Question count / answer count
- Recent edit state

Visual rules:

- Use CSS gradients only for planet surfaces.
- Do not use Three.js or complex canvas rendering.
- Each planet can have a different color while staying inside the palette.
- Rings should use `border`, `pseudo-element`, and `transform: rotate()`.
- Capsule types may have slightly different surface colors.

Type directions:

| Type | Visual Direction |
| --- | --- |
| Year | Gold / peach planet |
| Travel | Teal / lavender planet |
| Project | Navy / gold ring |
| Relationship | Rose / purple planet |
| Career | Calm navy / gray planet |
| Life stage | Soft lavender / moonlit planet |

State expression:

- More answers make the planet slightly brighter.
- More unanswered cards make the ring softer.
- Recently edited capsules get one small star.
- The capsule used for Today's Discovery gets a subtle gold halo.

Interaction:

- On tap/click, scale to about `1.06`.
- Transition to capsule detail after the expansion.
- On mobile, show a short press state instead of relying on hover.
- Animation must stay slow and soft.

## Spacing Rules

Design mobile-first.

Base spacing:

| Role | Value |
| --- | --- |
| Screen horizontal padding | 20px |
| Section gap | 28-40px |
| Card inner padding | 16-20px |
| List item gap | 10-14px |
| Memory map minimum height | 360px |
| Touch target minimum size | 44px |

Home order:

```text
Top brand
Today's Discovery card
Memory map
Create new memory planet
My Capsules list
```

Rules:

- The map needs breathing room.
- Planet placement should feel asymmetric rather than like a strict grid.
- On mobile, the first viewport should show Today's Discovery and the beginning of the memory map.
- On desktop, expand the map and place support panels to one side.

## Animation Rules

Animation should support exploration and discovery.

Allowed:

- Slow planet floating
- Subtle star opacity changes
- Short planet expansion on click
- Cards softly rising from the bottom
- Subtle glow on Today's Discovery

Forbidden:

- Fast particle explosions
- Strong neon flicker
- 3D rotation
- Game-like combat HUDs
- Repeating motion that interrupts reading

Recommended values:

```text
planet float: 6-10s ease-in-out infinite
star twinkle: 3-6s ease-in-out infinite
tap scale: 160-220ms ease-out
screen transition: 240-360ms ease
```

Accessibility:

- Disable floating and twinkling when `prefers-reduced-motion` is active.
- Do not rely on animation alone to communicate important information.

## Dark Mode Direction

Recoverse is dark-mode-first.

Reasons:

- It matches the space archive concept.
- Planets, stars, and discovery cards become more expressive.
- It fits the likely context of writing retrospectives at night.

Dark mode rules:

- Use a warm near-black background.
- Prefer `Moon Paper` over pure white for text.
- Cards and panels should be one step brighter than the background.
- Primary CTAs must have sufficient contrast against the dark background.

Light mode direction:

- Light mode is not required for the MVP.
- If added later, treat it as a paper map rather than a daytime dashboard.
- The planet-map concept should remain intact in light mode.
