/**
 * Test Suite for AuthAwareWrapper Components
 * 
 * Tests authentication-aware wrapper components that provide conditional
 * rendering and progressive disclosure based on user authentication state.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  AuthAwareBanner,
  AuthAwareWrapper,
  ConditionalAction,
  ProgressiveContent,
  useAuthAwareActions,
  withAuthAwareness
} from '../AuthAwareWrapper';
import { useUnifiedUserStore } from '../../../stores/unified-user-store';

// Mock the unified user store
  void jest.mock('../../../stores/unified-user-store');
const mockUseUnifiedUserStore = useUnifiedUserStore as jest.MockedFunction<typeof useUnifiedUserStore>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthAwareWrapper Component', () => {
  const mockChildren = <div>Protected Content</div>;
  const mockFallback = <div>Please sign in</div>;

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });
    });

    it('shows fallback content when provided', () => {
      renderWithRouter(
        <AuthAwareWrapper fallback={mockFallback}>
          {mockChildren}
        </AuthAwareWrapper>
      );

      expect(screen.getByText('Please sign in')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('shows children when no fallback provided', () => {
      renderWithRouter(
        <AuthAwareWrapper>
          {mockChildren}
        </AuthAwareWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('shows loading state when specified', () => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRouter(
        <AuthAwareWrapper showLoading={true}>
          {mockChildren}
        </AuthAwareWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('shows children content', () => {
      renderWithRouter(
        <AuthAwareWrapper fallback={mockFallback}>
          {mockChildren}
        </AuthAwareWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByText('Please sign in')).not.toBeInTheDocument();
    });
  });
});

describe('ConditionalAction Component', () => {
  const mockAction = <button>Perform Action</button>;

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasRole: jest.fn(),
        hasAnyRole: jest.fn(),
        checkPermission: jest.fn(),
      });
    });

    it('replaces action with auth prompt when replaceWithPrompt is true', () => {
      renderWithRouter(
        <ConditionalAction
          authAction="like"
          replaceWithPrompt={true}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.queryByText('Perform Action')).not.toBeInTheDocument();
      expect(screen.getByText('Show appreciation')).toBeInTheDocument();
    });

    it('shows both action and prompt when replaceWithPrompt is false', () => {
      renderWithRouter(
        <ConditionalAction
          authAction="like"
          replaceWithPrompt={false}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.getByText('Perform Action')).toBeInTheDocument();
      expect(screen.getByText('Show appreciation')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockHasAnyRole = jest.fn();
    const mockCheckPermission = jest.fn();

    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasRole: jest.fn(),
        hasAnyRole: mockHasAnyRole,
        checkPermission: mockCheckPermission,
      });
    });

    it('shows action when user has required roles', () => {
  void mockHasAnyRole.mockReturnValue(true);

      renderWithRouter(
        <ConditionalAction
          authAction="like"
          requiredRoles={['client']}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.getByText('Perform Action')).toBeInTheDocument();
    });

    it('hides action when user lacks required roles', () => {
  void mockHasAnyRole.mockReturnValue(false);

      renderWithRouter(
        <ConditionalAction
          authAction="like"
          requiredRoles={['admin']}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.queryByText('Perform Action')).not.toBeInTheDocument();
    });

    it('shows action when user has required permissions', () => {
  void mockCheckPermission.mockReturnValue(true);

      renderWithRouter(
        <ConditionalAction
          authAction="like"
          requiredPermissions={['posts:like']}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.getByText('Perform Action')).toBeInTheDocument();
    });

    it('hides action when user lacks required permissions', () => {
  void mockCheckPermission.mockReturnValue(false);

      renderWithRouter(
        <ConditionalAction
          authAction="like"
          requiredPermissions={['posts:delete']}
        >
          {mockAction}
        </ConditionalAction>
      );

      expect(screen.queryByText('Perform Action')).not.toBeInTheDocument();
    });
  });
});

describe('ProgressiveContent Component', () => {
  const publicContent = <div>Public Content</div>;
  const authenticatedContent = <div>Authenticated Content</div>;
  const roleBasedContent = [{
    roles: ['admin'],
    content: <div>Admin Only Content</div>
  }];

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasAnyRole: jest.fn(),
      });
    });

    it('shows only public content', () => {
      renderWithRouter(
        <ProgressiveContent
          publicContent={publicContent}
          authenticatedContent={authenticatedContent}
          roleBasedContent={roleBasedContent}
        />
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(screen.queryByText('Authenticated Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockHasAnyRole = jest.fn();

    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasAnyRole: mockHasAnyRole,
      });
    });

    it('shows public and authenticated content', () => {
      renderWithRouter(
        <ProgressiveContent
          publicContent={publicContent}
          authenticatedContent={authenticatedContent}
        />
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(screen.getByText('Authenticated Content')).toBeInTheDocument();
    });

    it('shows role-based content when user has required role', () => {
  void mockHasAnyRole.mockReturnValue(true);

      renderWithRouter(
        <ProgressiveContent
          publicContent={publicContent}
          roleBasedContent={roleBasedContent}
        />
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(screen.getByText('Admin Only Content')).toBeInTheDocument();
    });

    it('hides role-based content when user lacks required role', () => {
  void mockHasAnyRole.mockReturnValue(false);

      renderWithRouter(
        <ProgressiveContent
          publicContent={publicContent}
          roleBasedContent={roleBasedContent}
        />
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    });
  });

  describe('when loading', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        hasAnyRole: jest.fn(),
      });
    });

    it('shows loading state', () => {
      renderWithRouter(
        <ProgressiveContent
          publicContent={publicContent}
          authenticatedContent={authenticatedContent}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

describe('AuthAwareBanner Component', () => {
  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        profile: null,
      });
    });

    it('shows authentication prompt banner', () => {
      renderWithRouter(<AuthAwareBanner />);

      expect(screen.getByText('Join the conversation')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: true,
        profile: {
          full_name: 'John Doe',
        },
      });
    });

    it('shows personalized welcome message', () => {
      renderWithRouter(<AuthAwareBanner />);

      expect(screen.getByText(/Welcome back, John Doe!/)).toBeInTheDocument();
    });
  });
});

describe('withAuthAwareness HOC', () => {
  const TestComponent = ({ message }: { message: string }) => (
    <div>{message}</div>
  );

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        hasAnyRole: jest.fn(),
      });
    });

    it('shows fallback component when provided', () => {
      const FallbackComponent = () => <div>Fallback Content</div>;
      const WrappedComponent = withAuthAwareness(TestComponent, {
        fallbackComponent: FallbackComponent,
      });

      renderWithRouter(<WrappedComponent message="Test Message" />);

      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
      expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
    });

    it('shows original component when no fallback provided', () => {
      const WrappedComponent = withAuthAwareness(TestComponent);

      renderWithRouter(<WrappedComponent message="Test Message" />);

      expect(screen.getByText('Test Message')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockHasAnyRole = jest.fn();

    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        hasAnyRole: mockHasAnyRole,
      });
    });

    it('shows component when user has required roles', () => {
  void mockHasAnyRole.mockReturnValue(true);
      
      const WrappedComponent = withAuthAwareness(TestComponent, {
        requiredRoles: ['admin'],
      });

      renderWithRouter(<WrappedComponent message="Admin Content" />);

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });

    it('hides component when user lacks required roles', () => {
  void mockHasAnyRole.mockReturnValue(false);
      
      const WrappedComponent = withAuthAwareness(TestComponent, {
        requiredRoles: ['admin'],
      });

      renderWithRouter(<WrappedComponent message="Admin Content" />);

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    });
  });
});