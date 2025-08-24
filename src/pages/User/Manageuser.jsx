// SMS-ui/src/pages/User/Manageuser.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css'; // SMS-ui/src/index.css

const USERS_PER_PAGE = 4;

export default function Manageuser() {
  const [users, setUsers] = useState([]);
  const [userIdInput, setUserIdInput] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userActive, setUserActive] = useState('true');
  const [userIdToEdit, setUserIdToEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Toasts
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUserMail, setDeleteUserMail] = useState('');

  // Search & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${config.MASTER_USER_ROUTE}/users`);
      setUsers(res.data.users || []);
    } catch {
      showToast('Failed to load users', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'userid') setUserIdInput(value);
    if (name === 'userpwd') setUserPassword(value);
    if (name === 'userroles') setUserRole(value);
    if (name === 'useractive') setUserActive(value);
  };

  const resetFields = () => {
    setUserIdInput('');
    setUserPassword('');
    setUserRole('');
    setUserActive('true');
  };

  const handleAddUser = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.post(`${config.MASTER_USER_ROUTE}/users`, {
        userid: userIdInput,
        userpwd: userPassword,
        userroles: userRole,
        usercreated: new Date().toISOString(),
        userlastlogon: new Date().toISOString(),
        useractive: userActive === 'true'
      });
      setShowAddModal(false);
      resetFields();
      await fetchUsers();
      setPage(1);
      showToast('User added successfully', 'success');
    } catch {
      showToast('Error adding user', 'error');
    } finally { setLoading(false); }
  };

  const handleEditUser = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.put(`${config.MASTER_USER_ROUTE}/users/${userIdToEdit}`, {
        userpwd: userPassword,
        userroles: userRole,
        usercreated: new Date().toISOString(),
        userlastlogon: new Date().toISOString(),
        useractive: userActive === 'true'
      });
      setShowEditModal(false);
      resetFields();
      await fetchUsers();
      showToast('User updated successfully', 'success');
    } catch {
      showToast('Error updating user', 'error');
    } finally { setLoading(false); }
  };

  const handleDeleteUserPrompt = (userid) => {
    setDeleteUserId(userid);
    setDeleteUserMail(userid);
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserId) return;
    setLoading(true);
    try {
      const res = await axios.delete(`${config.MASTER_USER_ROUTE}/users/${deleteUserId}`);
      setDeleteUserId(null);
      setDeleteUserMail('');
      await fetchUsers();
      setPage(1);
      showToast(`User ${res.data.userid || deleteUserId} deleted successfully`, 'success');
    } catch {
      showToast('Error deleting user', 'error');
    } finally { setLoading(false); }
  };

  const handleDeleteUserCancel = () => {
    setDeleteUserId(null);
    setDeleteUserMail('');
  };

  // Filtered users based on search, newest first
  const filteredUsers = [...users]
    .filter(u =>
      (u.userid?.toLowerCase().includes(search.toLowerCase()) ||
        u.userroles?.toLowerCase().includes(search.toLowerCase()))
    )
    .reverse();

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE
  );

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="mu-page">
      {/* Toast */}
      {toast.show &&
        <div className="toast-wrapper">
          <div className={`toast-box ${toast.type === 'error' ? 'toast--error' : 'toast--success'}`}>
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
      }

      {/* Delete Modal */}
      {deleteUserId &&
        <div className="modal-overlay">
          <div className="modal">
            <button
              onClick={handleDeleteUserCancel}
              className="modal-x"
              title="Close"
              aria-label="Close"
            >×</button>
            <div className="modal-title danger">Delete User?</div>
            <div className="modal-desc">
              Are you sure you want to delete user:<br />
              <span className="highlight">{deleteUserMail}</span> ?
            </div>
            <div className="modal-actions">
              <button
                onClick={handleDeleteUserConfirm}
                disabled={loading}
                className="btn btn--danger"
              >{loading ? 'Deleting...' : 'Yes, Delete'}</button>
              <button
                onClick={handleDeleteUserCancel}
                disabled={loading}
                className="btn btn--secondary"
              >Cancel</button>
            </div>
          </div>
        </div>
      }

      <div className="mu-container">
        <h2 className="mu-title">Manage Users</h2>

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

          <button
            onClick={() => { setShowAddModal(true); resetFields(); }}
            className="btn btn--add"
          >
            <span className="btn-plus">+</span>
            Add
          </button>
        </div>

        {/* Users Table */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h3 className="mu-subtitle">All Users</h3>
            <div className="mu-tablecard">
              {/* NOTE: only change here → add mu-table--fixed */}
              <table className="mu-table mu-table--fixed">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">User ID</th>
                    <th className="mu-th">Role</th>
                    <th className="mu-th">Active</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.userid}>
                      <td className="mu-td mu-td--userid">{u.userid}</td>
                      <td className="mu-td">{u.userroles}</td>
                      <td className="mu-td">
                        <span className={`status ${u.useractive ? 'status--active' : 'status--inactive'}`}>
                          {u.useractive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="mu-td">
                        <button
                          onClick={() => {
                            setUserIdToEdit(u.userid);
                            setUserIdInput(u.userid);
                            setUserPassword('');
                            setUserRole(u.userroles);
                            setUserActive(u.useractive.toString());
                            setShowEditModal(true);
                          }}
                          className="btn btn--primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUserPrompt(u.userid)}
                          className="btn btn--danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="mu-empty">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="mu-pagination">
                <span className="mu-pageinfo">
                  Showing page <b>{page}</b> of <b>{totalPages}</b> pages
                </span>
                <div className="mu-pagebtns">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-page"
                    aria-label="Previous page"
                  >&laquo;</button>
                  <span className="badge-page">{page}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn-page"
                    aria-label="Next page"
                  >&raquo;</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showAddModal && (
          <Modal title="Add User" onClose={() => setShowAddModal(false)} showCross>
            <UserForm
              onSubmit={handleAddUser}
              handleChange={handleChange}
              userid={userIdInput}
              password={userPassword}
              role={userRole}
              active={userActive}
              loading={loading}
            />
          </Modal>
        )}

        {showEditModal && (
          <Modal title="Edit User" onClose={() => setShowEditModal(false)} showCross>
            <UserForm
              onSubmit={handleEditUser}
              handleChange={handleChange}
              userid={userIdInput}
              password={userPassword}
              role={userRole}
              active={userActive}
              loading={loading}
              isEdit={true}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children, showCross }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        {showCross && (
          <button
            onClick={onClose}
            className="modal-x"
            title="Close"
            aria-label="Close"
          >×</button>
        )}
        <h3 className="modal-heading">{title}</h3>
        {children}
        <button onClick={onClose} className="btn btn--close-fullwidth">Close</button>
      </div>
    </div>
  );
}

function UserForm({
  onSubmit, handleChange, userid, password, role, active, loading, isEdit = false
}) {
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    setRolesLoading(true);
    axios.get(config.MASTER_ROLE_ROUTE)
      .then(res => {
        setRoles(Array.isArray(res.data) ? res.data : []);
        setRolesLoading(false);
      })
      .catch(() => {
        setRoles([]);
        setRolesLoading(false);
      });
  }, []);

  return (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <label className="form-label">User ID (Email)</label>
        <input
          type="email"
          name="userid"
          value={userid}
          onChange={handleChange}
          disabled={isEdit}
          required
          className="form-input"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <label className="form-label">Password</label>
        <input
          type="password"
          name="userpwd"
          value={password}
          onChange={handleChange}
          required
          className="form-input"
          autoComplete="off"
        />
      </div>
      <div className="form-row">
        <label className="form-label">Role</label>
        <select
          name="userroles"
          value={role}
          onChange={handleChange}
          required
          className="form-input"
          disabled={rolesLoading}
        >
          <option value="">
            {rolesLoading ? 'Loading roles...' : 'Select role...'}
          </option>
          {roles.map(r =>
            <option key={r.role_id} value={r.role_desc}>
              {r.role_desc}
            </option>
          )}
        </select>
      </div>
      <div className="form-row">
        <label className="form-label">Status</label>
        <select
          name="useractive"
          value={active}
          onChange={handleChange}
          required
          className="form-input"
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`btn btn--submit ${loading ? 'is-loading' : ''}`}
      >
        {loading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  );
}
