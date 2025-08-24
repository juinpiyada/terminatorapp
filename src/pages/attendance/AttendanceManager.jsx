import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../../config/middleware_config';

// ---- Safe URL joiner (prevents double/missing slashes)
function joinUrl(base = '', path = '') {
  if (!base) return path || '';
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

// ===== API endpoints via config =====
const ROUTINE_API = joinUrl(config.DAILY_ROUTINE_ROUTE);                 // e.g. /api/daily-routine
const STUDENT_API = joinUrl(config.STUDENT_ROUTE, 'list');               // e.g. /api/student/list
const TEACHER_API = joinUrl(config.TEACHER_ROUTE);                       // e.g. /api/teacher
const COURSE_OFFERING_API = joinUrl(config.COURSE_OFFERING_ROUTE);       // e.g. /api/course-offering
const ATTENDANCE_API = joinUrl(config.COLLEGE_ATTENDANCE_ROUTE, 'submit'); // e.g. /api/CollegeAttendenceManager/submit
const SUBJECT_API = joinUrl(config.SUBJECT_ROUTE, 'list');               // e.g. /api/subject/list  ✅ (new)

// ---------- helper to resolve subject description by id ----------
function subjectDescFromLists(subjId, subjects) {
  if (!subjId) return '';
  const s = (subjects || []).find(
    x =>
      String(x.subjectid) === String(subjId) ||
      String(x.subject_code) === String(subjId) ||
      String(x.subjectname) === String(subjId)
  );
  return s
    ? (s.subjectname || s.subjectdesc || s.subject_description || s.subject_code || String(subjId))
    : String(subjId);
}

const AttendanceManager = () => {
  const [routines, setRoutines] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courseOfferings, setCourseOfferings] = useState([]);
  const [subjects, setSubjects] = useState([]); // ✅ master list for descriptions

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedCourseOffering, setSelectedCourseOffering] = useState('');
  const [selectedAcadYear, setSelectedAcadYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedTiming, setSelectedTiming] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitMsg, setSubmitMsg] = useState('');

  const [acadYearOptions, setAcadYearOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [timingOptions, setTimingOptions] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);

  // Load all base data on mount
  useEffect(() => {
    setLoading(true);
    setErr('');
    Promise.all([
      axios.get(ROUTINE_API),
      axios.get(STUDENT_API),
      axios.get(TEACHER_API),
      axios.get(COURSE_OFFERING_API),
      axios.get(SUBJECT_API),                // ✅ get subject master
    ])
      .then(([routineRes, studentRes, teacherRes, courseOfferingRes, subjectRes]) => {
        const rRaw = routineRes?.data?.routines ?? routineRes?.data ?? [];
        setRoutines(Array.isArray(rRaw) ? rRaw : []);

        const sRaw = studentRes?.data?.students ?? studentRes?.data ?? [];
        setStudents(Array.isArray(sRaw) ? sRaw : []);

        const tRaw = teacherRes?.data?.teachers ?? teacherRes?.data ?? [];
        setTeachers(Array.isArray(tRaw) ? tRaw : []);

        const cRaw = courseOfferingRes?.data?.offerings ?? courseOfferingRes?.data ?? [];
        setCourseOfferings(Array.isArray(cRaw) ? cRaw : []);

        const subRaw = subjectRes?.data?.subjects ?? subjectRes?.data ?? [];
        setSubjects(Array.isArray(subRaw) ? subRaw : []); // ✅

        setLoading(false);
      })
      .catch((e) => {
        setRoutines([]); setStudents([]); setTeachers([]); setCourseOfferings([]); setSubjects([]);
        setLoading(false);
        setErr('Failed to load initial data: ' + (e.message || ''));
      });
  }, []);

  // Update Academic Years after selecting Course Offering
  useEffect(() => {
    if (!selectedCourseOffering) {
      setAcadYearOptions([]); setSectionOptions([]);
      setSelectedAcadYear(''); setSelectedSection('');
      return;
    }
    const filtered = routines.filter(r => String(r.drsubjid) === String(selectedCourseOffering));
    const acadYears = [...new Set(filtered.map(r => r.acad_year).filter(Boolean))];
    setAcadYearOptions(acadYears);
    setSelectedAcadYear('');
    setSectionOptions([]);
    setSelectedSection('');
  }, [selectedCourseOffering, routines]);

  // Update Sections after selecting Academic Year
  useEffect(() => {
    if (!selectedCourseOffering || !selectedAcadYear) {
      setSectionOptions([]); setSelectedSection('');
      return;
    }
    const filtered = routines.filter(r =>
      String(r.drsubjid) === String(selectedCourseOffering) &&
      r.acad_year === selectedAcadYear
    );
    const sections = [...new Set(filtered.map(r => r.stu_section).filter(Boolean))];
    setSectionOptions(sections);
    setSelectedSection('');
  }, [selectedCourseOffering, selectedAcadYear, routines]);

  // Find all routines matching the full filter combo
  const showTable = selectedCourseOffering && selectedAcadYear && selectedSection;
  const filteredRoutines = routines.filter(r =>
    String(r.drsubjid) === String(selectedCourseOffering) &&
    r.acad_year === selectedAcadYear &&
    r.stu_section === selectedSection
  );

  // Meta from course offering
  const selectedOfferingMeta = courseOfferings.find(
    o => String(o.offerid) === String(selectedCourseOffering)
  );
  const offer_courseid = selectedOfferingMeta?.offer_courseid || ''; // real subject id (kept for DB)
  // ✅ what we SHOW to the user:
  const subjectDisplay =
    selectedOfferingMeta?.subjectname ||
    selectedOfferingMeta?.subject_NAME ||
    subjectDescFromLists(offer_courseid, subjects) ||
    offer_courseid ||
    '--';

  // Filtered students in section
  const filteredStudents = showTable
    ? students.filter(stu => stu.stu_section === selectedSection)
    : [];

  // Teacher/timing options for current session
  useEffect(() => {
    if (showTable) {
      setTimingOptions([...new Set(filteredRoutines.map(r => `${r.drfrom || '--'} - ${r.drto || '--'}`))]);
      setTeacherOptions([...new Set(filteredRoutines.map(r => r.drclassteacherid).filter(Boolean))]);
      setSelectedTeacher(filteredRoutines[0]?.drclassteacherid || '');
      setSelectedTiming(filteredRoutines[0] ? `${filteredRoutines[0].drfrom || '--'} - ${filteredRoutines[0].drto || '--'}` : '');
    } else {
      setTimingOptions([]); setTeacherOptions([]); setSelectedTeacher(''); setSelectedTiming('');
    }
    // eslint-disable-next-line
  }, [showTable, selectedCourseOffering, selectedAcadYear, selectedSection, routines]);

  // Attendance state per session (restore from localStorage if any)
  useEffect(() => {
    if (showTable) {
      const key = `attendance_${selectedCourseOffering}_${selectedAcadYear}_${selectedSection}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setAttendance(JSON.parse(saved));
      } else {
        const initial = {};
        filteredStudents.forEach(stu => { initial[stu.stuid] = false; });
        setAttendance(initial);
        localStorage.setItem(key, JSON.stringify(initial));
      }
    } else {
      setAttendance({});
    }
    // eslint-disable-next-line
  }, [showTable, selectedCourseOffering, selectedAcadYear, selectedSection, students]);

  // Update attendance in localStorage
  useEffect(() => {
    if (showTable) {
      const key = `attendance_${selectedCourseOffering}_${selectedAcadYear}_${selectedSection}`;
      localStorage.setItem(key, JSON.stringify(attendance));
    }
  }, [attendance, showTable, selectedCourseOffering, selectedAcadYear, selectedSection]);

  // Handlers
  const handleCheckboxChange = (stuid) => {
    setAttendance(prev => ({
      ...prev,
      [stuid]: !prev[stuid]
    }));
  };

  // ---- SUBMIT ----
  const handleSubmitAttendance = async () => {
    if (!selectedTeacher || !offer_courseid) {
      setSubmitMsg('Please select a teacher and a valid subject!');
      setTimeout(() => setSubmitMsg(''), 2500);
      return;
    }
    setLoading(true); setSubmitMsg('');
    const data = filteredStudents.map(stu => ({
      attuserid: stu.stuid,
      present: !!attendance[stu.stuid],
      attclassid: stu.stu_section,
      attsubjectid: selectedCourseOffering, // offering id (unchanged)
      attcourseid: offer_courseid,          // subject id for DB (unchanged)
      attmaarkedbyemployee: selectedTeacher,
      teacherid: selectedTeacher
    }));

    try {
      await axios.post(ATTENDANCE_API, data);
      setSubmitMsg('Attendance submitted & saved to database!');
    } catch (err) {
      setSubmitMsg('Failed to submit attendance to database. ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
    setTimeout(() => setSubmitMsg(''), 3500);
  };

  const getTeacherName = (tid) => {
    if (!tid) return '--';
    const t = teachers.find(t => String(t.teacherid) === String(tid));
    return t ? `${t.teachername} (${t.teacherid})` : `(${tid})`;
  };

  // Only show course offerings present in daily routine
  const courseOfferingIdsInRoutine = [...new Set(routines.map(r => r.drsubjid).filter(Boolean))];
  const courseOfferingOptions = [
    { value: '', label: '-- Select Course Offering --' },
    ...courseOfferings
      .filter(o => courseOfferingIdsInRoutine.includes(String(o.offerid)))
      .map(o => ({
        value: o.offerid,
        label: `${o.coursename || o.subjectname || o.offerid} (${o.offerid})`
      }))
  ];

  return (
    <div style={{ padding: 32, fontFamily: 'Inter, sans-serif', background: '#f8f8ff', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: 16 }}>College Attendance Manager</h2>
      {err && <div style={{ color: 'red', marginBottom: 12 }}>{err}</div>}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: '#fff',
        padding: 20,
        marginBottom: 22,
        borderRadius: 12,
        boxShadow: '0 1px 8px #ddd',
        gap: 24,
        fontSize: 17,
      }}>
        <div>
          <label style={{ fontWeight: 500 }}>Date: </label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: 7, borderRadius: 5, border: '1px solid #bbb', minWidth: 145 }}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>Course Offering: </label>
          <select
            style={{ padding: 7, borderRadius: 5, border: '1px solid #bbb', minWidth: 200 }}
            value={selectedCourseOffering}
            onChange={e => setSelectedCourseOffering(e.target.value)}
          >
            {courseOfferingOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>Academic Year: </label>
          <select
            style={{ padding: 7, borderRadius: 5, border: '1px solid #bbb', minWidth: 130 }}
            value={selectedAcadYear}
            onChange={e => setSelectedAcadYear(e.target.value)}
            disabled={!acadYearOptions.length}
          >
            <option value="">-- Select Year --</option>
            {acadYearOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 500 }}>Section: </label>
          <select
            style={{ padding: 7, borderRadius: 5, border: '1px solid #bbb', minWidth: 90 }}
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            disabled={!sectionOptions.length}
          >
            <option value="">-- Select Section --</option>
            {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {showTable && (
        <div style={{
          display: 'flex', gap: 24, alignItems: 'center', background: '#e0e7ff', borderRadius: 10, padding: '12px 18px', marginBottom: 18, marginLeft: 2, maxWidth: 900, fontSize: 16
        }}>
          <div>
            <b>Subject:</b> <span style={{ fontWeight: 700 }}>{subjectDisplay}</span> {/* ✅ description shown */}
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Teacher: </label>
            <select
              value={selectedTeacher}
              onChange={e => setSelectedTeacher(e.target.value)}
              style={{ padding: '5px 12px', borderRadius: 6, minWidth: 140, border: '1px solid #bbb' }}
            >
              {teacherOptions.map(tid =>
                <option key={tid} value={tid}>{getTeacherName(tid)}</option>
              )}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600 }}>Timing: </label>
            <select
              value={selectedTiming}
              onChange={e => setSelectedTiming(e.target.value)}
              style={{ padding: '5px 12px', borderRadius: 6, minWidth: 120, border: '1px solid #bbb' }}
            >
              {timingOptions.map(time =>
                <option key={time} value={time}>{time}</option>
              )}
            </select>
          </div>
        </div>
      )}

      {showTable && (
        <div style={{ fontWeight: 600, fontSize: 18, color: '#6366f1', marginBottom: 8, marginLeft: 6 }}>
          Attendance Date: <span style={{ fontWeight: 800 }}>{selectedDate}</span>
        </div>
      )}

      {showTable && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 10px #bbb', marginBottom: 20, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: 500 }}>
            <thead style={{ background: '#eceff1' }}>
              <tr>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd' }}></th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd', textAlign: 'left' }}>Student ID</th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd', textAlign: 'left' }}>Student Name</th>
                <th style={{ padding: 8, borderBottom: '1px solid #ddd', textAlign: 'center' }}>Present</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>Loading...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 20 }}>
                    No students found for this Section.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, idx) => (
                  <tr key={stu.stuid || idx} style={{ background: idx % 2 === 0 ? '#f6f9ff' : '#e8eaf6' }}>
                    <td style={{ padding: 7 }}>{idx + 1}</td>
                    <td style={{ padding: 7 }}>{stu.stuid || '--'}</td>
                    <td style={{ padding: 7 }}>{stu.stuname || '--'}</td>
                    <td style={{ padding: 7, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={attendance[stu.stuid] || false}
                        onChange={() => handleCheckboxChange(stu.stuid)}
                        aria-label={`Mark present for ${stu.stuname}`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredStudents.length > 0 && (
            <div style={{ textAlign: 'right', marginTop: 18, marginRight: 18 }}>
              <button
                onClick={handleSubmitAttendance}
                disabled={loading}
                style={{
                  background: loading ? '#a5b4fc' : '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 32px',
                  fontSize: 17,
                  boxShadow: '0 2px 8px #b1b3ff88',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginLeft: 'auto'
                }}>
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
              {submitMsg && <span style={{ marginLeft: 20, color: submitMsg.includes('Failed') ? '#dc2626' : '#059669', fontWeight: 600 }}>{submitMsg}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
