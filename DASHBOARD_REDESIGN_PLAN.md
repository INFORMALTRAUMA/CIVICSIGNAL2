# Government Dashboard Redesign Plan

## Information Gathered:
- Current dashboard exists at `/app/gov-portal/dashboard/page.tsx` but is basic
- SHADCN components are fully configured and available (card, table, badge, progress, tabs, separator, button, select, calendar, skeleton)
- CSS variables are already set up for both light and dark modes
- Project uses Next.js with TypeScript and Clerk authentication
- Current styling uses neutral/slate colors but needs refinement for government standards

## Plan: Complete Dashboard Redesign

### Phase 1: Update CSS Variables for Government Standards
- **File**: `app/globals.css`
- Update CSS variables to match government color scheme:
  - Primary: Slate (#0f172a to #475569)
  - Background: Gray-50 (#f9fafb)
  - Surface: White (#ffffff)
  - Accent: Stone-700 (#44403c)
  - Status colors: Standard red-600, amber-500, emerald-600
- Remove gradients and shadows, use only subtle borders

### Phase 2: Create Professional Dashboard Components
- **File**: `components/gov-dashboard/`
- Create reusable components:
  - `metrics-card.tsx` - Key metrics with trend indicators
  - `priority-issues-table.tsx` - Professional table for priority issues
  - `ward-performance.tsx` - Ward analytics with tabs
  - `quick-actions.tsx` - Right sidebar for immediate actions
  - `control-bar.tsx` - Top control section with filters

### Phase 3: Redesign Main Dashboard Page
- **File**: `app/gov-portal/dashboard/page.tsx`
- Implement 8-section layout:
  1. **Page Header**: "Municipal Dashboard" with authority typography
  2. **Control Bar**: Ward selector, date picker, export buttons
  3. **Key Metrics Grid**: 4 professional cards (Total Issues, Resolution Time, Satisfaction, Team Capacity)
  4. **Priority Issues Section**: Table with top 10 critical issues
  5. **Ward Performance Section**: Tabs with ward metrics
  6. **Resolution Trends Chart**: Placeholder for analytics
  7. **Quick Actions Panel**: Right sidebar for immediate actions
  8. **Responsive Layout**: Desktop-optimized with mobile adaptation

### Phase 4: Add Professional Data & Interactions
- Mock realistic municipal data for all sections
- Implement hover states (subtle background changes)
- Add loading states with professional skeleton screens
- Include real-time update indicators
- Ensure dark mode compatibility

## Dependent Files to be Edited:
1. `app/globals.css` - CSS variable updates
2. `app/gov-portal/dashboard/page.tsx` - Complete redesign
3. New components in `components/gov-dashboard/` directory

## Follow-up Steps:
1. Test the dashboard at http://localhost:3000/gov-portal/dashboard
2. Verify responsive behavior across devices
3. Ensure dark mode functionality
4. Validate all interactive elements work properly
5. Test export functionality (PDF/CSV buttons)

## Success Criteria:
- Professional, institutional appearance
- Neutral color palette without bright colors
- All 8 layout sections implemented
- Desktop-optimized with mobile responsiveness
- Dark mode compatible
- Government-grade authority and trust conveyed
