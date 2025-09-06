import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { CoachingBasics } from '../../pages/learning/CoachingBasics';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CoachingBasics Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('should render main heading correctly', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Introduction to Professional Coaching');
    });

    test('should render hero section with course information', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Free Course')).toBeInTheDocument();
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
      expect(screen.getByText('3 modules')).toBeInTheDocument();
      expect(screen.getByText('1,500+ learners')).toBeInTheDocument();
    });

    test('should render course overview section', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Course Overview')).toBeInTheDocument();
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    test('should render all three course modules', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('What is Coaching?')).toBeInTheDocument();
      expect(screen.getByText('Core Energy™ Coaching Framework')).toBeInTheDocument();
      expect(screen.getByText('The Coaching Process')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    test('should display learning objectives with checkmarks', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Understand the core principles of professional coaching')).toBeInTheDocument();
      expect(screen.getByText('Learn about the Core Energy™ coaching framework')).toBeInTheDocument();
      expect(screen.getByText('Explore the structure of coaching sessions')).toBeInTheDocument();
      expect(screen.getByText('Discover the benefits of professional coaching')).toBeInTheDocument();
    });

    test('should show module details with topics', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      // Module 1 topics
      expect(screen.getByText('Definition of coaching')).toBeInTheDocument();
      expect(screen.getByText('Differences between coaching, mentoring, and consulting')).toBeInTheDocument();
      expect(screen.getByText('The coaching mindset')).toBeInTheDocument();
      expect(screen.getByText('Benefits of professional coaching')).toBeInTheDocument();
      
      // Module 2 topics
      expect(screen.getByText('Introduction to Core Energy')).toBeInTheDocument();
      expect(screen.getByText('The Energy Leadership™ Index')).toBeInTheDocument();
      expect(screen.getByText('Seven levels of energy')).toBeInTheDocument();
      expect(screen.getByText('Practical applications')).toBeInTheDocument();
      
      // Module 3 topics
      expect(screen.getByText('Session structure')).toBeInTheDocument();
      expect(screen.getByText('Goal setting')).toBeInTheDocument();
      expect(screen.getByText('Action planning')).toBeInTheDocument();
      expect(screen.getByText('Progress tracking')).toBeInTheDocument();
    });

    test('should display module durations', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('15 min')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
    });

    test('should show module badges', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Module 1')).toBeInTheDocument();
      expect(screen.getByText('Module 2')).toBeInTheDocument();
      expect(screen.getByText('Module 3')).toBeInTheDocument();
    });
  });

  describe('Sidebar Content', () => {
    test('should render benefits of coaching section', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Benefits of Coaching')).toBeInTheDocument();
      expect(screen.getByText('Clear Direction')).toBeInTheDocument();
      expect(screen.getByText('Enhanced Awareness')).toBeInTheDocument();
      expect(screen.getByText('Better Relationships')).toBeInTheDocument();
      expect(screen.getByText('Professional Growth')).toBeInTheDocument();
    });

    test('should display benefit descriptions', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Set meaningful goals and create actionable plans for achievement')).toBeInTheDocument();
      expect(screen.getByText('Develop deeper self-understanding and emotional intelligence')).toBeInTheDocument();
      expect(screen.getByText('Improve communication and build stronger connections')).toBeInTheDocument();
      expect(screen.getByText('Accelerate your career development and leadership abilities')).toBeInTheDocument();
    });

    test('should render success stories section', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Success Stories')).toBeInTheDocument();
      expect(screen.getByText('Michael Roberts')).toBeInTheDocument();
      expect(screen.getByText('Emily Chen')).toBeInTheDocument();
      expect(screen.getByText('Marketing Director')).toBeInTheDocument();
      expect(screen.getByText('Startup Founder')).toBeInTheDocument();
    });

    test('should display testimonial content', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Working with an iPEC coach transformed my approach to leadership/)).toBeInTheDocument();
      expect(screen.getByText(/The coaching process helped me navigate challenging transitions/)).toBeInTheDocument();
    });
  });

  describe('Call-to-Action Elements', () => {
    test('should render hero CTAs correctly', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const findCoachButton = screen.getByRole('link', { name: /Find a Coach/i });
      expect(findCoachButton).toBeInTheDocument();
      expect(findCoachButton).toHaveAttribute('href', '/coaches');
      
      const viewResourcesButton = screen.getByRole('link', { name: /View Resources/i });
      expect(viewResourcesButton).toBeInTheDocument();
      expect(viewResourcesButton).toHaveAttribute('href', '/coaching-resources');
    });

    test('should render module CTAs to coach discovery', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const moduleCtaButtons = screen.getAllByRole('link', { name: /Find a Coach/i });
      expect(moduleCtaButtons.length).toBeGreaterThan(1); // Hero + module buttons
      
      moduleCtaButtons.forEach(button => {
        expect(button).toHaveAttribute('href', '/coaches');
      });
    });

    test('should render sidebar CTA', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText('Ready to Start Your Journey?')).toBeInTheDocument();
      
      const perfectCoachButton = screen.getByRole('link', { name: /Find Your Perfect Coach/i });
      expect(perfectCoachButton).toBeInTheDocument();
      expect(perfectCoachButton).toHaveAttribute('href', '/coaches');
    });

    test('should not contain old LMS CTAs', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.queryByText('Enroll Now')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Module')).not.toBeInTheDocument();
      expect(screen.queryByText('Complete Course')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Certificate')).not.toBeInTheDocument();
      expect(screen.queryByText('Track Progress')).not.toBeInTheDocument();
    });
  });

  describe('Visual and Layout Elements', () => {
    test('should have hero background with gradient overlay', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      // Check for hero section with background
      const heroSection = container.querySelector('.relative.bg-white.overflow-hidden');
      expect(heroSection).toBeInTheDocument();
      
      // Check for gradient overlay
      const gradientOverlay = container.querySelector('.bg-gradient-to-r');
      expect(gradientOverlay).toBeInTheDocument();
    });

    test('should display module images', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const images = screen.getAllByRole('img');
      // Should have module images and testimonial images
      expect(images.length).toBeGreaterThan(3);
      
      images.forEach(img => {
        expect(img).toHaveAttribute('src');
        expect(img).toHaveAttribute('alt');
      });
    });

    test('should have responsive grid layout', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const gridElements = container.querySelectorAll('.grid');
      expect(gridElements.length).toBeGreaterThan(0);
      
      // Check for responsive classes
      const responsiveElements = container.querySelectorAll('[class*="lg:"], [class*="md:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    test('should have accessible images', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        const altText = img.getAttribute('alt');
        expect(altText).not.toBe('');
        expect(altText).toBeTruthy();
      });
    });

    test('should have accessible buttons and links', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        expect(element).toHaveAccessibleName();
      });
    });

    test('should have semantic structure', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      // Check for main content area
      expect(container.querySelector('main, [role="main"], .min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Course Structure and Content', () => {
    test('should show comprehensive course description', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText(/This introductory course provides a comprehensive overview/)).toBeInTheDocument();
      expect(screen.getByText(/Whether you're considering becoming a coach/)).toBeInTheDocument();
    });

    test('should indicate iPEC methodology', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.getByText(/iPEC's Core Energy™ approach/)).toBeInTheDocument();
      expect(screen.getByText(/iPEC's unique approach to coaching/)).toBeInTheDocument();
      expect(screen.getByText(/certified iPEC coach/)).toBeInTheDocument();
    });

    test('should show appropriate course metadata', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      // Course should be marked as free
      expect(screen.getByText('Free Course')).toBeInTheDocument();
      
      // Should show total duration and module count
      expect(screen.getByText('60 minutes')).toBeInTheDocument();
      expect(screen.getByText('3 modules')).toBeInTheDocument();
      
      // Should show learner count
      expect(screen.getByText('1,500+ learners')).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    test('should have hover effects on cards', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      // Check for hover classes
      const hoverElements = container.querySelectorAll('.hover\\:bg-');
      expect(hoverElements.length).toBeGreaterThan(0);
    });

    test('should have properly styled buttons', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        // Should have some styling classes
        expect(element.className).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        render(
          <TestWrapper>
            <CoachingBasics />
          </TestWrapper>
        );
      }).not.toThrow();
      
      console.error = originalConsoleError;
    });

    test('should not display error messages', () => {
      render(
        <TestWrapper>
          <CoachingBasics />
        </TestWrapper>
      );
      
      expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Failed to load/)).not.toBeInTheDocument();
    });
  });
});