# Recoverse Design System

## 1. Atmosphere & Identity

Recoverse feels like opening a saved letter years later: quiet, tactile, personal, and slightly ceremonial. The product is not a productivity tracker; it is a small archive of remembered states. The signature is **Book x Time Capsule**: paper-like surfaces, editorial Korean typography, envelope folds, wax-seal confirmations, tiny stamps, and calm sage accents that make every reflection feel preserved rather than logged.

## 2. Color

| Role | Token | Light | Dark | Usage |
| --- | --- | --- | --- | --- |
| Surface/base | `--surface-base` | `#FBF4EC` | `#191513` | App background |
| Surface/paper | `--surface-paper` | `#FFFDF8` | `#241F1C` | Main screens, letters |
| Surface/parchment | `--surface-parchment` | `#EFE6D6` | `#302821` | Cards, album tiles |
| Surface/sage | `--surface-sage` | `#DDE5D8` | `#263127` | Reflection panels, selected state |
| Surface/blue | `--surface-blue` | `#D9E4E6` | `#1E2B2F` | Travel and photo accents |
| Surface/blush | `--surface-blush` | `#EAD7CF` | `#34211D` | Emotional highlights |
| Text/primary | `--text-primary` | `#2F261F` | `#F8F1E7` | Headlines, body |
| Text/secondary | `--text-secondary` | `#75695F` | `#CDBFAA` | Captions, descriptions |
| Text/tertiary | `--text-tertiary` | `#A99A8B` | `#8A7C70` | Disabled, metadata |
| Border/subtle | `--border-subtle` | `#E5D9C8` | `#3D332C` | Hairlines, dividers |
| Border/strong | `--border-strong` | `#CABCA8` | `#5B4C3F` | Inputs, selected states |
| Accent/espresso | `--accent-espresso` | `#3A312B` | `#F0DECA` | Primary CTA, logo ink |
| Accent/sage | `--accent-sage` | `#6F7F6B` | `#9FB391` | Writing, active states |
| Accent/wax | `--accent-wax` | `#8E4E38` | `#D18A72` | Completion, seal, warnings |
| Accent/sky | `--accent-sky` | `#7598A1` | `#AFCAD0` | Travel, info |
| Status/success | `--status-success` | `#5C7A56` | `#AFC7A5` | Saved and completed states |
| Status/warning | `--status-warning` | `#A8783D` | `#D8B074` | Gentle cautions |
| Status/error | `--status-error` | `#A54835` | `#E19A86` | Destructive actions |

Rules:

- Cream and parchment are the base, but sage, blue, wax, and espresso must appear on major surfaces to avoid a flat beige product.
- Accent colors are semantic: espresso for main action, sage for reflection/creation, wax for closure, sky for travel.
- No decorative gradients. Texture comes from fine paper grain, hairline rules, stamps, folded shapes, and tonal layering.

## 3. Typography

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `40px` | 600 | 1.18 | 0 | Splash and hero phrases |
| H1 | `32px` | 600 | 1.22 | 0 | Screen titles |
| H2 | `24px` | 600 | 1.32 | 0 | Section headers |
| H3 | `19px` | 600 | 1.45 | 0 | Card titles |
| Body/lg | `17px` | 400 | 1.7 | 0 | Emotional copy |
| Body | `15px` | 400 | 1.65 | 0 | Default mobile text |
| Body/sm | `13px` | 400 | 1.55 | 0 | Metadata and settings rows |
| Caption | `11px` | 600 | 1.35 | 0.06em | Labels and overlines |

Font stack:

- Serif display: `"Noto Serif KR", "Batang", "Iowan Old Style", Georgia, serif`
- Sans body: `"Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif`
- Mono: `"SFMono-Regular", "Cascadia Mono", Consolas, monospace`

Rules:

- Korean display lines use `word-break: keep-all`.
- Serif is reserved for title phrases, reflection excerpts, and time-capsule moments.
- Body text never drops below 13px in phone mockups and 14px in documentation.

## 4. Spacing & Layout

All spacing derives from a 4px base.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | `4px` | Hairline gaps, icon-to-label |
| `--space-2` | `8px` | Compact stacks, chips |
| `--space-3` | `12px` | Inputs, list rows |
| `--space-4` | `16px` | Standard card padding |
| `--space-5` | `20px` | Mobile section padding |
| `--space-6` | `24px` | Phone screen side margins |
| `--space-8` | `32px` | Major mobile groups |
| `--space-10` | `40px` | Documentation sections |
| `--space-12` | `48px` | Major screen breaks |
| `--space-16` | `64px` | Hero and large docs spacing |

Grid and layout:

- Mobile artboard reference: 390 x 844.
- Phone safe margin: 20-24px.
- Bottom navigation height: 68-76px.
- Card radius: 8-22px.
- Repeated cards use equal height or controlled aspect ratios to prevent layout jitter.

## 5. Components

### Phone Frame

- **Structure**: device shell, status bar, screen content, optional bottom navigation.
- **Variants**: standard, splash, system.
- **Spacing**: `--space-5` screen padding, `--space-4` inner groups.
- **States**: static, selected gallery state.
- **Accessibility**: each frame has an explicit screen title.
- **Motion**: entry fade-up and slight paper-lift transform.

### Button

- **Structure**: semantic button or anchor with optional leading icon.
- **Variants**: primary espresso, secondary paper, sage floating, ghost.
- **Spacing**: 48px minimum height, horizontal padding from `--space-5`.
- **States**: hover lift, active press, focus ring, disabled reduced opacity, loading with text preserved.
- **Accessibility**: visible focus ring and 44px minimum target.
- **Motion**: 220ms transform/opacity with `cubic-bezier(0.16, 1, 0.3, 1)`.

### Memory Card

- **Structure**: overline, reflection excerpt, optional stamp or photo.
- **Variants**: prompt, album, detail, comparison.
- **Spacing**: `--space-4` internal padding, `--space-3` gaps.
- **States**: default, selected, archived, empty.
- **Accessibility**: title text remains real text.
- **Motion**: hover paper-lift using transform only.

### Text Input Letter

- **Structure**: prompt header, textarea-like paper body, helper metadata row.
- **Variants**: writing, completed, locked.
- **Spacing**: `--space-4` padding.
- **States**: focus, error, saved.
- **Accessibility**: label is visually present; focus ring is visible.
- **Motion**: focus expands outline without layout shift.

### Bottom Navigation

- **Structure**: three to four icon+label items inside a floating rounded tray.
- **Variants**: app primary, album, settings.
- **Spacing**: 64px item width, 68-76px tray height.
- **States**: active with sage fill, inactive muted, focus.
- **Accessibility**: icon is accompanied by text; active state is not color-only.
- **Motion**: active item lifts 2px on selection.

### Seal Badge

- **Structure**: circular stamp with inner ring and lettermark.
- **Variants**: saved, shared, private.
- **Spacing**: fixed 48/64/92px sizes.
- **States**: stamped entry, idle.
- **Accessibility**: decorative seal is hidden when redundant.
- **Motion**: 420-520ms stamp scale with opacity.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | `120ms` | `cubic-bezier(0.2, 0, 0, 1)` | Button press, toggles |
| Standard | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Card hover, tab change |
| Emphasis | `520ms` | `cubic-bezier(0.19, 1, 0.22, 1)` | Splash, completion seal |
| Stagger | `80ms` delay steps | emphasis easing | Album and question reveal |

Rules:

- Animate only `transform`, `opacity`, and short entry `filter` moments.
- Respect `prefers-reduced-motion`.
- Time-capsule actions use a seal moment; writing actions use a gentle paper lift.
- No continuous scroll listeners.

## 7. Depth & Surface

Recoverse uses **mixed tactile depth**: tonal-shift surfaces for structure, hairline borders for paper edges, and soft low-opacity shadows for physical objects such as cards, floating nav, envelopes, and seals.

| Level | Value | Usage |
| --- | --- | --- |
| Hairline | `1px solid var(--border-subtle)` | Paper edges, dividers |
| Paper lift | `0 10px 24px rgba(47, 38, 31, 0.08)` | Cards and photos |
| Device | `0 28px 80px rgba(47, 38, 31, 0.18)` | Phone shell |
| Floating CTA | `0 12px 30px rgba(58, 49, 43, 0.18)` | Primary action |
| Inset paper | `inset 0 1px 0 rgba(255, 255, 255, 0.65)` | Buttons and panels |

Rules:

- Borders must be warm, never neutral gray.
- Object shadows stay soft and warm; no hard black shadows.
- Paper texture must not reduce text contrast.

## 8. Photography & Illustration

Recoverse photos are editorial anchors, not decoration. A screen should usually have one primary photo moment, then rely on paper cards, stamps, borders, and typography for the rest of the composition.

Photo usage rules:

- Use at most one large photo per screen section and avoid photo grids unless the screen is explicitly an album.
- Default product photo frames use `object-fit: contain` with a warm paper background so envelopes, journals, flowers, and taped photos are not cut off.
- Crop only when the photo is intentionally used as nonessential texture, and never crop away the main object of a user-provided image.
- Pair photos with functional copy or state changes. Do not add a photo just to fill empty space.
- Prefer wide, low-pressure frames for landscape images and square paper frames for envelope or seal images.

Illustration rules:

- Use line icons, wax seals, small ordinal stamps, and paper folds before adding another bitmap image.
- Question cards are primarily typographic. They may use a small stamp or accent mark, not a repeated thumbnail.
- Empty states may use one quiet photo if it clarifies the metaphor of an unopened book, blank journal, or stored letter.
