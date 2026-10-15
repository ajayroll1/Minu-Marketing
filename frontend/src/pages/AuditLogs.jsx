import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Shield, ChevronLeft, ChevronRight, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Search & Filter & Pagination states
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [confirmSingleDelete, setConfirmSingleDelete] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res?.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Distinct entities and actions for filters
  const entities = Array.from(new Set(logs.map(l => l.target_entity).filter(Boolean)));
  const actions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase().trim();
    const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '');
    const matchesSearch = !q ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.target_entity && log.target_entity.toLowerCase().includes(q)) ||
      (log.username && log.username.toLowerCase().includes(q)) ||
      (log.target_id && String(log.target_id).toLowerCase().includes(q)) ||
      detailsStr.toLowerCase().includes(q);

    const matchesEntity = entityFilter === 'ALL' || log.target_entity === entityFilter;
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesEntity && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Checkbox handlers
  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = paginatedLogs.map(l => l.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedLogs.map(l => l.id));
      setSelectedIds(selectedIds.filter(id => !pageIds.has(id)));
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const isAllPageSelected = paginatedLogs.length > 0 && paginatedLogs.every(l => selectedIds.includes(l.id));

  // Clear All logs
  const handleClearAll = async () => {
    setProcessing(true);
    try {
      // Instant optimistic wipe
      setLogs([]);
      setSelectedIds([]);
      setShowClearAllModal(false);
      const res = await api.clearAuditLogs();
      setActionMsg(res?.message || 'All audit logs have been successfully cleared.');
      loadLogs();
    } catch (err) {
      setErrorMsg(err.message);
      loadLogs();
    } finally {
      setProcessing(false);
    }
  };

  // Bulk delete selected logs
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setProcessing(true);
    try {
      const toDelete = [...selectedIds];
      // Instant optimistic removal
      setLogs(prev => prev.filter(l => !toDelete.includes(l.id)));
      setSelectedIds([]);
      setShowBulkModal(false);
      const res = await api.bulkDeleteAuditLogs(toDelete);
      setActionMsg(res?.message || `${toDelete.length} audit logs deleted successfully.`);
      loadLogs();
    } catch (err) {
      setErrorMsg(err.message);
      loadLogs();
    } finally {
      setProcessing(false);
    }
  };

  // Single delete
  const handleSingleDelete = async () => {
    if (!confirmSingleDelete) return;
    setProcessing(true);
    try {
      const id = confirmSingleDelete.id;
      // Instant optimistic removal
      setLogs(prev => prev.filter(l => l.id !== id));
      setSelectedIds(prev => prev.filter(i => i !== id));
      setConfirmSingleDelete(null);
      const res = await api.deleteAuditLog(id);
      setActionMsg(res?.message || 'Audit log entry deleted successfully.');
      loadLogs();
    } catch (err) {
      setErrorMsg(err.message);
      loadLogs();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      {/* Alert Banners */}
      {actionMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: '#DEF7EC', color: '#03543F', border: '1px solid #BCF0DA', marginBottom: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> {actionMsg}
          </div>
          <button type="button" onClick={() => setActionMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#03543F', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 18px', backgroundColor: '#FDE8E8', color: '#9B1C1C', border: '1px solid #F8B4B4', marginBottom: '18px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9B1C1C', fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Header section with Action Buttons */}
      <div className="page-header-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div className="page-header-text">
          <h2 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Shield size={20} color="var(--accent-blue)" /> Enterprise Security & Mutation Audit Trail
          </h2>
          <p className="page-header-desc" style={{ margin: '4px 0 0 0' }}>
            Immutable log of catalog mutations, stock transfers, and administrative interventions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setShowBulkModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={logs.length === 0}
            onClick={() => setShowClearAllModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: logs.length === 0 ? 'var(--text-muted)' : '#DC2626',
              backgroundColor: logs.length === 0 ? '#F3F4F6' : '#FFF5F5',
              borderColor: logs.length === 0 ? 'var(--border-light)' : '#FECACA'
            }}
            title="Permanently Clear All Audit Logs"
          >
            <Trash2 size={14} /> Clear All Logs
          </button>
        </div>
      </div>

      <div className="white-panel" style={{ padding: 0 }}>
        {/* Toolbar with Search, Entity Filter & Action Filter */}
        <div 
          className="panel-toolbar-responsive" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '16px', 
            padding: '14px 24px', 
            borderBottom: '1px solid var(--border-light)', 
            backgroundColor: '#FAFBFC',
            flexWrap: 'wrap'
          }}
        >
          <div className="panel-search-box" style={{ maxWidth: '320px', width: '100%', flex: '1 1 240px' }}>
            <input
              type="text"
              className="panel-search-input"
              placeholder="Search audit trail by user, action, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="panel-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select
              className="panel-filter-select"
              style={{ minWidth: '140px' }}
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Entities</option>
              {entities.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
            <select
              className="panel-filter-select"
              style={{ minWidth: '140px' }}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Actions</option>
              {actions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ tableLayout: 'auto', width: '100%', minWidth: '820px' }}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    title="Select All On Page"
                  />
                </th>
                <th style={{ width: '15%' }}>Timestamp</th>
                <th style={{ width: '20%' }}>Action</th>
                <th style={{ width: '12%' }}>Entity</th>
                <th style={{ width: '10%' }}>Target ID</th>
                <th style={{ width: '13%' }}>User / Principal</th>
                <th style={{ width: '22%' }}>Payload Details</th>
                <th style={{ width: '8%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading audit trail...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No audit events found matching your criteria.</td></tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} style={{ backgroundColor: selectedIds.includes(log.id) ? '#F0F7FF' : 'inherit' }}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log.id)}
                        onChange={() => handleToggleSelect(log.id)}
                        style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                      />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td>
                      <span className="badge-pill badge-neutral" style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.target_entity}</td>
                    <td>
                      <code className="font-mono" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem' }}>
                        #{log.target_id || '-'}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.86rem' }}>{log.username || 'System'}</td>
                    <td style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span title={JSON.stringify(log.details)}>
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn-pill btn-pill-soft"
                        onClick={() => setConfirmSingleDelete(log)}
                        title="Delete this audit record"
                        style={{
                          padding: '5px 8px',
                          color: '#DC2626',
                          backgroundColor: '#FEE2E2',
                          borderColor: '#FECACA',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar for Audit Logs */}
        {filteredLogs.length > pageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              <span>&bull;</span>
              <span><strong>{filteredLogs.length}</strong> events logged</span>
              {selectedIds.length > 0 && (
                <>
                  <span>&bull;</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{selectedIds.length} selected</span>
                </>
              )}
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
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal: Clear All Audit Logs */}
      {showClearAllModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content-rounded" style={{ maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Clear Audit Logs</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Permanent database cleanup</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to permanently clear all <strong>{logs.length}</strong> audit records from the system? This action cannot be reversed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={() => setShowClearAllModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={handleClearAll}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  borderColor: '#DC2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> {processing ? 'Clearing...' : 'Clear All Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Bulk Delete Selected Logs */}
      {showBulkModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content-rounded" style={{ maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete Selected Logs</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Batch removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to permanently delete the <strong>{selectedIds.length}</strong> selected audit log entries?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={() => setShowBulkModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={handleBulkDelete}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  borderColor: '#DC2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> {processing ? 'Deleting...' : `Delete (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Delete */}
      {confirmSingleDelete && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content-rounded" style={{ maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete Audit Record</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Single entry removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to delete audit entry <strong>#{confirmSingleDelete.id}</strong> (<code>{confirmSingleDelete.action}</code> on <code>{confirmSingleDelete.target_entity}</code>)?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={() => setConfirmSingleDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={processing} 
                onClick={handleSingleDelete}
                style={{
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  borderColor: '#DC2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> {processing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


