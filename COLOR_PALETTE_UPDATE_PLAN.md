# Professional Color Palette Update Plan

## Information Gathered:
- Current dashboard uses slate/gray color scheme which is good foundation
- Found indigo references in `components/ui/steps.tsx` that need removal
- Global CSS already has professional government color scheme
- Dark mode uses slate colors but may need refinement for complete neutrality
- All components use CSS variables properly for theming

## Plan: Complete Neutral Color Palette Update

### Phase 1: Update Global CSS Variables for Complete Neutrality
- **File**: `app/globals.css`
- Remove any blue undertones from dark mode
- Ensure all colors are strictly neutral (grays, slate, stone, neutral)
- Focus on:
  - Light mode: Keep current professional grays and slate
  - Dark mode: Use only cool grays and slate, NO blue undertones
  - Ensure all status colors remain functional (red, amber, emerald)

### Phase 2: Remove Blue References from UI Components
- **File**: `components/ui/steps.tsx`
- Replace indigo colors with neutral slate/stone alternatives
- Update both border and text colors to match neutral palette

### Phase 3: Verify Component Color Usage
- Review all dashboard components for any blue usage
- Ensure consistent neutral theming across all components
- Update any hardcoded blue references

### Phase 4: Test Dark Mode Completely
- Verify NO blue shades appear in dark mode
- Ensure professional, institutional appearance
- Test all interactive states and variants

## Specific Color Changes:

### Current Issues:
- `components/ui/steps.tsx` has indigo references
- Dark mode may have subtle blue undertones in some variables

### Proposed Neutral Color Palette:
**Light Mode** (keep current):
- Background: Gray-50 (#f9fafb)
- Foreground: Slate-900 (#0f172a)
- Primary: Slate-700 (#44403c)
- Secondary: Gray-100
- Borders: Gray-200

**Dark Mode** (update for complete neutrality):
- Background: Pure Slate-900 (#0f172a)
- Foreground: Gray-50 (#f9fafb)
- Primary: Gray-100 (#f3f4f6)
- Secondary: Stone-700 (#44403c)
- Borders: Gray-800 (#1f2937)

### Status Colors (keep functional):
- Destructive: Red-600/700
- Warning: Amber-500/600
- Success: Emerald-600/700

## Dependent Files to be Edited:
1. `app/globals.css` - Update dark mode color variables
2. `components/ui/steps.tsx` - Replace indigo with neutral colors

## Success Criteria:
- Zero blue shades in dark mode
- Professional, institutional government appearance
- Complete neutral color palette
- All status colors remain functional
- Consistent theming across all components
