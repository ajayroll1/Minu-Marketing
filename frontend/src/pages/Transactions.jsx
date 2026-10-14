import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Plus, Download, ArrowDownLeft, ArrowUpRight, Sliders, 
  CheckCircle, Clock, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Transactions({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await api.downloadExport('transactions', 'stock_transactions_ledger.csv');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to export transaction ledger');
    } finally {
      setExportingCsv(false);
    }
  };

  const [formData, setFormData] = useState({
    product_id: '',
    transaction_type: 'STOCK_IN',
    quantity: 1,
    reference_number: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, prodRes] = await Promise.all([
        api.getTransactions(`?page=${currentPage}`),
        api.getProducts('?status=ACTIVE'),
      ]);

      if (txRes?.results) {
        setTransactions(txRes.results);
        setTotalCount(txRes.count || txRes.results.length);
      } else {
        const arr = Array.isArray(txRes) ? txRes : [];
        setTransactions(arr);
        setTotalCount(arr.length);
      }

      setProducts(prodRes?.results || (Array.isArray(prodRes) ? prodRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordTransaction = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.createTransaction({
        product_id: parseInt(formData.product_id),
        transaction_type: formData.transaction_type,
        quantity: parseInt(formData.quantity),
        reference_number: formData.reference_number,
        reason: formData.reason,
      });

      setShowModal(false);
      setActionMsg('Inventory movement recorded successfully to immutable ledger.');
      setFormData({
        product_id: '',
        transaction_type: 'STOCK_IN',
        quantity: 1,
        reference_number: '',
        reason: '',
      });
      loadData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const canTransact = user?.role !== 'VIEWER';

  return (
    <div>
      {actionMsg && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)', marginBottom: '20px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <CheckCircle size={18} /> {actionMsg}
        </div>
      )}

      {/* Control bar */}
      <div className="page-header-responsive" data-tour="ledger-header">
        <div className="page-header-text">
          <h2 className="page-header-title">Stock Movement Ledger</h2>
          <p className="page-header-desc">Auditable history of inbound, outbound, and physical audit adjustments</p>
        </div>

        <div className="page-header-actions">
          <button 
            type="button" 
            onClick={handleExportCsv} 
            disabled={exportingCsv} 
            className="btn-pill btn-pill-soft"
          >
            <Download size={14} /> {exportingCsv ? 'Exporting...' : 'Export CSV'}
          </button>
          {canTransact && (
            <button className="btn-pill btn-pill-dark" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Record Movement
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" data-tour="ledger-filters" style={{ border: 'none', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          <table>
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Balance Shift</th>
                <th>Reference #</th>
                <th>Reason / Justification</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-muted)' }}>Loading transaction records...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-muted)' }}>No movements recorded in ledger.</td></tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <code className="font-mono" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>#{tx.id}</code>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      {tx.transaction_type === 'STOCK_IN' && <span className="badge badge-success">Stock In</span>}
                      {tx.transaction_type === 'STOCK_OUT' && <span className="badge badge-warning">Stock Out</span>}
                      {tx.transaction_type === 'ADJUSTMENT' && <span className="badge badge-neutral">Adjustment</span>}
                      {tx.transaction_type === 'REVERSAL' && <span className="badge badge-danger">Reversal</span>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{tx.product_name}</div>
                      <div><code className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--color-accent)' }}>{tx.product_sku}</code></div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800, fontSize: '0.92rem' }}>{tx.quantity}</td>
                    <td className="font-mono" style={{ fontSize: '0.84rem', color: 'var(--color-muted)' }}>
                      {tx.before_stock} &rarr; <strong style={{ color: 'var(--color-text)' }}>{tx.after_stock}</strong>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.84rem' }}>{tx.reference_number || '-'}</span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', maxWidth: '240px', fontSize: '0.84rem' }}>{tx.reason || '-'}</td>
                    <td style={{ fontWeight: 600 }}>{tx.performed_by_name || 'System'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <div className="pagination-info">
            <span>Page <strong>{currentPage}</strong></span>
            <span>&bull;</span>
            <span><strong>{totalCount}</strong> movements</span>
          </div>
          <div className="pagination-controls">
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={transactions.length < 15}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Record Stock Movement</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', marginBottom: '18px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRecordTransaction}>
              <div className="form-group">
                <label className="form-label">Product SKU *</label>
                <select 
                  className="form-control" 
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                >
                  <option value="">Select Catalog Item...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.sku}] — Current Stock: {p.current_stock}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Movement Type *</label>
                  <select 
                    className="form-control"
                    value={formData.transaction_type}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                  >
                    <option value="STOCK_IN">Stock In (Purchase/Inbound)</option>
                    <option value="STOCK_OUT">Stock Out (Dispatch/Fulfillment)</option>
                    <option value="ADJUSTMENT">Physical Audit Count</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {formData.transaction_type === 'ADJUSTMENT' ? 'New Verified Count *' : 'Quantity Units *'}
                  </label>
                  <input 
                    type="number" 
                    className="form-control font-mono" 
                    required 
                    min={formData.transaction_type === 'ADJUSTMENT' ? "0" : "1"}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Number (PO / Order / Tracking)</label>
                <input 
                  type="text" 
                  className="form-control font-mono" 
                  placeholder="e.g. PO-84920 or SO-1920"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Reason & Justification</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  placeholder="Mandatory explanation for physical variance or dispatches..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
