// SMS-ui/src/pages/Student/StudentForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// ---- Safe URL joiner ----
const joinUrl = (base, path = '') =>
  path ? `${String(base).replace(/\/+$/, '')}/${String(path).replace(/^\/+/, '')}` : String(base);

const initialState = {
  stuid: '',
  stu_enrollmentnumber: '',
  stu_rollnumber: '',
  stu_regn_number: '',
  stuname: '',
  stuemailid: '',
  stumob1: '',
  stumob2: '',
  stucaste: '',
  stugender: '',
  studob: '',
  stucategory: '',
  stuadmissiondt: '',
  stu_course_id: '',
  stu_lat_entry: false,
  stu_curr_semester: '',
  stu_section: '',
  stuvalid: true,
  stuuserid: '',
  stuparentname: '',
  stuaddress: '',
  stuparentemailid: '',
  stuprentmob1: '',
  stuprentmob2: '',
  stuparentaddress: '',
  stu_inst_id: ''
};

export default function StudentForm() {
  const [formData, setFormData] = useState(initialState);
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState('');
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  // search + pagination
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4; // ← show only 4 students per page

  // ---- Endpoints ----
  const COURSE_LIST_URL   = joinUrl(config.COURSE_ROUTE, 'list'); // GET
  const COLLEGES_URL      = `${config.BASE_URL}/master-college/view-colleges`; // GET
  const USERS_URL         = joinUrl(config.MASTER_USER_ROUTE, 'users'); // GET

  const STUDENT_LIST_URL  = joinUrl(config.STUDENT_ROUTE, 'list'); // GET
  const STUDENT_ADD_URL   = joinUrl(config.STUDENT_ROUTE, 'add'); // POST
  const STUDENT_UPDATE_ID = (id) => joinUrl(config.STUDENT_ROUTE, `update/${encodeURIComponent(id)}`); // PUT
  const STUDENT_DELETE_ID = (id) => joinUrl(config.STUDENT_ROUTE, `delete/${encodeURIComponent(id)}`); // DELETE

  // Fetch
  useEffect(() => {
    axios.get(COURSE_LIST_URL)
      .then(res => setCourses(res.data?.courses ?? res.data ?? []))
      .catch(() => setCourses([]));

    axios.get(COLLEGES_URL)
      .then(res => {
        const raw = res?.data?.colleges ?? res?.data;
        setColleges(raw ?? []);
      })
      .catch(() => setColleges([]));

    axios.get(USERS_URL)
      .then(res => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => setUsers([]));

    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStudents = () => {
    axios.get(STUDENT_LIST_URL)
      .then(res => setStudents(res.data?.students ?? res.data ?? []))
      .catch(() => setStudents([]));
  };

  // Derived (search + pagination)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      String(s.stuid ?? '').toLowerCase().includes(q) ||
      String(s.stuname ?? '').toLowerCase().includes(q) ||
      String(s.stuemailid ?? '').toLowerCase().includes(q) ||
      String(s.stu_rollnumber ?? '').toLowerCase().includes(q) ||
      String(s.stu_enrollmentnumber ?? '').toLowerCase().includes(q)
    );
  }, [students, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Handlers
  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus(editing ? 'Updating...' : 'Submitting...');

    const payload = {
      ...formData,
      studob: formData.studob ? formData.studob.slice(0, 19) : '',
      stuadmissiondt: formData.stuadmissiondt ? formData.stuadmissiondt.slice(0, 19) : '',
      stu_lat_entry: !!formData.stu_lat_entry,
      stuvalid: !!formData.stuvalid,
    };

    try {
      if (editing) {
        await axios.put(STUDENT_UPDATE_ID(editId), payload);
        setStatus('✅ Student updated!');
      } else {
        await axios.post(STUDENT_ADD_URL, payload);
        setStatus('✅ Student added!');
      }
      setFormData(initialState);
      setEditing(false);
      setEditId(null);
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.message || err.response?.data?.error || 'Failed to submit student'));
    }
  };

  const openAddModal = () => {
    setFormData(initialState);
    setEditing(false);
    setEditId(null);
    setShowModal(true);
    setStatus('');
  };
  const openEditModal = (stu) => {
    setFormData({
      ...stu,
      studob: stu.studob ? String(stu.studob).slice(0, 16) : '',
      stuadmissiondt: stu.stuadmissiondt ? String(stu.stuadmissiondt).slice(0, 16) : ''
    });
    setEditing(true);
    setEditId(stu.stuid);
    setShowModal(true);
    setStatus('');
  };
  const closeModal = () => {
    setShowModal(false);
    setFormData(initialState);
    setEditing(false);
    setEditId(null);
    setStatus('');
  };

  const askDelete = (id) => {
    setToDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (!toDeleteId) return;
    try {
      await axios.delete(STUDENT_DELETE_ID(toDeleteId));
      setStudents(prev => prev.filter(s => s.stuid !== toDeleteId));
    } catch {
      // soft fail UI
    } finally {
      setShowDeleteModal(false);
      setToDeleteId(null);
    }
  };

  // Pagination controls
  const goto = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="mu-page">
      <div className="mu-container">
        <h1 className="mu-title">Master Students</h1>

        {/* Toolbar: Search + Add */}
        <div className="mu-toolbar">
          <div className="searchbox">
            <div className="searchbox__icon" aria-hidden>
              {/* magnifier drawn like screenshot */}
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
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

        {/* Table Card */}
        <div className="mu-tablewrap-outer">
          <div className="mu-tablewrap">
            <h2 className="mu-subtitle">All Students</h2>
            {/* Scrollable card */}
            <div className="mu-tablecard">
              <table className="mu-table">
                <thead className="mu-thead-row">
                  <tr>
                    <th className="mu-th">ID</th>
                    <th className="mu-th">Name</th>
                    <th className="mu-th">Enroll No</th>
                    <th className="mu-th">Roll No</th>
                    <th className="mu-th">Course</th>
                    <th className="mu-th">Semester</th>
                    <th className="mu-th">Mobile</th>
                    <th className="mu-th">Email</th>
                    <th className="mu-th">DOB</th>
                    <th className="mu-th">Institute</th>
                    <th className="mu-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((stu, idx) => (
                    <tr key={stu.stuid || idx}>
                      <td className="mu-td">{stu.stuid}</td>
                      <td className="mu-td">{stu.stuname}</td>
                      <td className="mu-td">{stu.stu_enrollmentnumber}</td>
                      <td className="mu-td">{stu.stu_rollnumber}</td>
                      <td className="mu-td">{stu.stu_course_id}</td>
                      <td className="mu-td">{stu.stu_curr_semester}</td>
                      <td className="mu-td">{stu.stumob1}</td>
                      <td className="mu-td">{stu.stuemailid}</td>
                      <td className="mu-td">{stu.studob ? String(stu.studob).slice(0, 10) : ''}</td>
                      <td className="mu-td">{stu.stu_inst_id}</td>
                      <td className="mu-td">
                        <button className="btn btn--primary" onClick={() => openEditModal(stu)}>Edit</button>
                        <button className="btn btn--danger" onClick={() => askDelete(stu.stuid)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {paged.length === 0 && (
                    <tr>
                      <td className="mu-empty" colSpan={11}>No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* END .mu-tablecard (scroll area + its scrollbar) */}

            {/* Pagination moved BELOW the scroll area so it sits under the slider */}
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

            {/* Status line (kept) */}
            {status && (
              <div style={{ textAlign: 'center', marginTop: 12, fontWeight: 700 }}>
                {status}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal – 5-column compact grid */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={closeModal}>×</button>
            <div className="modal-heading">{editing ? 'Edit Student' : 'Add New Student'}</div>

            <form onSubmit={handleSubmit}>
              {/* 5 columns per row for compact height */}
              <div className="form-grid form-grid--5">
                {[
                  ['stuid', 'Student ID'],
                  ['stu_enrollmentnumber', 'Enroll No'],
                  ['stu_rollnumber', 'Roll No'],
                  ['stu_regn_number', 'Regn No'],
                  ['stuname', 'Student Name'],
                  ['stuemailid', 'Email ID'],
                  ['stumob1', 'Mobile 1'],
                  ['stumob2', 'Mobile 2'],
                  ['stuparentname', 'Parent Name'],
                  ['stuaddress', 'Address'],
                  ['stuparentemailid', 'Parent Email'],
                  ['stuprentmob1', 'Parent Mob1'],
                  ['stuprentmob2', 'Parent Mob2'],
                  ['stuparentaddress', 'Parent Addr'],
                ].map(([name, label]) => (
                  <div className="form-row" key={name}>
                    <label className="form-label">{label}</label>
                    <input
                      type="text"
                      name={name}
                      value={formData[name]}
                      onChange={handleChange}
                      className="form-input"
                      required
                      disabled={editing && name === 'stuid'}
                    />
                  </div>
                ))}

                {/* User */}
                <div className="form-row">
                  <label className="form-label">User</label>
                  <select
                    name="stuuserid"
                    value={formData.stuuserid}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select User</option>
                    {users.map(u => (
                      <option key={u.userid} value={u.userid}>
                        {u.username} ({u.userid})
                      </option>
                    ))}
                  </select>
                </div>

                {/* DOB */}
                <div className="form-row">
                  <label className="form-label">DOB</label>
                  <input
                    type="datetime-local"
                    name="studob"
                    value={formData.studob}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Admission Date */}
                <div className="form-row">
                  <label className="form-label">Admission Date</label>
                  <input
                    type="datetime-local"
                    name="stuadmissiondt"
                    value={formData.stuadmissiondt}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                {/* Gender */}
                <div className="form-row">
                  <label className="form-label">Gender</label>
                  <select
                    name="stugender"
                    value={formData.stugender}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Caste */}
                <div className="form-row">
                  <label className="form-label">Caste</label>
                  <select
                    name="stucaste"
                    value={formData.stucaste}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Caste</option>
                    <option value="General">General</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OBC">OBC</option>
                  </select>
                </div>

                {/* Category */}
                <div className="form-row">
                  <label className="form-label">Category</label>
                  <select
                    name="stucategory"
                    value={formData.stucategory}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="GEN">GEN</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                {/* Semester */}
                <div className="form-row">
                  <label className="form-label">Semester</label>
                  <select
                    name="stu_curr_semester"
                    value={formData.stu_curr_semester}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="form-row">
                  <label className="form-label">Section</label>
                  <select
                    name="stu_section"
                    value={formData.stu_section}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                {/* Course */}
                <div className="form-row">
                  <label className="form-label">Course</label>
                  <select
                    name="stu_course_id"
                    value={formData.stu_course_id}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.courseid} value={c.courseid}>{c.courseid}</option>
                    ))}
                  </select>
                </div>

                {/* Institute */}
                <div className="form-row">
                  <label className="form-label">Institute</label>
                  <select
                    name="stu_inst_id"
                    value={formData.stu_inst_id}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="">Select Institute</option>
                    {colleges.map(c => (
                      <option key={c.collegeid} value={c.collegeid}>{c.collegename}</option>
                    ))}
                  </select>
                </div>

                {/* Lateral Entry (span-2) */}
                <div className="form-row span-2">
                  <label className="form-label">Lateral Entry</label>
                  <input
                    type="checkbox"
                    name="stu_lat_entry"
                    checked={formData.stu_lat_entry}
                    onChange={handleChange}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>

                {/* Valid */}
                <div className="form-row">
                  <label className="form-label">Valid</label>
                  <input
                    type="checkbox"
                    name="stuvalid"
                    checked={formData.stuvalid}
                    onChange={handleChange}
                    style={{ transform: 'scale(1.2)' }}
                  />
                </div>
              </div>

              <button type="submit" className={`btn--submit ${status === 'Submitting...' || status === 'Updating...' ? 'is-loading':''}`}>
                {editing ? 'Update Student' : 'Add Student'}
              </button>
            </form>

            {status && <div className={status.startsWith('✅') ? 'modal-desc modal-desc--ok' : status.startsWith('❌') ? 'modal-desc modal-desc--error' : 'modal-desc'}>{status}</div>}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowDeleteModal(false)}>×</button>
            <div className="modal-title danger">Delete Student</div>
            <div className="modal-desc">Are you sure you want to delete <span className="highlight">Student ID: {toDeleteId}</span>?</div>
            <div className="modal-actions">
              <button className="btn btn--secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn--danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
