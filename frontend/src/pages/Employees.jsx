import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Users, UserCheck, UserX, Shield, ShieldAlert, 
  Search, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Edit3, X, UserPlus, Mail, Lock, User
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

  // Edit Employee Modal State (Full Employee Details)
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [editFormError, setEditFormError] = useState(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    role: 'OPERATOR',
    password: ''
  });

  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [addFormError, setAddFormError] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'OPERATOR',
    password: ''
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.is_superuser;

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

  const handleOpenEditModal = (emp) => {
    setEditingEmployee(emp);
    setEditFormError(null);
    setEditFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      username: emp.username || '',
      email: emp.email || '',
      role: emp.role || 'OPERATOR',
      password: ''
    });
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEmployee(true);
    setEditFormError(null);
    try {
      const payload = {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role,
      };
      if (editFormData.password) {
        payload.password = editFormData.password;
      }
      const res = await api.updateEmployee(editingEmployee.id, payload);
      setActionMsg(res.message || `Employee "${editFormData.username}" updated successfully.`);
      setEditingEmployee(null);
      loadEmployees();
    } catch (err) {
      setEditFormError(err.message);
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleCreateEmployeeSubmit = async (e) => {
    e.preventDefault();
    setAddFormError(null);
    setCreatingUser(true);

    try {
      const res = await api.createUser(newEmployee);
      setActionMsg(res.message || `Employee "${newEmployee.username}" created successfully.`);
      setShowAddModal(false);
      setNewEmployee({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'OPERATOR',
        password: ''
      });
      loadEmployees();
    } catch (err) {
      setAddFormError(err.message);
    } finally {
      setCreatingUser(false);
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
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedEmployees = filteredEmployees.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      <div className="page-header-responsive" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div className="page-header-text">
          <h2 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Users size={22} color="var(--accent-blue)" /> Employees & Team Directory
          </h2>
          <p className="page-header-desc" style={{ marginTop: '4px' }}>
            Manage organization members, assign access privileges, and provision new employee accounts
          </p>
        </div>

        {/* Add Employee Button for Admins */}
        {isAdmin && (
          <button 
            type="button"
            className="btn-pill btn-pill-dark"
            data-tour="team-add-employee"
            onClick={() => {
              setAddFormError(null);
              setShowAddModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700 }}
          >
            <UserPlus size={16} /> Add Employee
          </button>
        )}
      </div>

      {/* Main Panel */}
      <div className="white-panel" data-tour="team-directory" style={{ padding: 0 }}>
        {/* Responsive Toolbar: Search (narrower), Role Filter & Status Filter (aligned horizontally to the right) */}
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
              placeholder="Search employees by name, username, email..."
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
              style={{ minWidth: '150px' }}
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
                        {emp.avatar || localStorage.getItem(`user_custom_avatar_${emp.id}`) ? (
                          <img
                            src={emp.avatar || localStorage.getItem(`user_custom_avatar_${emp.id}`)}
                            alt={emp.username}
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #FFFFFF',
                              boxShadow: '0 2px 6px rgba(18, 24, 38, 0.12)',
                              flexShrink: 0
                            }}
                          />
                        ) : (
                          <div 
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              backgroundColor: emp.is_active ? '#EBF5FF' : '#F3F4F6',
                              color: emp.is_active ? '#1D4ED8' : '#6B7280',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.88rem',
                              flexShrink: 0
                            }}
                          >
                            {(emp.first_name ? emp.first_name[0] : emp.username[0]).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {emp.first_name ? `${emp.first_name} ${emp.last_name || ''}` : emp.username}
                          </div>
                          <div className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            @{emp.username} {emp.id === currentUser?.id ? '(You)' : ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                      {emp.email || '—'}
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
                        <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#9CA3AF' }}>
                          <UserX size={12} /> Inactive
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(emp.date_joined).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {emp.id === currentUser?.id ? (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, padding: '6px 10px', backgroundColor: '#F1F5F9', borderRadius: '8px' }}>
                            Protected Account
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn-pill btn-pill-soft"
                              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                              onClick={() => handleOpenEditModal(emp)}
                              title="Edit Employee Details"
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            <button
                              type="button"
                              className="btn-pill btn-pill-soft"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.76rem',
                                color: emp.is_active ? '#DC2626' : '#059669',
                                backgroundColor: emp.is_active ? '#FEE2E2' : '#DEF7EC',
                                borderColor: emp.is_active ? '#FECACA' : '#BCF0DA'
                              }}
                              onClick={() => handleToggleActive(emp)}
                            >
                              {emp.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages} &bull; Total {filteredEmployees.length} employees
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronLeft size={16} />
              </button>

              <button 
                type="button" 
                className="btn-pill btn-pill-soft" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '6px 10px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Add New Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content-rounded" style={{ maxWidth: '520px' }}>
            <div className="modal-header-rounded">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <UserPlus size={20} color="var(--accent-blue)" /> Add New Employee
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {addFormError && (
              <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '10px', marginBottom: '16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {addFormError}
              </div>
            )}

            <form onSubmit={handleCreateEmployeeSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>First Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rahul"
                    value={newEmployee.first_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Last Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Sharma"
                    value={newEmployee.last_name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Username *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="e.g. rahul_sharma"
                  value={newEmployee.username}
                  onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="e.g. rahul@example.com"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Assign Role *</label>
                <select
                  className="form-control"
                  value={newEmployee.role}
                  onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  style={{ fontWeight: 600 }}
                >
                  <option value="OPERATOR">Inventory Operator (Stock In / Dispatch Out)</option>
                  <option value="MANAGER">Inventory Manager (Stock, Products, Alert Limits)</option>
                  <option value="ADMIN">Administrator (Full System & User Directory)</option>
                  <option value="VIEWER">Read-Only Viewer (Auditing & Visibility only)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Initial Password *</label>
                <input 
                  type="password" 
                  className="form-control" 
                  required
                  placeholder="Enter strong temporary password"
                  value={newEmployee.password}
                  onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-pill btn-pill-soft" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-pill btn-pill-dark"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating Employee...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Employee Details Modal */}
      {editingEmployee && (
        <div className="modal-overlay">
          <div className="modal-content-rounded" style={{ maxWidth: '520px' }}>
            <div className="modal-header-rounded">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Edit3 size={20} color="var(--accent-blue)" /> Edit Employee Details
              </h3>
              <button 
                onClick={() => setEditingEmployee(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {editFormError && (
              <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '10px', marginBottom: '16px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {editFormError}
              </div>
            )}

            <form onSubmit={handleSaveEmployee}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>First Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="First Name"
                    value={editFormData.first_name}
                    onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Last Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Last Name"
                    value={editFormData.last_name}
                    onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Username *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  placeholder="Username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Email address"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>Assigned Role *</label>
                <select
                  className="form-control"
                  style={{ fontWeight: 600 }}
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                >
                  <option value="ADMIN">Administrator (Full System & User Control)</option>
                  <option value="MANAGER">Inventory Manager (Stock, Products, Alert Thresholds)</option>
                  <option value="OPERATOR">Inventory Operator (Stock In / Dispatch Out)</option>
                  <option value="VIEWER">Read-Only Viewer (Auditing & Visibility only)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Reset Password (Leave blank to keep unchanged)
                </label>
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Enter new password if changing"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                  disabled={savingEmployee}
                >
                  {savingEmployee ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
