# Page Design Document — Personalized Calorie Dashboard (Desktop-first)

## Global Styles
- Layout system: hybrid CSS Grid (page scaffolding) + Flexbox (component alignment).
- Spacing: 8px base grid (8/16/24/32).
- Typography: 
  - H1 28/32 semibold, H2 20/28 semibold, Body 14/20 regular, Small 12/16.
- Color tokens (light theme):
  - Background: #0B0F19 (app shell) + #111827 (cards)
  - Text primary: #F9FAFB, text secondary: #9CA3AF
  - Accent: #22C55E (progress/positive), Warning: #F59E0B, Danger: #EF4444
  - Borders: rgba(255,255,255,0.08)
- Buttons:
  - Primary: accent background, white text; hover darken 6%; disabled 40% opacity.
  - Secondary: transparent w/ border; hover background rgba(255,255,255,0.06).
- Inputs: dark field, 1px border, focus ring accent.

## 1) Login Page
### Meta Information
- Title: “Login | Calorie Dashboard”
- Description: “Sign in to view your personalized calorie dashboard.”
- OG: title/description match; type=website.

### Page Structure
- Centered auth card on a full-height background.

### Sections & Components
1. Top brand area
   - App name + short one-line tagline.
2. Auth card
   - Tabs: “Sign in” / “Sign up” (or a single form that toggles).
   - Fields: email, password.
   - Primary CTA: “Continue”.
   - Helper links: “Forgot password” (optional placeholder), “Privacy/Terms” (footer links).
3. Inline validation + error banner
   - Show authentication errors clearly.

### Responsive behavior
- Desktop: fixed card width ~420px.
- Small screens: card goes full-width with 16px margins.

## 2) Profile Setup Page
### Meta Information
- Title: “Profile Setup | Calorie Dashboard”
- Description: “Set your profile details to calculate your daily calorie target.”

### Page Structure
- Two-column grid on desktop: form (left) + explanation panel (right). Stacks on mobile.

### Sections & Components
1. Header
   - Breadcrumb-like text: “Setup → Profile”.
   - Action: “Save & Calculate”.
2. Profile form card
   - Name (text).
   - Sex (segmented control).
   - Age (number), Height (cm), Weight (kg).
   - Activity level (select with short labels).
   - Goal (Maintain/Cut/Bulk).
   - Submit triggers server action; show loading state.
3. Calculation result panel
   - After save, show: “Your daily target: XXXX kcal” and “Updated: timestamp”.
   - Secondary CTA: “Go to Dashboard”.

### Interaction states
- Saving: disable inputs, show spinner on primary button.
- Errors: field-level messages; top banner for server action failure.

## 3) Dashboard Page
### Meta Information
- Title: “Dashboard | Calorie Dashboard”
- Description: “Track your calorie intake progress against your daily target.”

### Page Structure
- Desktop dashboard grid:
  - Row 1: header (full width)
  - Row 2: 3-column layout: Progress card (2 cols) + Quick Add card (1 col)
  - Row 3: Today’s entries table (full width)

### Sections & Components
1. Top navigation bar
   - Left: app name.
   - Right: user menu (shows name) + “Sign out”.
2. Progress card (primary)
   - Title: “Today’s Progress”.
   - Big number: “consumed / target kcal”.
   - Progress visualization: circular ring or horizontal bar.
   - Subtext: “Target calculated on {last_calculated_at}”.
3. Quick Add intake card
   - Field: calories (number).
   - Optional note (text, single line).
   - CTA: “Add”.
4. Today’s entries table/list
   - Columns: time, calories, note, actions.
   - Actions: delete entry (minimal control needed to correct mistakes).

### Responsive behavior
- Tablet/mobile: collapse to single column; progress visualization stays at top; quick add below; entries list becomes stacked cards.

### Accessibility
- Ensure form labels are explicit, focus states visible, and progress has text equivalent (e.g