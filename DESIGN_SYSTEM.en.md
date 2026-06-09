# Recoverse Design System

## Design Direction

Recoverse is a space archive service for exploring memories.

The first screen must be the user's memory universe, not a list or management tool. Personal retrospectives are planets, group retrospectives are galaxies, question cards are exploration records/stars, and answers are exploration logs.

Core visual keywords:

- Space archive
- Memory planets
- Group galaxies
- Constellations
- Observation mode
- Warm night sky
- Quiet exploration
- Self-understanding and discovery

Avoid:

- Generic card dashboards
- Capsule-list-first Home
- Top-tab-first structure
- Sci-fi game styling
- Cyberpunk
- Cold neon
- Complex 3D
- Social feeds
- Comment/like-centered UI

## Colors

The base background should use deep space tones while staying emotionally warm through gold, peach, lavender, and teal accents.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Space Black | `space.black` | `#08070F` | Global background |
| Warm Night | `space.warmNight` | `#15111F` | Space surface and depth |
| Archive Navy | `space.archiveNavy` | `#1D2438` | Secondary background |
| Dust Purple | `space.dustPurple` | `#6D5A8D` | Orbit lines, secondary accents |
| Soft Lavender | `space.softLavender` | `#B9A7E8` | Selected states, small stars |
| Memory Gold | `memory.gold` | `#F4C56A` | Today's Discovery, primary CTAs |
| Sunset Peach | `memory.peach` | `#F2A27E` | Warm planet surfaces |
| Rose Fog | `memory.roseFog` | `#E8A8B8` | Emotional highlights |
| Galaxy Teal | `galaxy.teal` | `#60D0A8` | Group galaxies, member states |
| Moon Paper | `text.moonPaper` | `#F6EEDC` | Body text |
| Star White | `text.starWhite` | `#FFF9EA` | Titles and emphasis |
| Muted Star | `text.mutedStar` | `#BDB4C8` | Secondary text |

Usage rules:

- Do not let a screen become only purple. Mix gold, peach, navy, and teal.
- Use subtle teal/green accents to distinguish group galaxies from personal planets.
- Avoid neon blue, fluorescent green, and cyberpunk pink.
- Do not hide destructive actions inside the space palette; use clear warning colors.

## Typography

Korean is the default language. English appears only when selected in settings.

Product language should favor exploration over feature explanation.

| Existing Term | New Product Language |
| --- | --- |
| Capsule | Personal planet / memory planet |
| Group retrospective | Galaxy |
| Question card | Exploration record / star |
| Answer | Exploration log |
| Share link | Observation invitation |
| Shared view | Observation mode |

Example copy:

- `My Memory Universe`
- `Today's Rediscovered Star`
- `Create a New Memory Planet`
- `Create a Group Galaxy`
- `Create an Observation Invitation`
- `Explore this planet again?`

Size rules:

| Role | Mobile | Desktop | Rule |
| --- | --- | --- | --- |
| Screen title | 24-28px | 28-36px | Defines the home identity |
| Section title | 17-20px | 20-24px | Short and clear |
| Object label | 12-14px | 13-15px | Planet/galaxy names |
| Body | 14-16px | 15-17px | Prioritize long log readability |
| Metadata | 12-13px | 12-14px | Dates, progress, type |

Rules:

- Use default letter spacing.
- Allow mobile headings to wrap.
- Keep button labels short.
- Do not place long feature explanations on Home.

## Home Universe Rules

Home is a space, not a management screen.

Included:

- Small brand/status area
- Today's Discovery
- Personal planets
- Group galaxies
- `+` creation entry point

Excluded:

- Capsule-list-first sections
- Year view
- Quick entry
- Question comparison
- JSON management
- Destructive actions such as deleting all data

Layout:

```text
Top brand
Today's Discovery
Universe map
  ├─ Personal planets
  ├─ Group galaxies
  └─ + creation entry point
Bottom navigation or archive entry
```

On mobile, the first viewport should show Today's Discovery and the beginning of the universe map.

## Button Rules

### Primary Buttons

Usage:

- Create memory planet
- Create group galaxy
- Save exploration log
- Explore again

Rules:

- Use `Memory Gold`, `Sunset Peach`, or `Galaxy Teal` for group features.
- Minimum mobile height is 44px.
- The Home `+` button opens creation choices, not a generic add form.

### Secondary Buttons

Usage:

- Archive
- Settings
- Filter
- Import/export

Rules:

- Keep them out of the center of Home.
- Use transparent or dark translucent backgrounds.
- Keep labels short.

### Destructive Buttons

Usage:

- Delete planet
- Delete exploration record
- Delete all data

Rules:

- Do not expose them on the first Home screen.
- Use confirmation flows inside Archive / Settings or detail screens.

## Card Rules

Cards are information surfaces. On Home, they must not overpower the universe map.

Today's Discovery card:

- The emotional entry point of Home.
- Shows one old exploration log fragment and its linked planet/star.
- Uses short copy and a reopen action.

Archive cards:

- Lists, filters, and JSON management belong in Archive.
- They should not leak back into Home.

Observation mode cards:

- Clearly indicate read-only state.
- Do not include edit, comment, or like actions.

## Planet Rules

Meaning:

```text
Planet = personal retrospective capsule
Planet click = explore planet detail
Brightness / rings / stars = record state
```

Visual rules:

- Use CSS gradients only for planet surfaces.
- Do not use Three.js or complex canvas rendering.
- Vary colors and rings lightly by capsule type.
- Recently edited planets get one small star.
- Today's Discovery target gets a subtle gold halo.

Interaction:

- On tap/click, scale to about `1.06`.
- Transition to planet detail after expansion.
- Reduce floating and expansion animations with `prefers-reduced-motion`.

## Galaxy Rules

Meaning:

```text
Galaxy = group retrospective
Core = group theme
Satellite planets = members
Constellation = shared exploration records
```

Visual rules:

- A galaxy has a larger orbital structure than a personal planet.
- Use teal/lavender accents to distinguish it from personal planets.
- Represent members as small satellite planets.
- Before real group features exist, prepare only the creation entry point and empty state.

## Observation Mode Rules

Observation mode is the read-only sharing surface.

Rules:

- Clearly show `Observation Mode` and read-only state at the top.
- Do not expose edit buttons, delete buttons, or input fields.
- Make the view quieter and more contemplative than the editable app.
- Call share links `Observation Invitations`.

## Spacing and Layout

Design mobile-first.

| Role | Value |
| --- | --- |
| Screen horizontal padding | 20px |
| Section gap | 28-40px |
| Card inner padding | 16-20px |
| Universe map minimum height | 420px |
| Touch target minimum size | 44px |

Rules:

- The Home map needs breathing room.
- Planet and galaxy placement should feel asymmetric.
- On desktop, keep the universe map wide and move support tools into Archive or side areas.

## Animation Rules

Allowed:

- Slow planet floating
- Subtle star opacity changes
- Short expansion on planet/galaxy click
- Soft fade into observation mode

Forbidden:

- Fast particle explosions
- Strong neon flicker
- 3D rotation
- Game-like HUDs
- Repeating motion that interrupts reading

Recommended values:

```text
planet float: 6-10s ease-in-out infinite
star twinkle: 3-6s ease-in-out infinite
tap scale: 160-220ms ease-out
screen transition: 240-360ms ease
```

## Dark Mode Direction

Recoverse is dark-mode-first.

- It matches the space archive concept.
- Planets, galaxies, stars, and observation mode become more expressive.
- It fits the likely context of writing retrospectives at night.

Light mode is not required for the MVP. If added later, it should feel like a paper star map rather than a daytime dashboard.
