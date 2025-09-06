import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AboutCoaching } from '../../pages/learning/AboutCoaching';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Test wrapper with router
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AboutCoaching Component', () => {
  beforeEach(() => {
    // Clear any previous renders
    document.body.innerHTML = '';
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('should render main heading correctly', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('About Professional Coaching');
    });

    test('should render all key sections', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for main sections
      expect(screen.getByText('What is Professional Coaching?')).toBeInTheDocument();
      expect(screen.getByText('Benefits of Professional Coaching')).toBeInTheDocument();
      expect(screen.getByText('The Coaching Process')).toBeInTheDocument();
      expect(screen.getByText('What Our Clients Say')).toBeInTheDocument();
    });

    test('should render coaching benefits cards', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for all benefit titles
      expect(screen.getByText('Clarity & Focus')).toBeInTheDocument();
      expect(screen.getByText('Personal Growth')).toBeInTheDocument();
      expect(screen.getByText('Direction & Purpose')).toBeInTheDocument();
      expect(screen.getByText('Work-Life Balance')).toBeInTheDocument();
    });

    test('should render coaching process steps', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for process steps
      expect(screen.getByText('Discovery')).toBeInTheDocument();
      expect(screen.getByText('Goal Setting')).toBeInTheDocument();
      expect(screen.getByText('Action Planning')).toBeInTheDocument();
      expect(screen.getByText('Support & Growth')).toBeInTheDocument();
    });

    test('should render testimonials', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for testimonial names
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    test('should have appropriate meta information', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for descriptive text
      const introText = screen.getByText(/Discover how professional coaching can transform/);
      expect(introText).toBeInTheDocument();
    });

    test('should contain coaching vs other services explanation', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Unlike therapy, which often focuses on the past/)).toBeInTheDocument();
      expect(screen.getByText(/coaching is forward-looking and action-oriented/)).toBeInTheDocument();
    });

    test('should list what coaching focuses on', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      expect(screen.getByText('Goal achievement and action planning')).toBeInTheDocument();
      expect(screen.getByText('Personal and professional development')).toBeInTheDocument();
      expect(screen.getByText('Overcoming obstacles and limiting beliefs')).toBeInTheDocument();
      expect(screen.getByText('Building confidence and self-awareness')).toBeInTheDocument();
    });

    test('should list common coaching areas', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      expect(screen.getByText('Leadership and executive development')).toBeInTheDocument();
      expect(screen.getByText('Career transitions and advancement')).toBeInTheDocument();
      expect(screen.getByText('Work-life balance and wellness')).toBeInTheDocument();
      expect(screen.getByText('Communication and relationship skills')).toBeInTheDocument();
    });

    test('should have testimonials with proper structure', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check testimonial content
      expect(screen.getByText(/Coaching helped me gain the confidence/)).toBeInTheDocument();
      expect(screen.getByText(/The clarity and focus I gained through coaching/)).toBeInTheDocument();
      expect(screen.getByText(/I discovered my authentic leadership style/)).toBeInTheDocument();
      
      // Check roles
      expect(screen.getByText('Executive')).toBeInTheDocument();
      expect(screen.getByText('Entrepreneur')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Elements', () => {
    test('should render primary CTA to find coaches', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      const findCoachButton = screen.getByRole('link', { name: /Find Your Coach/i });
      expect(findCoachButton).toBeInTheDocument();
      expect(findCoachButton).toHaveAttribute('href', '/coaches');
    });

    test('should render secondary CTA to resources', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      const resourcesButton = screen.getByRole('link', { name: /Explore Resources/i });
      expect(resourcesButton).toBeInTheDocument();
      expect(resourcesButton).toHaveAttribute('href', '/coaching-resources');
    });

    test('should not contain old LMS CTAs', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // These should NOT be present
      expect(screen.queryByText('Enroll Now')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Course')).not.toBeInTheDocument();
      expect(screen.queryByText('My Learning')).not.toBeInTheDocument();
      expect(screen.queryByText('Course Progress')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    test('should have accessible images with alt text', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check that images don't have empty alt attributes
      const images = screen.queryAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    test('should have accessible links', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        // Links should have accessible names
        expect(link).toHaveAccessibleName();
      });
    });

    test('should have proper ARIA labels where needed', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check that buttons have proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Responsive Design Elements', () => {
    test('should have responsive container classes', () => {
      const { container } = render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for responsive classes
      expect(container.querySelector('.container')).toBeInTheDocument();
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    test('should have mobile-friendly spacing classes', () => {
      const { container } = render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for responsive spacing and layout classes
      const responsiveElements = container.querySelectorAll('[class*="md:"], [class*="lg:"], [class*="sm:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Data and Content Integrity', () => {
    test('should have consistent benefit descriptions', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Verify benefit descriptions are meaningful and complete
      expect(screen.getByText(/Gain clarity on your goals/)).toBeInTheDocument();
      expect(screen.getByText(/Unlock your potential/)).toBeInTheDocument();
      expect(screen.getByText(/Discover your true purpose/)).toBeInTheDocument();
      expect(screen.getByText(/Learn to balance your professional and personal life/)).toBeInTheDocument();
    });

    test('should have all process steps with descriptions', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check each process step has a description
      expect(screen.getByText(/Explore your current situation/)).toBeInTheDocument();
      expect(screen.getByText(/Define clear, actionable goals/)).toBeInTheDocument();
      expect(screen.getByText(/Create a structured plan/)).toBeInTheDocument();
      expect(screen.getByText(/Receive ongoing support/)).toBeInTheDocument();
    });

    test('should have star ratings for testimonials', () => {
      const { container } = render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Check for star rating elements
      const starElements = container.querySelectorAll('.text-yellow-400');
      expect(starElements.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing props gracefully', () => {
      // Test that component doesn't crash with minimal props
      expect(() => {
        render(
          <TestWrapper>
            <AboutCoaching />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    test('should not display error boundaries', () => {
      render(
        <TestWrapper>
          <AboutCoaching />
        </TestWrapper>
      );
      
      // Should not show error messages
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
    });
  });
});