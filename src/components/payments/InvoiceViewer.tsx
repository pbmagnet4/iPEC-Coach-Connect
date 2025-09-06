/**
 * InvoiceViewer Component
 * 
 * Display and manage invoices for users with:
 * - Invoice list with filtering and sorting
 * - Detailed invoice view
 * - Download invoice PDF
 * - Payment status tracking
 * - Subscription invoice handling
 */

import React, { useCallback, useEffect, useState } from 'react';
import { authService } from '../../services/auth.service';
import { stripeService } from '../../services/stripe.service';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Modal } from '../ui/Modal';
import type { Invoice, InvoiceLineItem, InvoiceWithDetails } from '../../types/database';

interface InvoiceViewerProps {
  className?: string;
  customerId?: string;
  subscriptionId?: string;
  limit?: number;
}

interface InvoiceListItemProps {
  invoice: Invoice;
  onViewDetails: (invoice: Invoice) => void;
  onDownloadPdf: (invoice: Invoice) => void;
}

interface InvoiceDetailsProps {
  invoice: InvoiceWithDetails;
  onClose: () => void;
  onDownloadPdf: (invoice: Invoice) => void;
}

const InvoiceListItem: React.FC<InvoiceListItemProps> = ({
  invoice,
  onViewDetails,
  onDownloadPdf
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'gray' as const, label: 'Draft' },
      open: { color: 'yellow' as const, label: 'Open' },
      paid: { color: 'green' as const, label: 'Paid' },
      void: { color: 'red' as const, label: 'Void' },
      uncollectible: { color: 'red' as const, label: 'Uncollectible' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { color: 'gray' as const, label: status };

    return <Badge color={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <div>
              <div className="font-medium text-gray-900">
                Invoice {invoice.invoice_number || `#${invoice.id.slice(-8)}`}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(invoice.created_at)}
                {invoice.due_date && (
                  <span className="ml-2">
                    • Due {formatDate(invoice.due_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="font-medium text-gray-900">
              {stripeService.utils.formatAmount(invoice.total, invoice.currency)}
            </div>
            {invoice.amount_due > 0 && invoice.status === 'open' && (
              <div className="text-sm text-red-600">
                {stripeService.utils.formatAmount(invoice.amount_due, invoice.currency)} due
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {getStatusBadge(invoice.status)}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(invoice)}
            >
              View
            </Button>
            
            {invoice.invoice_pdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPdf(invoice)}
              >
                PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onClose,
  onDownloadPdf
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'gray' as const, label: 'Draft' },
      open: { color: 'yellow' as const, label: 'Open' },
      paid: { color: 'green' as const, label: 'Paid' },
      void: { color: 'red' as const, label: 'Void' },
      uncollectible: { color: 'red' as const, label: 'Uncollectible' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { color: 'gray' as const, label: status };

    return <Badge color={config.color}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Invoice {invoice.invoice_number || `#${invoice.id.slice(-8)}`}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Created on {formatDate(invoice.created_at)}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(invoice.status)}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Invoice Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span>{getStatusBadge(invoice.status)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(invoice.created_at)}</span>
              </div>
              {invoice.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
              )}
              {invoice.paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Paid:</span>
                  <span className="text-gray-900">{formatDate(invoice.paid_at)}</span>
                </div>
              )}
              {invoice.period_start && invoice.period_end && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Period:</span>
                  <span className="text-gray-900">
                    {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-gray-900">{invoice.customer.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {invoice.customer.stripe_customer_id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items */}
      {invoice.line_items && invoice.line_items.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Items</h4>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-center py-2 text-sm font-medium text-gray-600">Qty</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Unit Price</th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 text-sm text-gray-900">
                      {item.description}
                      {item.period_start && item.period_end && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(item.period_start)} - {formatDate(item.period_end)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right">
                      {stripeService.utils.formatAmount(item.unit_amount, item.currency)}
                    </td>
                    <td className="py-3 text-sm text-gray-900 text-right font-medium">
                      {stripeService.utils.formatAmount(item.amount, item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Totals */}
      <Card className="p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="text-gray-900">
              {stripeService.utils.formatAmount(invoice.subtotal, invoice.currency)}
            </span>
          </div>
          
          {invoice.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span className="text-gray-900">
                {stripeService.utils.formatAmount(invoice.tax, invoice.currency)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
            <span className="text-gray-900">Total:</span>
            <span className="text-gray-900">
              {stripeService.utils.formatAmount(invoice.total, invoice.currency)}
            </span>
          </div>
          
          {invoice.amount_paid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="text-green-600">
                {stripeService.utils.formatAmount(invoice.amount_paid, invoice.currency)}
              </span>
            </div>
          )}
          
          {invoice.amount_due > 0 && (
            <div className="flex justify-between text-lg font-medium">
              <span className="text-red-600">Amount Due:</span>
              <span className="text-red-600">
                {stripeService.utils.formatAmount(invoice.amount_due, invoice.currency)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {invoice.hosted_invoice_url && (
          <Button
            variant="outline"
            onClick={() => window.open(invoice.hosted_invoice_url, '_blank')}
          >
            View in Stripe
          </Button>
        )}
        
        {invoice.invoice_pdf && (
          <Button onClick={() => onDownloadPdf(invoice)}>
            Download PDF
          </Button>
        )}
      </div>
    </div>
  );
};

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  className = '',
  customerId,
  subscriptionId,
  limit = 20
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (customerId) {
        const { data: customer } = await supabase
          .from('payment_customers')
          .select('id')
          .eq('user_id', customerId)
          .single();
        
        if (customer) {
          query = query.eq('customer_id', customer.id);
        }
      } else {
        // Get current user's invoices
        const currentUser = authService.getState().user;
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        const { data: customer } = await supabase
          .from('payment_customers')
          .select('id')
          .eq('user_id', currentUser.id)
          .single();
        
        if (customer) {
          query = query.eq('customer_id', customer.id);
        }
      }

      if (subscriptionId) {
        query = query.eq('subscription_id', subscriptionId);
      }

      const { data, error: queryError } = await query;
      
      if (queryError) throw queryError;
      
      setInvoices(data || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [customerId, subscriptionId, limit]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      // Load full invoice details with line items
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:payment_customers(*),
          line_items:invoice_line_items(*)
        `)
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      setSelectedInvoice(fullInvoice as InvoiceWithDetails);
      setShowDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    }
  };

  const handleDownloadPdf = (invoice: Invoice) => {
    if (invoice.invoice_pdf) {
      window.open(invoice.invoice_pdf, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading invoices...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Invoices</h3>
        <Button variant="outline" onClick={loadInvoices} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      <div className="space-y-4">
        {invoices.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c5.523 0 10 4.477 10 10.001v.001"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h4 className="mt-4 text-lg font-medium text-gray-900">No invoices found</h4>
              <p className="mt-2 text-sm text-gray-500">
                Invoices for your purchases and subscriptions will appear here.
              </p>
            </div>
          </Card>
        ) : (
          invoices.map((invoice) => (
            <InvoiceListItem
              key={invoice.id}
              invoice={invoice}
              onViewDetails={handleViewDetails}
              onDownloadPdf={handleDownloadPdf}
            />
          ))
        )}
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedInvoice(null);
        }}
        title=""
        size="xl"
      >
        {selectedInvoice && (
          <InvoiceDetails
            invoice={selectedInvoice}
            onClose={() => {
              setShowDetails(false);
              setSelectedInvoice(null);
            }}
            onDownloadPdf={handleDownloadPdf}
          />
        )}
      </Modal>
    </div>
  );
};

export default InvoiceViewer;