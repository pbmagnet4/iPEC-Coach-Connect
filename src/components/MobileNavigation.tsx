import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCircle, 
  Calendar, 
  BookOpen, 
  Menu, 
  X,
  Compass, 
  BookMarked, 
  GraduationCap, 
  Library,
  Settings,
  LogOut,
  User,
  Home,
  Search,
  MessageCircle,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRole } from '../lib/roles';
import { RoleGuard } from './RoleGuard';
import { Logo } from './ui/Logo';
import { MobileButton } from './ui/MobileButton';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '../lib/utils';

const THUMB_ZONE_HEIGHT = 88; // Bottom thumb zone height
const TOUCH_TARGET_SIZE = 44; // Minimum touch target size

interface NavigationItem {
  href: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: number;
  external?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
}

// Bottom navigation items optimized for thumb access
const bottomNavItems: NavigationItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
  },
  {
    href: '/coaches',
    icon: Users,
    label: 'Coaches',
  },
  {
    href: '/learning',
    icon: GraduationCap,
    label: 'Learning',
  },
  {
    href: '/community',
    icon: BookOpen,
    label: 'Community',
  },
  {
    href: '/sessions',
    icon: Calendar,
    label: 'Sessions',
    requiresAuth: true,
  },
];

interface MobileNavigationProps {
  showBottomNav?: boolean;
  transparentHeader?: boolean;
}

export function MobileNavigation({ 
  showBottomNav = true, 
  transparentHeader = false 
}: MobileNavigationProps) {
  const { user } = useAuth();
  const { role } = useRole();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  React.useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setActiveSubmenu(null);
  }, [location.pathname]);

  // Skip link for accessibility
  const skipLink = (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-brand-600 text-white px-4 py-2 rounded-lg focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );

  const learningLinks = [
    {
      href: '/learning',
      icon: Compass,
      title: 'Learning Home',
      description: 'Explore all learning resources',
    },
    {
      href: '/learning/courses',
      icon: BookMarked,
      title: 'Courses',
      description: 'Browse our course catalog',
    },
    {
      href: '/learning/resources',
      icon: Library,
      title: 'Resource Library',
      description: 'Articles, videos, and tools',
    },
    {
      href: '/learning/coaching-basics',
      icon: BookOpen,
      title: 'Coaching Basics',
      description: 'Free introductory course',
    },
  ];

  const isCurrentPath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {skipLink}
      
      {/* Top Navigation Header */}
      <header 
        className={cn(
          "sticky top-0 z-40 w-full border-b",
          transparentHeader 
            ? "bg-white/80 backdrop-blur-sm border-white/20" 
            : "bg-white border-gray-200",
          "transition-all duration-200"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Logo />

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/coaches" 
                className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Find Coaches</span>
              </Link>

              <RoleGuard roles={['coach']}>
                <Link 
                  to="/clients" 
                  className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">My Clients</span>
                </Link>
              </RoleGuard>

              <div className="relative group">
                <button className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors">
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-sm font-medium">Learning</span>
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="p-4 space-y-4">
                    {learningLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.href}
                          to={link.href} 
                          className="flex items-center gap-3 text-gray-700 hover:text-brand-600 transition-colors"
                        >
                          <Icon className="h-5 w-5" />
                          <div>
                            <div className="text-sm font-medium">{link.title}</div>
                            <div className="text-xs text-gray-500">{link.description}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Link 
                to="/community" 
                className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Community</span>
              </Link>

              {user ? (
                <>
                  <Link 
                    to="/sessions" 
                    className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm font-medium">My Sessions</span>
                  </Link>
                  <NotificationCenter />
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 text-gray-700 hover:text-brand-600 transition-colors"
                    >
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8" />
                      )}
                      <span className="text-sm font-medium">{user.firstName}</span>
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            {user.profileImage ? (
                              <img 
                                src={user.profileImage} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircle className="h-10 w-10" />
                            )}
                            <div>
                              <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <User className="h-4 w-4" />
                            <span>View Profile</span>
                          </Link>
                          <Link
                            to="/sessions"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Calendar className="h-4 w-4" />
                            <span>My Sessions</span>
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </Link>
                        </div>

                        <div className="border-t border-gray-100">
                          <button
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setIsProfileOpen(false);
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/login" 
                    className="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <MobileButton 
                    href="/get-started" 
                    size="md"
                    variant="gradient"
                  >
                    Get Started
                  </MobileButton>
                </div>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {user && <NotificationCenter />}
              <MobileButton
                variant="ghost"
                size="touch"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </MobileButton>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setIsMenuOpen(false)}
              />
              
              <motion.div
                ref={menuRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 md:hidden"
                id="mobile-menu"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <MobileButton
                      variant="ghost"
                      size="touch"
                      onClick={() => setIsMenuOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="h-6 w-6" />
                    </MobileButton>
                  </div>

                  {/* User Profile Section */}
                  {user && (
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3 mb-4">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle className="h-12 w-12" />
                        )}
                        <div>
                          <div className="font-medium">{`${user.firstName} ${user.lastName}`}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="flex-1 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                      {/* Main Navigation */}
                      <MobileButton
                        href="/coaches"
                        variant="ghost"
                        size="touch"
                        className="w-full justify-start"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        Find Coaches
                      </MobileButton>

                      <RoleGuard roles={['coach']}>
                        <MobileButton
                          href="/clients"
                          variant="ghost"
                          size="touch"
                          className="w-full justify-start"
                        >
                          <Users className="h-5 w-5 mr-3" />
                          My Clients
                        </MobileButton>
                      </RoleGuard>

                      {/* Learning Section */}
                      <div>
                        <MobileButton
                          variant="ghost"
                          size="touch"
                          className="w-full justify-between"
                          onClick={() => setActiveSubmenu(activeSubmenu === 'learning' ? null : 'learning')}
                        >
                          <div className="flex items-center">
                            <GraduationCap className="h-5 w-5 mr-3" />
                            Learning
                          </div>
                          <ChevronDown className={cn(
                            "h-5 w-5 transition-transform",
                            activeSubmenu === 'learning' && "rotate-180"
                          )} />
                        </MobileButton>
                        
                        <AnimatePresence>
                          {activeSubmenu === 'learning' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-6 mt-2 space-y-2"
                            >
                              {learningLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                  <MobileButton
                                    key={link.href}
                                    href={link.href}
                                    variant="ghost"
                                    size="touch"
                                    className="w-full justify-start"
                                  >
                                    <Icon className="h-4 w-4 mr-3" />
                                    {link.title}
                                  </MobileButton>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <MobileButton
                        href="/community"
                        variant="ghost"
                        size="touch"
                        className="w-full justify-start"
                      >
                        <BookOpen className="h-5 w-5 mr-3" />
                        Community
                      </MobileButton>

                      {user ? (
                        <>
                          <MobileButton
                            href="/sessions"
                            variant="ghost"
                            size="touch"
                            className="w-full justify-start"
                          >
                            <Calendar className="h-5 w-5 mr-3" />
                            My Sessions
                          </MobileButton>
                          
                          <MobileButton
                            href="/profile"
                            variant="ghost"
                            size="touch"
                            className="w-full justify-start"
                          >
                            <User className="h-5 w-5 mr-3" />
                            Profile
                          </MobileButton>
                          
                          <MobileButton
                            href="/settings"
                            variant="ghost"
                            size="touch"
                            className="w-full justify-start"
                          >
                            <Settings className="h-5 w-5 mr-3" />
                            Settings
                          </MobileButton>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <MobileButton
                            href="/login"
                            variant="ghost"
                            size="touch"
                            className="w-full justify-start"
                          >
                            Log In
                          </MobileButton>
                          <MobileButton
                            href="/get-started"
                            variant="gradient"
                            size="touch"
                            className="w-full"
                          >
                            Get Started
                          </MobileButton>
                        </div>
                      )}
                    </nav>
                  </div>

                  {/* Footer */}
                  {user && (
                    <div className="p-4 border-t">
                      <MobileButton
                        variant="ghost"
                        size="touch"
                        className="w-full justify-start text-red-600"
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5 mr-3" />
                        Log Out
                      </MobileButton>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Bottom Navigation - Mobile Only */}
      {showBottomNav && (
        <motion.nav
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden"
          style={{ height: THUMB_ZONE_HEIGHT }}
        >
          <div className="flex items-center justify-around h-full px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isCurrentPath(item.href);
              const shouldShow = !item.requiresAuth || user;
              
              if (!shouldShow) return null;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors",
                    "min-w-[60px] min-h-[60px]", // Ensure adequate touch target
                    "touch-manipulation", // Optimize for touch
                    isActive 
                      ? "text-brand-600 bg-brand-50" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  )}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    "h-6 w-6 mb-1",
                    isActive && "text-brand-600"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-brand-600" : "text-gray-600"
                  )}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}

      {/* Bottom navigation spacer */}
      {showBottomNav && (
        <div className="md:hidden" style={{ height: THUMB_ZONE_HEIGHT }} />
      )}
    </>
  );
}