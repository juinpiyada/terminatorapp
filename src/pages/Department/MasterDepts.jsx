// SMS-ui/src/pages/Department/MasterDepts.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css'; // use your styles

// ---- Safe URL joiner (prevents double slashes / duplicated bases)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// ---- Normalize colleges (handles array or {colleges: [...]}, and varied key names)
function normalizeColleges(raw) {
  const arr = Array.isArray(raw) ? raw : (raw?.colleges ?? []);
  return (arr || []).map((c) => {
    const id =
      c.collegeid ?? c.id ?? c.college_id ?? c.COLLEGEID ?? c.COLLEGE_ID ?? '';
    const name =
      c.collegename ?? c.name ?? c.college_name ?? c.COLLEGENAME ?? c.COLLEGE_NAME ?? id;
    return { collegeid: String(id ?? ''), collegename: String(name ?? '') };
  });
}

// ---- Reusable Input Field ----
function Field({ label, name, value, onChange }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        required={
          name === 'collegedeptid' ||
          name === 'collegeid' ||
          name === 'colldept_code' ||
          name === 'collegedeptdesc'
        }
      />
    </div>
  );
}

// ---- Reusable Select Field ----
function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="form-row">
      <label className="form-label">{label}</label>
      <select
        className="form-input"
        name={name}
        value={value}
        onChange={onChange}
        required
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---- Department Modal Form for Add/Edit ----
function DeptFormModal({
  show,
  editing,
  form,
  setForm,
  colleges,
  onClose,
  onSubmit,
  loading,
  error,
  message,
}) {
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={onClose}>
          ×
        </button>
        <h2 className="modal-heading">
          {editing ? 'Edit Department' : 'Add Department'}
        </h2>
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="form-grid form-grid--3">
            <Field
              label="Department ID"
              name="collegedeptid"
              value={form.collegedeptid}
              onChange={handleChange}
            />
            <SelectField
              label="College"
              name="collegeid"
              value={form.collegeid}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select College' },
                ...colleges.map((c) => ({
                  value: c.collegeid,
                  label: `${c.collegename} (${c.collegeid})`,
                })),
              ]}
            />
            <Field
              label="Dept Code"
              name="colldept_code"
              value={form.colldept_code}
              onChange={handleChange}
            />
            <div className="span-3">
              <Field
                label="Description"
                name="collegedeptdesc"
                value={form.collegedeptdesc}
                onChange={handleChange}
              />
            </div>
            <Field
              label="HOD"
              name="colldepthod"
              value={form.colldepthod}
              onChange={handleChange}
            />
            <Field
              label="Email"
              name="colldepteaail"
              value={form.colldepteaail}
              onChange={handleChange}
            />
            <Field
              label="Phone"
              name="colldeptphno"
              value={form.colldeptphno}
              onChange={handleChange}
            />
          </div>

          {error && (
            <p className="modal-desc modal-desc--error" style={{ textAlign: 'center' }}>
              {error}
            </p>
          )}
          {message && (
            <p className="modal-desc modal-desc--ok" style={{ textAlign: 'center' }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className={`btn btn--submit ${loading ? 'is-loading' : ''}`}
            disabled={loading}
          >
            {loading
              ? editing
                ? 'Updating...'
                : 'Adding...'
              : editing
              ? 'Update Department'
              : 'Add Department'}
          </button>
          <button type="button" className="btn btn--close-fullwidth" onClick={onClose}>
            Close
          </button>
        </form>
      </div>
    </div>
  );
}

const PAGE_SIZE = 4;

// ---- Main Departments Component ----
export default function MasterDepts() {
  const [departments, setDepartments] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    collegedeptid: '',
    collegeid: '',
    colldept_code: '',
    collegedeptdesc: '',
    colldepthod: '',
    colldepteaail: '',
    colldeptphno: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // search + pagination
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Build routes from config
  const ROUTES = {
    DEPTS: config.MASTER_DEPTS_ROUTE, // e.g. http://localhost:9090/api/master-depts
  };

  // ---------- effects ----------
  // Colleges
  useEffect(() => {
    const COLLEGES_URL = `${config.BASE_URL}/master-college/view-colleges`;
    axios
      .get(COLLEGES_URL)
      .then((res) => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(normalizeColleges(raw));
      })
      .catch(() => setColleges([]));
  }, []);

  // Departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get(ROUTES.DEPTS);
      setDepartments(
        Array.isArray(res.data) ? res.data : res.data?.departments || []
      );
    } catch {
      setDepartments([]);
    }
  };
  useEffect(() => {
    fetchDepartments();
  }, []);

  // reset to first page on search change
  useEffect(() => {
    setPage(1);
  }, [query]);

  // filtered + paginated lists
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => {
      const id = String(d.collegedeptid ?? '').toLowerCase();
      const collegeid = String(d.collegeid ?? '').toLowerCase();
      const code = String(d.colldept_code ?? '').toLowerCase();
      const desc = String(d.collegedeptdesc ?? '').toLowerCase();
      const hod = String(d.colldepthod ?? '').toLowerCase();
      return (
        id.includes(q) ||
        collegeid.includes(q) ||
        code.includes(q) ||
        desc.includes(q) ||
        hod.includes(q)
      );
    });
  }, [departments, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // keep page in range if list shrinks
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // --- Add or Edit submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (
      !form.collegedeptid ||
      !form.collegeid ||
      !form.colldept_code ||
      !form.collegedeptdesc
    ) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    try {
      if (editing) {
        await axios.put(
          joinUrl(ROUTES.DEPTS, `/${encodeURIComponent(form.collegedeptid)}`),
          form
        );
        setMessage('Department updated successfully!');
      } else {
        await axios.post(ROUTES.DEPTS, form);
        setMessage('Department added successfully!');
      }
      setTimeout(() => {
        setMessage('');
        setShowModal(false);
        setEditing(false);
        setForm({
          collegedeptid: '',
          collegeid: '',
          colldept_code: '',
          collegedeptdesc: '',
          colldepthod: '',
          colldepteaail: '',
          colldeptphno: '',
        });
        fetchDepartments();
      }, 900);
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Show Add Modal ---
  const handleAddClick = () => {
    setForm({
      collegedeptid: '',
      collegeid: '',
      colldept_code: '',
      collegedeptdesc: '',
      colldepthod: '',
      colldepteaail: '',
      colldeptphno: '',
    });
    setEditing(false);
    setShowModal(true);
    setError('');
    setMessage('');
  };

  // --- Show Edit Modal ---
  const handleEditClick = (dept) => {
    setForm({ ...dept });
    setEditing(true);
    setShowModal(true);
    setError('');
    setMessage('');
  };

  // --- Delete Department ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?'))
      return;
    try {
      await axios.delete(joinUrl(ROUTES.DEPTS, `/${encodeURIComponent(id)}`));
      setDepartments((ds) => ds.filter((d) => d.collegedeptid !== id));
    } catch {
      alert('Failed to delete department');
    }
  };

  // --- helper to display college description ---
  const getCollegeName = (id) => {
    const c = colleges.find((clg) => clg.collegeid === String(id));
    return c ? c.collegename : id;
  };

  return (
    <div className="mu-page">
      <div className="mu-container">
        <h1 className="mu-title">Master Department</h1>

        {/* Toolbar: search + add */}
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
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn--add" onClick={handleAddClick}>
            <span className="btn-plus">+</span> Add
          </button>
        </div>

        {/* Modal for Add/Edit Department */}
        <DeptFormModal
          show={showModal}
          editing={editing}
          form={form}
          setForm={setForm}
          colleges={colleges}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          message={message}
        />

        {/* Table */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h2 className="mu-subtitle">All Departments</h2>

            <div className="mu-tablecard" style={{ overflow: 'visible' }}>
              <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                <table className="mu-table">
                  <thead>
                    <tr className="mu-thead-row">
                      <th className="mu-th">Dept ID</th>
                      <th className="mu-th">College</th>
                      <th className="mu-th">Code</th>
                      <th className="mu-th">Description</th>
                      <th className="mu-th">HOD</th>
                      <th className="mu-th">Email</th>
                      <th className="mu-th">Phone</th>
                      <th className="mu-th" style={{ textAlign: 'center' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="mu-empty" colSpan={8}>
                          No departments found
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((dept) => (
                        <tr key={dept.collegedeptid}>
                          <td className="mu-td">{dept.collegedeptid}</td>
                          <td className="mu-td">{getCollegeName(dept.collegeid)}</td>
                          <td className="mu-td">{dept.colldept_code}</td>
                          <td className="mu-td">{dept.collegedeptdesc}</td>
                          <td className="mu-td">{dept.colldepthod}</td>
                          <td className="mu-td">{dept.colldepteaail}</td>
                          <td className="mu-td">{dept.colldeptphno}</td>
                          <td className="mu-td">
                            <button
                              className="btn btn--primary"
                              onClick={() => handleEditClick(dept)}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn--danger"
                              onClick={() =>
                                handleDelete(dept.collegedeptid)
                              }
                              title="Delete"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mu-pagination mu-pagination--chips">
                <div className="mu-pageinfo mu-pageinfo--chips">
                  Showing page {page} of {totalPages} pages
                </div>
                <div className="mu-pagebtns mu-pagebtns--chips">
                  <button
                    className="pagechip"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    title="Previous"
                  >
                    «
                  </button>
                  <span className="pagechip pagechip--active">{page}</span>
                  <button
                    className="pagechip"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
        {/* /table */}
      </div>
    </div>
  );
}