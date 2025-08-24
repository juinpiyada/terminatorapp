// SMS-ui/src/pages/CourseOffering/CollegeCourseOfferingManager.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';
import '../../index.css';

// ---- Safe URL joiner
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build base API URLs from config
const API = joinUrl(config.COURSE_OFFERING_ROUTE);

const PAGE_SIZE = 4;

const defaultForm = {
  offerid: '',
  offer_programid: '',
  offer_courseid: '',
  offer_term: '',
  offer_facultyid: '',
  offer_semesterno: '',
  offer_section: '',
  offerislab: false,
  offer_capacity: '',
  offeriselective: false,
  offerelectgroupid: '',
  offerroom: '',
  offerstatus: ''
};

const CollegeCourseOfferingManager = () => {
  const [formData, setFormData] = useState(defaultForm);
  const [offerings, setOfferings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [years, setYears] = useState([]);

  // UI state (match CollegeGroup pattern)
  const [editing, setEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // search + pagination
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDropdowns();
    fetchOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [cr, sr, tr, yr] = await Promise.all([
        axios.get(joinUrl(config.COURSE_ROUTE, 'all')),
        axios.get(joinUrl(config.SUBJECT_ROUTE, 'list')),
        axios.get(config.TEACHER_ROUTE),
        axios.get(config.MASTER_ACADYEAR_ROUTE)
      ]);
      setCourses(cr.data || []);
      setSubjects(sr.data?.subjects || sr.data || []);
      setTeachers(tr.data || []);
      setYears(yr.data?.years || yr.data?.acadyears || yr.data || []);
    } catch (err) {
      // keep page usable even if some dropdowns fail
      setCourses([]); setSubjects([]); setTeachers([]); setYears([]);
    }
  };

  const fetchOfferings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setOfferings(res.data?.offerings || res.data || []);
    } catch (err) {
      setOfferings([]);
      setError('Failed to fetch offerings');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData(defaultForm);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(''); setError('');

    // build payload (keep same values/shape)
    const payload = {
      ...formData,
      offerislab: !!formData.offerislab,
      offeriselective: !!formData.offeriselective,
      offer_semesterno: formData.offer_semesterno === '' ? '' : Number(formData.offer_semesterno),
      offer_capacity:    formData.offer_capacity === '' ? '' : Number(formData.offer_capacity),
    };

    try {
      const exists = offerings.some(o => String(o.offerid) === String(formData.offerid));

      if (exists) {
        await axios.put(`${API}/${encodeURIComponent(formData.offerid)}`, payload);
        setMessage('Offering updated');
      } else {
        await axios.post(API, payload);
        setMessage('Offering created');
      }

      resetForm();
      setEditing(false);
      setShowForm(false);
      fetchOfferings();
    } catch (err) {
      setError('Submit failed');
    }
  };

  const handleEdit = (off) => {
    setFormData({
      ...off,
      offerislab: !!off.offerislab,
      offeriselective: !!off.offeriselective
    });
    setEditing(true);
    setShowForm(true);
    setMessage(''); setError('');
  };

  const handleDelete = async id => {
    if (!window.confirm(`Delete ${id}?`)) return;
    setMessage(''); setError('');
    try {
      await axios.delete(`${API}/${encodeURIComponent(id)}`);
      setOfferings(list => list.filter(o => String(o.offerid) !== String(id)));
      setMessage('Offering deleted');
    } catch (err) {
      setError('Delete failed');
    }
  };

  // Helpers for readable names
  const getSubjectDesc = (subjId) => {
    const s = subjects.find(x =>
      String(x.subjectid) === String(subjId) ||
      String(x.subject_code) === String(subjId) ||
      String(x.subjectname) === String(subjId)
    );
    return s
      ? (s.subjectname || s.subjectdesc || s.subject_description || s.subject_code || subjId)
      : subjId;
  };

  const getCourseDesc = (courseId) => {
    const c = courses.find(x =>
      String(x.courseid) === String(courseId) ||
      String(x.course_code) === String(courseId) ||
      String(x.coursename) === String(courseId) ||
      String(x.coursedesc) === String(courseId)
    );
    return c
      ? (c.coursename || c.coursedesc || c.course_description || c.course_code || courseId)
      : courseId;
  };

  // Filter + pagination
  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return offerings;
    return offerings.filter(o =>
      [
        o.offerid, o.offer_programid, o.offer_courseid, o.offer_term, o.offer_facultyid,
        o.offer_semesterno, o.offer_section, o.offerislab, o.offer_capacity,
        o.offeriselective, o.offerelectgroupid, o.offerroom, o.offerstatus
      ]
        .map(v => String(v ?? '').toLowerCase())
        .some(txt => txt.includes(s))
    );
  }, [offerings, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

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

      <h1 className="mu-title">Course Offering Manager</h1>

      {/* Toolbar */}
      <div className="mu-toolbar">
        <label className="searchbox" aria-label="Search offerings">
          <span className="searchbox__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" role="img" aria-hidden="true">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="20" y1="20" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            className="searchbox__input"
            type="text"
            placeholder="Search offerings"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <button
          className="btn btn--add"
          onClick={() => { resetForm(); setEditing(false); setShowForm(true); setMessage(''); setError(''); }}
        >
          <span className="btn-plus">＋</span> Add
        </button>
      </div>

      {/* Table Card */}
      <div className="mu-tablewrap-outer">
        <div className="mu-tablewrap">
          <h2 className="mu-subtitle">All Offerings</h2>

          <div className="mu-tablecard mu-tablecard--with-pager">
            <div className="mu-table-scroll">
              <table className="mu-table">
                <thead>
                  <tr className="mu-thead-row">
                    <th className="mu-th">Offer ID</th>
                    <th className="mu-th">Course</th>
                    <th className="mu-th">Subject</th>
                    <th className="mu-th">Year</th>
                    <th className="mu-th">Faculty</th>
                    <th className="mu-th">Sem</th>
                    <th className="mu-th">Section</th>
                    <th className="mu-th">Lab</th>
                    <th className="mu-th">Capacity</th>
                    <th className="mu-th">Elect</th>
                    <th className="mu-th">Group</th>
                    <th className="mu-th">Room</th>
                    <th className="mu-th">Status</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td className="mu-td mu-empty" colSpan={14}>Loading...</td></tr>
                  ) : pageItems.length === 0 ? (
                    <tr><td className="mu-td mu-empty" colSpan={14}>No records found</td></tr>
                  ) : (
                    pageItems.map(off => (
                      <tr key={off.offerid}>
                        <td className="mu-td">{off.offerid}</td>
                        <td className="mu-td">{getCourseDesc(off.offer_programid)}</td>
                        <td className="mu-td">{getSubjectDesc(off.offer_courseid)}</td>
                        <td className="mu-td">{off.offer_term}</td>
                        <td className="mu-td">{off.offer_facultyid}</td>
                        <td className="mu-td">{off.offer_semesterno}</td>
                        <td className="mu-td">{off.offer_section}</td>
                        <td className="mu-td">{off.offerislab ? '✅' : '❌'}</td>
                        <td className="mu-td">{off.offer_capacity}</td>
                        <td className="mu-td">{off.offeriselective ? '✅' : '❌'}</td>
                        <td className="mu-td">{off.offerelectgroupid}</td>
                        <td className="mu-td">{off.offerroom}</td>
                        <td className="mu-td">{off.offerstatus}</td>
                        <td className="mu-td">
                          <button className="btn btn--primary" onClick={() => handleEdit(off)}>Edit</button>
                          <button className="btn btn--danger" onClick={() => handleDelete(off.offerid)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination — chips style */}
            <div className="mu-pagination mu-pagination--chips">
              <span className="mu-pageinfo mu-pageinfo--chips">
                {`Showing page ${page} of ${totalPages} pages`}
              </span>
              <div className="mu-pagebtns mu-pagebtns--chips">
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  «
                </button>
                <span className="pagechip pagechip--active">{page}</span>
                <button
                  className="pagechip"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
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
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditing(false); resetForm(); }}>
          <form className="modal modal--wide" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <button type="button" className="modal-x" onClick={() => { setShowForm(false); setEditing(false); resetForm(); }}>×</button>
            <h3 className="modal-heading">{editing ? 'Edit Offering' : 'Add Offering'}</h3>

            <div className="form-grid form-grid--3">
              <div className="form-row">
                <label className="form-label">Offer ID</label>
                <input
                  className="form-input"
                  name="offerid"
                  value={formData.offerid}
                  onChange={handleChange}
                  disabled={editing}
                  required
                />
              </div>

              <div className="form-row">
                <label className="form-label">Program / Course</label>
                <select
                  className="form-input"
                  name="offer_programid"
                  value={formData.offer_programid}
                  onChange={handleChange}
                >
                  <option value="">Select Program</option>
                  {courses.map(c => (
                    <option key={c.courseid} value={c.courseid}>
                      {(c.coursename || c.coursedesc || c.course_description || c.course_code || c.courseid)} ({c.courseid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Subject</label>
                <select
                  className="form-input"
                  name="offer_courseid"
                  value={formData.offer_courseid}
                  onChange={handleChange}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.subjectid} value={s.subjectid}>
                      {(s.subjectname || s.subjectdesc || s.subject_description || s.subject_code || s.subjectid)} ({s.subjectid})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Academic Year</label>
                <select
                  className="form-input"
                  name="offer_term"
                  value={formData.offer_term}
                  onChange={handleChange}
                >
                  <option value="">Select Academic Year</option>
                  {years.map(y => (
                    <option
                      key={y.acad_yearid ?? y.id ?? y.termid ?? y.year}
                      value={y.acad_yearid ?? y.id ?? y.termid ?? y.year ?? ''}
                    >
                      {y.year ?? y.acadyearname ?? y.termname ?? (y.acad_yearid ?? y.id ?? '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Faculty</label>
                <select
                  className="form-input"
                  name="offer_facultyid"
                  value={formData.offer_facultyid}
                  onChange={handleChange}
                >
                  <option value="">Select Faculty</option>
                  {teachers.map(t => (
                    <option key={t.teacherid} value={t.teacherid}>
                      {t.teachername ?? t.teacherid}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Semester No</label>
                <input
                  className="form-input"
                  type="number"
                  name="offer_semesterno"
                  value={formData.offer_semesterno}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Section</label>
                <input
                  className="form-input"
                  name="offer_section"
                  value={formData.offer_section}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Capacity</label>
                <input
                  className="form-input"
                  type="number"
                  name="offer_capacity"
                  value={formData.offer_capacity}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Room</label>
                <input
                  className="form-input"
                  name="offerroom"
                  value={formData.offerroom}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Status</label>
                <input
                  className="form-input"
                  name="offerstatus"
                  value={formData.offerstatus}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">Elective Group ID</label>
                <input
                  className="form-input"
                  name="offerelectgroupid"
                  value={formData.offerelectgroupid}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <label className="form-label">
                  <input
                    type="checkbox"
                    name="offerislab"
                    checked={!!formData.offerislab}
                    onChange={handleChange}
                    style={{ marginRight: 6 }} /* browser default spacing only; not a visual style */
                  />{' '}
                  Is Lab
                </label>
              </div>

              <div className="form-row">
                <label className="form-label">
                  <input
                    type="checkbox"
                    name="offeriselective"
                    checked={!!formData.offeriselective}
                    onChange={handleChange}
                    style={{ marginRight: 6 }}
                  />{' '}
                  Is Elective
                </label>
              </div>
            </div>

            {!!error && <div className="modal-desc modal-desc--error">{error}</div>}
            {!!message && <div className="modal-desc modal-desc--ok">{message}</div>}

            <div className="modal-actions">
              <button type="submit" className="btn btn--primary">{editing ? 'Update' : 'Add'} Offering</button>
              <button type="button" className="btn btn--secondary" onClick={() => { setShowForm(false); setEditing(false); resetForm(); }}>Cancel</button>
            </div>

            <button type="button" className="btn btn--close-fullwidth" onClick={() => { setShowForm(false); setEditing(false); resetForm(); }}>Close</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CollegeCourseOfferingManager;
