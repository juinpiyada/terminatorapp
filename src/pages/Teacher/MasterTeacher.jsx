// SMS-ui/src/pages/Teacher/MasterTeacher.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css';

/* ---------- Small helpers (unchanged data logic) ---------- */
const toStringSafe = (v) => (v === undefined || v === null ? '' : String(v).trim());
const toNumOrNull = (v) => {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const looksLikeEmail = (s) => /\S+@\S+\.\S+/.test(String(s || ''));

function pickArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.list)) return raw.list;
  if (Array.isArray(raw?.items)) return raw.items;
  if (raw && typeof raw === 'object') {
    const key = Object.keys(raw).find(k => Array.isArray(raw[k]));
    if (key) return raw[key];
  }
  return [];
}

function getInitialForm() {
  return {
    teacherid: '', teachercode: '', teachername: '', teacheraddress: '',
    teacheremailid: '', teachermob1: '', teachermob2: '', teachergender: '',
    teachercaste: '', teacherdoj: '', teacherdesig: '', teachertype: '',
    teachermaxweekhrs: '', teacheruserid: '', teachercollegeid: '',
    teachervalid: true,
  };
}

/* ---------- Component ---------- */
export default function MasterTeacher() {
  const [colleges, setColleges] = useState([]); // [{id,label}]
  const [users, setUsers] = useState([]);       // [{userid, username, email}]
  const [teachers, setTeachers] = useState([]);
  const [formData, setFormData] = useState(getInitialForm());

  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // search + pagination
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  /* ---------- Normalize helpers ---------- */
  function normalizeColleges(raw) {
    const list = pickArray(raw);
    return list
      .map(c => {
        const idRaw = c.collegeid ?? c.college_id ?? c.id ?? c.ID ?? c.CollegeID;
        const nameRaw = c.collegename ?? c.college_name ?? c.name ?? c.collegeName ?? `College ${idRaw ?? ''}`;
        const id = toStringSafe(idRaw);
        return id ? { id, label: `${id} — ${toStringSafe(nameRaw)}` } : null;
      })
      .filter(Boolean);
  }

  const getTeacherUserRaw = (t) =>
    t.teacheruserid ?? t.teacher_user_id ?? t.user_id ?? t.userid ?? t.user?.userid ?? t.user?.id ?? t.user?.user_id ?? '';

  const findUser = (value, teacherCtx) => {
    const v = toStringSafe(value);
    const list = users || [];

    let u = list.find(x => String(x.userid) === v);
    if (u) return u;

    if (looksLikeEmail(v)) {
      u = list.find(x => toStringSafe(x.email) === v || toStringSafe(x.username) === v);
      if (u) return u;
    }

    const teeEmail = toStringSafe(teacherCtx?.teacheremailid || teacherCtx?.email || teacherCtx?.user?.email);
    if (teeEmail) {
      u = list.find(x => toStringSafe(x.email) === teeEmail || toStringSafe(x.username) === teeEmail);
      if (u) return u;
    }
    return undefined;
  };

  function normalizeTeachers(raw) {
    const list = pickArray(raw);
    return list.map(t => {
      const rawUser = getTeacherUserRaw(t);
      let teacheruserid = toStringSafe(rawUser);
      if (!teacheruserid || looksLikeEmail(teacheruserid)) {
        const u = findUser(teacheruserid, t);
        if (u?.userid != null) teacheruserid = String(u.userid);
      }
      return {
        ...t,
        teacherid: toStringSafe(t.teacherid ?? t.id ?? t.teacher_id),
        teacheruserid,
        teachercollegeid: toStringSafe(t.teachercollegeid ?? t.collegeid ?? t.college_id),
        teachername: t.teachername ?? t.name ?? '',
        teacheremailid: t.teacheremailid ?? t.email ?? '',
        teachermob1: t.teachermob1 ?? t.mobile1 ?? t.phone ?? '',
        teachergender: t.teachergender ?? t.gender ?? '',
        teachervalid: t.teachervalid ?? t.active ?? t.valid ?? true,
      };
    });
  }

  const renderUserRef = (teacher) => {
    const raw = getTeacherUserRaw(teacher) || teacher.teacheruserid || '';
    const u = findUser(raw, teacher);
    if (u) {
      const left = toStringSafe(u.userid);
      const right = toStringSafe(u.username || u.email);
      return right ? `${left} — ${right}` : left;
    }
    return toStringSafe(teacher.teacheruserid || raw);
  };

  /* ---------- Data fetch ---------- */
  useEffect(() => {
    axios.get(`${config.BASE_URL}/master-college/view-colleges`)
      .then(res => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(normalizeColleges(raw));
      })
      .catch(() => setColleges([]));

    axios.get(`${config.MASTER_USER_ROUTE}/users`)
      .then(res => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => setUsers([]));

    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (teachers.length > 0 && users.length > 0) {
      setTeachers(prev => normalizeTeachers(prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const fetchTeachers = () => {
    axios.get(`${config.TEACHER_ROUTE}`)
      .then(res => setTeachers(normalizeTeachers(res.data?.teachers ?? res.data ?? [])))
      .catch(() => setMsg('❌ Error fetching teacher list'));
  };

  /* ---------- Search & pagination ---------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(t =>
      String(t.teacherid ?? '').toLowerCase().includes(q) ||
      String(t.teachername ?? '').toLowerCase().includes(q) ||
      String(t.teacheremailid ?? '').toLowerCase().includes(q) ||
      String(t.teachercollegeid ?? '').toLowerCase().includes(q) ||
      String(renderUserRef(t) ?? '').toLowerCase().includes(q)
    );
  }, [teachers, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  /* ---------- Handlers ---------- */
  const openAddModal = () => {
    setFormData(getInitialForm());
    setEditingId(null);
    setShowFormModal(true);
    setMsg('');
  };
  const openEditModal = (teacher) => {
    let uid = getTeacherUserRaw(teacher) || teacher.teacheruserid || '';
    const normalized = {
      ...teacher,
      teachercollegeid: toStringSafe(teacher.teachercollegeid ?? teacher.collegeid ?? teacher.college_id),
      teacheruserid: toStringSafe(uid),
      teachermaxweekhrs: toStringSafe(teacher.teachermaxweekhrs),
    };
    setFormData(normalized);
    setEditingId(teacher.teacherid);
    setShowFormModal(true);
    setMsg('');
  };
  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingId(null);
    setFormData(getInitialForm());
    setMsg('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : toStringSafe(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacheruserid) {
      setMsg('❌ Please select a valid User ID.');
      return;
    }
    setSubmitting(true);
    const now = new Date();
    const payload = {
      ...formData,
      teacheruserid: toStringSafe(formData.teacheruserid),
      teachercollegeid: toNumOrNull(formData.teachercollegeid),
      teachermaxweekhrs: toNumOrNull(formData.teachermaxweekhrs),
      createdat: now,
      updatedat: now,
    };
    try {
      if (editingId) {
        await axios.put(`${config.TEACHER_ROUTE}/${encodeURIComponent(editingId)}`, payload, { headers: { 'Content-Type': 'application/json' } });
        setMsg('✅ Teacher updated successfully!');
      } else {
        await axios.post(`${config.TEACHER_ROUTE}`, payload, { headers: { 'Content-Type': 'application/json' } });
        setMsg('✅ Teacher added successfully!');
      }
      closeFormModal();
      fetchTeachers();
    } catch (err) {
      setMsg(editingId ? '❌ Error updating teacher.' : '❌ Error adding teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const askDelete = (teacher) => setPendingDelete(teacher);
  const cancelDelete = () => setPendingDelete(null);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await axios.delete(`${config.TEACHER_ROUTE}/${encodeURIComponent(pendingDelete.teacherid)}`);
      setTeachers(prev => prev.filter(t => t.teacherid !== pendingDelete.teacherid));
      setMsg('✅ Teacher deleted successfully!');
    } catch (err) {
      setMsg('❌ Error deleting teacher.');
    } finally {
      setPendingDelete(null);
    }
  };

  const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  /* ---------- UI ---------- */
  return (
    <div className="mu-page">
      <div className="mu-container">
        <h1 className="mu-title">Master Teachers</h1>

        {/* Toolbar: Search + Add */}
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
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>

          <button className="btn btn--add" onClick={openAddModal}>
            <span className="btn-plus">＋</span> Add
          </button>
        </div>

        {/* Table card */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h2 className="mu-subtitle">All Teachers</h2>

            <div className="mu-tablecard">
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">ID</th>
                    <th className="mu-th">Name</th>
                    <th className="mu-th">Email</th>
                    <th className="mu-th">Mobile 1</th>
                    <th className="mu-th">Gender</th>
                    <th className="mu-th">College ID</th>
                    <th className="mu-th">User</th>
                    <th className="mu-th">Valid</th>
                    <th className="mu-th" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td className="mu-empty" colSpan={9}>No teacher data available.</td>
                    </tr>
                  ) : (
                    paged.map((t) => (
                      <tr key={t.teacherid}>
                        <td className="mu-td">{t.teacherid}</td>
                        <td className="mu-td">{t.teachername}</td>
                        <td className="mu-td">{t.teacheremailid}</td>
                        <td className="mu-td">{t.teachermob1}</td>
                        <td className="mu-td">{t.teachergender}</td>
                        <td className="mu-td">{t.teachercollegeid}</td>
                        <td className="mu-td">{renderUserRef(t)}</td>
                        <td className="mu-td">{t.teachervalid ? '✅' : '❌'}</td>
                        <td className="mu-td">
                          <button className="btn btn--primary" onClick={() => openEditModal(t)}>Edit</button>
                          <button className="btn btn--danger" onClick={() => askDelete(t)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Chips pagination under the horizontal scrollbar */}
            <div className="mu-pagination mu-pagination--chips">
              <div className="mu-pageinfo mu-pageinfo--chips">
                Showing page {currentPage} of {totalPages} pages
              </div>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button className="pagechip" onClick={() => goto(currentPage - 1)} disabled={currentPage === 1}>«</button>
                <button className="pagechip pagechip--active" disabled>{currentPage}</button>
                <button className="pagechip" onClick={() => goto(currentPage + 1)} disabled={currentPage === totalPages}>»</button>
              </div>
            </div>

            {/* Optional status line */}
            {msg && (
              <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Teacher Modal (same style as index.css) */}
      {showFormModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={closeFormModal}>×</button>
            <div className="modal-heading">{editingId ? 'Edit Teacher' : 'Add New Teacher'}</div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-grid form-grid--3">
                {/* Row items (use shared .form-row/input) */}
                <div className="form-row">
                  <label className="form-label">Teacher ID</label>
                  <input className="form-input" type="text" name="teacherid" value={formData.teacherid} onChange={handleChange} required disabled={!!editingId} />
                </div>
                <div className="form-row">
                  <label className="form-label">Code</label>
                  <input className="form-input" type="text" name="teachercode" value={formData.teachercode} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">Name</label>
                  <input className="form-input" type="text" name="teachername" value={formData.teachername} onChange={handleChange} required />
                </div>

                <div className="form-row">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" name="teacheremailid" value={formData.teacheremailid} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">Mobile 1</label>
                  <input className="form-input" type="text" name="teachermob1" value={formData.teachermob1} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">Mobile 2</label>
                  <input className="form-input" type="text" name="teachermob2" value={formData.teachermob2} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <label className="form-label">Gender</label>
                  <select className="form-input" name="teachergender" value={formData.teachergender} onChange={handleChange}>
                    <option value="">-- Select Gender --</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">Caste</label>
                  <input className="form-input" type="text" name="teachercaste" value={formData.teachercaste} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">DOJ</label>
                  <input className="form-input" type="date" name="teacherdoj" value={formData.teacherdoj} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <label className="form-label">Designation</label>
                  <input className="form-input" type="text" name="teacherdesig" value={formData.teacherdesig} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <label className="form-label">Type</label>
                  <select className="form-input" name="teachertype" value={formData.teachertype} onChange={handleChange}>
                    <option value="">-- Select --</option>
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">Max Week Hours</label>
                  <input className="form-input" type="number" name="teachermaxweekhrs" value={formData.teachermaxweekhrs} onChange={handleChange} />
                </div>

                <div className="form-row">
                  <label className="form-label">User</label>
                  <select className="form-input" name="teacheruserid" value={formData.teacheruserid} onChange={handleChange}>
                    <option value="">Select User</option>
                    {(users ?? []).map(u => (
                      <option key={u.userid} value={toStringSafe(u.userid)}>
                        {u.userid} — {u.username || u.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label className="form-label">College</label>
                  <select className="form-input" name="teachercollegeid" value={formData.teachercollegeid} onChange={handleChange}>
                    <option value="">Select College</option>
                    {(colleges ?? []).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-row span-3" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label className="form-label">Active</label>
                  <input type="checkbox" name="teachervalid" checked={formData.teachervalid} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" disabled={submitting} className={`btn--submit ${submitting ? 'is-loading' : ''}`}>
                {editingId ? 'Update Teacher' : 'Add Teacher'}
              </button>
            </form>

            {msg && (
              <div className={msg.startsWith('✅') ? 'modal-desc modal-desc--ok' : 'modal-desc modal-desc--error'}>
                {msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal (same look) */}
      {pendingDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={cancelDelete}>×</button>
            <div className="modal-title danger">Delete Teacher</div>
            <div className="modal-desc">
              Are you sure you want to delete <span className="highlight">Teacher ID: {pendingDelete.teacherid}</span>?
            </div>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
