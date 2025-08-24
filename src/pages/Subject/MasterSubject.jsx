// SMS-ui/src/pages/Subject/MasterSubject.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css';

/* ---------- helpers ---------- */
const joinUrl = (base, path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

/* ---------- Reusable Fields (use index.css classes only) ---------- */
function Field({ label, name, type = 'text', value, onChange, required = true }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <select className="form-input" name={name} value={value} onChange={onChange} required>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Add/Edit Modal ---------- */
function SubjectFormModal({
  show,
  editing,
  form,
  setForm,
  departments,
  onClose,
  onSubmit,
  loading,
  error,
  message,
}) {
  if (!show) return null;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
        <button className="modal-x" type="button" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-heading">{editing ? 'Edit Subject' : 'Add Subject'}</h2>

        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-grid form-grid--3">
            <Field label="Subject ID" name="subjectid" value={form.subjectid} onChange={handleChange} />
            <Field label="Code" name="subjectcode" value={form.subjectcode} onChange={handleChange} />
            <Field label="Description" name="subjectdesc" value={form.subjectdesc} onChange={handleChange} />

            <Field
              label="Credits"
              name="subjectcredits"
              type="number"
              value={form.subjectcredits}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Lecture Hrs"
              name="subjectlecturehrs"
              type="number"
              value={form.subjectlecturehrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Tutorial Hrs"
              name="subjecttutorialhrs"
              type="number"
              value={form.subjecttutorialhrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Practical Hrs"
              name="subjectpracticalhrs"
              type="number"
              value={form.subjectpracticalhrs}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Course Type"
              name="subjectcoursetype"
              value={form.subjectcoursetype}
              onChange={handleChange}
              required={false}
            />
            <Field
              label="Category"
              name="subjectcategory"
              value={form.subjectcategory}
              onChange={handleChange}
              required={false}
            />

            <SelectField
              label="Department"
              name="subjectdeptid"
              value={form.subjectdeptid}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Dept' },
                ...departments.map(d => ({
                  value: d.collegedeptid,
                  label: `${d.collegedeptdesc} (${d.collegedeptid})`,
                })),
              ]}
            />

            {/* Active checkbox */}
            <div className="form-row">
              <label className="form-label" htmlFor="subjectactive">
                Active
              </label>
              <input
                id="subjectactive"
                className="form-input"
                type="checkbox"
                name="subjectactive"
                checked={!!form.subjectactive}
                onChange={handleChange}
              />
            </div>
          </div>

          {!!error && <div className="modal-desc modal-desc--error">{error}</div>}
          {!!message && <div className="modal-desc modal-desc--ok">{message}</div>}

          <button type="submit" className={`btn btn--submit ${loading ? 'is-loading' : ''}`} disabled={loading}>
            {loading ? (editing ? 'Updating...' : 'Adding...') : editing ? 'Update Subject' : 'Add Subject'}
          </button>

          <button type="button" className="btn btn--close-fullwidth" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Main Component ---------- */
export default function MasterSubject() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    subjectid: '',
    subjectcode: '',
    subjectdesc: '',
    subjectcredits: '',
    subjectlecturehrs: '',
    subjecttutorialhrs: '',
    subjectpracticalhrs: '',
    subjectcoursetype: '',
    subjectcategory: '',
    subjectdeptid: '',
    subjectactive: true,
  });
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');

  // search + pagination
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  // delete confirmation state
  const [pendingDelete, setPendingDelete] = useState(null); // the subject object to delete

  // endpoints
  const SUBJECT_LIST_URL = joinUrl(config.SUBJECT_ROUTE, 'list');
  const SUBJECT_ADD_URL = joinUrl(config.SUBJECT_ROUTE, 'add');
  const SUBJECT_UPDATE_URL = id => joinUrl(config.SUBJECT_ROUTE, `update/${encodeURIComponent(id)}`);
  const SUBJECT_DELETE_URL = id => joinUrl(config.SUBJECT_ROUTE, `delete/${encodeURIComponent(id)}`);
  const DEPARTMENTS_URL = joinUrl(config.MASTER_DEPTS_ROUTE);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SUBJECT_LIST_URL);
      setSubjects(res.data?.subjects ?? res.data ?? []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(DEPARTMENTS_URL);
      setDepartments(res.data ?? []);
    } catch {
      setDepartments([]);
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset to first page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  // filter subjects by query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(s => {
      const id = String(s.subjectid ?? '').toLowerCase();
      const code = String(s.subjectcode ?? '').toLowerCase();
      const desc = String(s.subjectdesc ?? '').toLowerCase();
      const cat = String(s.subjectcategory ?? '').toLowerCase();
      const dept = String(s.subjectdeptid ?? '').toLowerCase();
      const ctype = String(s.subjectcoursetype ?? '').toLowerCase();
      return (
        id.includes(q) ||
        code.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        dept.includes(q) ||
        ctype.includes(q)
      );
    });
  }, [subjects, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // keep page within range if list shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const handleSubmit = async e => {
    e.preventDefault();
    setModalError('');
    setModalMessage('');
    setLoading(true);

    if (!form.subjectid || !form.subjectcode || !form.subjectdesc) {
      setModalError('Subject ID, Code, and Description are required.');
      setLoading(false);
      return;
    }

    try {
      if (editing) {
        await axios.put(SUBJECT_UPDATE_URL(form.subjectid), form);
        setModalMessage('Subject updated successfully!');
      } else {
        await axios.post(SUBJECT_ADD_URL, form);
        setModalMessage('Subject added successfully!');
      }

      setTimeout(() => {
        setModalMessage('');
        setShowModal(false);
        setEditing(false);
        setForm({
          subjectid: '',
          subjectcode: '',
          subjectdesc: '',
          subjectcredits: '',
          subjectlecturehrs: '',
          subjecttutorialhrs: '',
          subjectpracticalhrs: '',
          subjectcoursetype: '',
          subjectcategory: '',
          subjectdeptid: '',
          subjectactive: true,
        });
        fetchSubjects();
      }, 900);
    } catch (err) {
      setModalError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setForm({
      subjectid: '',
      subjectcode: '',
      subjectdesc: '',
      subjectcredits: '',
      subjectlecturehrs: '',
      subjecttutorialhrs: '',
      subjectpracticalhrs: '',
      subjectcoursetype: '',
      subjectcategory: '',
      subjectdeptid: '',
      subjectactive: true,
    });
    setEditing(false);
    setShowModal(true);
    setModalError('');
    setModalMessage('');
  };

  const handleEditClick = subj => {
    setForm({
      ...subj,
      subjectactive:
        subj.subjectactive === true || subj.subjectactive === 'true' || subj.subjectactive === 1,
    });
    setEditing(true);
    setShowModal(true);
    setModalError('');
    setModalMessage('');
  };

  // open delete confirmation
  const requestDelete = (subj) => setPendingDelete(subj);

  // actually delete (used by confirm)
  const deleteSubject = async (id) => {
    try {
      await axios.delete(SUBJECT_DELETE_URL(id));
      setSubjects(ss => ss.filter(d => d.subjectid !== id));
    } catch {
      alert('Failed to delete subject');
    }
  };

  // confirm / cancel handlers
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteSubject(pendingDelete.subjectid);
    setPendingDelete(null);
  };
  const cancelDelete = () => setPendingDelete(null);

  // Delete confirmation modal (styled like your screenshot)
  const DeleteConfirmModal = () =>
    !pendingDelete ? null : (
      <div className="modal-overlay" onClick={cancelDelete}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={cancelDelete}>×</button>
          <div className="modal-title danger">Delete Subject?</div>
          <div className="modal-desc">
            Are you sure you want to delete subject:{' '}
            <a href="#!" onClick={(e) => e.preventDefault()}>
              {pendingDelete.subjectdesc || pendingDelete.subjectid}
            </a>{' '}
            ?
          </div>
          <div className="modal-actions">
            <button className="btn btn--danger" onClick={confirmDelete}>Yes, Delete</button>
            <button className="btn btn--secondary" onClick={cancelDelete}>Cancel</button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="mu-page">
      {/* Page Title */}
      <h1 className="mu-title">Subjects</h1>

      {/* Toolbar */}
      <div className="mu-toolbar">
        <div className="searchbox">
          <span className="searchbox__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="searchbox__input"
            placeholder="Search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button className="btn btn--add" onClick={handleAddClick}>
          <span className="btn-plus">+</span> Add
        </button>
      </div>

      {/* Modal */}
      <SubjectFormModal
        show={showModal}
        editing={editing}
        form={form}
        setForm={setForm}
        departments={departments}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        loading={loading}
        error={modalError}
        message={modalMessage}
      />

      {/* Table Card */}
      <div className="mu-tablewrap-outer">
        <div className="mu-tablewrap">
          <h2 className="mu-subtitle">All Subjects</h2>
          <div className="mu-tablecard" style={{ overflow: 'visible' }}>
            <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">Subject ID</th>
                    <th className="mu-th">Code</th>
                    <th className="mu-th">Description</th>
                    <th className="mu-th">Credits</th>
                    <th className="mu-th">Lecture Hrs</th>
                    <th className="mu-th">Tutorial Hrs</th>
                    <th className="mu-th">Practical Hrs</th>
                    <th className="mu-th">Course Type</th>
                    <th className="mu-th">Category</th>
                    <th className="mu-th">Dept ID</th>
                    <th className="mu-th">Active</th>
                    <th className="mu-th" style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length === 0 ? (
                    <tr>
                      <td className="mu-empty" colSpan={12}>
                        {loading ? 'Loading...' : 'No subjects found'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map(subj => (
                      <tr key={subj.subjectid}>
                        <td className="mu-td">{subj.subjectid}</td>
                        <td className="mu-td">{subj.subjectcode}</td>
                        <td className="mu-td">{subj.subjectdesc}</td>
                        <td className="mu-td">{subj.subjectcredits}</td>
                        <td className="mu-td">{subj.subjectlecturehrs}</td>
                        <td className="mu-td">{subj.subjecttutorialhrs}</td>
                        <td className="mu-td">{subj.subjectpracticalhrs}</td>
                        <td className="mu-td">{subj.subjectcoursetype}</td>
                        <td className="mu-td">{subj.subjectcategory}</td>
                        <td className="mu-td">{subj.subjectdeptid}</td>
                        <td className="mu-td">{subj.subjectactive ? 'Yes' : 'No'}</td>
                        <td className="mu-td">
                          <button className="btn btn--primary" onClick={() => handleEditClick(subj)}>
                            Edit
                          </button>
                          <button className="btn btn--danger" onClick={() => requestDelete(subj)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination (chips style) */}
            <div className="mu-pagination mu-pagination--chips">
              <div className="mu-pageinfo mu-pageinfo--chips">
                Showing page {page} of {totalPages} pages
              </div>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  title="Previous"
                >
                  «
                </button>
                <span className="pagechip pagechip--active">{page}</span>
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  title="Next"
                >
                  »
                </button>
              </div>
            </div>
            {/* /pagination */}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {DeleteConfirmModal()}
    </div>
  );
}
