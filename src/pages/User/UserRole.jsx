import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css'; // SMS-ui/src/index.css

const PAGE_SIZE = 4;

export default function UserRole() {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    userid: '',
    userrolesid: '',
    userroledesc: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [editKey, setEditKey] = useState(null); // { userid, userrolesid } ORIGINAL ids
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Master roles for dropdown
  const [masterRoles, setMasterRoles] = useState([]);

  useEffect(() => { fetchRoles(); fetchMasterRoles(); }, []);
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ ...toast, show: false }), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => { setCurrentPage(1); }, [search, roles.length]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // ---- API calls using config ----
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(config.USER_ROLE_ROUTE);
      setRoles(res.data.roles || []);
    } catch {
      setRoles([]);
      showToast('Failed to load roles', 'error');
    }
    setLoading(false);
  };

  const fetchMasterRoles = async () => {
    try {
      const res = await axios.get(config.MASTER_ROLE_ROUTE);
      // Expecting an array [{ role_id, role_desc }, ...]
      setMasterRoles(Array.isArray(res.data) ? res.data : (res.data.roles || []));
    } catch {
      setMasterRoles([]);
    }
  };

  // When role description is selected, set also the role id (hidden)
  const handleRoleDescChange = (e) => {
    const selectedDesc = e.target.value;
    const found = masterRoles.find(r => r.role_desc === selectedDesc);
    setFormData(prev => ({
      ...prev,
      userroledesc: selectedDesc,
      userrolesid: found ? String(found.role_id) : ''
    }));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { userid, userrolesid, userroledesc } = formData;
    if (!userid || !userroledesc) return showToast('All fields are required', 'error');

    try {
      if (editMode && editKey) {
        // Use ORIGINAL ids in the URL; send possibly NEW userrolesid in body
        await axios.put(
          `${config.USER_ROLE_ROUTE}/${encodeURIComponent(editKey.userid)}/${encodeURIComponent(editKey.userrolesid)}`,
          { userroledesc, userrolesid } // new role id is optional & handled by API
        );
        showToast('Role updated successfully', 'success');
      } else {
        await axios.post(config.USER_ROLE_ROUTE, formData);
        showToast('Role added successfully', 'success');
      }
      setShowForm(false);
      setFormData({ userid: '', userrolesid: '', userroledesc: '' });
      setEditMode(false);
      setEditKey(null);
      fetchRoles();
    } catch {
      showToast('Error submitting form', 'error');
    }
  };

  const openEdit = (role) => {
    setFormData({
      userid: role.userid,
      userrolesid: String(role.userrolesid ?? ''), // current role id
      userroledesc: role.userroledesc,
    });
    setEditKey({ userid: role.userid, userrolesid: String(role.userrolesid ?? '') }); // keep ORIGINAL
    setEditMode(true);
    setShowForm(true);
  };

  const openAdd = () => {
    setFormData({ userid: '', userrolesid: '', userroledesc: '' });
    setEditMode(false);
    setEditKey(null);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteInfo) return;
    try {
      await axios.delete(
        `${config.USER_ROLE_ROUTE}/${encodeURIComponent(deleteInfo.userid)}/${encodeURIComponent(deleteInfo.userrolesid)}`
      );
      showToast('Role deleted successfully', 'success');
      setDeleteInfo(null);
      fetchRoles();
    } catch {
      showToast('Error deleting role', 'error');
    }
  };

  // --- Filter + Pagination ---
  const filteredRoles = roles.filter(role =>
    (role.userid || '').toLowerCase().includes(search.toLowerCase()) ||
    (role.userroledesc || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredRoles.length / PAGE_SIZE) || 0;
  const paginatedRoles = filteredRoles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="mu-page">
      {/* Toast */}
      {toast.show && (
        <div className="toast-wrapper">
          <div className={`toast-box ${toast.type === 'error' ? 'toast--error' : ''}`}>
            <span className="toast-emoji">{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span className="toast-text">{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="toast-close"
              aria-label="Close toast"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="mu-container">
        <h2 className="mu-title">Manage User Roles</h2>

        {/* Toolbar */}
        <div className="mu-toolbar">
          <div className="searchbox">
            <span className="searchbox__icon" aria-hidden="true">
              <svg width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="searchbox__input"
            />
          </div>

          <button onClick={openAdd} className="btn btn--add">
            <span className="btn-plus">+</span>
            Add
          </button>
        </div>

        {/* Table area */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h3 className="mu-subtitle">All User Roles</h3>

            <div className="mu-tablecard">
              {/* FIXED layout just for this table */}
              <table className="mu-table mu-table--fixed-roles">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">User ID</th>
                    <th className="mu-th">Description</th>
                    <th className="mu-th">Created At</th>
                    <th className="mu-th">Updated At</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="mu-empty">Loading...</td>
                    </tr>
                  ) : paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="mu-empty">No roles found</td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role, idx) => (
                      <tr key={`${role.userid}-${role.userrolesid}-${idx}`}>
                        <td className="mu-td">{role.userid}</td>
                        <td className="mu-td">{role.userroledesc}</td>
                        <td className="mu-td">{role.createdat}</td>
                        <td className="mu-td">{role.updatedat}</td>
                        <td className="mu-td">
                          <button className="btn btn--primary" onClick={() => openEdit(role)}>Edit</button>
                          <button className="btn btn--danger" onClick={() => setDeleteInfo(role)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mu-pagination">
                <span className="mu-pageinfo">
                  {`Showing page ${totalPages === 0 ? 0 : currentPage} of ${totalPages} pages`}
                </span>
                <div className="mu-pagebtns">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="btn-page"
                    aria-label="Previous page"
                  >&laquo;</button>
                  <span className="badge-page">{currentPage}</span>
                  <button
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="btn-page"
                    aria-label="Next page"
                  >&raquo;</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="modal-overlay">
            <div className="modal">
              <button
                className="modal-x"
                title="Close"
                aria-label="Close"
                onClick={() => { setShowForm(false); setEditMode(false); setEditKey(null); }}
              >×</button>
              <h3 className="modal-heading">{editMode ? 'Edit User Role' : 'Add User Role'}</h3>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label className="form-label">User ID</label>
                  <input
                    type="text"
                    name="userid"
                    value={formData.userid}
                    onChange={handleChange}
                    className="form-input"
                    autoComplete="off"
                    disabled={editMode}
                    required
                  />
                </div>

                <div className="form-row">
                  <label className="form-label">Role Description</label>
                  <select
                    name="userroledesc"
                    value={formData.userroledesc}
                    onChange={handleRoleDescChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select role...</option>
                    {masterRoles.map(r => (
                      <option key={r.role_id} value={r.role_desc}>{r.role_desc}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`btn btn--submit ${loading ? 'is-loading' : ''}`}
                >
                  {editMode ? 'Update Role' : 'Add Role'}
                </button>
              </form>

              <button
                onClick={() => { setShowForm(false); setEditMode(false); setEditKey(null); }}
                className="btn btn--close-fullwidth"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteInfo && (
          <div className="modal-overlay">
            <div className="modal">
              <button
                className="modal-x"
                title="Close"
                aria-label="Close"
                onClick={() => setDeleteInfo(null)}
              >×</button>

              <div className="modal-title danger">Delete User Role?</div>
              <div className="modal-desc">
                Are you sure you want to delete role:<br />
                <span className="highlight">
                  {deleteInfo.userid} / {deleteInfo.userrolesid}
                </span> ?
              </div>

              <div className="modal-actions">
                <button className="btn btn--danger" onClick={handleDelete}>
                  Yes, Delete
                </button>
                <button className="btn btn--secondary" onClick={() => setDeleteInfo(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
