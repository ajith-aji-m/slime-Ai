---
name: Aetheric Intelligence
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffafd3'
  on-tertiary: '#620040'
  tertiary-container: '#ae397b'
  on-tertiary-container: '#ffdce9'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max-width: 1280px
  sidebar-width: 280px
  gutter: 24px
  margin-mobile: 16px
  stack-gap: 12px
---

## Brand & Style
The design system is centered on a "futuristic tool for thought" narrative, positioning the AI not as a chatbot, but as a high-performance workstation for intellectual production. The aesthetic is **Dark-First Modernism**—utilizing deep, layered grays to reduce eye strain during long sessions, contrasted with high-energy electric accents that signify machine intelligence.

The emotional response should be one of "effortless power" and "precision." It avoids the friendly, conversational tropes of consumer AI in favor of a sophisticated, technical interface. It employs subtle **Glassmorphism** to create a sense of digital depth and **Minimalism** to ensure the user’s content remains the primary focus.

## Colors
The palette is rooted in a "Deep Space" neutral scale. The background is not pure black, but a very dark navy-tinted gray (`#0F172A`) to allow for subtle shadow depth. 

- **Primary (Electric Violet):** Used for primary actions, active AI states, and high-priority focus rings.
- **Secondary (Cyber Cyan):** Used for secondary interactions and status indicators for "System" or "Safe" operations.
- **Accent (Neon Pink):** Reserved for specialized AI modes or error states that require immediate attention.
- **Surface Scale:** Layers are built using incremental steps of Slate and Zinc grays.
- **Glass Effects:** Overlays use a 60% opacity fill of the background color with a 20px backdrop blur.

## Typography
Typography follows a strict hierarchy to manage complex data. 
- **Headlines:** Use **Hanken Grotesk** for a sharp, contemporary "tech-startup" feel. Tight letter spacing for a locked-in, professional look.
- **Body:** Use **Inter** for its neutral, systematic legibility. Paragraph spacing should be generous to allow for long AI-generated explanations.
- **Technical/Mono:** **JetBrains Mono** is mandatory for code blocks, terminal outputs, and metadata labels to reinforce the "workstation" vibe.

All text should maintain a minimum contrast ratio of 4.5:1, even in dark mode. Secondary text should use a reduced opacity (60-70%) rather than a mid-gray hex to maintain color harmony with the background tints.

## Layout & Spacing
The layout uses a **Hybrid Fluid Grid**. The sidebar (Navigation and History) is fixed at 280px, while the main workspace expands. 

- **Workspace:** The central message thread is constrained to a maximum readable width of 800px to prevent long lines of text, centered within the larger fluid container.
- **Rhythm:** An 8px linear scale is used for most spacing, with a 4px "half-step" for tight component internals (e.g., icon-to-label spacing).
- **Responsive:** On mobile, the sidebar collapses into a bottom sheet or a full-screen overlay. Margins reduce to 16px to maximize the screen real estate for the chat input.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Backdrop Blurs**.
- **Level 0 (Background):** Base surface (`#0F172A`).
- **Level 1 (Cards/Sidebar):** Raised surface using a 2% lighter tint or a subtle 1px border (`rgba(255,255,255,0.05)`).
- **Level 2 (Popovers/Modals):** Glassmorphic surfaces with a 24px blur and a faint outer glow using the primary color at 5% opacity.
- **Shadows:** Avoid heavy black shadows. Use "Ambient Shadows"—large, soft blurs with a slight color tint matching the surface beneath them to simulate natural light in a digital environment.

## Shapes
The shape language is "Soft-Tech." 
- **Standard Radius:** 12px for buttons, input fields, and small cards.
- **Large Radius:** 24px for main container sections and modal wrappers.
- **Interaction:** Active states for buttons should not just change color, but subtly "grow" (scale 1.02) to provide tactile feedback.
- **Lines:** Dividers should be minimal—use spacing over lines whenever possible. When necessary, use 1px borders with 10% white opacity.

## Components
- **Input Field:** The "Command Bar" (Chat input) is the most important component. It should be floating, styled as a Level 2 glass surface, with a 1px Primary-colored border when focused.
- **Buttons:** 
    - *Primary:* Solid Electric Violet with white text.
    - *Ghost:* No background, Primary-colored border, for low-emphasis actions.
- **AI Response Cards:** Distinct from user messages. Use a subtle gradient background (Deep Indigo to Transparent) to signify the AI's presence.
- **Code Blocks:** Darker background than the main surface (`#010409`), with a header bar displaying the language type and a "Copy" button in JetBrains Mono.
- **Status Chips:** Small, pill-shaped indicators for "Processing," "Streaming," or "Complete," using neon accents for the dot indicator.
- **Scrollbars:** Custom slim-line scrollbars that only appear on hover, avoiding visual clutter in the airy layout.