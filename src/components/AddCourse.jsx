// SMS-ui/src/components/AddCourse.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import config from '../config/middleware_config.js';
import '../index.css';

// ---- Safe URL joiner (prevents double slashes & respects absolute paths)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

export default function AddCourse({ showTable = true }) {
  const [form, setForm] = useState(getInitialForm());
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);

  // search + pagination (for the table)
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  // delete confirmation modal
  const [pendingDelete, setPendingDelete] = useState(null); // holds the course object to delete

  // Base routes from env-driven config
  const DEPT_BASE = config.MASTER_DEPTS_ROUTE; // e.g., http://localhost:9090/api/master-depts
  const COURSE_BASE = config.COURSE_ROUTE;     // e.g., http://localhost:9090/api/course

  // Derived endpoints
  const DEPT_SELECTOR_URL = joinUrl(DEPT_BASE, 'selector');
  const COURSE_ALL_URL    = joinUrl(COURSE_BASE, 'all');
  const COURSE_ADD_URL    = joinUrl(COURSE_BASE, 'add');
  const COURSE_UPDATE_URL = (id) => joinUrl(COURSE_BASE, `update/${id}`);
  const COURSE_DELETE_URL = (id) => joinUrl(COURSE_BASE, `delete/${id}`);

  // Fetch departments and courses
  useEffect(() => {
    fetchDepartments();
    if (showTable) fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showSuccess && showTable) fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSuccess]);

  // reset to first page when query changes
  useEffect(() => {
    setPage(1);
  }, [query]);

  function getInitialForm() {
    return {
      courseid: '',
      coursedesc: '',
      collegedept: '',
      courseprgcod: '',
      course_level: '',
      course_totsemester: '',
      course_tot_credits: '',
      course_duration: '',
      coursestartdate: '',
      courseenddate: ''
    };
  }

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(DEPT_SELECTOR_URL);
      setDepartments(res.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(COURSE_ALL_URL);
      setCourses(res.data || []);
    } catch {
      setCourses([]);
    }
  };

  // Helpers
  const toDateOrNull = val => (val && /^\d{4}-\d{2}-\d{2}$/.test(val) ? val : null);
  const toNumOrNull = val => (val === '' ? null : Number(val));

  // Modal form change handler
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Add/Edit modal handlers
  const openAddModal = () => {
    setForm(getInitialForm());
    setEditing(false);
    setShowModal(true);
    setMsg('');
  };

  const openEditModal = course => {
    setForm({
      courseid: course.courseid,
      coursedesc: course.coursedesc,
      collegedept: course.collegedept,
      courseprgcod: course.courseprgcod || '',
      course_level: course.course_level || '',
      course_totsemester: course.course_totsemester || '',
      course_tot_credits: course.course_tot_credits || '',
      course_duration: course.course_duration || '',
      coursestartdate: course.coursestartdate ? String(course.coursestartdate).substring(0,10) : '',
      courseenddate: course.courseenddate ? String(course.courseenddate).substring(0,10) : ''
    });
    setEditing(true);
    setShowModal(true);
    setMsg('');
  };

  const closeModal = () => {
    setShowModal(false);
    setMsg('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    const payload = {
      courseid: form.courseid,
      coursedesc: form.coursedesc,
      collegedept: form.collegedept || null,
      courseprgcod: form.courseprgcod || null,
      course_level: form.course_level || null,
      course_totsemester: toNumOrNull(form.course_totsemester),
      course_tot_credits: toNumOrNull(form.course_tot_credits),
      course_duration: form.course_duration || null,
      coursestartdate: toDateOrNull(form.coursestartdate),
      courseenddate: toDateOrNull(form.courseenddate)
    };

    try {
      if (editing) {
        await axios.put(COURSE_UPDATE_URL(form.courseid), payload);
        setMsg('✅ Course updated successfully!');
      } else {
        await axios.post(COURSE_ADD_URL, payload);
        setMsg('✅ Course added successfully!');
      }
      setShowSuccess(true);
      setShowModal(false);
      setEditing(false);
      setForm(getInitialForm());
      fetchCourses();
    } catch (err) {
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to save course'));
    }
    setLoading(false);
  };

  // open delete confirm
  const requestDelete = (course) => setPendingDelete(course);

  // confirm delete
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await axios.delete(COURSE_DELETE_URL(pendingDelete.courseid));
      setCourses(prev => prev.filter(c => c.courseid !== pendingDelete.courseid));
      setPendingDelete(null);
    } catch {
      alert('Failed to delete course');
    }
  };

  // cancel delete
  const cancelDelete = () => setPendingDelete(null);

  // ------- search + pagination helpers -------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c => {
      const id = String(c.courseid ?? '').toLowerCase();
      const desc = String(c.coursedesc ?? '').toLowerCase();
      const dept = String(c.collegedept ?? '').toLowerCase();
      const prg = String(c.courseprgcod ?? '').toLowerCase();
      const lvl = String(c.course_level ?? '').toLowerCase();
      const duration = String(c.course_duration ?? '').toLowerCase();
      return (
        id.includes(q) ||
        desc.includes(q) ||
        dept.includes(q) ||
        prg.includes(q) ||
        lvl.includes(q) ||
        duration.includes(q)
      );
    });
  }, [courses, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  // ---- Reusable field (uses index.css classes) ----
  function Field({ label, name, type, value, onChange, min, required = false }) {
    return (
      <div className="form-row">
        <label className="form-label">{label}</label>
        <input
          className="form-input"
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          min={min}
          required={required}
        />
      </div>
    );
  }

  // ---- Add/Edit Modal (index.css modal styles) ----
  function CourseModal() {
    if (!showModal) return null;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={closeModal}>×</button>
          <h2 className="modal-heading">{editing ? 'Edit Course' : 'Add Course'}</h2>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-grid form-grid--3">
              <Field label="Course ID" name="courseid" type="text" value={form.courseid} onChange={handleChange} required={!editing} />
              <div className="form-row">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  name="coursedesc"
                  value={form.coursedesc}
                  onChange={handleChange}
                  required
                  rows={2}
                />
              </div>
              <div className="form-row">
                <label className="form-label">Department</label>
                <select
                  className="form-input"
                  name="collegedept"
                  value={form.collegedept}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Dept ID</option>
                  {departments.map(dep => (
                    <option key={dep.collegedeptid} value={dep.collegedeptid}>
                      {dep.collegedeptid}
                    </option>
                  ))}
                </select>
              </div>
              <Field label="Program Code" name="courseprgcod" type="text" value={form.courseprgcod} onChange={handleChange} />
              <Field label="Level" name="course_level" type="text" value={form.course_level} onChange={handleChange} />
              <Field label="Total Semesters" name="course_totsemester" type="number" min="0" value={form.course_totsemester} onChange={handleChange} />
              <Field label="Total Credits" name="course_tot_credits" type="number" min="0" value={form.course_tot_credits} onChange={handleChange} />
              <Field label="Duration" name="course_duration" type="text" value={form.course_duration} onChange={handleChange} />
              <Field label="Start Date" name="coursestartdate" type="date" value={form.coursestartdate} onChange={handleChange} />
              <Field label="End Date" name="courseenddate" type="date" value={form.courseenddate} onChange={handleChange} />
            </div>

            {msg && (
              <div className={`modal-desc ${msg.startsWith('✅') ? 'modal-desc--ok' : 'modal-desc--error'}`} style={{ textAlign: 'center' }}>
                {msg}
              </div>
            )}

            <button type="submit" disabled={loading} className={`btn btn--submit ${loading ? 'is-loading' : ''}`}>
              {loading ? 'Saving...' : (editing ? 'Update Course' : 'Add Course')}
            </button>
            <button type="button" className="btn btn--close-fullwidth" onClick={closeModal}>
              Close
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- Delete Confirmation Modal (styled like your screenshot) ----
  function DeleteConfirmModal() {
    if (!pendingDelete) return null;
    return (
      <div className="modal-overlay" onClick={cancelDelete}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={cancelDelete}>×</button>
          <div className="modal-title danger">Delete Course?</div>
          <div className="modal-desc">
            Are you sure you want to delete course:{' '}
            <a href="#!" onClick={e => e.preventDefault()}>
              {pendingDelete.coursedesc || pendingDelete.courseid}
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
  }

  // ---- Success Modal (uses same modal styles) ----
  function SuccessModal() {
    if (!showSuccess) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="modal-x" onClick={() => setShowSuccess(false)}>×</button>
          <div className="modal-title">Success!</div>
          <div className="modal-desc modal-desc--ok">{msg}</div>
          <div className="modal-actions">
            <button className="btn btn--secondary" onClick={() => setShowSuccess(false)}>OK</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mu-page">
      <div className="mu-container">
        <h1 className="mu-title">Courses</h1>

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
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="btn btn--add" onClick={openAddModal}>
            <span className="btn-plus">+</span> Add
          </button>
        </div>

        {/* Table of courses */}
        {showTable && (
          <div className="mu-tablewrap-outer">
            <div className="mu-tablewrap">
              <h2 className="mu-subtitle">All Courses</h2>

              {/* Scrollable table card (kept) */}
              <div className="mu-tablecard">
                <table className="mu-table">
                  <thead>
                    <tr className="mu-thead-row">
                      <th className="mu-th">ID</th>
                      <th className="mu-th">Description</th>
                      <th className="mu-th">Dept</th>
                      <th className="mu-th">Prg Code</th>
                      <th className="mu-th">Level</th>
                      <th className="mu-th">Sem</th>
                      <th className="mu-th">Credits</th>
                      <th className="mu-th">Duration</th>
                      <th className="mu-th">Start</th>
                      <th className="mu-th">End</th>
                      <th className="mu-th" style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length === 0 ? (
                      <tr>
                        <td className="mu-empty" colSpan={11}>
                          {loading ? 'Loading...' : 'No courses found.'}
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((course, idx) => (
                        <tr key={course.courseid || idx}>
                          <td className="mu-td">{course.courseid}</td>
                          <td className="mu-td">{course.coursedesc}</td>
                          <td className="mu-td">{course.collegedept}</td>
                          <td className="mu-td">{course.courseprgcod}</td>
                          <td className="mu-td">{course.course_level}</td>
                          <td className="mu-td">{course.course_totsemester}</td>
                          <td className="mu-td">{course.course_tot_credits}</td>
                          <td className="mu-td">{course.course_duration}</td>
                          <td className="mu-td">{course.coursestartdate ? String(course.coursestartdate).substring(0,10) : ''}</td>
                          <td className="mu-td">{course.courseenddate ? String(course.courseenddate).substring(0,10) : ''}</td>
                          <td className="mu-td">
                            <button
                              className="btn btn--primary"
                              onClick={() => openEditModal(course)}
                              title="Edit"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn--danger"
                              onClick={() => requestDelete(course)}
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
              {/* END .mu-tablecard (scroll area + its scrollbar) */}

              {/* Pagination moved BELOW the scroll area so it sits under the slider */}
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
        )}
      </div>

      {CourseModal()}
      {DeleteConfirmModal()}
      {SuccessModal()}
    </div>
  );
}
