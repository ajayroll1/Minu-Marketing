import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  AlertTriangle, CheckCircle, Check, Download, 
  SlidersHorizontal, CheckCircle2, ChevronRight, ChevronLeft, Settings2 
} from 'lucide-react';

export default function Alerts({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  // State for Table 1: Live Triggered Alerts
  const [alertSearch, setAlertSearch] = useState('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('ALL');
  const [alertPage, setAlertPage] = useState(1);
  const alertPageSize = 8;

  // Custom Alert Threshold Configuration Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [customThresholdVal, setCustomThresholdVal] = useState(10);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await api.downloadAlertPdf();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await api.downloadExport('alerts', 'low_stock_alerts.csv');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  // State for Table 2: Custom Alert Threshold Settings per Product
  const [thresholdSearch, setThresholdSearch] = useState('');
  const [thresholdFilter, setThresholdFilter] = useState('ALL');
  const [thresholdPage, setThresholdPage] = useState(1);
  const thresholdPageSize = 8;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [alertRes, prodRes] = await Promise.all([
        api.getAlerts(),
        api.getProducts('?status=ACTIVE'),
      ]);
      setAlerts(alertRes?.results || (Array.isArray(alertRes) ? alertRes : []));
      setProducts(prodRes?.results || (Array.isArray(prodRes) ? prodRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.acknowledgeAlert(id);
      setActionMsg('Alert acknowledged.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.resolveAlert(id);
      setActionMsg('Alert manually resolved.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenThresholdModal = (prod) => {
    setSelectedProduct(prod);
    setCustomThresholdVal(prod.min_stock_level);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSavingThreshold(true);
    try {
      const res = await api.setAlertThreshold(selectedProduct.id, parseInt(customThresholdVal));
      setActionMsg(res.message);
      setSelectedProduct(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingThreshold(false);
    }
  };

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.is_superuser;

  // Filter Table 1: Live Alerts
  const filteredAlerts = alerts.filter(a => {
    const q = alertSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      (a.product_name && a.product_name.toLowerCase().includes(q)) ||
      (a.product_sku && a.product_sku.toLowerCase().includes(q)) ||
      (a.notes && a.notes.toLowerCase().includes(q));
    
    const matchesSeverity = alertSeverityFilter === 'ALL' || a.severity === alertSeverityFilter;
    return matchesSearch && matchesSeverity;
  });

  const totalAlertPages = Math.ceil(filteredAlerts.length / alertPageSize) || 1;
  const paginatedAlerts = filteredAlerts.slice((alertPage - 1) * alertPageSize, alertPage * alertPageSize);

  // Filter Table 2: Custom Threshold Products
  const filteredProducts = products.filter(p => {
    const q = thresholdSearch.toLowerCase().trim();
    const matchesSearch = !q ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));
    
    if (thresholdFilter === 'BREACHED') {
      return matchesSearch && p.current_stock <= p.min_stock_level;
    }
    if (thresholdFilter === 'NORMAL') {
      return matchesSearch && p.current_stock > p.min_stock_level;
    }
    return matchesSearch;
  });

  const totalThresholdPages = Math.ceil(filteredProducts.length / thresholdPageSize) || 1;
  const paginatedProducts = filteredProducts.slice((thresholdPage - 1) * thresholdPageSize, thresholdPage * thresholdPageSize);

  return (
    <div>
      {actionMsg && (
        <div style={{ padding: '14px 20px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
          <CheckCircle2 size={18} /> {actionMsg}
        </div>
      )}

      {/* Control bar */}
      <div className="page-header-responsive">
        <div className="page-header-text">
          <h2 className="page-header-title">Automated Low-Stock Alert System</h2>
          <p className="page-header-desc">Real-time inventory threshold breaches and custom per-product triggers</p>
        </div>

        <div className="page-header-actions">
          <button 
            type="button" 
            onClick={handleDownloadPdf} 
            disabled={downloadingPdf} 
            className="btn-pill btn-pill-dark"
          >
            <Download size={14} /> {downloadingPdf ? 'Generating PDF...' : 'PDF Report'}
          </button>
          <button 
            type="button" 
            onClick={handleExportCsv} 
            disabled={exportingCsv} 
            className="btn-pill btn-pill-soft"
          >
            <Download size={14} /> {exportingCsv ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* 1. Active Alerts Feed */}
      <div className="white-panel" data-tour="alerts-live-table" style={{ padding: 0, marginBottom: '28px' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="white-panel-title">
            <AlertTriangle size={18} color="#D97706" /> Live Triggered Alerts
          </h3>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Products currently breaching minimum required inventory levels</div>
        </div>

        {/* Toolbar: Search (narrower) & Severity Filter (aligned horizontally on the right) */}
        <div 
          className="panel-toolbar-responsive" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '16px', 
            padding: '14px 24px', 
            borderBottom: '1px solid var(--border-light)', 
            backgroundColor: '#FAFBFC' 
          }}
        >
          <div className="panel-search-box" style={{ maxWidth: '320px', width: '100%', flex: '0 1 320px' }}>
            <input
              type="text"
              className="panel-search-input"
              placeholder="Search alerts by name, SKU, notes..."
              value={alertSearch}
              onChange={(e) => {
                setAlertSearch(e.target.value);
                setAlertPage(1);
              }}
            />
          </div>
          <select
            className="panel-filter-select"
            style={{ minWidth: '160px', flexShrink: 0 }}
            value={alertSeverityFilter}
            onChange={(e) => {
              setAlertSeverityFilter(e.target.value);
              setAlertPage(1);
            }}
          >
            <option value="ALL">All Severities</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
          </select>
        </div>

        <div className="rounded-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Triggered At</th>
                <th>Severity</th>
                <th>Product Identifier</th>
                <th>Current Stock</th>
                <th>Configured Threshold</th>
                <th>Workflow Status</th>
                <th>Automated Notes</th>
                {canManage && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading alert feed...</td></tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700 }}>
                      {alerts.length === 0 ? 'All warehouse inventory levels are healthy. Zero breaches.' : 'No alerts match your filter criteria.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {new Date(a.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      {a.severity === 'OUT_OF_STOCK' ? (
                        <span className="badge-pill badge-peach">Out of Stock</span>
                      ) : (
                        <span className="badge-pill badge-amber">Low Stock</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{a.product_name}</div>
                      <div><code className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--accent-blue)' }}>{a.product_sku}</code></div>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 800, color: a.current_stock === 0 ? '#DC2626' : '#D97706' }}>
                      {a.current_stock}
                    </td>
                    <td className="font-mono">&le; {a.threshold}</td>
                    <td>
                      {a.status === 'ACTIVE' && <span className="badge-pill badge-peach">Active</span>}
                      {a.status === 'ACKNOWLEDGED' && <span className="badge-pill badge-amber">Acknowledged</span>}
                      {a.status === 'RESOLVED' && <span className="badge-pill badge-mint">Resolved</span>}
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                      {a.notes}
                    </td>
                    {canManage && (
                      <td style={{ textAlign: 'right' }}>
                        {a.status === 'ACTIVE' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button className="btn-pill btn-pill-soft" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handleAcknowledge(a.id)}>
                              Acknowledge
                            </button>
                            <button className="btn-pill btn-pill-dark" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handleResolve(a.id)}>
                              <Check size={12} /> Resolve
                            </button>
                          </div>
                        )}
                        {a.status === 'ACKNOWLEDGED' && (
                          <button className="btn-pill btn-pill-dark" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => handleResolve(a.id)}>
                            <Check size={12} /> Resolve
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar for Live Alerts */}
        {filteredAlerts.length > alertPageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              <span>Page <strong>{alertPage}</strong> of <strong>{totalAlertPages}</strong></span>
              <span>&bull;</span>
              <span><strong>{filteredAlerts.length}</strong> alerts</span>
            </div>
            <div className="pagination-controls">
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={alertPage <= 1}
                onClick={() => setAlertPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={alertPage >= totalAlertPages}
                onClick={() => setAlertPage(p => p + 1)}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Custom Alert Threshold Configuration Panel for All Catalog SKUs */}
      <div className="white-panel" data-tour="alerts-threshold-settings" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="white-panel-title">
            <Settings2 size={18} color="var(--accent-blue)" /> Custom Alert Threshold Settings per Product
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Configure individual stock trigger levels. Jab kisi bhi product ka stock is limit tak ya isse kam hoga, automated alert trigger ho jayega.
          </p>
        </div>

        {/* Toolbar: Search & Stock Status Filter */}
        <div 
          className="panel-toolbar-responsive" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '16px', 
            padding: '14px 24px', 
            borderBottom: '1px solid var(--border-light)', 
            backgroundColor: '#FAFBFC' 
          }}
        >
          <div className="panel-search-box" style={{ maxWidth: '320px', width: '100%', flex: '0 1 320px' }}>
            <input
              type="text"
              className="panel-search-input"
              placeholder="Search products by SKU, name, category..."
              value={thresholdSearch}
              onChange={(e) => {
                setThresholdSearch(e.target.value);
                setThresholdPage(1);
              }}
            />
          </div>
          <select
            className="panel-filter-select"
            style={{ minWidth: '160px', flexShrink: 0 }}
            value={thresholdFilter}
            onChange={(e) => {
              setThresholdFilter(e.target.value);
              setThresholdPage(1);
            }}
          >
            <option value="ALL">All Items</option>
            <option value="BREACHED">Breached (Stock &le; Threshold)</option>
            <option value="NORMAL">Normal (Stock &gt; Threshold)</option>
          </select>
        </div>

        <div className="rounded-table-wrapper" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Current In-Stock</th>
                <th>Alert Threshold Level</th>
                <th style={{ textAlign: 'right' }}>Custom Configuration</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No products found matching "{thresholdSearch}".
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => (
                  <tr key={p.id}>
                    <td><code className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{p.sku}</code></td>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td className="font-mono" style={{ fontWeight: 800 }}>{p.current_stock} units</td>
                    <td className="font-mono">
                      <span className="badge-pill badge-neutral">Triggers at &le; {p.min_stock_level} units</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canManage && (
                        <button 
                          className="btn-pill btn-pill-soft" 
                          style={{ padding: '6px 16px', fontSize: '0.8rem' }}
                          onClick={() => handleOpenThresholdModal(p)}
                        >
                          <SlidersHorizontal size={13} /> Set Alert Limit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar for Alert Threshold Settings Table */}
        {filteredProducts.length > thresholdPageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              <span>Page <strong>{thresholdPage}</strong> of <strong>{totalThresholdPages}</strong></span>
              <span>&bull;</span>
              <span><strong>{filteredProducts.length}</strong> catalog items</span>
            </div>
            <div className="pagination-controls">
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={thresholdPage <= 1}
                onClick={() => setThresholdPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button 
                className="btn btn-secondary btn-sm" 
                disabled={thresholdPage >= totalThresholdPages}
                onClick={() => setThresholdPage(p => p + 1)}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Custom Threshold Configuration Modal */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content-rounded">
            <div className="modal-header-rounded">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Set Custom Stock Alert Threshold
              </h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F8FAFD', borderRadius: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{selectedProduct.name}</div>
              <div className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', marginTop: '2px' }}>
                SKU: {selectedProduct.sku} &bull; Current Available: {selectedProduct.current_stock} units
              </div>
            </div>

            <form onSubmit={handleSaveThreshold}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Kitne stocks pe alert aana chahiye? (Threshold Level):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    className="form-control font-mono" 
                    min="0"
                    required
                    style={{ fontSize: '1.1rem', fontWeight: 700, padding: '10px 14px' }}
                    value={customThresholdVal}
                    onChange={(e) => setCustomThresholdVal(e.target.value)}
                  />
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Units</span>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  Agar inventory is number ke barabar ya isse kam hogi, toh automatic alert trigger hoga.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '28px' }}>
                <button 
                  type="button" 
                  className="btn-pill btn-pill-soft" 
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-pill btn-pill-dark"
                  disabled={savingThreshold}
                >
                  {savingThreshold ? 'Saving Threshold...' : 'Save Custom Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
