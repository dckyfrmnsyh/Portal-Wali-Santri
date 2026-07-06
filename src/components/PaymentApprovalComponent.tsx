import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PaymentApprovalProps {
  paymentId: string;
  onSuccess?: () => void;
}

export function PaymentApprovalComponent({ paymentId, onSuccess }: PaymentApprovalProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [auditHistory, setAuditHistory] = useState<any[]>([]);

  // ============================================================================
  // CHECK ADMIN ROLE ON MOUNT
  // ============================================================================

  useEffect(() => {
    checkAdminStatus();
    loadAuditHistory();
  }, [paymentId]);

  const checkAdminStatus = async () => {
    try {
      // Call is_admin function
      const { data, error } = await supabase.rpc('is_admin');
      
      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
    } catch (err) {
      console.error('Error:', err);
      setIsAdmin(false);
    }
  };

  // ============================================================================
  // LOAD AUDIT HISTORY
  // ============================================================================

  const loadAuditHistory = async () => {
    try {
      const { data, error } = await supabase.rpc(
        'get_payment_audit_history',
        { p_payment_id: paymentId }
      );

      if (error) {
        console.warn('Could not load audit history:', error);
        return;
      }

      if (data?.success && data?.data) {
        setAuditHistory(data.data);
      }
    } catch (err) {
      console.warn('Error loading audit history:', err);
    }
  };

  // ============================================================================
  // APPROVE PAYMENT
  // ============================================================================

  const handleApprovePayment = async () => {
    // ⭐ CHECK ADMIN FIRST
    if (!isAdmin) {
      setError('❌ Unauthorized: Only administrators can approve payments');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.rpc('approve_payment', {
        p_payment_id: paymentId
      });

      if (error) {
        setError(`❌ Approval failed: ${error.message}`);
        return;
      }

      if (!data?.success) {
        const message = data?.error || 'Unknown error';
        const code = data?.code || '';

        // User-friendly error messages
        if (code === 'ADMIN_ONLY') {
          setError('❌ Only administrators can approve payments');
        } else if (code === 'INVALID_STATUS') {
          setError(`❌ Cannot approve payment in status: ${data?.current_status}`);
        } else if (code === 'NOT_FOUND') {
          setError('❌ Payment not found');
        } else {
          setError(`❌ ${message}`);
        }
        return;
      }

      // Success!
      setSuccessMessage(
        `✅ Payment approved successfully by ${data.approved_by}`
      );
      onSuccess?.();
      
      // Reload audit history
      setTimeout(() => loadAuditHistory(), 500);

    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // REJECT PAYMENT
  // ============================================================================

  const handleRejectPayment = async () => {
    // ⭐ CHECK ADMIN FIRST
    if (!isAdmin) {
      setError('❌ Unauthorized: Only administrators can reject payments');
      return;
    }

    if (!rejectReason.trim()) {
      setError('❌ Rejection reason is required');
      return;
    }

    if (rejectReason.trim().length < 3) {
      setError('❌ Rejection reason must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.rpc('reject_payment', {
        p_payment_id: paymentId,
        p_reason: rejectReason
      });

      if (error) {
        setError(`❌ Rejection failed: ${error.message}`);
        return;
      }

      if (!data?.success) {
        const message = data?.error || 'Unknown error';
        const code = data?.code || '';

        if (code === 'ADMIN_ONLY') {
          setError('❌ Only administrators can reject payments');
        } else if (code === 'INVALID_STATUS') {
          setError(`❌ Cannot reject payment in status: ${data?.current_status}`);
        } else if (code === 'REASON_REQUIRED') {
          setError('❌ Rejection reason is required');
        } else {
          setError(`❌ ${message}`);
        }
        return;
      }

      // Success!
      setSuccessMessage(
        `✅ Payment rejected: ${rejectReason}`
      );
      setRejectReason('');
      setShowRejectForm(false);
      onSuccess?.();

      // Reload audit history
      setTimeout(() => loadAuditHistory(), 500);

    } catch (err: any) {
      setError(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isAdmin) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          ⚠️ You don't have permission to approve or reject payments.
          Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprovePayment}
          disabled={loading || showRejectForm}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? '⏳ Processing...' : '✅ Approve Payment'}
        </button>

        <button
          onClick={() => setShowRejectForm(!showRejectForm)}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          {showRejectForm ? '✖️ Cancel' : '❌ Reject Payment'}
        </button>
      </div>

      {/* Reject Form */}
      {showRejectForm && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <label className="block text-sm font-medium mb-2">
            Rejection Reason (required)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter reason for rejecting this payment..."
            className="w-full p-2 border border-gray-300 rounded mb-2"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleRejectPayment}
            disabled={loading || !rejectReason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? '⏳ Processing...' : 'Confirm Rejection'}
          </button>
        </div>
      )}

      {/* Audit History */}
      {auditHistory.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="font-semibold mb-3">📋 Action History</h3>
          <div className="space-y-2">
            {auditHistory.map((entry, idx) => (
              <div key={idx} className="text-sm text-blue-900">
                <strong>{entry.action.toUpperCase()}</strong>
                {' '}: {entry.new_status}
                {' '}by {entry.approved_by}
                <br />
                <small className="text-gray-600">
                  {new Date(entry.timestamp).toLocaleString()}
                </small>
                {entry.reason && (
                  <div className="mt-1 text-gray-700">
                    Reason: {entry.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentApprovalComponent;