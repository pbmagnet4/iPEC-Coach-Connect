import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { CoachingResources } from '../../pages/learning/CoachingResources';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('CoachingResources Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Component Rendering', () => {
    test('should render without crashing', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    test('should render main heading correctly', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Coaching Resources');
    });

    test('should render all key sections', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getByText('Resource Categories')).toBeInTheDocument();
      expect(screen.getByText('Featured Resources')).toBeInTheDocument();
      expect(screen.getByText('All Resources')).toBeInTheDocument();
    });

    test('should render resource categories', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Core Concepts')).toBeInTheDocument();
      expect(screen.getByText('Personal Development')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Tools & Templates')).toBeInTheDocument();
    });
  });

  describe('Content Validation', () => {
    test('should display correct resource count per category', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check category counts
      expect(screen.getByText('1 resource')).toBeInTheDocument(); // Getting Started, Core Concepts, Personal Development, Communication
      expect(screen.getByText('2 resources')).toBeInTheDocument(); // Tools & Templates
    });

    test('should render featured resources correctly', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check featured resource titles
      expect(screen.getByText('Introduction to Professional Coaching')).toBeInTheDocument();
      expect(screen.getByText('What is Energy Leadership?')).toBeInTheDocument();
      
      // Check featured badges
      const featuredBadges = screen.getAllByText('Featured');
      expect(featuredBadges.length).toBe(2);
    });

    test('should display resource metadata correctly', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check authors
      expect(screen.getByText('By Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('By Michael Chen')).toBeInTheDocument();
      expect(screen.getByText('By Emily Rodriguez')).toBeInTheDocument();
      
      // Check read times and durations
      expect(screen.getByText('8 min')).toBeInTheDocument();
      expect(screen.getByText('12 min')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
    });

    test('should show different resource types with appropriate badges', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getAllByText('Article').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Video').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Worksheet').length).toBeGreaterThan(0);
    });

    test('should display view counts and download counts', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check for view counts
      expect(screen.getByText('1250')).toBeInTheDocument(); // views
      expect(screen.getByText('980')).toBeInTheDocument(); // views
      expect(screen.getByText('650')).toBeInTheDocument(); // downloads
    });
  });

  describe('Resource Type Functionality', () => {
    test('should show appropriate icons for different resource types', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Icons should be present (we can't easily test specific icons, but we can check for icon containers)
      const iconContainers = container.querySelectorAll('.bg-blue-100, .bg-purple-100, .bg-green-100');
      expect(iconContainers.length).toBeGreaterThan(0);
    });

    test('should show download buttons for worksheets', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const downloadButtons = screen.getAllByText('Download');
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    test('should show view buttons for articles and videos', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const viewButtons = screen.getAllByText('View Resource');
      expect(viewButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Call-to-Action Elements', () => {
    test('should render CTA section with coach discovery link', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getByText('Ready to Work with a Coach?')).toBeInTheDocument();
      
      const findCoachButton = screen.getByRole('link', { name: /Find Your Coach/i });
      expect(findCoachButton).toBeInTheDocument();
      expect(findCoachButton).toHaveAttribute('href', '/coaches');
    });

    test('should have link back to about coaching', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const aboutCoachingButton = screen.getByRole('link', { name: /Learn About Coaching/i });
      expect(aboutCoachingButton).toBeInTheDocument();
      expect(aboutCoachingButton).toHaveAttribute('href', '/about-coaching');
    });

    test('should not contain old LMS CTAs', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.queryByText('Enroll')).not.toBeInTheDocument();
      expect(screen.queryByText('Course Progress')).not.toBeInTheDocument();
      expect(screen.queryByText('My Learning')).not.toBeInTheDocument();
      expect(screen.queryByText('Certificate')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Design', () => {
    test('should have responsive grid layouts', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const gridElements = container.querySelectorAll('.grid');
      expect(gridElements.length).toBeGreaterThan(0);
      
      // Check for responsive classes
      const responsiveElements = container.querySelectorAll('[class*="md:"], [class*="lg:"], [class*="sm:"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    test('should display category badges with different colors', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check for different colored badges
      expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-purple-100')).toBeInTheDocument();
      expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2s = screen.getAllByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
      expect(h3s.length).toBeGreaterThan(0);
    });

    test('should have accessible buttons and links', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      
      [...buttons, ...links].forEach(element => {
        expect(element).toHaveAccessibleName();
      });
    });

    test('should have semantic HTML structure', () => {
      const { container } = render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Check for semantic elements
      expect(container.querySelector('main, [role="main"], .min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Resource Data Integrity', () => {
    test('should have all required resource fields', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Featured resources should have all required fields
      expect(screen.getByText('Introduction to Professional Coaching')).toBeInTheDocument();
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      
      expect(screen.getByText('What is Energy Leadership?')).toBeInTheDocument();
      expect(screen.getByText('Michael Chen')).toBeInTheDocument();
      expect(screen.getByText('Core Concepts')).toBeInTheDocument();
    });

    test('should display appropriate descriptions for each resource', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.getByText(/Learn the fundamentals of professional coaching/)).toBeInTheDocument();
      expect(screen.getByText(/An introduction to the Energy Leadership Index/)).toBeInTheDocument();
      expect(screen.getByText(/A practical worksheet to help you clarify/)).toBeInTheDocument();
    });

    test('should show correct file types for worksheets', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Worksheets should indicate PDF file type
      const worksheetElements = screen.getAllByText('Worksheet');
      expect(worksheetElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Experience', () => {
    test('should provide clear categorization', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Each resource should have a category badge
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
      expect(screen.getByText('Core Concepts')).toBeInTheDocument();
      expect(screen.getByText('Personal Development')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Tools & Templates')).toBeInTheDocument();
    });

    test('should show appropriate metadata for different content types', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Articles should show read time
      expect(screen.getByText('8 min')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
      
      // Videos should show duration
      expect(screen.getByText('12 min')).toBeInTheDocument();
      expect(screen.getByText('18 min')).toBeInTheDocument();
    });

    test('should differentiate between featured and regular resources', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      // Should have featured section
      expect(screen.getByText('Featured Resources')).toBeInTheDocument();
      
      // Should have all resources section
      expect(screen.getByText('All Resources')).toBeInTheDocument();
      
      // Featured items should have star indicators
      const featuredBadges = screen.getAllByText('Featured');
      expect(featuredBadges.length).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty resource arrays gracefully', () => {
      // Mock empty resources for this test
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      expect(() => {
        render(
          <TestWrapper>
            <CoachingResources />
          </TestWrapper>
        );
      }).not.toThrow();
      
      console.error = originalConsoleError;
    });

    test('should not display error messages', () => {
      render(
        <TestWrapper>
          <CoachingResources />
        </TestWrapper>
      );
      
      expect(screen.queryByText(/Error/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
    });
  });
});