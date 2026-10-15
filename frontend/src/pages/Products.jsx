import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Plus, Search, Filter, Download, Archive, RefreshCw, 
  CheckCircle, Edit2, ChevronLeft, ChevronRight, Trash2 
} from 'lucide-react';


export default function Products({ user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal states (Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);
  const [formData, setFormData] = useState({

    name: '',
    sku: '',
    description: '',
    category: '',
    supplier: '',
    cost_price: '0.00',
    selling_price: '0.00',
    min_stock_level: 10,
    reorder_quantity: 50,
  });
  const [formError, setFormError] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await api.downloadExport('products', 'inventory_products.csv');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to export catalog');
    } finally {
      setExportingCsv(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      let query = `?page=${currentPage}&search=${encodeURIComponent(search)}`;
      if (statusFilter) query += `&status=${statusFilter}`;

      const [prodRes, catRes, supRes] = await Promise.all([
        api.getProducts(query),
        api.getCategories(),
        api.getSuppliers(),
      ]);

      if (prodRes?.results) {
        setProducts(prodRes.results);
        setTotalCount(prodRes.count || prodRes.results.length);
      } else {
        const arr = Array.isArray(prodRes) ? prodRes : [];
        setProducts(arr);
        setTotalCount(arr.length);
      }

      setCategories(catRes?.results || (Array.isArray(catRes) ? catRes : []));
      setSuppliers(supRes?.results || (Array.isArray(supRes) ? supRes : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      category: '',
      supplier: '',
      cost_price: '0.00',
      selling_price: '0.00',
      min_stock_level: 10,
      reorder_quantity: 50,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormError(null);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      category: p.category || '',
      supplier: p.supplier || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      min_stock_level: p.min_stock_level,
      reorder_quantity: p.reorder_quantity,
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = {
        ...formData,
        category: formData.category ? parseInt(formData.category) : null,
        supplier: formData.supplier ? parseInt(formData.supplier) : null,
      };

      if (editingId) {
        await api.updateProduct(editingId, payload);
        setActionMsg(`Product ${formData.sku} updated successfully.`);
      } else {
        await api.createProduct(payload);
        setActionMsg(`Product ${formData.sku} created successfully.`);
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    try {
      await api.archiveProduct(id);
      setActionMsg('Product archived successfully.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.restoreProduct(id);
      setActionMsg('Product restored successfully.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!product) return;
    setDeletingProduct(true);
    try {
      const res = await api.deleteProduct(product.id);
      setActionMsg(res?.message || `Archived product "${product.name}" (${product.sku}) deleted successfully.`);
      setConfirmDeleteModal(null);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingProduct(false);
    }
  };


  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.is_superuser;

  return (
    <div>
      {actionMsg && (
        <div style={{ padding: '14px 18px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-border)', marginBottom: '20px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <CheckCircle size={18} /> {actionMsg}
        </div>
      )}

      {/* Control bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div data-tour="products-filters" style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', maxWidth: '580px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              style={{ paddingLeft: '38px' }} 
              placeholder="Search by SKU, product name, or description..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <select 
            className="form-control" 
            style={{ width: '170px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ARCHIVED">Archived Only</option>
          </select>
        </div>

        <div data-tour="products-header-actions" style={{ display: 'flex', gap: '12px' }}>
          <button 
            type="button" 
            onClick={handleExportCsv} 
            disabled={exportingCsv} 
            className="btn btn-secondary"
          >
            <Download size={16} /> {exportingCsv ? 'Exporting...' : 'Export Catalog CSV'}
          </button>
          {canEdit && (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Product
            </button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Category</th>
                <th>Stock / Min</th>
                <th>Unit Cost</th>
                <th>Selling Price</th>
                <th>Total Valuation</th>
                <th>Status</th>
                {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-muted)' }}>Loading catalog data...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-muted)' }}>No products found matching filters.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <code className="font-mono" style={{ fontWeight: 700, color: 'var(--color-accent)', fontSize: '0.86rem' }}>
                        {p.sku}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{p.supplier_name || 'No Direct Supplier'}</div>
                    </td>
                    <td>{p.category_name || '-'}</td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '0.92rem', color: p.current_stock === 0 ? 'var(--color-danger)' : p.is_low_stock ? 'var(--color-warning)' : 'inherit' }}>
                        {p.current_stock}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}> / {p.min_stock_level}</span>
                    </td>
                    <td className="font-mono">₹{parseFloat(p.cost_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="font-mono">₹{parseFloat(p.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="font-mono" style={{ fontWeight: 700 }}>
                      ₹{parseFloat(p.inventory_valuation).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      {p.status === 'ACTIVE' ? (
                        p.current_stock === 0 ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : p.is_low_stock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">In Stock</span>
                        )
                      ) : (
                        <span className="badge badge-neutral">Archived</span>
                      )}
                    </td>
                    {canEdit && (
                      <td style={{ textAlign: 'right' }}>
                        <div data-tour="products-table-actions" style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(p)} title="Edit details">
                            <Edit2 size={13} /> Edit
                          </button>
                          {p.status === 'ACTIVE' ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => handleArchive(p.id)} title="Archive product">
                              <Archive size={13} /> Archive
                            </button>
                          ) : (
                            <>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleRestore(p.id)} title="Restore product">
                                <RefreshCw size={13} /> Restore
                              </button>
                              <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => setConfirmDeleteModal(p)} 
                                title="Permanently delete archived product"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
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
            <span><strong>{totalCount}</strong> items</span>
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
              disabled={products.length < 15}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingId ? `Edit Product: ${formData.sku}` : 'Create New Catalog SKU'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-border)', marginBottom: '18px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">SKU Identifier *</label>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    required 
                    placeholder="e.g. ELEC-STM32-001"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. Microcontroller 32-bit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier</label>
                  <select 
                    className="form-control"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Cost Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control font-mono"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control font-mono"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Min Stock Threshold</label>
                  <input 
                    type="number" 
                    className="form-control font-mono"
                    value={formData.min_stock_level}
                    onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Quantity</label>
                  <input 
                    type="number" 
                    className="form-control font-mono"
                    value={formData.reorder_quantity}
                    onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Archived Product */}
      {confirmDeleteModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content-rounded" style={{ maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Delete Archived Product</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Irreversible catalog action</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '22px' }}>
              Are you sure you want to permanently delete <strong>{confirmDeleteModal.name}</strong> (<code style={{ color: 'var(--color-accent)', fontWeight: 700 }}>{confirmDeleteModal.sku}</code>)? This product and its transaction logs will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                disabled={deletingProduct} 
                onClick={() => setConfirmDeleteModal(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                disabled={deletingProduct} 
                onClick={() => handleDeleteProduct(confirmDeleteModal)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Trash2 size={15} /> {deletingProduct ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
