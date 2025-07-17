import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  User,
  Shield,
  CreditCard,
  Bell,
  Settings,
  ChevronRight,
  Trash2
} from 'lucide-react';

const settingsLinks = [
  {
    icon: User,
    title: 'Profile Settings',
    description: 'Manage your personal information and preferences',
    path: '/settings/profile',
  },
  {
    icon: Shield,
    title: 'Security',
    description: 'Password, two-factor authentication, and login history',
    path: '/settings/security',
  },
  {
    icon: CreditCard,
    title: 'Payment Methods',
    description: 'Manage your payment methods and billing information',
    path: '/settings/payment',
  },
  {
    icon: Bell,
    title: 'Notifications',
    description: 'Configure your notification preferences',
    path: '/messages/settings',
  },
  {
    icon: Settings,
    title: 'Subscription',
    description: 'View and manage your subscription plan',
    path: '/settings/subscription',
  },
];

export function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Account Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid gap-4">
            {settingsLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.path} to={link.path}>
                  <Card hover>
                    <Card.Body>
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{link.title}</h3>
                          <p className="text-sm text-gray-600">
                            {link.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-600">Delete Account</h3>
                    <p className="text-sm text-gray-600">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                </div>

                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">
                      Are you sure you want to delete your account? This action cannot be undone.
                    </p>
                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Confirm Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}