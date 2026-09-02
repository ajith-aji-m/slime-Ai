---
name: Aetheric Intelligence Light
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4a4455'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#425064'
  on-tertiary: '#ffffff'
  tertiary-container: '#5a687c'
  on-tertiary-container: '#d9e7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d5e3fc'
  tertiary-fixed-dim: '#b9c7df'
  on-tertiary-fixed: '#0d1c2e'
  on-tertiary-fixed-variant: '#3a485b'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  container-max: 1440px
---

## Brand & Style
The design system embodies a premium, high-fidelity aesthetic that merges **Minimalism** with **Glassmorphism**. It is designed to evoke a sense of clarity, intelligence, and ethereal lightness. By shifting the original dark palette to a sophisticated light mode, the UI transforms from a mysterious deep-space aesthetic into a crisp, laboratory-grade interface for high-level cognitive work.

The emotional response should be one of "effortless power"—providing the user with a focused environment where complex data feels manageable and airy. High-transparency layers, subtle blurs, and precise 1px borders define the visual language.

## Colors
The palette is rooted in high-luminance whites and soft grays to maintain a "clean-room" feel. 
- **Primary Accent:** Electric Violet (#7c3aed) is used sparingly for critical actions, status indicators, and brand moments to create a high-contrast focal point against the neutral base.
- **Surface Strategy:** Layers are built using incremental shifts in gray. The base is pure white, while "Dim" and "Bright" variants provide the necessary contrast for containers and sidebars.
- **Text:** Deep Slate is utilized for maximum legibility in body copy, ensuring the interface meets high accessibility standards while maintaining a premium feel.

## Typography
This design system leverages **Hanken Grotesk** across all roles to ensure a modern, geometric, yet highly readable experience. 

- **Hierarchy:** Dramatic scale differences between display and body text create a clear information architecture. 
- **Readability:** Body text utilizes a generous 1.6x line height and slight positive tracking to prevent eye fatigue during long sessions. 
- **Precision:** Labels and utility text use increased font weight (Medium/Semi-Bold) and wider tracking to ensure clarity at small sizes.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a base-8 spacing rhythm. 
- **Desktop:** A 12-column grid with 24px gutters. Content is centered within a 1440px max-width container.
- **Tablet:** 8-column grid with 20px gutters and 24px side margins.
- **Mobile:** 4-column grid with 16px gutters and 16px side margins.

White space is treated as a first-class citizen; elements are given significant breathing room to emphasize the "Aetheric" nature of the interface.

## Elevation & Depth
Depth is conveyed through **Glassmorphism** and **Tonal Layering**. 
- **Glassmorphic Surfaces:** Use a semi-transparent white fill (e.g., `rgba(255, 255, 255, 0.7)`) with a 20px backdrop-blur. 
- **Shadows:** Instead of harsh blacks, shadows use a very low-opacity Slate tint (`rgba(15, 23, 42, 0.08)`) with a large blur radius (30px-50px) to simulate natural, diffused ambient light.
- **Borders:** All elevated containers must feature a 1px solid border in `#E2E8F0` to define the edges against the white background.

## Shapes
The shape language is defined by a consistent **12px (Round Eight)** corner radius. 
- **Standard Elements:** Buttons, input fields, and small cards use the base 12px radius.
- **Large Containers:** Section-level cards and modals scale up to `rounded-xl` (24px) to feel more substantial and approachable.
- **Interactive States:** Maintain the same radius; do not change corner roundness on hover or active states.

## Components
- **Buttons:** Primary buttons use the Electric Violet fill with white text. Secondary buttons are ghost-style with a 1px Slate border. All buttons have a height of 48px for a substantial, premium feel.
- **Input Fields:** Use a `Surface-Dim` fill with a subtle 1px border. On focus, the border transitions to Electric Violet with a soft glow (shadow).
- **Cards:** Utilize the glassmorphic style for floating elements. Use a pure white fill for "grounded" content blocks.
- **Chips:** Highly rounded (pill-style) with `Surface-Bright` backgrounds and `Text Secondary` typography.
- **Navigation:** Top-level navigation utilizes the backdrop-blur effect, ensuring it remains visible and distinct while scrolling over content.
- **Feedback Indicators:** Use soft, desaturated versions of success (Emerald) and error (Rose) colors, ensuring they do not clash with the Electric Violet primary accent.