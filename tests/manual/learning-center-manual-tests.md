# Learning Center Cleanup - Manual Test Cases

## Test Suite Overview

This document provides comprehensive manual test cases to validate the iPEC Coach Connect learning center cleanup. These tests should be performed by QA testers to ensure the cleanup was successful without breaking core functionality.

## Test Environment Setup

### Prerequisites
- Local development environment running at `http://localhost:5173`
- Test data populated in the database
- Browser developer tools available
- Screen reader software (optional but recommended)

### Test Browsers
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## 1. Navigation and Routing Tests

### Test Case 1.1: Desktop Navigation - Coaching Dropdown
**Objective**: Verify coaching dropdown shows all three new learning center links

**Steps**:
1. Navigate to homepage
2. Hover over "Coaching" in the main navigation
3. Verify dropdown appears
4. Check all three links are present:
   - About Coaching
   - Coaching Resources  
   - Coaching Basics
5. Click each link and verify navigation

**Expected Results**:
- ✅ Dropdown appears on hover
- ✅ All three links are visible with descriptions
- ✅ Links navigate to correct pages
- ✅ No old LMS links appear (Courses, My Learning, etc.)

**Test Data**: N/A

---

### Test Case 1.2: Mobile Navigation - Coaching Section
**Objective**: Verify mobile navigation includes collapsible coaching section

**Steps**:
1. Open site on mobile device or mobile viewport (375px width)
2. Tap hamburger menu button
3. Tap "Coaching" section to expand
4. Verify all three coaching links appear
5. Tap each link to test navigation
6. Verify menu closes after navigation

**Expected Results**:
- ✅ Mobile menu opens correctly
- ✅ Coaching section expands/collapses properly
- ✅ All three links are accessible
- ✅ Menu closes automatically after navigation

**Test Data**: N/A

---

### Test Case 1.3: Direct URL Access
**Objective**: Verify all new routes are accessible via direct URL

**Steps**:
1. Navigate directly to `/about-coaching`
2. Navigate directly to `/coaching-resources`
3. Navigate directly to `/coaching-basics`
4. Try old routes (should fail):
   - `/learning`
   - `/courses`
   - `/learning/courses`

**Expected Results**:
- ✅ New URLs load correctly
- ✅ Old URLs return 404 or redirect appropriately
- ✅ Page content matches the URL

**Test Data**: Direct URLs

---

### Test Case 1.4: Breadcrumb Navigation (if applicable)
**Objective**: Verify breadcrumb navigation reflects new structure

**Steps**:
1. Navigate to each learning center page
2. Check for breadcrumb navigation
3. Verify breadcrumb accuracy

**Expected Results**:
- ✅ Breadcrumbs show correct hierarchy
- ✅ No references to old learning structure

**Test Data**: N/A

---

## 2. Content Validation Tests

### Test Case 2.1: About Coaching Content
**Objective**: Verify About Coaching page contains appropriate content

**Steps**:
1. Navigate to `/about-coaching`
2. Verify page structure:
   - Main heading: "About Professional Coaching"
   - "What is Professional Coaching?" section
   - "Benefits of Professional Coaching" section (4 cards)
   - "The Coaching Process" section (4 steps)
   - "What Our Clients Say" section (testimonials)
   - CTA section at bottom
3. Check for coaching vs. therapy explanation
4. Verify testimonials have names, roles, and star ratings
5. Check CTAs point to `/coaches`

**Expected Results**:
- ✅ All sections present and properly formatted
- ✅ Content is informational, not course-oriented
- ✅ CTAs direct to coach discovery
- ✅ No LMS terminology (enroll, course, module progress)

**Test Data**: Static content

---

### Test Case 2.2: Coaching Resources Content
**Objective**: Verify Coaching Resources page displays resource library correctly

**Steps**:
1. Navigate to `/coaching-resources`
2. Verify page structure:
   - Main heading: "Coaching Resources"
   - Resource categories overview (5 categories)
   - Featured resources section (2 items)
   - All resources section (remaining items)
   - CTA section
3. Check resource types: articles, videos, worksheets
4. Verify metadata: author, read time/duration, views/downloads
5. Test resource buttons (should not actually download/play)
6. Check CTAs point to `/coaches`

**Expected Results**:
- ✅ Resources categorized properly
- ✅ Different resource types have appropriate icons/badges
- ✅ Metadata displays correctly
- ✅ Featured resources are highlighted
- ✅ No enrollment or course completion elements

**Test Data**: Static resource data

---

### Test Case 2.3: Coaching Basics Content
**Objective**: Verify Coaching Basics page shows course introduction properly

**Steps**:
1. Navigate to `/coaching-basics`
2. Verify hero section:
   - "Free Course" badge
   - Course metadata: 60 minutes, 3 modules, 1,500+ learners
   - CTA buttons to find coaches and view resources
3. Check course overview with learning objectives
4. Verify three modules with:
   - Module numbers and titles
   - Topic lists with checkmarks
   - Duration for each module
   - "Find a Coach" CTAs (not "Start Module")
5. Check sidebar:
   - Benefits of coaching
   - Success stories/testimonials
   - CTA to find perfect coach

**Expected Results**:
- ✅ Course presented as introduction, not active learning
- ✅ All CTAs direct to coach discovery
- ✅ No enrollment or progress tracking elements
- ✅ Content focuses on what coaching is, not learning modules

**Test Data**: Static course structure data

---

## 3. Call-to-Action and Business Logic Tests

### Test Case 3.1: Coach Discovery CTAs
**Objective**: Verify all CTAs properly direct users to coach discovery

**Steps**:
1. Visit each learning center page
2. Identify all primary and secondary CTAs
3. Click each CTA button/link
4. Verify destination is `/coaches`
5. Check CTA text is appropriate:
   - "Find Your Coach"
   - "Find a Coach" 
   - "Find Your Perfect Coach"
   - NOT "Enroll Now", "Start Course", etc.

**Expected Results**:
- ✅ All CTAs navigate to `/coaches`
- ✅ CTA text focuses on coach discovery
- ✅ No old LMS CTAs remain

**Test Data**: N/A

---

### Test Case 3.2: No LMS Functionality
**Objective**: Verify no LMS functionality remains accessible

**Steps**:
1. Search pages for LMS terminology:
   - "Enroll"
   - "My Learning"
   - "Course Progress"
   - "Complete Module"
   - "Get Certificate"
   - "Track Progress"
2. Look for progress bars, completion indicators
3. Check for user learning dashboards or profiles
4. Verify no course enrollment forms

**Expected Results**:
- ✅ No LMS terminology found
- ✅ No progress tracking elements
- ✅ No enrollment functionality
- ✅ Focus is on information and coach connection

**Test Data**: Content search

---

### Test Case 3.3: Resource Access
**Objective**: Verify resources are presented as informational, not part of LMS

**Steps**:
1. On Coaching Resources page, click resource buttons
2. Verify behavior:
   - Articles: Should indicate external link or show preview
   - Videos: Should indicate external link or embed
   - Worksheets: Should indicate download (PDF)
3. Check no user tracking or completion monitoring
4. Verify no prerequisites or course enrollment requirements

**Expected Results**:
- ✅ Resources accessible without login
- ✅ No completion tracking
- ✅ Resources presented as free materials
- ✅ No course enrollment gating

**Test Data**: Resource interaction

---

## 4. Mobile Responsiveness Tests

### Test Case 4.1: Mobile Layout Validation
**Objective**: Verify all learning center pages display correctly on mobile

**Steps**:
1. Test on multiple mobile viewports:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - Galaxy S8 (360x740)
   - iPad (768x1024)
2. For each page, verify:
   - Content is readable without horizontal scrolling
   - Images scale appropriately
   - Text remains legible
   - Touch targets are adequate size (min 44x44px)
   - Cards/sections stack properly

**Expected Results**:
- ✅ No horizontal scrolling required
- ✅ Content remains accessible and readable
- ✅ Touch targets are appropriately sized
- ✅ Layout adapts to different screen sizes

**Test Data**: Multiple device viewports

---

### Test Case 4.2: Bottom Navigation (Mobile)
**Objective**: Verify bottom navigation includes coaching section

**Steps**:
1. View learning center pages on mobile
2. Check bottom navigation bar
3. Verify "Coaching" item is present
4. Tap coaching item
5. Verify appropriate navigation (likely to `/about-coaching`)
6. Check active state styling

**Expected Results**:
- ✅ Bottom navigation visible and functional
- ✅ Coaching item present and tappable
- ✅ Active states work correctly
- ✅ Navigation works as expected

**Test Data**: Mobile interaction

---

### Test Case 4.3: Touch Interaction Testing
**Objective**: Verify all interactive elements work properly with touch

**Steps**:
1. On mobile device, test all buttons and links
2. Verify scroll behavior is smooth
3. Test pinch-to-zoom (should work for content)
4. Check dropdown/accordion animations
5. Test form inputs if present

**Expected Results**:
- ✅ All touch targets respond appropriately
- ✅ Scrolling is smooth and predictable
- ✅ Animations don't interfere with usability
- ✅ No touch responsiveness issues

**Test Data**: Touch interactions

---

## 5. Cross-Browser Compatibility Tests

### Test Case 5.1: Browser-Specific Testing
**Objective**: Verify consistent behavior across all supported browsers

**Steps**:
1. Test each learning center page in:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
2. For each browser, verify:
   - Layout consistency
   - Navigation functionality
   - Content display
   - CTA behavior
   - No JavaScript errors in console

**Expected Results**:
- ✅ Consistent appearance across browsers
- ✅ All functionality works in each browser
- ✅ No browser-specific errors
- ✅ Performance is acceptable

**Test Data**: Multi-browser testing

---

### Test Case 5.2: Progressive Enhancement
**Objective**: Verify site works with JavaScript disabled

**Steps**:
1. Disable JavaScript in browser
2. Navigate to each learning center page
3. Test basic navigation
4. Verify content is still accessible
5. Check that core information is available

**Expected Results**:
- ✅ Content remains accessible without JavaScript
- ✅ Basic navigation works
- ✅ Information is still meaningful
- ✅ Graceful degradation occurs

**Test Data**: No-JavaScript environment

---

## 6. Performance and Loading Tests

### Test Case 6.1: Page Load Performance
**Objective**: Verify acceptable loading times for learning center pages

**Steps**:
1. Use browser dev tools Network tab
2. Load each learning center page
3. Record load times:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Total load time
4. Test on throttled connections (Slow 3G)
5. Verify loading states are appropriate

**Expected Results**:
- ✅ FCP under 1.5 seconds
- ✅ LCP under 2.5 seconds  
- ✅ Acceptable performance on slow connections
- ✅ Loading states provide user feedback

**Test Data**: Performance metrics

---

### Test Case 6.2: Image Optimization
**Objective**: Verify images load efficiently and display correctly

**Steps**:
1. Check all images on learning center pages
2. Verify appropriate file formats (WebP, JPEG, PNG)
3. Test image loading on slow connections
4. Check for lazy loading behavior
5. Verify responsive image behavior

**Expected Results**:
- ✅ Images optimized for web
- ✅ Appropriate loading strategies
- ✅ Images display correctly at all sizes
- ✅ No broken or missing images

**Test Data**: Image performance analysis

---

## 7. Accessibility Manual Tests

### Test Case 7.1: Keyboard Navigation
**Objective**: Verify complete keyboard accessibility

**Steps**:
1. Navigate each learning center page using only keyboard
2. Use Tab to move forward, Shift+Tab to move backward
3. Test Enter/Space key activation of buttons and links
4. Verify focus indicators are clearly visible
5. Check focus order is logical
6. Test Escape key for closing modals/dropdowns

**Expected Results**:
- ✅ All interactive elements reachable via keyboard
- ✅ Focus indicators clearly visible
- ✅ Logical tab order
- ✅ All functionality available via keyboard

**Test Data**: Keyboard-only interaction

---

### Test Case 7.2: Screen Reader Testing
**Objective**: Verify compatibility with screen reader software

**Steps**:
1. Use screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate each learning center page
3. Verify:
   - Headings are announced correctly
   - Images have appropriate alt text
   - Links have descriptive text
   - Form elements have proper labels
   - Page landmarks are identified
4. Test reading order is logical

**Expected Results**:
- ✅ Content announced clearly and logically
- ✅ Navigation is understandable
- ✅ All important information is accessible
- ✅ No confusing or missing announcements

**Test Data**: Screen reader interaction

---

### Test Case 7.3: Color and Contrast
**Objective**: Verify sufficient color contrast and no color-only information

**Steps**:
1. Use color contrast analyzer tools
2. Check all text against background colors
3. Verify minimum 4.5:1 contrast ratio for normal text
4. Verify minimum 3:1 contrast ratio for large text
5. Check that information isn't conveyed by color alone
6. Test with color blindness simulators

**Expected Results**:
- ✅ All text meets contrast requirements
- ✅ Information available without color perception
- ✅ Interface usable with color blindness
- ✅ No accessibility barriers due to color choices

**Test Data**: Contrast measurements

---

## 8. Error Handling and Edge Cases

### Test Case 8.1: Network Failure Handling
**Objective**: Verify graceful handling of network issues

**Steps**:
1. Simulate slow/intermittent network connection
2. Load learning center pages
3. Test behavior when:
   - Images fail to load
   - CSS fails to load
   - JavaScript fails to load
   - API calls timeout
4. Verify appropriate error messages or fallback content

**Expected Results**:
- ✅ Pages remain functional with network issues
- ✅ Appropriate fallback content displayed
- ✅ Error states are user-friendly
- ✅ No crashes or broken layouts

**Test Data**: Network simulation

---

### Test Case 8.2: Browser Feature Support
**Objective**: Verify handling of unsupported browser features

**Steps**:
1. Test in older browsers (if supported)
2. Disable specific browser features:
   - Local storage
   - Session storage
   - Modern CSS features
   - Modern JavaScript features
3. Verify fallback behavior
4. Check console for polyfill loading

**Expected Results**:
- ✅ Site remains usable with limited browser support
- ✅ Appropriate fallbacks activate
- ✅ No critical functionality breaks
- ✅ User experience degrades gracefully

**Test Data**: Feature detection testing

---

## 9. Integration Testing

### Test Case 9.1: Navigation Integration
**Objective**: Verify learning center integrates properly with main site navigation

**Steps**:
1. Start from homepage
2. Navigate to learning center via main menu
3. Navigate between learning center pages
4. Navigate back to main site sections
5. Test breadcrumb navigation (if present)
6. Verify URL structure is consistent

**Expected Results**:
- ✅ Seamless navigation between sections
- ✅ Consistent navigation patterns
- ✅ URL structure is logical
- ✅ No broken navigation paths

**Test Data**: Navigation flow

---

### Test Case 9.2: Search Integration (if applicable)
**Objective**: Verify site search includes learning center content

**Steps**:
1. Use site search functionality
2. Search for terms related to coaching/learning
3. Verify learning center pages appear in results
4. Test search result navigation
5. Check search result descriptions are accurate

**Expected Results**:
- ✅ Learning center content is searchable
- ✅ Search results are relevant and accurate
- ✅ Search result navigation works correctly
- ✅ Content descriptions are helpful

**Test Data**: Search queries

---

## 10. Regression Testing

### Test Case 10.1: Existing Functionality Verification
**Objective**: Verify cleanup hasn't broken existing site functionality

**Steps**:
1. Test core site functionality:
   - User authentication
   - Coach discovery and booking
   - Community features
   - Profile management
   - Settings pages
2. Verify no broken links to learning center
3. Check for JavaScript errors in console
4. Test major user workflows

**Expected Results**:
- ✅ All existing functionality works as before
- ✅ No new JavaScript errors introduced
- ✅ No broken links or missing pages
- ✅ User workflows remain intact

**Test Data**: Existing site functionality

---

### Test Case 10.2: Database Integrity
**Objective**: Verify no data corruption or missing references

**Steps**:
1. Check for any references to old learning center data
2. Verify user profiles don't reference deleted course data
3. Test any analytics or tracking related to learning
4. Check for orphaned data or broken relationships

**Expected Results**:
- ✅ No broken data references
- ✅ User data remains intact
- ✅ No orphaned database records
- ✅ Analytics continue to work properly

**Test Data**: Database verification

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Development environment running
- [ ] Test browsers available
- [ ] Screen reader software installed (optional)
- [ ] Network throttling tools available
- [ ] Accessibility testing tools available

### Test Execution
- [ ] All navigation tests completed
- [ ] All content validation tests completed
- [ ] All CTA and business logic tests completed
- [ ] All mobile responsiveness tests completed
- [ ] All cross-browser tests completed
- [ ] All performance tests completed
- [ ] All accessibility tests completed
- [ ] All error handling tests completed
- [ ] All integration tests completed
- [ ] All regression tests completed

### Post-Test Activities
- [ ] Document all issues found
- [ ] Prioritize issues by severity
- [ ] Verify fixes for critical issues
- [ ] Update test cases based on findings
- [ ] Sign off on learning center cleanup

---

## Issue Reporting Template

When issues are found during testing, use the following template:

**Issue ID**: LC-[number]
**Test Case**: [Reference to test case]
**Severity**: Critical/High/Medium/Low
**Browser/Device**: [Browser version and/or device]
**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**: What should happen
**Actual Result**: What actually happened
**Screenshot/Video**: [If applicable]

**Additional Notes**: Any other relevant information

---

## Success Criteria

The learning center cleanup is considered successful when:

1. ✅ All new learning center pages load correctly
2. ✅ Navigation has been updated to reflect new structure
3. ✅ All CTAs direct users to coach discovery
4. ✅ No old LMS functionality remains accessible
5. ✅ Mobile responsiveness works across all devices
6. ✅ Accessibility standards are met
7. ✅ Performance is acceptable across all browsers
8. ✅ No existing functionality has been broken
9. ✅ TypeScript compilation is successful
10. ✅ All automated tests pass

**Test Sign-off**: 
- QA Lead: _________________ Date: _________
- Product Manager: _________________ Date: _________
- Technical Lead: _________________ Date: _________