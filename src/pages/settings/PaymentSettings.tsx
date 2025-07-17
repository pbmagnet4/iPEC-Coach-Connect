import React from 'react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  CreditCard,
  Plus,
  MapPin,
  Trash2
} from 'lucide-react';

const mockPaymentMethods = [
  {
    id: 1,
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2024,
    isDefault: true,
  },
  {
    id: 2,
    type: 'card',
    brand: 'mastercard',
    last4: '8888',
    expMonth: 3,
    expYear: 2025,
    isDefault: false,
  },
];

export function PaymentSettings() {
  const [showAddCard, setShowAddCard] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Container size="sm">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Payment Methods</h1>
            <p className="text-gray-600 mt-2">
              Manage your payment methods and billing information
            </p>
          </div>

          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-brand-600" />
                  <h2 className="text-xl font-semibold">Payment Methods</h2>
                </div>
                <Button
                  variant="outline"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowAddCard(true)}
                >
                  Add New Card
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                {mockPaymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg ${
                      selectedMethod === method.id ? 'border-brand-500 bg-brand-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="payment-method"
                          checked={selectedMethod === method.id}
                          onChange={() => setSelectedMethod(method.id)}
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                        />
                        <div>
                          <p className="font-medium capitalize">
                            {method.brand} •••• {method.last4}
                          </p>
                          <p className="text-sm text-gray-600">
                            Expires {method.expMonth}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <span className="text-sm text-brand-600 font-medium">
                            Default
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {showAddCard && (
                  <div className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-medium">Add New Card</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVC
                          </label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddCard(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="gradient">Add Card</Button>
                    </div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-brand-600" />
                <h2 className="text-xl font-semibold">Billing Address</h2>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apartment, suite, etc.
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP / Postal Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button variant="gradient">Save Changes</Button>
          </div>
        </div>
      </Container>
    </div>
  );
}