import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, ChevronUp } from 'lucide-react';
import { MobileNavigation } from '../MobileNavigation';
import { MobileButton } from '../ui/MobileButton';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { cn } from '../../lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  transparentHeader?: boolean;
  scrollToTop?: boolean;
  className?: string;
}

// Thumb zone constants (based on ergonomic research)
const THUMB_ZONES = {
  EASY: { bottom: 0, height: '25vh' }, // 0-25% from bottom
  NATURAL: { bottom: '25vh', height: '40vh' }, // 25-65% from bottom
  STRETCH: { bottom: '65vh', height: '35vh' }, // 65-100% from bottom
} as const;

const MOBILE_BREAKPOINT = 768;

export function MobileLayout({
  children,
  showBottomNav = true,
  transparentHeader = false,
  scrollToTop = true,
  className,
}: MobileLayoutProps) {
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [safePadding, setSafePadding] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  
  const { preferences, liveRegions } = useAccessibility();

  // Handle viewport height changes (mobile address bar)
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    updateViewportHeight();
  void window.addEventListener('resize', updateViewportHeight);
    return () => window.removeEventListener('resize', updateViewportHeight);
  }, []);

  // Handle safe area insets for notched devices
  useEffect(() => {
    const updateSafeAreaInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      setSafePadding({
        top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0', 10),
        bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
        left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0', 10),
        right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0', 10),
      });
    };

    updateSafeAreaInsets();
  void window.addEventListener('resize', updateSafeAreaInsets);
    return () => window.removeEventListener('resize', updateSafeAreaInsets);
  }, []);

  // Handle scroll to top visibility
  useEffect(() => {
    if (!scrollToTop) return;

    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);
    };

  void window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollToTop]);

  const handleScrollToTop = () => {
  void window.scrollTo({ top: 0, behavior: 'smooth' });
  void liveRegions.announcePolite('Scrolled to top');
  };

  // Generate layout classes based on thumb zones
  const getThumbZoneClass = (zone: keyof typeof THUMB_ZONES) => {
    const zoneConfig = THUMB_ZONES[zone];
    return {
      bottom: zoneConfig.bottom,
      height: zoneConfig.height,
    };
  };

  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 flex flex-col",
        preferences.prefersReducedMotion && "reduce-motion",
        className
      )}
      style={{
        paddingTop: safePadding.top,
        paddingBottom: safePadding.bottom,
        paddingLeft: safePadding.left,
        paddingRight: safePadding.right,
        minHeight: viewportHeight || '100vh',
      }}
    >
      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Header/Navigation */}
      <MobileNavigation 
        showBottomNav={showBottomNav}
        transparentHeader={transparentHeader}
      />

      {/* Main content */}
      <main 
        id="main-content"
        className="flex-1 relative"
        role="main"
        aria-label="Main content"
      >
        {/* Thumb zone indicators (development only) */}
        {process.env.NODE_ENV === 'development' && isMobile && (
          <div className="fixed inset-0 pointer-events-none z-40 opacity-20">
            <div 
              className="absolute bg-green-500"
              style={getThumbZoneClass('EASY')}
            />
            <div 
              className="absolute bg-yellow-500"
              style={getThumbZoneClass('NATURAL')}
            />
            <div 
              className="absolute bg-red-500"
              style={getThumbZoneClass('STRETCH')}
            />
          </div>
        )}

        {/* Content wrapper */}
        <div className={cn(
          "relative z-10",
          showBottomNav && "pb-24 md:pb-0" // Add bottom padding for mobile nav
        )}>
          {children}
        </div>

        {/* Scroll to top button */}
        <AnimatePresence>
          {showScrollToTop && scrollToTop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed bottom-20 right-4 z-30 md:bottom-4"
            >
              <MobileButton
                variant="primary"
                size="touch"
                onClick={handleScrollToTop}
                className="rounded-full shadow-lg"
                aria-label="Scroll to top"
              >
                <ArrowUp className="h-6 w-6" />
              </MobileButton>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer id="footer" className="mt-auto">
        {/* Footer content would go here */}
      </footer>
    </div>
  );
}

// Thumb zone optimization component
interface ThumbZoneProps {
  zone: keyof typeof THUMB_ZONES;
  children: React.ReactNode;
  className?: string;
}

export function ThumbZone({ zone, children, className }: ThumbZoneProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
  void window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  const zoneConfig = THUMB_ZONES[zone];
  const zoneClass = cn(
    "thumb-zone",
    `thumb-zone-${zone.toLowerCase()}`,
    zone === 'EASY' && "thumb-reach-easy",
    zone === 'NATURAL' && "thumb-reach-natural",
    zone === 'STRETCH' && "thumb-reach-stretch",
    className
  );

  return (
    <div 
      className={zoneClass}
      style={{
        bottom: zoneConfig.bottom,
        height: zoneConfig.height,
      }}
      data-thumb-zone={zone}
    >
      {children}
    </div>
  );
}

// One-handed layout component
interface OneHandedLayoutProps {
  children: React.ReactNode;
  primaryHand?: 'left' | 'right';
  className?: string;
}

export function OneHandedLayout({ 
  children, 
  primaryHand = 'right',
  className 
}: OneHandedLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
  void window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={cn(
        "one-handed-layout",
        primaryHand === 'left' && "one-handed-left",
        primaryHand === 'right' && "one-handed-right",
        className
      )}
      data-primary-hand={primaryHand}
    >
      {children}
    </div>
  );
}

// Mobile-optimized container component
interface MobileContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  thumbZone?: keyof typeof THUMB_ZONES;
}

export function MobileContainer({
  children,
  size = 'md',
  padding = 'md',
  className,
  thumbZone,
}: MobileContainerProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  const containerClass = cn(
    'mx-auto',
    sizeClasses[size],
    paddingClasses[padding],
    className
  );

  const content = (
    <div className={containerClass}>
      {children}
    </div>
  );

  if (thumbZone) {
    return (
      <ThumbZone zone={thumbZone} className={className}>
        {content}
      </ThumbZone>
    );
  }

  return content;
}

// Safe area component for notched devices
interface SafeAreaProps {
  children: React.ReactNode;
  insets?: ('top' | 'bottom' | 'left' | 'right')[];
  className?: string;
}

export function SafeArea({ 
  children, 
  insets = ['top', 'bottom', 'left', 'right'],
  className 
}: SafeAreaProps) {
  const safeAreaClasses = insets.map(inset => `safe-area-inset-${inset}`).join(' ');
  
  return (
    <div 
      className={cn(
        safeAreaClasses,
        className
      )}
      style={{
        paddingTop: insets.includes('top') ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: insets.includes('bottom') ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: insets.includes('left') ? 'env(safe-area-inset-left)' : undefined,
        paddingRight: insets.includes('right') ? 'env(safe-area-inset-right)' : undefined,
      }}
    >
      {children}
    </div>
  );
}

// Sticky action bar component (stays in thumb zone)
interface StickyActionBarProps {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

export function StickyActionBar({ 
  children, 
  className, 
  show = true 
}: StickyActionBarProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-20",
        "bg-white border-t border-gray-200",
        "p-4 pb-8", // Extra padding for safe area
        "md:relative md:bottom-auto md:border-t-0 md:bg-transparent md:p-0",
        className
      )}
    >
      <SafeArea insets={['bottom']}>
        {children}
      </SafeArea>
    </motion.div>
  );
}

// Floating action button component
interface FloatingActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  ariaLabel: string;
}

export function FloatingActionButton({
  children,
  onClick,
  position = 'bottom-right',
  className,
  ariaLabel,
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-20 right-4 md:bottom-4',
    'bottom-left': 'bottom-20 left-4 md:bottom-4',
    'bottom-center': 'bottom-20 left-1/2 transform -translate-x-1/2 md:bottom-4',
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn(
        "fixed z-30",
        positionClasses[position],
        className
      )}
    >
      <MobileButton
        variant="gradient"
        size="touch"
        onClick={onClick}
        className="rounded-full shadow-lg"
        aria-label={ariaLabel}
      >
        {children}
      </MobileButton>
    </motion.div>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 100 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 z-10 bg-brand-100 text-brand-700 p-4 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <ChevronUp className="h-5 w-5" />
              <span>
                {pullDistance > 100 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-brand-100 text-brand-700 p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
            <span>Refreshing...</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${Math.min(pullDistance, 100)}px)` }}>
        {children}
      </div>
    </div>
  );
}