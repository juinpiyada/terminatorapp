import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config'; 

// ---- Safe URL joiner (prevents double slashes / duplicated bases)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Build base and routes from env-driven config
const BASE = joinUrl(config.BASE_URL || '', config.API_PREFIX || ''); // e.g. http://localhost:9090 + /api
const ROUTES = {
  MANAGER: joinUrl(BASE, config.EXAM_ROUTINE_MANAGER_ROUTE || '/exam-routine-manager'),
  TEACHER: joinUrl(BASE, config.TEACHER_ROUTE || '/teacher'),
  OFFERING: joinUrl(BASE, config.COURSE_OFFERING_ROUTE || '/course-offering'),
  CLASS_ROOM: joinUrl(BASE, config.CLASS_ROOM_ROUTE || '/class-room'),
  MASTER_ACADYEAR: joinUrl(BASE, config.MASTER_ACADYEAR_ROUTE || '/master-acadyear'),
};

const emptyForm = {
  examid: '',
  examofferid: '',
  examtermid: '',
  examtype: '',
  examtitle: '',
  examdate: '',
  examst_time: '',
  examen_time: '',
  examroomid: '',
  exammaxmarks: '',
  examwtpercentge: '',
  examcondby: '',
  examremarks: ''
};

const ExamRoutineManager = () => {
  const [routines, setRoutines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    fetchRoutines();
    fetchTeachers();
    fetchOfferings();
    fetchRooms();
    fetchTerms();
  }, []);

  const fetchRoutines = async () => {
    try {
      const res = await axios.get(ROUTES.MANAGER);
      // supports array or { routines: [...] }
      const data = Array.isArray(res.data) ? res.data : (res.data?.routines || []);
      setRoutines(data);
    } catch (err) {
      alert('Failed to fetch exam routines!');
      console.error(err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(ROUTES.TEACHER);
      setTeachers(Array.isArray(res.data) ? res.data : (res.data?.teachers || []));
    } catch (err) {
      console.error('Failed to fetch teachers!', err);
    }
  };

  const fetchOfferings = async () => {
    try {
      const res = await axios.get(ROUTES.OFFERING);
      setOfferings(Array.isArray(res.data) ? res.data : (res.data?.offerings || []));
    } catch (err) {
      console.error('Failed to fetch offerings!', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(ROUTES.CLASS_ROOM);
      setRooms(Array.isArray(res.data) ? res.data : (res.data?.classrooms || []));
    } catch (err) {
      console.error('Failed to fetch rooms!', err);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await axios.get(ROUTES.MASTER_ACADYEAR);
      setTerms(Array.isArray(res.data) ? res.data : (res.data?.terms || res.data?.acadyears || []));
    } catch (err) {
      console.error('Failed to fetch terms!', err);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await axios.put(`${ROUTES.MANAGER}/${encodeURIComponent(form.examid)}`, form);
        alert('Routine updated!');
      } else {
        await axios.post(ROUTES.MANAGER, form);
        alert('Routine created!');
      }
      fetchRoutines();
      setForm(emptyForm);
      setEditing(false);
    } catch (err) {
      alert('Failed to save routine!');
      console.error(err);
    }
  };

  const handleEdit = (routine) => {
    setForm(routine);
    setEditing(true);
  };

  // ---- Robust delete that works with multiple backend styles
  async function deleteRoutineAPI(examid) {
    const id = encodeURIComponent(examid);

    // Try: DELETE /manager/:id
    try {
      return await axios.delete(`${ROUTES.MANAGER}/${id}`);
    } catch (e1) {
      // Try: DELETE /manager/delete/:id
      try {
        return await axios.delete(`${ROUTES.MANAGER}/delete/${id}`);
      } catch (e2) {
        // Try: DELETE /manager with JSON body
        try {
          return await axios.delete(`${ROUTES.MANAGER}`, {
            data: { examid },
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (e3) {
          // Try: POST /manager/delete with JSON body (some backends do this)
          try {
            return await axios.post(`${ROUTES.MANAGER}/delete`, { examid });
          } catch (e4) {
            // Surface the last error
            throw e4;
          }
        }
      }
    }
  }

  const handleDelete = async (examid) => {
    if (!window.confirm('Delete this routine?')) return;
    try {
      await deleteRoutineAPI(examid);
      fetchRoutines();
    } catch (err) {
      console.error('Delete failed:', err?.response?.data || err?.message || err);
      alert(`Failed to delete! ${err?.response?.data?.error || ''}`);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    for (let i = 0; i < 48; i++) {
      const hours = String(start.getHours()).padStart(2, '0');
      const minutes = String(start.getMinutes()).padStart(2, '0');
      options.push(`${hours}:${minutes}`);
      start.setMinutes(start.getMinutes() + 30);
    }
    return options;
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#eef2ff', minHeight: '100vh', fontFamily: 'Arial' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af', marginBottom: '20px' }}>Exam Routine Manager</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        }}
      >
        <input name="examid" value={form.examid} onChange={handleChange} placeholder="Exam ID" style={inputStyle} required />

        <select name="examofferid" value={form.examofferid} onChange={handleChange} style={inputStyle} required>
          <option value="">Select Course Offering</option>
          {offerings.map(off => (
            <option key={off.offerid} value={off.offerid}>
              {off.offerid} {off.coursename && `- ${off.coursename}`}
            </option>
          ))}
        </select>

        <select name="examtermid" value={form.examtermid} onChange={handleChange} style={inputStyle} required>
          <option value="">Select Term</option>
          {terms.map(term => (
            <option key={term.id || term.acadyearid || term.acadyearname} value={term.id || term.acadyearid || term.acadyearname}>
              {term.termname || term.acadyear || term.acadyearname || term.id}
            </option>
          ))}
        </select>

        <input name="examtype" value={form.examtype} onChange={handleChange} placeholder="Type" style={inputStyle} />
        <input name="examtitle" value={form.examtitle} onChange={handleChange} placeholder="Title" style={inputStyle} />
        <input name="examdate" value={form.examdate} type="date" onChange={handleChange} style={inputStyle} />

        <select name="examst_time" value={form.examst_time} onChange={handleChange} style={inputStyle} required>
          <option value="">Start Time</option>
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <select name="examen_time" value={form.examen_time} onChange={handleChange} style={inputStyle} required>
          <option value="">End Time</option>
          {generateTimeOptions().map((time) => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>

        <select name="examroomid" value={form.examroomid} onChange={handleChange} style={inputStyle} required>
          <option value="">Select Room</option>
          {rooms.map(room => (
            <option key={room.classroomid} value={room.classroomid}>
              {room.room_no || room.classroomid}
            </option>
          ))}
        </select>

        <input name="exammaxmarks" value={form.exammaxmarks} onChange={handleChange} placeholder="Max Marks" style={inputStyle} />
        <input name="examwtpercentge" value={form.examwtpercentge} onChange={handleChange} placeholder="percentage (%)" style={inputStyle} />

        <select name="examcondby" value={form.examcondby} onChange={handleChange} style={inputStyle} required>
          <option value="">Conducted By</option>
          {teachers.map(teacher => (
            <option key={teacher.teacherid} value={teacher.teacherid}>
              {teacher.teachername || teacher.teacherid}
            </option>
          ))}
        </select>

        <input name="examremarks" value={form.examremarks} onChange={handleChange} placeholder="Remarks" style={inputStyle} />

        <button
          type="submit"
          style={{
            gridColumn: 'span 3',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none'
          }}
        >
          {editing ? 'Update' : 'Add'} Routine
        </button>
      </form>

      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#e0e7ff' }}>
            <tr>
              {Object.keys(emptyForm).map((key) => (
                <th
                  key={key}
                  style={{
                    padding: '10px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                >
                  {key}
                </th>
              ))}
              <th style={{ padding: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routines.map((routine, idx) => (
              <tr key={routine.examid} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : '#ffffff' }}>
                {Object.keys(emptyForm).map((key) => (
                  <td key={key} style={{ padding: '10px', border: '1px solid #e5e7eb', fontSize: '13px' }}>
                    {routine[key]}
                  </td>
                ))}
                <td style={{ padding: '10px', border: '1px solid #e5e7eb', display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleEdit(routine)}
                    style={{ backgroundColor: '#facc15', color: '#000', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(routine.examid)}
                    style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '14px'
};

export default ExamRoutineManager;
