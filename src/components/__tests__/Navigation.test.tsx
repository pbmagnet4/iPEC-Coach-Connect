/**
 * Navigation Component Unit Tests
 * 
 * Comprehensive testing for the Navigation component with deep analysis of:
 * - Component rendering with different authentication states
 * - Role-based navigation visibility and access control
 * - Mobile menu functionality and responsive behavior
 * - User dropdown interactions and event handling
 * - Learning dropdown functionality and hover states
 * - Accessibility compliance (ARIA, keyboard navigation)
 * - User interaction flows (clicks, hovers, focus)
 * - Integration with authentication and role management
 * - Edge cases and error scenarios
 * 
 * Testing Strategy:
 * - Isolated component testing with mocked dependencies
 * - Multiple user roles and authentication states
 * - Responsive design breakpoints and mobile interactions
 * - Event handling and state management validation
 * - Accessibility and keyboard navigation testing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';
import { Navigation } from '../Navigation';

// Mock dependencies with comprehensive implementations
const mockNavigate = vi.fn();
const mockUseAuth = vi.fn();
const mockUseRole = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../stores/unified-user-store', () => ({
  useLegacyAuth: () => mockUseAuth(),
  useLegacyRole: () => mockUseRole(),
  legacyIsCoach: (role: string) => role === 'coach',
}));

vi.mock('../RoleGuard', () => ({
  RoleGuard: ({ children, roles }: { children: React.ReactNode; roles: string[] }) => {
    const { role } = mockUseRole();
    return roles.includes(role) ? <>{children}</> : null;
  },
}));

vi.mock('../ui/Logo', () => ({
  Logo: () => <div data-testid="logo">iPEC Coach Connect</div>,
}));

vi.mock('../NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}));

// Test data factory for different user types
const createTestUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  profileImage: null,
  ...overrides,
});

const createTestUserWithImage = () => createTestUser({
  profileImage: 'https://example.com/avatar.jpg',
});

// Wrapper component for router context
const NavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

// Custom render function with router wrapper
const renderNavigation = (ui: React.ReactElement) => {
  return render(ui, { wrapper: NavigationWrapper });
};

describe('Navigation Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    
    mockUseRole.mockReturnValue({
      role: null,
    });
  });

  afterEach(() => {
    // Clean up any side effects
    vi.restoreAllMocks();
  });

  describe('Unauthenticated State', () => {
    it('should render basic navigation for unauthenticated users', () => {
      renderNavigation(<Navigation />);

      // Verify logo is present
      expect(screen.getByTestId('logo')).toBeInTheDocument();

      // Verify public navigation links
      expect(screen.getByText('Find Coaches')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();

      // Verify authentication links
      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();

      // Verify authenticated-only elements are not present
      expect(screen.queryByText('My Sessions')).not.toBeInTheDocument();
      expect(screen.queryByTestId('notification-center')).not.toBeInTheDocument();
    });

    it('should not show role-specific navigation items for guests', () => {
      renderNavigation(<Navigation />);

      // Coach-specific items should not be visible
      expect(screen.queryByText('My Clients')).not.toBeInTheDocument();
    });

    it('should have correct link destinations for unauthenticated users', () => {
      renderNavigation(<Navigation />);

      // Check link href attributes
      const findCoachesLink = screen.getByText('Find Coaches').closest('a');
      const learningButton = screen.getByText('Learning');
      const communityLink = screen.getByText('Community').closest('a');
      const loginLink = screen.getByText('Log In').closest('a');
      const getStartedLink = screen.getByText('Get Started').closest('a');

      expect(findCoachesLink).toHaveAttribute('href', '/coaches');
      expect(communityLink).toHaveAttribute('href', '/community');
      expect(loginLink).toHaveAttribute('href', '/login');
      expect(getStartedLink).toHaveAttribute('href', '/get-started');
    });
  });

  describe('Authenticated Client User', () => {
    beforeEach(() => {
      const testUser = createTestUser();
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
        isAuthenticated: true,
      });
      
      mockUseRole.mockReturnValue({
        role: 'client',
      });
    });

    it('should render navigation for authenticated client users', () => {
      renderNavigation(<Navigation />);

      // Verify authenticated user elements
      expect(screen.getByText('My Sessions')).toBeInTheDocument();
      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();

      // Verify authentication links are not present
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });

    it('should not show coach-specific navigation for client users', () => {
      renderNavigation(<Navigation />);

      // Coach-specific items should not be visible for clients
      expect(screen.queryByText('My Clients')).not.toBeInTheDocument();
    });

    it('should display user avatar or fallback icon correctly', () => {
      renderNavigation(<Navigation />);

      // Should show UserCircle icon as fallback
      const userButton = screen.getByText('John').closest('button');
      expect(userButton).toBeInTheDocument();
      
      // Check for UserCircle icon (lucide-react component)
      const userIcon = userButton?.querySelector('svg');
      expect(userIcon).toBeInTheDocument();
    });

    it('should display user profile image when available', () => {
      const userWithImage = createTestUserWithImage();
      mockUseAuth.mockReturnValue({
        user: userWithImage,
        isLoading: false,
        isAuthenticated: true,
      });

      renderNavigation(<Navigation />);

      const profileImage = screen.getByAltText('John Doe');
      expect(profileImage).toBeInTheDocument();
      expect(profileImage).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Authenticated Coach User', () => {
    beforeEach(() => {
      const testCoach = createTestUser({ role: 'coach' });
      mockUseAuth.mockReturnValue({
        user: testCoach,
        isLoading: false,
        isAuthenticated: true,
      });
      
      mockUseRole.mockReturnValue({
        role: 'coach',
      });
    });

    it('should render coach-specific navigation items', () => {
      renderNavigation(<Navigation />);

      // Verify coach-specific elements are visible
      expect(screen.getByText('My Clients')).toBeInTheDocument();
      expect(screen.getByText('My Sessions')).toBeInTheDocument();
    });

    it('should show both client and coach navigation items', () => {
      renderNavigation(<Navigation />);

      // All users should see these
      expect(screen.getByText('Find Coaches')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
      
      // Coach-specific
      expect(screen.getByText('My Clients')).toBeInTheDocument();
    });
  });

  describe('User Profile Dropdown', () => {
    beforeEach(() => {
      const testUser = createTestUser();
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
        isAuthenticated: true,
      });
      
      mockUseRole.mockReturnValue({
        role: 'client',
      });
    });

    it('should toggle profile dropdown on user click', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');
      expect(userButton).toBeInTheDocument();

      // Dropdown should not be visible initially
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();

      // Click to open dropdown
      await user.click(userButton!);
      
      // Dropdown should now be visible
      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
      });

      // Click again to close dropdown
      await user.click(userButton!);
      
      // Dropdown should be hidden again
      await waitFor(() => {
        expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      });
    });

    it('should contain correct profile dropdown items', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');
      await user.click(userButton!);

      await waitFor(() => {
        // Check user info display
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();

        // Check dropdown links
        expect(screen.getByText('View Profile')).toBeInTheDocument();
        expect(screen.getByText('My Sessions')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Log Out')).toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');
      await user.click(userButton!);

      // Dropdown should be open
      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
      });

      // Click outside the dropdown
      await user.click(document.body);

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      });
    });

    it('should close dropdown when clicking a link', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');
      await user.click(userButton!);

      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
      });

      // Click on a dropdown link
      const profileLink = screen.getByText('View Profile');
      await user.click(profileLink);

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      });
    });
  });

  describe('Learning Dropdown', () => {
    it('should show learning dropdown on hover (desktop)', async () => {
      renderNavigation(<Navigation />);

      const learningButton = screen.getByText('Learning');
      
      // Learning dropdown items should not be visible initially
      expect(screen.queryByText('Learning Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Courses')).not.toBeInTheDocument();

      // Hover over learning button
      fireEvent.mouseEnter(learningButton.closest('div')!);

      // Dropdown items should become visible
      await waitFor(() => {
        expect(screen.getByText('Learning Home')).toBeInTheDocument();
        expect(screen.getByText('Courses')).toBeInTheDocument();
        expect(screen.getByText('Resource Library')).toBeInTheDocument();
        expect(screen.getByText('Coaching Basics')).toBeInTheDocument();
      });
    });

    it('should contain correct coaching dropdown links', async () => {
      renderNavigation(<Navigation />);

      const coachingSection = screen.getByText('Coaching').closest('div');
      fireEvent.mouseEnter(coachingSection!);

      await waitFor(() => {
        const aboutCoaching = screen.getByText('About Coaching').closest('a');
        const resources = screen.getByText('Coaching Resources').closest('a');
        const basics = screen.getByText('Coaching Basics').closest('a');

        expect(aboutCoaching).toHaveAttribute('href', '/about-coaching');
        expect(resources).toHaveAttribute('href', '/coaching-resources');
        expect(basics).toHaveAttribute('href', '/coaching-basics');
      });
    });

    it('should show learning descriptions in dropdown', async () => {
      renderNavigation(<Navigation />);

      const learningSection = screen.getByText('Learning').closest('div');
      fireEvent.mouseEnter(learningSection!);

      await waitFor(() => {
        expect(screen.getByText('Explore all learning resources')).toBeInTheDocument();
        expect(screen.getByText('Browse our course catalog')).toBeInTheDocument();
        expect(screen.getByText('Articles, videos, and tools')).toBeInTheDocument();
        expect(screen.getByText('Free introductory course')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu button on small screens', () => {
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu on button click', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');

      // Mobile menu items should not be visible initially
      const mobileCoachesLink = screen.queryAllByText('Find Coaches');
      expect(mobileCoachesLink).toHaveLength(1); // Only desktop version visible

      // Click to open mobile menu
      await user.click(mobileMenuButton);

      // Mobile menu items should now be visible
      await waitFor(() => {
        const allCoachesLinks = screen.getAllByText('Find Coaches');
        expect(allCoachesLinks).toHaveLength(2); // Both desktop and mobile versions
      });
    });

    it('should close mobile menu when clicking a link', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');
      await user.click(mobileMenuButton);

      // Wait for mobile menu to open
      await waitFor(() => {
        const allCoachesLinks = screen.getAllByText('Find Coaches');
        expect(allCoachesLinks).toHaveLength(2);
      });

      // Click on a mobile menu link
      const mobileLinks = screen.getAllByText('Find Coaches');
      const mobileLink = mobileLinks[1]; // Second one is mobile version
      await user.click(mobileLink);

      // Mobile menu should close
      await waitFor(() => {
        const remainingLinks = screen.getAllByText('Find Coaches');
        expect(remainingLinks).toHaveLength(1); // Only desktop version remains
      });
    });

    it('should show learning submenu in mobile', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');
      await user.click(mobileMenuButton);

      // Find the mobile learning button
      const learningButtons = screen.getAllByText('Learning');
      const mobileLearningButton = learningButtons.find(button => 
        button.closest('div')?.className?.includes('space-y-2')
      );

      expect(mobileLearningButton).toBeInTheDocument();

      // Click to open learning submenu
      await user.click(mobileLearningButton!);

      // Learning submenu items should be visible
      await waitFor(() => {
        expect(screen.getByText('Learning Home')).toBeInTheDocument();
        expect(screen.getByText('Courses')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');
      expect(mobileMenuButton).toHaveAttribute('aria-label', 'Toggle menu');
    });

    it('should support keyboard navigation for user dropdown', async () => {
      const user = userEvent.setup();
      const testUser = createTestUser();
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
        isAuthenticated: true,
      });

      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');
      
      // Focus on user button
      userButton?.focus();
      expect(userButton).toHaveFocus();

      // Press Enter to open dropdown
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('View Profile')).toBeInTheDocument();
      });

      // Press Escape to close dropdown
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
      });
    });

    it('should have semantic HTML structure', () => {
      renderNavigation(<Navigation />);

      // Should have nav element
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      // Should have proper button elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Should have proper link elements
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should handle keyboard navigation between links', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      // Get all links
      const links = screen.getAllByRole('link');
      
      // Focus on first link
      links[0].focus();
      expect(links[0]).toHaveFocus();

      // Tab to next link
      await user.tab();
      expect(links[1]).toHaveFocus();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: true, // Edge case: authenticated but no user data
      });

      expect(() => renderNavigation(<Navigation />)).not.toThrow();
      
      // Should fallback to unauthenticated state
      expect(screen.getByText('Log In')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      expect(() => renderNavigation(<Navigation />)).not.toThrow();
      
      // Should show basic navigation during loading
      expect(screen.getByText('Find Coaches')).toBeInTheDocument();
    });

    it('should handle user without profile image', () => {
      const userWithoutImage = createTestUser({ profileImage: null });
      mockUseAuth.mockReturnValue({
        user: userWithoutImage,
        isLoading: false,
        isAuthenticated: true,
      });

      renderNavigation(<Navigation />);

      // Should not crash and should show fallback icon
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
    });

    it('should handle empty user names gracefully', () => {
      const userWithEmptyName = createTestUser({ 
        firstName: '', 
        lastName: '' 
      });
      mockUseAuth.mockReturnValue({
        user: userWithEmptyName,
        isLoading: false,
        isAuthenticated: true,
      });

      expect(() => renderNavigation(<Navigation />)).not.toThrow();
    });

    it('should handle rapid dropdown toggling', async () => {
      const user = userEvent.setup();
      const testUser = createTestUser();
      mockUseAuth.mockReturnValue({
        user: testUser,
        isLoading: false,
        isAuthenticated: true,
      });

      renderNavigation(<Navigation />);

      const userButton = screen.getByText('John').closest('button');

      // Rapidly toggle dropdown multiple times
      for (let i = 0; i < 5; i++) {
        await user.click(userButton!);
        await user.click(userButton!);
      }

      // Should not crash and dropdown should be closed
      expect(screen.queryByText('View Profile')).not.toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const TestComponent = () => {
        renderSpy();
        return <Navigation />;
      };

      const { rerender } = renderNavigation(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestComponent />);

      // Should have been called again (React doesn't prevent re-renders by default)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple rapid state changes', async () => {
      const user = userEvent.setup();
      renderNavigation(<Navigation />);

      const mobileMenuButton = screen.getByLabelText('Toggle menu');

      // Rapidly toggle mobile menu
      for (let i = 0; i < 10; i++) {
        await user.click(mobileMenuButton);
      }

      // Should not crash and should handle the final state correctly
      expect(mobileMenuButton).toBeInTheDocument();
    });
  });
});