import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Package, ArrowDownLeft, ArrowUpRight, AlertTriangle, 
  DollarSign, Activity, TrendingUp, Layers, CheckCircle2, Clock, 
  SlidersHorizontal, ChevronRight, Check
} from 'lucide-react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick Threshold Configuration Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newThreshold, setNewThreshold] = useState(10);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardSummary();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [modalError, setModalError] = useState(null);

  const handleOpenThresholdModal = (product) => {
    setSelectedProduct(product);
    setNewThreshold(product.min_stock_level);
    setSuccessMsg(null);
    setModalError(null);
  };

  const handleSaveThreshold = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSavingThreshold(true);
    setModalError(null);
    try {
      const res = await api.setAlertThreshold(selectedProduct.id, parseInt(newThreshold));
      setSuccessMsg(res.message);
      setSelectedProduct(null);
      loadDashboard();
    } catch (err) {
      setModalError(err.message || 'Failed to update alert threshold.');
    } finally {
      setSavingThreshold(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Clock size={32} style={{ marginBottom: '12px', color: 'var(--accent-blue)' }} />
        <div style={{ fontWeight: 700 }}>Synchronizing Warehouse Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '12px' }}>
        <strong>Error connecting:</strong> {error}
      </div>
    );
  }

  const { kpis, categories_distribution, movement_trends, recent_transactions, critical_items } = data || {};

  return (
    <div>
      {successMsg && (
        <div style={{ padding: '14px 20px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* 1. Hero Black Card (from "My Card" in iBanko mockup) */}
      <div className="hero-black-card">
        <div>
          <div className="hero-balance-label">Total Inventory Valuation</div>
          <div className="hero-balance-val font-mono">
            ₹{(kpis?.total_inventory_valuation ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '10px', color: '#34D399', fontSize: '0.84rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={16} /> Cost-Basis Active Inventory Assets &bull; {kpis?.total_units_in_stock ?? 0} Physical Units
          </div>
        </div>

        <div className="hero-pill-actions">
          <button className="btn-pill-white" onClick={() => onNavigate && onNavigate('transactions')}>
            <ArrowDownLeft size={16} color="#059669" /> Stock In
          </button>
          <button className="btn-pill-outline" onClick={() => onNavigate && onNavigate('transactions')}>
            <ArrowUpRight size={16} color="#FB923C" /> Dispatch Out
          </button>
        </div>
      </div>

      {/* 2. Three Soft Pastel Record Cards (Mint, Peach, Lavender from Mockup) */}
      <div className="record-grid">
        {/* Mint Card - Catalog Units */}
        <div className="record-card mint">
          <div className="record-card-title">
            <span>Total Catalog SKUs</span>
            <Package size={18} color="var(--pastel-mint-text)" />
          </div>
          <div className="record-card-val font-mono" style={{ color: 'var(--pastel-mint-text)' }}>
            {kpis?.total_products ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#046C4E', fontWeight: 600 }}>Active Warehouse Items</div>
        </div>

        {/* Peach Card - Low Stock Alert Condition */}
        <div className="record-card peach">
          <div className="record-card-title">
            <span>Low Stock Warnings</span>
            <AlertTriangle size={18} color="var(--pastel-peach-text)" />
          </div>
          <div className="record-card-val font-mono" style={{ color: 'var(--pastel-peach-text)' }}>
            {kpis?.low_stock_count ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9B1C1C', fontWeight: 600 }}>Crossed Minimum Threshold</div>
        </div>

        {/* Lavender Card - Out of Stock Depletions */}
        <div className="record-card lavender">
          <div className="record-card-title">
            <span>Depleted Units</span>
            <Activity size={18} color="var(--pastel-lavender-text)" />
          </div>
          <div className="record-card-val font-mono" style={{ color: 'var(--pastel-lavender-text)' }}>
            {kpis?.out_of_stock_count ?? 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#3753C4', fontWeight: 600 }}>Zero Stock Available</div>
        </div>
      </div>

      {/* 3. Analytics Charts Grid */}
      <div className="dashboard-charts-grid">
        {/* Movement Flow (Money Flow in Mockup) */}
        <div className="white-panel">
          <div className="white-panel-header">
            <h3 className="white-panel-title">
              <TrendingUp size={18} color="var(--accent-blue)" /> Stock Movement Flow
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>7-Day Intake vs Outflow</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={movement_trends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F4F8" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="stock_in" name="Stock In" stroke="#10B981" fill="#D1FAE5" fillOpacity={0.6} />
                <Area type="monotone" dataKey="stock_out" name="Stock Out" stroke="#F97316" fill="#FFEDD5" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="white-panel">
          <div className="white-panel-header">
            <h3 className="white-panel-title">
              <Layers size={18} color="#6366F1" /> Category Stock Allocations
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Units</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={categories_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F4F8" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0' }} />
                <Bar dataKey="stock_sum" name="Units Stored" fill="#11141C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Critical Items with Custom Alert Threshold Configuration */}
      <div className="white-panel" style={{ padding: 0 }}>
        <div style={{ padding: '22px 28px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="white-panel-title">
              <AlertTriangle size={18} color="#D97706" /> Critical Threshold Watchlist & Custom Alert Configuration
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Set custom stock alert triggers per product. When inventory reaches or drops below this count, automatic alerts trigger.
            </p>
          </div>
          <button className="btn-pill btn-pill-soft" onClick={() => onNavigate && onNavigate('alerts')}>
            View All Alerts <ChevronRight size={14} />
          </button>
        </div>

        <div className="rounded-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Current Stock</th>
                <th>Configured Alert Threshold</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Custom Threshold</th>
              </tr>
            </thead>
            <tbody>
              {(critical_items && critical_items.length > 0) ? (
                critical_items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700 }}>{item.name}</td>
                    <td><code className="font-mono" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{item.sku}</code></td>
                    <td className="font-mono" style={{ fontWeight: 800, color: item.current_stock === 0 ? '#DC2626' : '#D97706' }}>
                      {item.current_stock}
                    </td>
                    <td className="font-mono">
                      <span className="badge-pill badge-neutral">Alert at &le; {item.min_stock_level} units</span>
                    </td>
                    <td>
                      {item.current_stock === 0 ? (
                        <span className="badge-pill badge-peach">Out of Stock</span>
                      ) : (
                        <span className="badge-pill badge-amber">Low Stock</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn-pill btn-pill-soft" 
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleOpenThresholdModal(item)}
                      >
                        <SlidersHorizontal size={13} /> Set Alert
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={24} color="#10B981" style={{ marginBottom: '8px' }} />
                    <div>All products currently meet or exceed their configured thresholds.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Custom Threshold Configuration Modal */}
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

            {modalError && (
              <div style={{ padding: '10px 14px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '10px', fontSize: '0.84rem', fontWeight: 600, marginBottom: '16px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveThreshold}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Trigger Alert When Stock Drops To Or Below:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    className="form-control font-mono" 
                    min="0"
                    required
                    style={{ fontSize: '1.1rem', fontWeight: 700, padding: '10px 14px' }}
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                  />
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Units</span>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  Agar stock is number ke barabar ya isse kam hoga, to system automatically Low-Stock warning create karega.
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
                  {savingThreshold ? 'Saving Threshold...' : 'Update Alert Setting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
