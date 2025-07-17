import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCircle, 
  Calendar, 
  BookOpen, 
  Menu, 
  Compass, 
  BookMarked, 
  GraduationCap, 
  Library,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useRole, isCoach } from '../lib/roles';
import { RoleGuard } from './RoleGuard';
import { Logo } from './ui/Logo';
import { NotificationCenter } from './NotificationCenter';

export function Navigation() {
  const { user } = useAuth();
  const { role } = useRole();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLearningOpen, setIsLearningOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Always show Find Coaches link */}
            <Link to="/coaches" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Find Coaches</span>
            </Link>

            <RoleGuard roles={['coach']}>
              <Link to="/clients" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">My Clients</span>
              </Link>
            </RoleGuard>

            {/* Always show Learning Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsLearningOpen(!isLearningOpen)}
              >
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
                        className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors"
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

            <Link to="/community" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Community</span>
            </Link>

            {user ? (
              <>
                <Link to="/sessions" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">My Sessions</span>
                </Link>
                <NotificationCenter />
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
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

                  {/* Profile Dropdown */}
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
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </Link>
                        <Link
                          to="/sessions"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Calendar className="h-4 w-4" />
                          <span>My Sessions</span>
                        </Link>
                        <Link
                          to="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </div>

                      <div className="border-t border-gray-100">
                        <button
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          onClick={() => {
                            // Handle logout
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
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  to="/get-started" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-700 hover:text-blue-600 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-4">
              {/* Always show Find Coaches link */}
              <Link 
                to="/coaches" 
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">Find Coaches</span>
              </Link>

              <RoleGuard roles={['coach']}>
                <Link 
                  to="/clients" 
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-medium">My Clients</span>
                </Link>
              </RoleGuard>

              {/* Always show Learning Section */}
              <div className="space-y-2">
                <button 
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors w-full"
                  onClick={() => setIsLearningOpen(!isLearningOpen)}
                >
                  <GraduationCap className="h-5 w-5" />
                  <span className="text-sm font-medium">Learning</span>
                </button>
                {isLearningOpen && (
                  <div className="pl-7 space-y-2">
                    {learningLinks.map((link) => (
                      <Link 
                        key={link.href}
                        to={link.href}
                        className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link 
                to="/community" 
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Community</span>
              </Link>

              {user ? (
                <>
                  <Link 
                    to="/sessions" 
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm font-medium">My Sessions</span>
                  </Link>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">View Profile</span>
                  </Link>
                  <Link 
                    to="/settings"
                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="text-sm font-medium">Settings</span>
                  </Link>
                  <button
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors w-full"
                    onClick={() => {
                      // Handle logout
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Log Out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link 
                    to="/login" 
                    className="block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/get-started" 
                    className="block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}