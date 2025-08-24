import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../middleware_config"; // ← adjust the path if needed

// ---------- Build base + route helpers ----------
const BASE = `${config.BASE_URL}${config.API_PREFIX}`; // e.g. http://localhost:9090 + /api
const DR_API       = `${BASE}${config.COLLEGE_DAILY_ROUTINE_ROUTE || config.DAILY_ROUTINE_ROUTE}`; // daily-routine
const SUBJECT_API  = `${BASE}${config.COURSE_OFFERING_ROUTE}`;
const CLASS_API    = `${BASE}${config.CLASS_ROOM_ROUTE}`;
const ACAD_API     = `${BASE}${config.MASTER_ACADYEAR_ROUTE}`;
const STUDENT_API  = `${BASE}${config.STUDENT_ROUTE}`;
const TEACHER_API  = `${BASE}${config.TEACHER_ROUTE}`;

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIMES = Array.from({ length: 11 }, (_, i) => 8 + i);

const sessionUser = JSON.parse(localStorage.getItem("sessionUser")) || { role: "admin" };

const initialForm = {
  drdayofweek: "",
  drslot: "",
  drsubjid: "",
  drfrom: "",
  drto: "",
  drclassroomid: "",
  drislabsession: false,
  drisclasssession: false,
  drroutcnt: "",
  drclassteacherid: "",
  acad_year: "",
  stu_curr_semester: "",
  stu_section: ""
};

function to24Hour(str) {
  if (!str) return 0;
  const [h, m] = str.split(":");
  return parseInt(h, 10) + (parseInt(m || "0", 10) >= 30 ? 0.5 : 0);
}
function formatTimeRange(from, to) { return (!from || !to) ? "--" : `${from} - ${to}`; }
function getDayShort(day) { return day ? day.slice(0, 3) : ""; }

// half-hour slots from 08:00 to 18:00
const TIME_SLOTS = [];
for (let h = 8; h < 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}
TIME_SLOTS.push("18:00");

export default function DailyRoutine() {
  const [routines, setRoutines] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingKey, setEditingKey] = useState(null); // composite key holder
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [acadyears, setAcadyears] = useState([]);
  const [filterCourse, setFilterCourse] = useState("");
  const [filterAcadYear, setFilterAcadYear] = useState("");
  const [tooltip, setTooltip] = useState({ show: false, routine: null, pos: { x: 0, y: 0 } });

  const [students, setStudents] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetchRoutines();
    fetchSubjects();
    fetchClassrooms();
    fetchTeachers();
    fetchAcadyears();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(STUDENT_API);
      const list = Array.isArray(res.data?.students) ? res.data.students : (Array.isArray(res.data) ? res.data : []);
      setStudents(list);
      setSemesters(
        [...new Set(list.map(s => s.stu_curr_semester).filter(Boolean))]
          .sort((a, b) => isNaN(a) || isNaN(b) ? String(a).localeCompare(String(b)) : Number(a) - Number(b))
      );
      setSections(
        [...new Set(list.map(s => s.stu_section).filter(Boolean))]
          .sort((a, b) => String(a).localeCompare(String(b)))
      );
    } catch {
      setStudents([]); setSemesters([]); setSections([]);
    }
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${DR_API}/`);
      setRoutines(res.data?.routines || res.data || []);
      setMessage("");
    } catch {
      setMessage("Failed to load routines.");
    }
    setLoading(false);
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(SUBJECT_API);
      setSubjects(Array.isArray(res.data) ? res.data : res.data?.offerings || []);
    } catch (err) {
      console.error("Failed to fetch subjects", err);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const res = await axios.get(CLASS_API);
      setClassrooms(Array.isArray(res.data) ? res.data : res.data?.classrooms || []);
    } catch {
      console.error("Failed to fetch classrooms!");
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(TEACHER_API);
      setTeachers(Array.isArray(res.data) ? res.data : res.data?.teachers || []);
    } catch {
      setTeachers([]); setMessage("Failed to load teachers.");
    }
  };

  const fetchAcadyears = async () => {
    try {
      const res = await axios.get(ACAD_API);
      setAcadyears(Array.isArray(res.data) ? res.data : res.data?.acadyears || res.data || []);
    } catch {
      setAcadyears([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // UI key only (not API)
  const getRoutineKey = (r) =>
    [r.drdayofweek, r.drslot, r.drsubjid, r.drclassroomid, r.stu_curr_semester, r.stu_section, r.acad_year].join("_");

  const handleEdit = (routine) => {
    setEditingKey({
      drdayofweek: routine.drdayofweek,
      drslot: routine.drslot,
      drsubjid: routine.drsubjid,
      drclassroomid: routine.drclassroomid,
      stu_curr_semester: routine.stu_curr_semester,
      stu_section: routine.stu_section,
      acad_year: routine.acad_year,
    });
    setForm({
      ...routine,
      drislabsession: !!routine.drislabsession,
      drisclasssession: !!routine.drisclasssession,
      drclassteacherid: routine.drclassteacherid || "",
      acad_year: routine.acad_year || "",
      stu_curr_semester: routine.stu_curr_semester || "",
      stu_section: routine.stu_section || "",
    });
    setShowModal(true);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!form.drsubjid || !form.drclassroomid || !form.acad_year) {
      setMessage("Subject ID, Classroom ID and Academic Year are required!");
      setLoading(false);
      return;
    }
    try {
      if (editingKey) {
        // composite-key update endpoint (as in your current UI)
        await axios.put(`${DR_API}/update`, { ...form, original: editingKey });
        setMessage("Routine updated.");
      } else {
        await axios.post(`${DR_API}/`, form);
        setMessage("Routine added.");
      }
      setForm(initialForm);
      setEditingKey(null);
      setShowModal(false);
      await fetchRoutines();
    } catch (err) {
      setMessage("Operation failed: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const handleDelete = async (routine) => {
    if (!window.confirm("Delete this routine?")) return;
    setLoading(true);
    try {
      // composite-key delete endpoint (as in your current UI)
      await axios.delete(`${DR_API}/delete`, {
        data: {
          drdayofweek: routine.drdayofweek,
          drslot: routine.drslot,
          drsubjid: routine.drsubjid,
          drclassroomid: routine.drclassroomid,
          stu_curr_semester: routine.stu_curr_semester,
          stu_section: routine.stu_section,
          acad_year: routine.acad_year
        }
      });
      setMessage("Routine deleted.");
      await fetchRoutines();
    } catch (err) {
      setMessage("Delete failed: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setForm(initialForm);
    setShowModal(false);
    setMessage("");
  };

  // Filter
  let sessionFilteredRoutines = routines;
  if (sessionUser.role === "teacher") {
    sessionFilteredRoutines = routines.filter(
      r => String(r.drclassteacherid) === String(sessionUser.teacherid)
    );
  }

  const filteredRoutines = sessionFilteredRoutines.filter(r => {
    if (sessionUser.role !== 'admin') return true;
    let ok = true;
    if (filterCourse) ok = ok && r.drsubjid === filterCourse;
    if (filterAcadYear) ok = ok && (r.acad_year === filterAcadYear || r.acadyearid === filterAcadYear || r.academicyearid === filterAcadYear);
    return ok;
  });

  const getRoutinesAt = (dayIdx, hour) => {
    const day = DAYS[dayIdx];
    return filteredRoutines.filter(r => {
      if (r.drdayofweek !== day) return false;
      const from = to24Hour(r.drfrom);
      const to = to24Hour(r.drto);
      return from <= hour && hour < to;
    });
  };

  function getTeacherNameAndId(id) {
    if (!id) return "Not Assigned";
    const t = teachers.find(t => String(t.teacherid) === String(id));
    return t ? `${t.teachername} (${t.teacherid})` : `(${id})`;
  }
  function getClassroomName(id) {
    const room = classrooms.find(r => r.classroomid === id);
    return room ? `Classroom - ${room.classroomid}` : `Classroom - ${id}`;
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 12, maxWidth: 1500, margin: "0 auto", minHeight: 640,
      boxShadow: "0 2px 12px rgba(99,102,241,0.10)", padding: "18px 18px 36px 18px", position: "relative"
    }}>
      {sessionUser.role === "admin" && (
        <button
          onClick={() => { setShowModal(true); setForm(initialForm); setEditingKey(null); }}
          style={{
            position: "absolute", right: 32, top: 18, zIndex: 5, background: "#fff",
            border: "1.7px solid #d4d4d4", borderRadius: "22px", fontWeight: 700, color: "#444", fontSize: 18,
            boxShadow: "0 2px 9px #f3f4f690", padding: "6px 28px 6px 16px", display: "flex", alignItems: "center",
            gap: 8, cursor: "pointer", transition: "box-shadow .14s"
          }}>
          <span style={{ display: "inline-block", fontWeight: 900, fontSize: 22, marginRight: 3, position: "relative", top: 1 }}>+</span>
          Add
        </button>
      )}

      <h2 style={{ color: "#18181b", fontSize: 28, fontWeight: 800, marginBottom: 12, marginTop: 2, marginLeft: 7 }}>
        College Daily Routine
      </h2>

      {sessionUser.role === "admin" && (
        <div style={{ display: "flex", gap: 18, alignItems: "center", marginLeft: 7, marginBottom: 16 }}>
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)}
                  style={{ padding: 8, borderRadius: 7, border: "1.3px solid #c7d2fe", minWidth: 150 }}>
            <option value="">All Courses</option>
            {subjects.map(subj =>
              <option key={subj.offerid} value={subj.offerid}>
                {subj.coursename ? `${subj.coursename} (${subj.offerid})` : subj.offerid}
              </option>
            )}
          </select>
          <select value={filterAcadYear} onChange={e => setFilterAcadYear(e.target.value)}
                  style={{ padding: 8, borderRadius: 7, border: "1.3px solid #c7d2fe", minWidth: 140 }}>
            <option value="">All Academic Years</option>
            {acadyears.map(y =>
              <option key={y.acadyearid || y.id} value={y.acadyearname || y.name || y.acadyearid || y.id}>
                {y.acadyearname || y.name || y.acadyearid || y.id}
              </option>
            )}
          </select>
          <button onClick={() => { setFilterCourse(""); setFilterAcadYear(""); }}
                  style={{ background: "#e0e7ff", color: "#3b0764", border: "1.3px solid #6366f1", borderRadius: 8, padding: "7px 20px", fontWeight: 700 }}>
            Reset
          </button>
        </div>
      )}

      {message && <div style={{ marginBottom: 12, color: "#b91c1c", fontWeight: 700, marginLeft: 6 }}>{message}</div>}

      <div style={{
        width: "100%", overflow: "auto", borderRadius: 12, border: "1.4px solid #e4e4e7",
        background: "#fafbfe", boxShadow: "0 2px 9px #e0e7ff44",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fafbfe", borderRadius: 10, fontSize: 15, minWidth: 1200 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ width: 60, background: "#fff", fontWeight: 700, color: "#71717a" }}></th>
              {DAYS.map(day =>
                <th key={day} style={{ padding: "8px 0", fontWeight: 700, color: "#3b3b3b", fontSize: 18, borderBottom: "1.2px solid #ede9fe", background: "#fff" }}>
                  {day.slice(0, 3)}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {TIMES.map((hour) => (
              <tr key={hour}>
                <td style={{ padding: "8px 5px", fontWeight: 600, color: "#a1a1aa", textAlign: "right", background: "#fff", borderRight: "1.2px solid #f3f4f6" }}>
                  {hour}:00
                </td>
                {DAYS.map((day, dayIdx) => (
                  <td key={day} style={{
                    minWidth: 120, maxWidth: 350, height: 44, background: "#fff", borderBottom: "1.1px solid #f3f4f6",
                    verticalAlign: "top", position: "relative", padding: 0
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "0 2px" }}>
                      {getRoutinesAt(dayIdx, hour).map(routine => {
                        let bg, borderLeft, label;
                        if (routine.drislabsession && routine.drisclasssession) {
                          bg = "linear-gradient(90deg,#6366f1,#38bdf8)"; borderLeft = "5px solid #a21caf";
                          label = <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "linear-gradient(90deg,#ef4444 70%,#2563eb 90%)", padding: "2px 14px", borderRadius: 8, marginLeft: 8 }}>Lab + Class</span>;
                        } else if (routine.drislabsession) {
                          bg = "#e0f2fe"; borderLeft = "5px solid #2563eb";
                          label = <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "#2563eb", padding: "2px 12px", borderRadius: 8, marginLeft: 8 }}>Lab</span>;
                        } else if (routine.drisclasssession) {
                          bg = "#fee2e2"; borderLeft = "5px solid #ef4444";
                          label = <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", background: "#ef4444", padding: "2px 12px", borderRadius: 8, marginLeft: 8 }}>Class</span>;
                        } else {
                          bg = "#f3f4f6"; borderLeft = "5px solid #a3a3a3"; label = "";
                        }
                        return (
                          <div
                            key={getRoutineKey(routine)}
                            style={{
                              background: bg, border: "1.2px solid #d1d5db", borderLeft: borderLeft, borderRadius: 10,
                              margin: "2px 0", padding: "7px 13px 7px 14px", fontWeight: 600, fontSize: 15, color: "#222",
                              display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 2px 9px #0001", position: "relative", cursor: "pointer"
                            }}
                            onMouseEnter={e => setTooltip({ show: true, routine, pos: { x: e.clientX, y: e.clientY } })}
                            onMouseMove={e => setTooltip({ show: true, routine, pos: { x: e.clientX, y: e.clientY } })}
                            onMouseLeave={() => setTooltip({ show: false, routine: null, pos: { x: 0, y: 0 } })}
                            onClick={() => { if (sessionUser.role === "admin") handleEdit(routine); }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "space-between" }}>
                              <span>
                                <b style={{ fontSize: 20, fontWeight: 900 }}>{routine.drsubjid}</b>
                                <span style={{ color: "#2563eb", fontWeight: 700, marginLeft: 13, fontSize: 15 }}>
                                  {getClassroomName(routine.drclassroomid)}
                                </span>
                              </span>
                              <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginLeft: 10 }}>
                                {routine.drfrom}-{routine.drto}
                              </span>
                            </div>
                            {label && <div style={{ marginTop: 3 }}>{label}</div>}
                            <div style={{ fontSize: 13, color: "#6366f1" }}><b>Academic Year:</b> {routine.acad_year || "--"}</div>
                            <div style={{ fontSize: 13, color: "#ff6b00" }}><b>Semester:</b> {routine.stu_curr_semester || "--"}</div>
                            <div style={{ fontSize: 13, color: "#0ea5e9" }}><b>Section:</b> {routine.stu_section || "--"}</div>
                            <div style={{ fontSize: 13, color: "#2563eb" }}><b>Teacher:</b> {getTeacherNameAndId(routine.drclassteacherid)}</div>
                            {sessionUser.role === "admin" && (
                              <div style={{ marginTop: 6, display: "flex", gap: 7 }}>
                                <button
                                  onClick={e => { e.stopPropagation(); handleEdit(routine); }}
                                  style={{ fontSize: 13, color: "#2563eb", border: "none", background: "#e0e7ff", borderRadius: 6, padding: "3px 14px", cursor: "pointer" }}>
                                  Edit
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDelete(routine); }}
                                  style={{ fontSize: 13, color: "#fff", border: "none", background: "#ef4444", borderRadius: 6, padding: "3px 14px", cursor: "pointer" }}>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && sessionUser.role === "admin" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(100,115,255,0.13)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(2.5px)"
        }}>
          <div
            style={{
              background: "#fff", borderRadius: 13, boxShadow: "0 6px 32px #818cf855", minWidth: 440, maxWidth: "98vw",
              padding: "38px 38px 28px 38px", position: "relative", border: "1.5px solid #a5b4fc"
            }}>
            <button onClick={handleCancel}
              style={{ position: 'absolute', right: 15, top: 12, border: 'none', background: 'none', fontSize: 28, fontWeight: 800, color: '#6366f1', cursor: 'pointer', lineHeight: 1 }}>
              ×
            </button>
            <h3 style={{ margin: '0 0 22px 0', textAlign: 'center', fontWeight: 800, letterSpacing: 1, color: '#3b0764' }}>
              {editingKey ? "Edit Routine" : "Add Routine"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "19px 21px", marginBottom: 20 }}>
                <select name="stu_curr_semester" value={form.stu_curr_semester} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (<option key={sem} value={sem}>{sem}</option>))}
                </select>
                <select name="stu_section" value={form.stu_section} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Select Section</option>
                  {sections.map(sec => (<option key={sec} value={sec}>{sec}</option>))}
                </select>

                <select name="drdayofweek" value={form.drdayofweek} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Day of Week</option>
                  {DAYS.map(day => (<option key={day} value={day}>{day}</option>))}
                </select>

                <select name="drslot" value={form.drslot} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Slot</option>
                  <option value="A1">A1</option><option value="A2">A2</option>
                  <option value="B1">B1</option><option value="B2">B2</option>
                  <option value="C1">C1</option><option value="C2">C2</option>
                  <option value="D1">D1</option><option value="D2">D2</option>
                </select>

                <select name="drsubjid" value={form.drsubjid} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Select Course Offering</option>
                  {subjects.map(off => (
                    <option key={off.offerid} value={off.offerid}>
                      {off.coursename ? `${off.coursename} (${off.offerid})` : off.offerid}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontWeight: 600, marginBottom: 3, marginLeft: 2, color: "#444" }}>Start Time</label>
                  <select name="drfrom" value={form.drfrom} onChange={handleChange} required
                          style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                    <option value="">Select Start Time</option>
                    {TIME_SLOTS.map(time => (<option key={time} value={time}>{time}</option>))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ fontWeight: 600, marginBottom: 3, marginLeft: 2, color: "#444" }}>End Time</label>
                  <select name="drto" value={form.drto} onChange={handleChange} required
                          style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                    <option value="">Select End Time</option>
                    {TIME_SLOTS.map(time => (<option key={time} value={time}>{time}</option>))}
                  </select>
                </div>

                <select name="drclassroomid" value={form.drclassroomid} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Select Classroom</option>
                  {classrooms.map(room => (
                    <option key={room.classroomid} value={room.classroomid}>
                      {room.classroomid} - {room.classroom_name}
                    </option>
                  ))}
                </select>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontWeight: 600 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" name="drislabsession" checked={form.drislabsession} onChange={handleChange} style={{ width: 18, height: 18 }} />
                    Lab Session
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" name="drisclasssession" checked={form.drisclasssession} onChange={handleChange} style={{ width: 18, height: 18 }} />
                    Class Session
                  </label>
                </div>

                <select name="drclassteacherid" value={form.drclassteacherid} onChange={handleChange}
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Class Teacher</option>
                  {teachers.map(t => (
                    <option key={t.teacherid} value={t.teacherid}>{t.teachername} ({t.teacherid})</option>
                  ))}
                </select>

                <input name="drroutcnt" value={form.drroutcnt} onChange={handleChange} placeholder="Routine Count"
                       style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }} type="number" min="1" />

                <select name="acad_year" value={form.acad_year} onChange={handleChange} required
                        style={{ padding: 9, borderRadius: 6, border: "1.3px solid #c7d2fe" }}>
                  <option value="">Select Academic Year</option>
                  {acadyears.map(y =>
                    <option key={y.acadyearid || y.id} value={y.acadyearname || y.name || y.acadyearid || y.id}>
                      {y.acadyearname || y.name || y.acadyearid || y.id}
                    </option>
                  )}
                </select>
              </div>

              <button type="submit" disabled={loading}
                      style={{
                        width: "100%", padding: '13px',
                        background: loading ? 'linear-gradient(90deg,#818cf8,#a5b4fc)' : 'linear-gradient(90deg,#7c3aed,#6366f1 60%,#a5b4fc)',
                        color: '#fff', border: 'none', borderRadius: '9px', fontWeight: 'bold', fontSize: 17, letterSpacing: 1,
                        cursor: loading ? 'default' : 'pointer', marginTop: 3, boxShadow: "0 2px 16px #b5bdf680"
                      }}>
                {editingKey ? "Update Routine" : "Add Routine"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip.show && tooltip.routine && (
        <div style={{
          position: "fixed", left: tooltip.pos.x + 12, top: tooltip.pos.y - 16, zIndex: 99999,
          background: "#222e3a", color: "#fff", borderRadius: 12, boxShadow: "0 4px 32px #0004",
          padding: "18px 22px 16px 22px", minWidth: 260, fontSize: 16, pointerEvents: "none"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4, gap: 7 }}>
            <span style={{ fontSize: 19 }}>🕒</span><b style={{ letterSpacing: 1 }}>Time: </b>
            <span style={{ marginLeft: 4 }}>{formatTimeRange(tooltip.routine.drfrom, tooltip.routine.drto)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4, gap: 7 }}>
            <span style={{ fontSize: 19 }}>📅</span><b style={{ letterSpacing: 1 }}>Day:</b>
            <span style={{ marginLeft: 4 }}>{tooltip.routine.drdayofweek ? getDayShort(tooltip.routine.drdayofweek) : ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 4, gap: 7 }}>
            <span style={{ fontSize: 19 }}>👨‍🏫</span><b style={{ letterSpacing: 1 }}>Teacher:</b>
            <span style={{ marginLeft: 4 }}>{getTeacherNameAndId(tooltip.routine.drclassteacherid)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 19 }}>🏫</span><b style={{ letterSpacing: 1 }}>Class Room:</b>
            <span style={{ marginLeft: 4 }}>{getClassroomName(tooltip.routine.drclassroomid)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
            <span style={{ fontSize: 19 }}>🎓</span><b style={{ letterSpacing: 1 }}>Academic Year:</b>
            <span style={{ marginLeft: 4 }}>{tooltip.routine.acad_year || "--"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
            <span style={{ fontSize: 19 }}>🔖</span><b style={{ letterSpacing: 1 }}>Semester:</b>
            <span style={{ marginLeft: 4 }}>{tooltip.routine.stu_curr_semester || "--"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
            <span style={{ fontSize: 19 }}>👥</span><b style={{ letterSpacing: 1 }}>Section:</b>
            <span style={{ marginLeft: 4 }}>{tooltip.routine.stu_section || "--"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
