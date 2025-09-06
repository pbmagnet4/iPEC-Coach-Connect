/**
 * Trust Signal Component Tests
 * 
 * Unit tests for the trust signal system components
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TrustSignal } from '../TrustSignal';
import { SecurityBadge } from '../SecurityBadge';
import { VerificationBadge } from '../VerificationBadge';
import { AuthTrustSignals } from '../AuthTrustSignals';
import { BookingTrustSignals } from '../BookingTrustSignals';
import { TrustMicrocopy } from '../TrustMicrocopy';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('TrustSignal', () => {
  test('renders security trust signal correctly', () => {
    render(
      <TrustSignal
        type="security"
        variant="badge"
        title="Bank-Level Security"
        description="256-bit encryption protects your data"
      />
    );

    expect(screen.getByText('Bank-Level Security')).toBeInTheDocument();
    expect(screen.getByText('256-bit encryption protects your data')).toBeInTheDocument();
  });

  test('renders verification trust signal correctly', () => {
    render(
      <TrustSignal
        type="verification"
        variant="card"
        title="iPEC Certified"
        description="All coaches are verified"
      />
    );

    expect(screen.getByText('iPEC Certified')).toBeInTheDocument();
    expect(screen.getByText('All coaches are verified')).toBeInTheDocument();
  });

  test('renders social proof trust signal correctly', () => {
    render(
      <TrustSignal
        type="social"
        variant="inline"
        title="15,000+ Users"
        value="Growing daily"
      />
    );

    expect(screen.getByText('15,000+ Users')).toBeInTheDocument();
    expect(screen.getByText('Growing daily')).toBeInTheDocument();
  });

  test('applies correct styling based on type', () => {
    const { container } = render(
      <TrustSignal
        type="security"
        variant="badge"
        title="Secure"
        className="test-class"
      />
    );

    const element = container.firstChild as HTMLElement;
    expect(element).toHaveClass('test-class');
    expect(element).toHaveClass('bg-green-50');
    expect(element).toHaveClass('text-green-800');
  });
});

describe('SecurityBadge', () => {
  test('renders SSL badge correctly', () => {
    render(<SecurityBadge type="ssl" size="md" showText={true} />);
    
    expect(screen.getByText('SSL Secured')).toBeInTheDocument();
    expect(screen.getByText('Bank-level encryption')).toBeInTheDocument();
  });

  test('renders encryption badge correctly', () => {
    render(<SecurityBadge type="encryption" size="lg" showText={true} />);
    
    expect(screen.getByText('256-bit Encryption')).toBeInTheDocument();
    expect(screen.getByText('Military-grade security')).toBeInTheDocument();
  });

  test('renders GDPR badge correctly', () => {
    render(<SecurityBadge type="gdpr" size="sm" showText={true} />);
    
    expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
    expect(screen.getByText('European privacy standards')).toBeInTheDocument();
  });

  test('hides text when showText is false', () => {
    render(<SecurityBadge type="ssl" size="md" showText={false} />);
    
    expect(screen.queryByText('SSL Secured')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank-level encryption')).not.toBeInTheDocument();
  });
});

describe('VerificationBadge', () => {
  test('renders iPEC badge correctly', () => {
    render(<VerificationBadge type="ipec" level="gold" size="md" showText={true} />);
    
    expect(screen.getByText('iPEC Certified')).toBeInTheDocument();
    expect(screen.getByText('Official iPEC certification')).toBeInTheDocument();
  });

  test('renders background check badge correctly', () => {
    render(<VerificationBadge type="background" size="md" showText={true} />);
    
    expect(screen.getByText('Background Checked')).toBeInTheDocument();
    expect(screen.getByText('Background verification complete')).toBeInTheDocument();
  });

  test('shows verification level when provided', () => {
    render(<VerificationBadge type="elite" level="platinum" size="md" showText={true} />);
    
    expect(screen.getByText('Elite Coach')).toBeInTheDocument();
    expect(screen.getByText('platinum')).toBeInTheDocument();
  });
});

describe('AuthTrustSignals', () => {
  test('renders signup trust signals correctly', () => {
    render(<AuthTrustSignals context="signup" variant="sidebar" />);
    
    expect(screen.getByText('Join 15,000+ Professionals')).toBeInTheDocument();
    expect(screen.getByText('Bank-Level Security')).toBeInTheDocument();
  });

  test('renders login trust signals correctly', () => {
    render(<AuthTrustSignals context="login" variant="sidebar" />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Your secure coaching platform')).toBeInTheDocument();
  });

  test('renders password reset trust signals correctly', () => {
    render(<AuthTrustSignals context="reset" variant="sidebar" />);
    
    expect(screen.getByText('Account Recovery')).toBeInTheDocument();
    expect(screen.getByText('We\'ll help you regain access securely')).toBeInTheDocument();
  });
});

describe('BookingTrustSignals', () => {
  test('renders coach selection trust signals correctly', () => {
    render(<BookingTrustSignals context="selection" variant="sidebar" />);
    
    expect(screen.getByText('All Coaches Are Verified')).toBeInTheDocument();
    expect(screen.getByText('iPEC Certification')).toBeInTheDocument();
  });

  test('renders payment trust signals correctly', () => {
    render(<BookingTrustSignals context="payment" variant="sidebar" />);
    
    expect(screen.getByText('Secure Payment Processing')).toBeInTheDocument();
    expect(screen.getByText('256-bit SSL Encryption')).toBeInTheDocument();
  });

  test('renders booking process trust signals correctly', () => {
    render(<BookingTrustSignals context="booking" variant="sidebar" />);
    
    expect(screen.getByText('Flexible & Risk-Free')).toBeInTheDocument();
    expect(screen.getByText('30-Day Money-Back Guarantee')).toBeInTheDocument();
  });
});

describe('TrustMicrocopy', () => {
  test('renders email input trust microcopy correctly', () => {
    render(<TrustMicrocopy context="email_input" variant="helper" />);
    
    expect(screen.getByText('Your email is secure with us')).toBeInTheDocument();
    expect(screen.getByText('We use bank-level encryption and never share your information')).toBeInTheDocument();
  });

  test('renders payment form trust microcopy correctly', () => {
    render(<TrustMicrocopy context="payment_form" variant="helper" />);
    
    expect(screen.getByText('Your payment is 100% secure')).toBeInTheDocument();
    expect(screen.getByText('Powered by Stripe with PCI DSS compliance')).toBeInTheDocument();
  });

  test('renders coach selection trust microcopy correctly', () => {
    render(<TrustMicrocopy context="coach_selection" variant="helper" />);
    
    expect(screen.getByText('All coaches are iPEC certified')).toBeInTheDocument();
    expect(screen.getByText('Background checked and verified by our team')).toBeInTheDocument();
  });

  test('renders inline variant correctly', () => {
    render(<TrustMicrocopy context="data_sharing" variant="inline" />);
    
    expect(screen.getByText('We never sell your data')).toBeInTheDocument();
  });

  test('renders banner variant correctly', () => {
    render(<TrustMicrocopy context="community_join" variant="banner" />);
    
    expect(screen.getByText('Join 15,000+ coaching professionals')).toBeInTheDocument();
    expect(screen.getByText('A supportive community focused on growth and success')).toBeInTheDocument();
  });
});

describe('Trust Signal Integration', () => {
  test('renders multiple trust signals together', () => {
    render(
      <div>
        <TrustSignal type="security" variant="badge" title="Secure" />
        <TrustSignal type="verification" variant="badge" title="Verified" />
        <TrustSignal type="social" variant="badge" title="Popular" />
      </div>
    );

    expect(screen.getByText('Secure')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  test('trust signals work with different variants', () => {
    render(
      <div>
        <TrustSignal type="security" variant="badge" title="Badge" />
        <TrustSignal type="security" variant="card" title="Card" />
        <TrustSignal type="security" variant="inline" title="Inline" />
        <TrustSignal type="security" variant="banner" title="Banner" />
      </div>
    );

    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Inline')).toBeInTheDocument();
    expect(screen.getByText('Banner')).toBeInTheDocument();
  });
});

// Integration test to verify components work together
describe('Trust Signal System Integration', () => {
  test('auth page with trust signals renders correctly', () => {
    render(
      <div>
        <AuthTrustSignals context="signup" variant="sidebar" />
        <SecurityBadge type="ssl" showText={true} />
        <TrustMicrocopy context="email_input" variant="helper" />
      </div>
    );

    expect(screen.getByText('Join 15,000+ Professionals')).toBeInTheDocument();
    expect(screen.getByText('SSL Secured')).toBeInTheDocument();
    expect(screen.getByText('Your email is secure with us')).toBeInTheDocument();
  });
});

// Performance test
describe('Trust Signal Performance', () => {
  test('renders quickly with multiple trust signals', () => {
    const startTime = performance.now();
    
    render(
      <div>
        {Array.from({ length: 10 }, (_, i) => (
          <TrustSignal
            key={i}
            type="security"
            variant="badge"
            title={`Trust Signal ${i}`}
            animate={false}
          />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });
});

// Accessibility test
describe('Trust Signal Accessibility', () => {
  test('trust signals have proper ARIA attributes', () => {
    render(
      <TrustSignal
        type="security"
        variant="badge"
        title="Secure"
        description="Bank-level encryption"
      />
    );

    const element = screen.getByText('Secure').closest('span');
    expect(element).toHaveAttribute('title');
  });

  test('security badges have proper titles', () => {
    render(<SecurityBadge type="ssl" showText={true} />);
    
    const element = screen.getByText('SSL Secured').closest('div');
    expect(element).toHaveAttribute('title');
  });
});