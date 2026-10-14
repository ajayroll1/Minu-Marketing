import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter & Pagination states
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

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

  return (
    <div>
      {/* Header section */}
      <div className="page-header-responsive">
        <div className="page-header-text">
          <h2 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="var(--accent-blue)" /> Enterprise Security & Mutation Audit Trail
          </h2>
          <p className="page-header-desc">
            Immutable log of catalog mutations, stock transfers, and administrative interventions
          </p>
        </div>
      </div>

      <div className="white-panel" style={{ padding: 0 }}>
        {/* Toolbar with Search (narrower), Entity Filter & Action Filter (aligned to the right horizontally) */}
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
              placeholder="Search audit trail by user, action, SKU, payload..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="panel-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="panel-filter-select"
              style={{ minWidth: '150px' }}
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
              style={{ minWidth: '150px' }}
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
          <table style={{ tableLayout: 'auto', width: '100%', minWidth: '760px' }}>
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Timestamp</th>
                <th style={{ width: '22%' }}>Action</th>
                <th style={{ width: '12%' }}>Entity</th>
                <th style={{ width: '10%' }}>Target ID</th>
                <th style={{ width: '14%' }}>User / Principal</th>
                <th style={{ width: '26%' }}>Payload Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>Loading audit trail...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>No audit events found matching your criteria.</td></tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id}>
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
    </div>
  );
}

