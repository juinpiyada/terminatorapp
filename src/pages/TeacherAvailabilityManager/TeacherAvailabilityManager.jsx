// SMS-ui/src/pages/TeacherAvailability/TeacherAvailabilityManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css';

/* ---------- helpers ---------- */
const joinUrl = (base = '', path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

const pickArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === 'object') {
    const k = Object.keys(raw).find((x) => Array.isArray(raw[x]));
    if (k) return raw[k];
  }
  return [];
};

/* ---------- routes ---------- */
const TEACHERS_API = joinUrl(config.TEACHER_ROUTE);                     // e.g. /api/teacher
const AVAIL_API    = joinUrl(config.TEACHER_AVAILABILITY_ROUTE);        // e.g. /api/teacher-availability

/* ---------- constants ---------- */
const PAGE_SIZE = 6;

const initialForm = {
  teaacheravlid: '',
  teacherid: '',
  avldate: '',
  slottime: '',
  avlflafr: false,
};

export default function TeacherAvailabilityManager() {
  /* ---------- state ---------- */
  const [availabilities, setAvailabilities] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  /* ---------- fetchers ---------- */
  const fetchTeachers = async () => {
    try {
      const res = await axios.get(TEACHERS_API);
      setTeachers(pickArray(res.data));
    } catch {
      setTeachers([]);
    }
  };

  const fetchAvailabilities = async () => {
    setLoading(true);
    try {
      const res = await axios.get(AVAIL_API);
      // accept {data:[...]} or bare array
      setAvailabilities(pickArray(res.data));
    } catch (e) {
      setError('Failed to fetch teacher availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchAvailabilities();
  }, []);

  /* ---------- handlers ---------- */
  const resetForm = () => setForm(initialForm);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      if (editing) {
        await axios.put(joinUrl(AVAIL_API, form.teaacheravlid), form);
        setMessage('Availability updated');
      } else {
        await axios.post(AVAIL_API, form);
        setMessage('Availability added');
      }
      setShowForm(false);
      setEditing(false);
      resetForm();
      fetchAvailabilities();
    } catch (err) {
      setError('Failed to save availability');
      // console.error(err?.response?.data || err);
    }
  };

  const handleEdit = (row) => {
    setForm({
      teaacheravlid: row.teaacheravlid || '',
      teacherid: row.teacherid || '',
      avldate: row.avldate || '',
      slottime: row.slottime || '',
      avlflafr: !!row.avlflafr,
    });
    setEditing(true);
    setShowForm(true);
    setMessage(''); setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this availability?')) return;
    setMessage(''); setError('');
    try {
      await axios.delete(joinUrl(AVAIL_API, id));
      setAvailabilities((list) => list.filter((r) => r.teaacheravlid !== id));
      setMessage('Availability deleted');
    } catch (err) {
      setError('Failed to delete availability');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(false);
    resetForm();
    setMessage(''); setError('');
  };

  /* ---------- filter + pagination ---------- */
  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return availabilities;
    return availabilities.filter((r) =>
      [
        r.teaacheravlid,
        r.teacherid,
        r.avldate,
        r.slottime,
        (r.avlflafr ? 'yes' : 'no'),
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .some((txt) => txt.includes(s))
    );
  }, [availabilities, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  /* ---------- render ---------- */
  return (
    <div className="mu-page">
      {(message || error) && (
        <div className="toast-wrapper">
          <div className={`toast-box ${error ? 'toast--error' : ''}`}>
            <span className="toast-emoji">{error ? '⚠️' : '✅'}</span>
            <span className="toast-text">{error || message}</span>
            <button className="toast-close" onClick={() => { setMessage(''); setError(''); }}>×</button>
          </div>
        </div>
      )}

      <h1 className="mu-title">Teacher Availability</h1>

      {/* Toolbar */}
      <div className="mu-toolbar">
        <label className="searchbox" aria-label="Search availability">
          <span className="searchbox__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="searchbox__input"
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <button
          className="btn btn--add"
          onClick={() => { setShowForm(true); setEditing(false); resetForm(); setMessage(''); setError(''); }}
        >
          <span className="btn-plus">＋</span> Add
        </button>
      </div>

      {/* Table Card */}
      <div className="mu-tablewrap-outer">
        <div className="mu-tablewrap">
          <h2 className="mu-subtitle">All Teacher Availabilities</h2>

          <div className="mu-tablecard">
            <table className="mu-table">
              <thead>
                <tr className="mu-thead-row">
                  <th className="mu-th">Availability ID</th>
                  <th className="mu-th">Teacher</th>
                  <th className="mu-th">Date</th>
                  <th className="mu-th">Slot</th>
                  <th className="mu-th">Available</th>
                  <th className="mu-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="mu-td mu-empty" colSpan={6}>Loading...</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td className="mu-td mu-empty" colSpan={6}>No records found</td></tr>
                ) : (
                  pageItems.map((row) => {
                    const t = teachers.find((x) => x.teacherid === row.teacherid);
                    return (
                      <tr key={row.teaacheravlid}>
                        <td className="mu-td">{row.teaacheravlid}</td>
                        <td className="mu-td">
                          {t ? <span className="mu-td--userid">{t.teachername}</span> : row.teacherid}
                        </td>
                        <td className="mu-td">{row.avldate}</td>
                        <td className="mu-td">{row.slottime}</td>
                        <td className="mu-td">
                          <span className={`status ${row.avlflafr ? 'status--active' : 'status--inactive'}`}>
                            {row.avlflafr ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="mu-td">
                          <button className="btn btn--primary" onClick={() => handleEdit(row)}>Edit</button>
                          <button className="btn btn--danger" onClick={() => handleDelete(row.teaacheravlid)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination (chips style) */}
            <div className="mu-pagination mu-pagination--chips">
              <span className="mu-pageinfo mu-pageinfo--chips">
                {`Showing page ${page} of ${totalPages} pages`}
              </span>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button
                  className="pagechip"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  «
                </button>
                <span className="pagechip pagechip--active">{page}</span>
                <button
                  className="pagechip"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  »
                </button>
              </div>
            </div>
            {/* /Pagination */}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <form className="modal modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <button type="button" className="modal-x" onClick={handleCancel}>×</button>
            <h3 className="modal-heading">{editing ? 'Edit Availability' : 'Add Availability'}</h3>

            <div className="form-grid form-grid--3">
              <div className="form-row">
                <label className="form-label">Availability ID</label>
                <input
                  className="form-input"
                  name="teaacheravlid"
                  value={form.teaacheravlid}
                  onChange={handleChange}
                  disabled={editing}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label">Teacher</label>
                <select
                  className="form-input"
                  name="teacherid"
                  value={form.teacherid}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.teacherid ?? t.id} value={t.teacherid ?? t.id}>
                      {(t.teachername ?? t.name) ? `${t.teachername ?? t.name} (${t.teacherid ?? t.id})` : (t.teacherid ?? t.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="avldate"
                  value={form.avldate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label">Slot Time</label>
                <input
                  className="form-input"
                  name="slottime"
                  placeholder="e.g. 10:30-12:30"
                  value={form.slottime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label">Available</label>
                <div>
                  <input
                    type="checkbox"
                    id="avlflafr"
                    name="avlflafr"
                    checked={form.avlflafr}
                    onChange={handleChange}
                  />{' '}
                  <label htmlFor="avlflafr">Available for Faculty/Arrangement?</label>
                </div>
              </div>
            </div>

            {!!error && <div className="modal-desc modal-desc--error">{error}</div>}
            {!!message && <div className="modal-desc modal-desc--ok">{message}</div>}

            <div className="modal-actions">
              <button type="submit" className="btn btn--primary">{editing ? 'Update' : 'Add'} Availability</button>
              <button type="button" className="btn btn--secondary" onClick={handleCancel}>Cancel</button>
            </div>

            <button type="button" className="btn btn--close-fullwidth" onClick={handleCancel}>Close</button>
          </form>
        </div>
      )}
    </div>
  );
}
