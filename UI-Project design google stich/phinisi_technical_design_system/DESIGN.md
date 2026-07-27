---
name: Phinisi Technical Design System
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dadf'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f9'
  surface-container: '#ebeef3'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#e0e3e8'
  on-surface: '#181c20'
  on-surface-variant: '#424752'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f6'
  outline: '#727784'
  outline-variant: '#c2c6d4'
  surface-tint: '#115cb9'
  primary: '#003f87'
  on-primary: '#ffffff'
  primary-container: '#0056b3'
  on-primary-container: '#bbd0ff'
  inverse-primary: '#acc7ff'
  secondary: '#006877'
  on-secondary: '#ffffff'
  secondary-container: '#75e7fe'
  on-secondary-container: '#006776'
  tertiary: '#89001a'
  on-tertiary: '#ffffff'
  tertiary-container: '#b30b27'
  on-tertiary-container: '#ffc1bf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#004491'
  secondary-fixed: '#a4eeff'
  secondary-fixed-dim: '#62d6ed'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b1'
  on-tertiary-fixed: '#410007'
  on-tertiary-fixed-variant: '#92001c'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#e0e3e8'
  terminal-bg: '#0F172A'
  border-subtle: '#E2E8F0'
  surface-muted: '#F8FAFC'
  success-green: '#166534'
typography:
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  max-width: 1200px
---

## Brand & Style
The design system is engineered for Phinisi Network, an e-learning and technical publication platform specializing in networking, Linux, and automation. The brand personality is authoritative, precise, and utilitarian, prioritizing information density and legibility over decorative elements.

The visual style is a **High-Contrast Technical** aesthetic. It draws inspiration from modern documentation frameworks and terminal environments, utilizing a strict grid, clear hierarchical separation, and a professional "blue-chip" color palette. The UI should evoke a sense of reliability and expert-level competence, functioning as a high-performance tool for engineers and students.

## Colors
The palette is built on a foundation of high-contrast neutrals and a dominant professional blue. 

- **Primary Blue (#0056B3):** Used for primary actions, navigation headers, and critical UI state indicators. It represents stability and technical depth.
- **Secondary Cyan (#17A2B8):** Utilized for information callouts, progress bars, and secondary interactive elements.
- **Tertiary Red (#E63946):** Reserved strictly for destructive actions, errors, and high-priority alerts.
- **Neutrals (Slate/Zinc):** A range of cool grays (from #212529 down to #F8FAFC) provides the structural framework, ensuring that content areas remain distinct and readable. 

In Dark Mode, the primary background shifts to a deep Navy-Slate (#0F172A), while the high-contrast white text maintains a ratio of at least 7:1 against the background for maximum accessibility.

## Typography
Typography is the core of the technical documentation experience. 

- **Headlines:** Uses **Hanken Grotesk** for a sharp, contemporary feel. High weight contrast (Bold/Semi-bold) is used to anchor the page.
- **Body:** Uses **Inter** for its exceptional legibility at small sizes and its systematic, neutral tone.
- **Technical/Labels:** Uses **JetBrains Mono** for all code snippets, terminal commands, and metadata labels. This provides a clear visual distinction between instructional prose and executable logic.

Hierarchy is enforced through strict adherence to line-height ratios and generous paragraph spacing to prevent cognitive fatigue during long-form technical reading.

## Layout & Spacing
This design system utilizes a **Fixed-Fluid Hybrid Grid** system. 

The main content area is capped at 1200px to ensure line lengths remain optimal for reading technical documentation. A 12-column grid is used for dashboard layouts, while a single-column layout with a right-hand "On This Page" navigation is preferred for blog and course content.

Spacing follows a strict 4px/8px baseline grid. Gutters are fixed at 24px to provide ample "breathing room" between technical diagrams and text. On mobile, margins shrink to 16px to maximize the utility of the smaller horizontal viewport.

## Elevation & Depth
In line with the high-contrast technical aesthetic, the design system avoids heavy shadows or skeuomorphic depth.

Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**:
- **Level 0 (Base):** Solid background (#FFFFFF or #0F172A).
- **Level 1 (Cards/Sidebar):** A subtle background shift (#F8FAFC) with a 1px solid border (#E2E8F0).
- **Level 2 (Dropdowns/Modals):** Small, sharp ambient shadows (0px 4px 6px rgba(0,0,0,0.1)) to indicate temporary overlay status.

Borders are the primary tool for separation. All containers should use a 1px border to define their boundaries clearly against the base background.

## Shapes
The shape language is "Soft-Industrial." 

A low roundedness of **0.25rem (4px)** is applied to UI components like buttons, inputs, and code blocks. This softens the high-contrast edges just enough to feel modern while maintaining the rigid, professional structure required for a technical platform. Interactive components should never be pill-shaped or fully rounded.

## Components
### Buttons
Primary buttons are solid Blue (#0056B3) with white text. Secondary buttons use a 1px border of the primary color with a transparent background. All buttons use the Label-Caps typography style for a structured appearance.

### Code Blocks
Code blocks must use the `terminal-bg` color with syntax highlighting. They include a top bar containing the file name (left) and a "Copy" button (right) using `label-caps`.

### Input Fields
Inputs are rectangular with a 1px border. On focus, the border weight increases to 2px using the primary blue color. No glow or outer shadows.

### Cards
Cards are used for course modules and blog posts. They feature a white background, a 1px border, and a subtle "border-left" accent of 4px in the primary blue to denote importance.

### Chips & Tags
Tags for "Linux", "Automation", or "BGP" use a light gray background with `label-caps` text. They are strictly rectangular with 2px corner radii.

### Navigation
The side navigation uses a "Nested List" approach, common in documentation. Active items are indicated by a bold font weight and a vertical blue line on the left edge of the menu item.