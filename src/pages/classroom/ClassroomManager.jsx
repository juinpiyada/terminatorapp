// SMS-ui/src/pages/Classroom/ClassroomManager.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css'; // keep your shared styles

// ---- Safe URL joiner (prevents double/missing slashes)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build API URL from config
const API = joinUrl(config.CLASS_ROOM_ROUTE); // e.g. http://localhost:9090/api/class-room

const CLASSROOMS_PER_PAGE = 4;

export default function ClassroomManager() {
  // Data
  const [classrooms, setClassrooms] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Search & pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLabel, setDeleteLabel] = useState('');

  // Form state
  const initialForm = {
    classroomid: '',
    classroomcollege: '',
    classroomdept: '',
    classroomcode: '',
    classroomname: '',
    classroomtype: '',
    classroomcapacity: '',
    classroomisavailable: false,
    classroomprojector: false,
    classfloornumber: '',
    classroomlat: '',
    classroomlong: '',
    classroomloc: ''
  };
  const [formData, setFormData] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  // Fetch
  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(API);
      const raw = res?.data?.classrooms ?? res?.data ?? [];
      setClassrooms(Array.isArray(raw) ? raw : []);
    } catch (err) {
      showToast('Failed to load classrooms', 'error');
      setClassrooms([]);
    }
  };
  useEffect(() => { fetchClassrooms(); }, []);

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
  };

  // Search & filter (loose match across visible fields)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classrooms;
    return classrooms.filter(cls =>
      [
        cls.classroomid,
        cls.classroomname,
        cls.classroomcollege,
        cls.classroomdept,
        cls.classroomtype,
        cls.classroomcode,
        cls.classroomcapacity,
        cls.classfloornumber,
        cls.classroomlat,
        cls.classroomlong,
        cls.classroomloc
      ].join(' ').toLowerCase().includes(q)
    );
  }, [classrooms, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / CLASSROOMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * CLASSROOMS_PER_PAGE, page * CLASSROOMS_PER_PAGE);
  useEffect(() => { setPage(1); }, [search]);

  // Form helpers
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  const resetForm = () => {
    setFormData(initialForm);
    setEditId(null);
  };

  // Add
  const handleAddOpen = () => {
    resetForm();
    setShowAddModal(true);
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(API, formData);
      setShowAddModal(false);
      resetForm();
      await fetchClassrooms();
      setPage(1);
      showToast('Classroom added successfully', 'success');
    } catch (err) {
      showToast('Error adding classroom', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Edit
  const handleEditOpen = (cls) => {
    setFormData({
      classroomid: cls.classroomid ?? '',
      classroomcollege: cls.classroomcollege ?? '',
      classroomdept: cls.classroomdept ?? '',
      classroomcode: cls.classroomcode ?? '',
      classroomname: cls.classroomname ?? '',
      classroomtype: cls.classroomtype ?? '',
      classroomcapacity: cls.classroomcapacity ?? '',
      classroomisavailable: !!cls.classroomisavailable,
      classroomprojector: !!cls.classroomprojector,
      classfloornumber: cls.classfloornumber ?? '',
      classroomlat: cls.classroomlat ?? '',
      classroomlong: cls.classroomlong ?? '',
      classroomloc: cls.classroomloc ?? ''
    });
    setEditId(cls.classroomid);
    setShowEditModal(true);
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    setLoading(true);
    try {
      await axios.put(joinUrl(API, String(editId)), formData);
      setShowEditModal(false);
      resetForm();
      await fetchClassrooms();
      showToast('Classroom updated successfully', 'success');
    } catch (err) {
      showToast('Error updating classroom', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const promptDelete = (cls) => {
    setDeleteId(cls.classroomid);
    setDeleteLabel(`${cls.classroomname || ''} (${cls.classroomcode || cls.classroomid})`);
  };
  const confirmDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await axios.delete(joinUrl(API, String(deleteId)));
      setDeleteId(null);
      setDeleteLabel('');
      await fetchClassrooms();
      setPage(1);
      showToast('Classroom deleted successfully', 'success');
    } catch {
      showToast('Error deleting classroom', 'error');
    } finally {
      setLoading(false);
    }
  };
  const cancelDelete = () => {
    setDeleteId(null);
    setDeleteLabel('');
  };

  return (
    // NOTE: page-scope class to keep table fonts compact on this page only
    <div className="mu-page classroom-slim">
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
            >×</button>
          </div>
        </div>
      }

      {/* Delete Modal */}
      {deleteId &&
        <div className="modal-overlay">
          <div className="modal">
            <button onClick={cancelDelete} className="modal-x" title="Close" aria-label="Close">×</button>
            <div className="modal-title danger">Delete Classroom?</div>
            <div className="modal-desc">
              Are you sure you want to delete:<br />
              <span className="highlight">{deleteLabel}</span> ?
            </div>
            <div className="modal-actions">
              <button onClick={confirmDelete} disabled={loading} className="btn btn--danger">
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={cancelDelete} disabled={loading} className="btn btn--secondary">Cancel</button>
            </div>
          </div>
        </div>
      }

      <div className="mu-container">
        <h2 className="mu-title">Classroom Manager</h2>

        {/* Toolbar */}
        <div className="mu-toolbar">
          <div className="searchbox">
            <span className="searchbox__icon" aria-hidden="true">
              <svg width="23" height="23" viewBox="0 0 24 24">
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

          <button onClick={handleAddOpen} className="btn btn--add">
            <span className="btn-plus">+</span>
            Add
          </button>
        </div>

        {/* Table */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h3 className="mu-subtitle">All Classrooms</h3>
            <div className="mu-tablecard">
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    {/* Removed "#" column */}
                    <th className="mu-th">ID</th>
                    <th className="mu-th">Name</th>
                    <th className="mu-th">College</th>
                    <th className="mu-th">Dept</th>
                    <th className="mu-th">Type</th>
                    <th className="mu-th">Code</th>
                    <th className="mu-th">Capacity</th>
                    <th className="mu-th">Floor</th>
                    <th className="mu-th">Available</th>
                    <th className="mu-th">Projector</th>
                    <th className="mu-th">Lat</th>
                    <th className="mu-th">Long</th>
                    <th className="mu-th">Loc</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((cls, idx) => (
                    <tr key={cls.classroomid}>
                      {/* Removed serial number cell */}
                      <td className="mu-td mu-td--userid">{cls.classroomid}</td>
                      <td className="mu-td">{cls.classroomname}</td>
                      <td className="mu-td">{cls.classroomcollege}</td>
                      <td className="mu-td">{cls.classroomdept}</td>
                      <td className="mu-td">{cls.classroomtype}</td>
                      <td className="mu-td">{cls.classroomcode}</td>
                      <td className="mu-td">{cls.classroomcapacity}</td>
                      <td className="mu-td">{cls.classfloornumber}</td>
                      <td className="mu-td">
                        <span className={`status ${cls.classroomisavailable ? 'status--active' : 'status--inactive'}`}>
                          {cls.classroomisavailable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="mu-td">
                        <span className={`status ${cls.classroomprojector ? 'status--active' : 'status--inactive'}`}>
                          {cls.classroomprojector ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="mu-td">{cls.classroomlat}</td>
                      <td className="mu-td">{cls.classroomlong}</td>
                      <td className="mu-td">{cls.classroomloc}</td>
                      <td className="mu-td">
                        <button onClick={() => handleEditOpen(cls)} className="btn btn--primary">Edit</button>
                        <button onClick={() => promptDelete(cls)} className="btn btn--danger">Delete</button>
                      </td>
                    </tr>
                  ))}

                  {paginated.length === 0 && (
                    <tr>
                      {/* was 15; now 14 after removing "#" column */}
                      <td colSpan={14} className="mu-empty">No classrooms found</td>
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
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="btn-page"
                    aria-label="Previous page"
                  >&laquo;</button>
                  <span className="badge-page">{page}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="btn-page"
                    aria-label="Next page"
                  >&raquo;</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <Modal title="Add Classroom" onClose={() => setShowAddModal(false)} showCross>
            <ClassroomForm
              onSubmit={handleAddSubmit}
              formData={formData}
              onChange={handleFormChange}
              loading={loading}
              isEdit={false}
            />
          </Modal>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <Modal title="Edit Classroom" onClose={() => setShowEditModal(false)} showCross>
            <ClassroomForm
              onSubmit={handleEditSubmit}
              formData={formData}
              onChange={handleFormChange}
              loading={loading}
              isEdit={true}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

/* ---------- Reusable Modal (same look/feel as Manage Users) ---------- */
function Modal({ title, onClose, children, showCross }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        {showCross && (
          <button onClick={onClose} className="modal-x" title="Close" aria-label="Close">×</button>
        )}
        <h3 className="modal-heading">{title}</h3>
        {children}
        <button onClick={onClose} className="btn btn--close-fullwidth">Close</button>
      </div>
    </div>
  );
}

/* ---------------------- Classroom Add/Edit Form ---------------------- */
function ClassroomForm({ onSubmit, formData, onChange, loading, isEdit }) {
  return (
    <form onSubmit={onSubmit}>
      {/* Use 3-column grid like other screens */}
      <div className="form-grid form-grid--3">
        {/* ID (lock during edit) */}
        <div className="form-row">
          <label className="form-label">Classroom ID</label>
          <input
            className="form-input"
            type="text"
            name="classroomid"
            value={formData.classroomid}
            onChange={onChange}
            disabled={isEdit}
            required
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Name</label>
          <input
            className="form-input"
            type="text"
            name="classroomname"
            value={formData.classroomname}
            onChange={onChange}
            required
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Code</label>
          <input
            className="form-input"
            type="text"
            name="classroomcode"
            value={formData.classroomcode}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">College</label>
          <input
            className="form-input"
            type="text"
            name="classroomcollege"
            value={formData.classroomcollege}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Department</label>
          <input
            className="form-input"
            type="text"
            name="classroomdept"
            value={formData.classroomdept}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Type</label>
          <input
            className="form-input"
            type="text"
            name="classroomtype"
            value={formData.classroomtype}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Capacity</label>
          <input
            className="form-input"
            type="number"
            name="classroomcapacity"
            value={formData.classroomcapacity}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Floor No.</label>
          <input
            className="form-input"
            type="number"
            name="classfloornumber"
            value={formData.classfloornumber}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Location (Text)</label>
          <input
            className="form-input"
            type="text"
            name="classroomloc"
            value={formData.classroomloc}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Latitude</label>
          <input
            className="form-input"
            type="text"
            name="classroomlat"
            value={formData.classroomlat}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Longitude</label>
          <input
            className="form-input"
            type="text"
            name="classroomlong"
            value={formData.classroomlong}
            onChange={onChange}
            autoComplete="off"
          />
        </div>

        <div className="form-row">
          <label className="form-label">Available</label>
          <input
            className="form-input"
            type="checkbox"
            name="classroomisavailable"
            checked={!!formData.classroomisavailable}
            onChange={onChange}
          />
        </div>

        <div className="form-row">
          <label className="form-label">Projector</label>
          <input
            className="form-input"
            type="checkbox"
            name="classroomprojector"
            checked={!!formData.classroomprojector}
            onChange={onChange}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`btn btn--submit ${loading ? 'is-loading' : ''}`}
      >
        {loading ? 'Saving...' : (isEdit ? 'Update Classroom' : 'Add Classroom')}
      </button>
    </form>
  );
}
