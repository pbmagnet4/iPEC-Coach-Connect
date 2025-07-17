import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Moon, Filter, Mail } from 'lucide-react';

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = React.useState({
    newMessage: true,
    sessionReminders: true,
    mentions: true,
    updates: false,
  });

  const [pushNotifications, setPushNotifications] = React.useState({
    enabled: true,
    sound: true,
    preview: true,
  });

  const [doNotDisturb, setDoNotDisturb] = React.useState({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
  });

  const [messageFilters, setMessageFilters] = React.useState({
    coaches: true,
    clients: true,
    system: true,
    marketing: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <h1 className="text-3xl font-bold mb-8">Notification Settings</h1>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Email Notifications</h2>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              {Object.entries(emailNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Receive email notifications for {key.toLowerCase()}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setEmailNotifications((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Push Notifications */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Push Notifications</h2>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              {Object.entries(pushNotifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {key === 'enabled'
                        ? 'Enable push notifications'
                        : key === 'sound'
                        ? 'Play sound for new notifications'
                        : 'Show message preview in notifications'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setPushNotifications((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Do Not Disturb */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Moon className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Do Not Disturb</h2>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Schedule Quiet Hours</h3>
                  <p className="text-sm text-gray-600">
                    Mute notifications during specified hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doNotDisturb.enabled}
                    onChange={(e) =>
                      setDoNotDisturb((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                </label>
              </div>
              {doNotDisturb.enabled && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={doNotDisturb.startTime}
                      onChange={(e) =>
                        setDoNotDisturb((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={doNotDisturb.endTime}
                      onChange={(e) =>
                        setDoNotDisturb((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Message Filters */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Filter className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Message Filters</h2>
              </div>
            </Card.Header>
            <Card.Body className="space-y-4">
              {Object.entries(messageFilters).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Receive messages from {key.toLowerCase()}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setMessageFilters((prev) => ({
                          ...prev,
                          [key]: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              ))}
            </Card.Body>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Reset to Default</Button>
            <Button variant="gradient">Save Changes</Button>
          </div>
        </div>
      </Container>
    </div>
  );
}