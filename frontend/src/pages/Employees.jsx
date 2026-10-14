import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Users, UserCheck, UserX, Shield, ShieldAlert, 
  Search, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Edit3, X
} from 'lucide-react';

export default function Employees({ user: currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Role Edit Modal State
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState('OPERATOR');
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getUsers();
      setEmployees(res?.results || (Array.isArray(res) ? res : []));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (emp) => {
    if (emp.id === currentUser?.id) {
      alert("Aap apna khud ka account deactivate nahi kar sakte.");
      return;
    }
    const actionWord = emp.is_active ? 'deactivate' : 'activate';
    if (!window.confirm(`Kya aap employee "${emp.username}" ko ${actionWord} karna chahte hain?`)) {
      return;
    }

    try {
      const res = await api.toggleUserActive(emp.id);
      setActionMsg(res.message);
      loadEmployees();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleOpenRoleModal = (emp) => {
    setEditingEmployee(emp);
    setSelectedRole(emp.role || 'OPERATOR');
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingRole(true);
    try {
      const res = await api.updateUserRole(editingEmployee.id, selectedRole);
      setActionMsg(res.message);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const q = search.toLowerCase().trim();
    const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.trim().toLowerCase();
    const matchesSearch = !q ||
      emp.username.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      fullName.includes(q);

    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && emp.is_active) || 
      (statusFilter === 'INACTIVE' && !emp.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge-pill badge-peach" style={{ fontWeight: 800 }}>Admin</span>;
      case 'MANAGER':
        return <span className="badge-pill badge-amber" style={{ fontWeight: 800 }}>Manager</span>;
      case 'OPERATOR':
        return <span className="badge-pill badge-neutral" style={{ fontWeight: 800 }}>Operator</span>;
      case 'VIEWER':
        return <span className="badge-pill badge-mint" style={{ fontWeight: 800 }}>Viewer</span>;
      default:
        return <span className="badge-pill badge-neutral">{role}</span>;
    }
  };

  return (
    <div>
      {actionMsg && (
        <div style={{ padding: '14px 20px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
          <CheckCircle2 size={18} /> {actionMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '14px 20px', backgroundColor: '#FDE8E8', color: '#9B1C1C', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header-responsive">
        <div className="page-header-text">
          <h2 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--accent-blue)" /> Employees & Team Directory
          </h2>
          <p className="page-header-desc">
            Manage organization members, assign access privileges, and activate or deactivate user accounts
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="white-panel" data-tour="team-directory" style={{ padding: 0 }}>
        {/* Responsive Toolbar: Search, Role Filter, Status Filter */}
        <div className="panel-toolbar-responsive" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAFBFC' }}>
          <div className="panel-toolbar-left" style={{ flex: 1, minWidth: '240px' }}>
            <div className="panel-search-box" style={{ flex: 1 }}>
              <input
                type="text"
                className="panel-search-input"
                placeholder="Search employees by name, username, email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select
              className="panel-filter-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Inventory Manager</option>
              <option value="OPERATOR">Inventory Operator</option>
              <option value="VIEWER">Read-Only Viewer</option>
            </select>

            <select
              className="panel-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Employees</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>
        </div>

        {/* Employees Table with Scroll */}
        <div className="rounded-table-wrapper" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee / User</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Date Joined</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading employees directory...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No employees found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => (
                  <tr key={emp.id} style={{ opacity: emp.is_active ? 1 : 0.65 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: emp.is_active ? '#EBF5FF' : '#F3F4F6',
                            color: emp.is_active ? '#1D4ED8' : '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}
                        >
                          {emp.username ? emp.username[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username}
                          </div>
                          <div className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            @{emp.username} {emp.id === currentUser?.id && <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>(You)</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {emp.email || '-'}
                    </td>

                    <td>
                      {getRoleBadge(emp.role)}
                    </td>

                    <td>
                      {emp.is_active ? (
                        <span className="badge-pill badge-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={12} /> Active
                        </span>
                      ) : (
                        <span className="badge-pill badge-peach" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserX size={12} /> Deactivated
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {emp.date_joined ? new Date(emp.date_joined).toLocaleDateString() : '-'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        {emp.id !== currentUser?.id ? (
                          <>
                            <button
                              className="btn-pill btn-pill-soft"
                              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                              title="Assign new role"
                              onClick={() => handleOpenRoleModal(emp)}
                            >
                              <Edit3 size={12} /> Change Role
                            </button>

                            <button
                              className="btn-pill"
                              style={{
                                padding: '6px 14px',
                                fontSize: '0.78rem',
                                backgroundColor: emp.is_active ? '#FEE2E2' : '#DEF7EC',
                                color: emp.is_active ? '#991B1B' : '#03543F',
                                borderColor: emp.is_active ? '#FCA5A5' : '#84E1BC',
                              }}
                              title={emp.is_active ? "Deactivate employee account" : "Activate employee account"}
                              onClick={() => handleToggleActive(emp)}
                            >
                              {emp.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        ) : (
                          <span 
                            className="badge-pill badge-neutral" 
                            style={{ fontSize: '0.76rem', color: 'var(--text-muted)', border: '1px dashed var(--border-light)', padding: '6px 14px' }}
                            title="Current administrator session is protected"
                          >
                            Protected Account
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredEmployees.length > pageSize && (
          <div className="pagination-bar">
            <div className="pagination-info">
              <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              <span>&bull;</span>
              <span><strong>{filteredEmployees.length}</strong> employees</span>
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

      {/* Role Assignment Modal */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content-rounded">
            <div className="modal-header-rounded">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="var(--accent-blue)" /> Assign Employee Role
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F8FAFD', borderRadius: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
                {editingEmployee.first_name ? `${editingEmployee.first_name} ${editingEmployee.last_name || ''}` : editingEmployee.username}
              </div>
              <div className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', marginTop: '2px' }}>
                @{editingEmployee.username} &bull; {editingEmployee.email}
              </div>
            </div>

            <form onSubmit={handleSaveRole}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  Select Access Privilege / Role:
                </label>
                <select
                  className="form-control"
                  style={{ padding: '10px 14px', fontWeight: 600 }}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="ADMIN">Administrator (Full System & User Control)</option>
                  <option value="MANAGER">Inventory Manager (Stock, Products, Alert Thresholds)</option>
                  <option value="OPERATOR">Inventory Operator (Stock In / Dispatch Out)</option>
                  <option value="VIEWER">Read-Only Viewer (Auditing & Visibility only)</option>
                </select>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  Role change se user ke permissions immediately update ho jayenge.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '28px' }}>
                <button 
                  type="button" 
                  className="btn-pill btn-pill-soft" 
                  onClick={() => setEditingEmployee(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-pill btn-pill-dark"
                  disabled={savingRole}
                >
                  {savingRole ? 'Updating Role...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
