# Citizen Dashboard Complete Layout Implementation Plan

## Objective
Implement the exact citizen dashboard layout as specified, following the government portal design principles with professional styling and comprehensive functionality.

## Phase 1: Create New Navigation Component
### Create `components/citizen-dashboard/citizen-navigation.tsx`
- Fixed position top navigation bar
- Left: Logo + "Civic Signal" text  
- Center: Search input (40% width) with search icon
- Right: User avatar dropdown + notification bell + settings gear
- Responsive design with mobile hamburger menu
- Dark mode support

## Phase 2: Create Left Sidebar Components
### Create `components/citizen-dashboard/user-profile.tsx`
- Large avatar (centered)
- User name display
- Civic score badge with progress
- Ward number display
- Joined date
- Professional card layout

### Create `components/citizen-dashboard/quick-stats.tsx`
- Total issues reported (number)
- Total upvotes given (number) 
- Issues resolved (number)
- Contribution rank
- Grid layout with icons

### Create `components/citizen-dashboard/navigation-menu.tsx`
- Navigation items: Dashboard, Report Issue, Browse Issues, My Reports, Upvoted Issues, Notifications, Profile, Logout
- Active state indicators
- Icons for each item
- Responsive design

## Phase 3: Create Main Content Area Components
### Update `components/citizen-dashboard/welcome-section.tsx`
- "Welcome back, [Name]" heading
- Today's date display
- Weather widget placeholder
- Quick tip/notification alert
- Professional styling

### Create `components/citizen-dashboard/active-issues-grid.tsx`
- 2x2 grid layout for desktop
- Card 1: "Issues You Reported" - count, recent list, "View All" button
- Card 2: "Issues You Upvoted" - count, recent list, "View All" button  
- Card 3: "Nearby Issues" - count, map thumbnail, "View Map" button
- Card 4: "Trending Issues" - top 3 issues, "See All Trending" button
- Responsive stacking on mobile

### Update `components/citizen-dashboard/activity-feed.tsx`
- Recent activities table/list format
- Timestamp, Action, Issue title, Status change
- Pagination controls
- Filter by activity type
- Professional table styling

### Create `components/citizen-dashboard/category-chart.tsx`
- Horizontal bar chart placeholder
- Issue distribution by category in user's ward
- Category legend
- Professional chart styling

## Phase 4: Create Right Sidebar Components  
### Update `components/citizen-dashboard/quick-actions.tsx`
- Large "Report Issue" button (primary styling)
- "Upload Photo" button
- "Check for Updates" button  
- "Invite Neighbor" button
- Professional button styling

### Create `components/citizen-dashboard/notifications-panel.tsx`
- Unread notifications count badge
- List of 5 most recent notifications
- "Mark All Read" button
- "View All Notifications" link
- Notification types: status updates, comments, upvotes, system

### Create `components/citizen-dashboard/ward-info.tsx`
- Ward number and name
- Councilor contact info
- Meeting schedule
- Emergency contacts
- Professional information card

### Create `components/citizen-dashboard/achievement-badges.tsx`
- Grid of 6 earned badges
- Progress to next badge
- "View All Badges" link
- Badge icons and progress indicators

## Phase 5: Create Mobile Components
### Create `components/citizen-dashboard/mobile-bottom-nav.tsx`
- Fixed bottom navigation for mobile only
- 5 icons: Home, Report (camera), Map (location), Notifications (bell), Profile (user)
- Active state indicators
- iOS-style bottom navigation

## Phase 6: Create Modal Components
### Create `components/citizen-dashboard/report-modal.tsx`
- 3-step form overlay
- Step 1: Category selection (grid of icons)
- Step 2: Photo upload + description  
- Step 3: Location confirmation + submit
- Professional modal styling
- Progress indicators

### Create `components/citizen-dashboard/notification-drawer.tsx`
- Slide-in from right
- Full notification history
- Filter by type
- Notification preferences settings

## Phase 7: Main Dashboard Page Restructure
### Update `app/(citizen)/citizen-dashboard/page.tsx`
- Implement exact 3-column layout (20%-60%-20%)
- Desktop: Full 3-column layout
- Tablet (768-1024px): Hide right sidebar, expand main content to 80%
- Mobile (<768px): Single column, hamburger menu, bottom nav
- Integrate all new components
- Implement component hierarchy as specified
- Add loading states and empty states
- Professional government-grade styling

## Phase 8: Styling and Responsiveness
### Update `app/globals.css`
- Implement responsive breakpoints
- Ensure professional color scheme
- Dark mode compatibility
- Smooth transitions and hover states
- Government-grade typography

## Phase 9: Data Integration
### Mock Data Structure
- User profile data
- Issue tracking data
- Activity feed data  
- Notification data
- Achievement data
- Ward information data

## Phase 10: Testing and Validation
- Test responsive breakpoints
- Validate dark mode implementation
- Check accessibility standards
- Performance optimization
- Cross-browser compatibility

## Component Hierarchy Implementation
```
<Page>
  <CitizenNavigation />
  <MainLayout>
    <LeftSidebar>
      <UserProfile />
      <QuickStats />
      <NavigationMenu />
    </LeftSidebar>
    
    <MainContent>
      <WelcomeSection />
      <ActiveIssuesGrid />
      <ActivityFeed />
      <CategoryChart />
    </MainContent>
    
    <RightSidebar>
      <QuickActions />
      <NotificationsPanel />
      <WardInfo />
      <AchievementBadges />
    </RightSidebar>
  </MainLayout>
  
  <MobileBottomNav />
  <ReportModal />
  <NotificationDrawer />
</Page>
```

## Key Features to Implement
- Exact 3-column layout with specified percentages
- Professional government-grade styling
- Comprehensive responsive design
- Dark mode support throughout
- Modal and drawer components
- Professional data visualization
- Accessibility compliance
- Performance optimization

## Success Criteria
- Layout matches exact specifications
- Professional appearance matching government portal
- Fully responsive across all breakpoints
- Dark mode implementation
- All interactive elements functional
- Government-grade authority and trust conveyed
- Accessibility standards met

## Timeline
- Phase 1-2: Navigation and sidebar components (Foundation)
- Phase 3-4: Main content and right sidebar (Core functionality)  
- Phase 5-6: Mobile and modal components (Enhanced UX)
- Phase 7: Main page integration (Complete layout)
- Phase 8-10: Styling, data, and testing (Polish and validation)

This plan will create the exact citizen dashboard layout as specified, with professional styling and comprehensive functionality.
