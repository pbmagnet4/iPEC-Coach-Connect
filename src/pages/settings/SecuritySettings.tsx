import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  History,
  Laptop,
  Lock,
  LogOut,
  Shield,
  Smartphone
} from 'lucide-react';

const connectedDevices = [
  {
    name: 'MacBook Pro',
    type: 'Desktop',
    lastActive: 'Active now',
    location: 'New York, USA',
    browser: 'Chrome',
    os: 'macOS',
  },
  {
    name: 'iPhone 13',
    type: 'Mobile',
    lastActive: '2 hours ago',
    location: 'New York, USA',
    browser: 'Safari',
    os: 'iOS',
  },
];

export function SecuritySettings() {
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Security Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account security and connected devices
            </p>
          </div>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Password</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <Button variant="gradient">Update Password</Button>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={twoFactorEnabled}
                      onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>

                {twoFactorEnabled && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Verification Methods</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="2fa-method" value="authenticator" />
                        <span>Authenticator App</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="2fa-method" value="sms" />
                        <span>SMS</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <History className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Login History</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {[
                  {
                    date: 'March 20, 2024',
                    time: '10:30 AM',
                    location: 'New York, USA',
                    device: 'Chrome on MacOS',
                    status: 'success',
                  },
                  {
                    date: 'March 19, 2024',
                    time: '3:45 PM',
                    location: 'New York, USA',
                    device: 'Safari on iOS',
                    status: 'success',
                  },
                ].map((login, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {login.date} at {login.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        {login.device} • {login.location}
                      </p>
                    </div>
                    <Badge
                      variant={login.status === 'success' ? 'success' : 'error'}
                    >
                      {login.status === 'success' ? 'Successful' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Laptop className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Connected Devices</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {connectedDevices.map((device, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {device.type === 'Desktop' ? (
                        <Laptop className="h-6 w-6 text-gray-500" />
                      ) : (
                        <Smartphone className="h-6 w-6 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-gray-600">
                          {device.browser} on {device.os} • {device.location}
                        </p>
                        <p className="text-sm text-brand-600">{device.lastActive}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<LogOut className="h-4 w-4" />}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Security Recommendations</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 text-green-700 rounded-lg">
                  <Shield className="h-6 w-6" />
                  <div>
                    <p className="font-medium">Your account is secure</p>
                    <p className="text-sm">
                      You have all recommended security measures enabled
                    </p>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </div>
  );
}