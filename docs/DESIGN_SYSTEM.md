# Design system

## Visual intent

A working architectural sheet, with the warmth of an editorial publication. The interface combines fine drafting lines, generous negative space, distinct object states, and selective dark surfaces. Empty space is meaningful: the real collection may have no completed work. The interface remains composed without inventing content.

## Tokens

| Token           | Value     | Use                                              |
| --------------- | --------- | ------------------------------------------------ |
| Ivory           | `#F4F1E9` | Canvas, quiet surfaces                           |
| Charcoal        | `#262C29` | Primary text, realized project objects, controls |
| Sage            | `#A7C69D` | Realization, relationship emphasis               |
| Blueprint       | `#9BA8A1` | Structural strokes, sketch details               |
| White           | `#FFFFFF` | Working fragment surfaces, form fields           |
| Muted ink       | `#647169` | Supporting text on light surfaces                |
| Focus           | `#4D7551` | Visible keyboard focus outline                   |
| Structural line | `#CBD0C5` | Dividers and quiet borders                       |

Avoid using sage as small body text on ivory; it is an accent, not the main text color. Dark objects use ivory text. Design tokens may evolve if contrast and the light/dark relationship are preserved.

## Typography and spacing

Instrument Serif provides expressive headings and occasional italic phrases. DM Sans handles controls, body copy, labels, and technical metadata. Both ship locally from Fontsource; the visitor does not need Google Fonts or another external font request.

The desktop identity heading is intentionally oversized inside a fixed canvas node. Node scaling is controlled by the viewport. Studio and detail text use ordinary responsive CSS, so reading does not depend on zoom. Base spacing steps are 4, 8, 12, 16, 20, 24, 32, 40, and 48 pixels. Buttons and dialogs use restrained 3–9px corners. Canvas controls have a dark, compact tool-strip treatment.

## Object states

| State      | Appearance                                                   | Meaning                                     |
| ---------- | ------------------------------------------------------------ | ------------------------------------------- |
| Blueprint  | Dashed boundary, transparent SVG object, construction guides | A real idea/concept documented by the owner |
| Experiment | Partly realized SVG, restrained diagonal hatch               | A genuine prototype or exploration          |
| Working    | Solid object, white surface, firm outline                    | A functioning implementation                |
| Evolving   | Charcoal surface, sage object/detail                         | Functioning work that continues developing  |

These states are not a required sequence, score, or mastery scale. A simple creation may begin as working. Revisions may change its stage when evidence supports the change. The sample-only transformation button demonstrates the visual effect without changing real content.

## Canvas behavior

- Pointer drag pans empty space; wheel zooms; touch uses one-finger drag and two-finger pinch.
- Zoom range: 0.18–2.0. Fit, recenter, zoom buttons, and a desktop minimap provide orientation.
- Keyboard: `/` opens Index, `?` opens help, `+`/`-` zoom, `0` fits, Home recenters, and arrows pan when the canvas region is focused.
- Distant objects show identity/kind; middle distance shows the blueprint glyph; close views add the summary. Full media/content lives in the detail panel.
- Visitors do not mutate public node positions. Their final viewport is saved locally, with validation and a recenter escape route.
- Exploded views reposition descendants temporarily, preserving their stable IDs and relationships. Reassembly restores layout and previous viewport.

## Motion

SVG stroke drawing takes about 0.75 seconds when motion is allowed. Camera actions take about 0.55 seconds; object expansion uses a restrained ease-out transition. Relationship exploration changes stroke emphasis. No idle animation loop is required.

Respect `prefers-reduced-motion`: use immediate camera changes, disable transition motion, and reveal the completed glyph without a drawing sequence. Motion must explain a state change rather than delay access.

## Interaction and accessibility

The index is a first-class alternative to the canvas. It contains every published piece, text search, type filters, and semantic buttons. The detail panel exposes all descriptive content and links. No achievement is available exclusively through spatial discovery.

Use native dialogs for focus containment, restore focus on close, support Escape, and label every panel. Preserve the skip-to-index link, visible focus outline, alt descriptions, and explicit form labels. Do not render untrusted HTML. Iframes are allowlisted, isolated, and opt-in. Contact details appear only when actually published.

The initial implementation is not a certified WCAG audit. Keyboard/component tests and CSS provisions exist, but real-browser/screen-reader, touch, and contrast testing are staging tasks documented in VERIFICATION.md.

## Responsive behavior

Desktop: fixed-height canvas between a minimal header and footer, compact minimap, right-side detail panel, inline tool strip. Tablet: reduced header metadata and spacing. Mobile: simplified header, no minimap, centered touch controls, bottom-spanning dialog, responsive studio form, and visible index access. The studio becomes a single-column form with a bounded revision list.

Do not introduce conventional Skills/About/Projects pages to solve a canvas issue. Extend the accessible index, profile dialog, or detail panel when that addresses a real discoverability need.
