/**
 * Test Suite for AuthPrompt Component
 * 
 * Tests authentication-aware prompts across different styles and actions.
 * Ensures proper rendering, interaction, and accessibility compliance.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthPrompt, CommunityAuthPrompt, QuickAuthPrompt } from '../AuthPrompt';
import { useUnifiedUserStore } from '../../../stores/unified-user-store';

// Mock the unified user store
jest.mock('../../../stores/unified-user-store');
const mockUseUnifiedUserStore = useUnifiedUserStore as jest.MockedFunction<typeof useUnifiedUserStore>;

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/community' }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthPrompt Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue(false); // isAuthenticated = false
    });

    it('renders inline style prompt correctly', () => {
      renderWithRouter(
        <AuthPrompt action="participate" style="inline" />
      );

      expect(screen.getByText('Join the conversation')).toBeInTheDocument();
      expect(screen.getByText('Sign in to participate in discussions, share insights, and connect with the community')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('renders card style prompt correctly', () => {
      renderWithRouter(
        <AuthPrompt action="join" style="card" />
      );

      expect(screen.getByText('Join this group')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
    });

    it('renders banner style prompt correctly', () => {
      renderWithRouter(
        <AuthPrompt action="rsvp" style="banner" />
      );

      expect(screen.getByText('Reserve your spot')).toBeInTheDocument();
    });

    it('handles sign in navigation correctly', () => {
      renderWithRouter(
        <AuthPrompt action="participate" context="in this discussion" />
      );

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          from: { pathname: '/community' },
          action: 'participate',
          context: 'in this discussion'
        }
      });
    });

    it('handles sign up navigation correctly', () => {
      renderWithRouter(
        <AuthPrompt action="create" />
      );

      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/register', {
        state: {
          from: { pathname: '/community' },
          action: 'create',
          context: undefined
        }
      });
    });

    it('calls onAuthStart callback when provided', () => {
      const mockOnAuthStart = jest.fn();
      
      renderWithRouter(
        <AuthPrompt action="participate" onAuthStart={mockOnAuthStart} />
      );

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(mockOnAuthStart).toHaveBeenCalled();
    });

    it('renders custom message when provided', () => {
      const customMessage = 'Custom authentication message';
      
      renderWithRouter(
        <AuthPrompt action="participate" message={customMessage} />
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('emphasizes sign up when flag is set', () => {
      renderWithRouter(
        <AuthPrompt action="participate" emphasizeSignUp={true} />
      );

      const signUpButton = screen.getByRole('button', { name: /join free/i });
      expect(signUpButton).toBeInTheDocument();
    });

    it('renders compact version correctly', () => {
      renderWithRouter(
        <AuthPrompt action="participate" compact={true} />
      );

      // Should not show description in compact mode
      expect(screen.queryByText('Sign in to participate in discussions')).not.toBeInTheDocument();
      // But should still show title
      expect(screen.getByText('Join the conversation')).toBeInTheDocument();
    });

    it('renders custom actions when provided', () => {
      const customActions = <button>Custom Action</button>;
      
      renderWithRouter(
        <AuthPrompt action="participate" customActions={customActions} />
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });

    describe('accessibility', () => {
      it('has proper ARIA labels', () => {
        renderWithRouter(
          <AuthPrompt action="participate" style="inline" />
        );

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('type');
        });
      });

      it('supports keyboard navigation', () => {
        renderWithRouter(
          <AuthPrompt action="participate" style="inline" />
        );

        const signInButton = screen.getByRole('button', { name: /sign in/i });
        signInButton.focus();
        
        expect(document.activeElement).toBe(signInButton);
        
        fireEvent.keyDown(signInButton, { key: 'Tab' });
        
        const signUpButton = screen.getByRole('button', { name: /sign up/i });
        expect(document.activeElement).toBe(signUpButton);
      });
    });

    describe('different actions', () => {
      const actions = [
        'participate',
        'reply', 
        'create',
        'join',
        'rsvp',
        'like',
        'follow',
        'message',
        'vote',
        'save'
      ] as const;

      actions.forEach(action => {
        it(`renders ${action} action correctly`, () => {
          renderWithRouter(
            <AuthPrompt action={action} />
          );

          // Each action should render without error
          expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        });
      });
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseUnifiedUserStore.mockReturnValue(true); // isAuthenticated = true
    });

    it('does not render when user is authenticated', () => {
      renderWithRouter(
        <AuthPrompt action="participate" />
      );

      expect(screen.queryByText('Join the conversation')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    });
  });
});

describe('QuickAuthPrompt Component', () => {
  beforeEach(() => {
    mockUseUnifiedUserStore.mockReturnValue(false);
  });

  it('renders as inline compact prompt', () => {
    renderWithRouter(
      <QuickAuthPrompt action="like" context="this post" />
    );

    expect(screen.getByText('Show appreciation this post')).toBeInTheDocument();
  });
});

describe('CommunityAuthPrompt Component', () => {
  beforeEach(() => {
    mockUseUnifiedUserStore.mockReturnValue(false);
  });

  it('renders as card with emphasized sign up', () => {
    renderWithRouter(
      <CommunityAuthPrompt />
    );

    expect(screen.getByText('Join the conversation')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /join free/i })).toBeInTheDocument();
  });
});