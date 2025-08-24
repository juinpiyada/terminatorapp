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
const TEACHER_API = joinUrl(config.TEACHER_ROUTE);                 // /api/teacher
const ROUTINE_API = joinUrl(config.DAILY_ROUTINE_ROUTE);           // /api/daily-routine
const OFFERING_API = joinUrl(config.COURSE_OFFERING_ROUTE);        // /api/course-offering
const ATTENDANCE_API = joinUrl(config.EMPLOYEE_ATTENDANCE_ROUTE);  // /api/employee-attendance
const SUBJECT_API = joinUrl(config.SUBJECT_ROUTE, 'list');         // /api/subject/list  ✅ for descriptions

// ---- date helpers (local, no UTC surprises)
function pad(n){ return String(n).padStart(2,'0'); }
function todayYMD(){
  const d = new Date();
  const y = d.getFullYear();
  const m = pad(d.getMonth()+1);
  const da = pad(d.getDate());
  return `${y}-${m}-${da}`;
}
function weekdayFromDate(dateStr){
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m-1, d);
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dt.getDay()];
}

function getAttendanceKey({ teacherId, date, offerId, classId }) {
  return `attendance_${teacherId}_${date}_${offerId}_${classId}`;
}
function randomId() {
  return 'ATT' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ✅ Resolve a subject *description* from master subject list using many possible keys
function subjectDescFromList(subjId, subjects) {
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

const EmployeeAttendance = () => {
  const [date, setDate] = useState(() => todayYMD());
  const [teacherId, setTeacherId] = useState('');
  const [offerId, setOfferId] = useState('');
  const [classId, setClassId] = useState('');

  const [teachers, setTeachers] = useState([]);
  const [routineAlloc, setRoutineAlloc] = useState([]);
  const [offerings, setOfferings] = useState([]); // [{ offerid, offerlabel, offer_courseid }]
  const [classes, setClasses] = useState([]);
  const [present, setPresent] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [routine, setRoutine] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [guardMsg, setGuardMsg] = useState('');

  // Shows the subject *ID* that will be sent to DB; UI will show description via subject list
  const [selectedOfferCourseId, setSelectedOfferCourseId] = useState('');

  // Subject master list for descriptions
  const [subjects, setSubjects] = useState([]);

  // Load teachers + subject master on mount
  useEffect(() => {
    axios.get(TEACHER_API)
      .then(res => {
        const data = res?.data?.teachers ?? res?.data ?? [];
        setTeachers([{ teacherid: '', teachername: '-- Select Teacher --' }, ...data]);
      })
      .catch(() => setTeachers([{ teacherid: '', teachername: '-- Select Teacher --' }]));

    axios.get(SUBJECT_API)
      .then(res => {
        const list = res?.data?.subjects ?? res?.data ?? [];
        setSubjects(Array.isArray(list) ? list : []);
      })
      .catch(() => setSubjects([]));
  }, []);

  // Load course offerings on mount (for fallback lookups if needed)
  useEffect(() => {
    axios.get(OFFERING_API)
      .then(res => {
        const arr = Array.isArray(res?.data) ? res.data : (res?.data?.offerings ?? []);
        window.__allOfferingsCache__ = arr;
      })
      .catch(() => { window.__allOfferingsCache__ = []; });
  }, []);

  // Load routines for selected teacher
  useEffect(() => {
    setOfferId('');
    setClassId('');
    setRoutineAlloc([]);
    setRoutine(null);
    setClasses([]);

    if (!teacherId) return;

    axios.get(ROUTINE_API)
      .then(res => {
        const routines = res?.data?.routines ?? res?.data ?? [];
        const alloc = (Array.isArray(routines) ? routines : []).filter(
          r => String(r.drclassteacherid) === String(teacherId)
        );
        setRoutineAlloc(alloc);

        // Build Offer IDs set from allocations
        const offerSet = [];
        alloc.forEach(r => { if (r.drsubjid && !offerSet.includes(r.drsubjid)) offerSet.push(r.drsubjid); });

        // Map offer IDs to labels & subject ids (offer_courseid)
        const offeringOpts = [{ offerid: '', offerlabel: '-- Select Offer ID --', offer_courseid: '' }];
        offerSet.forEach(ofId => {
          const all = window.__allOfferingsCache__ || [];
          const off = (Array.isArray(all) ? all : []).find(o => String(o.offerid) === String(ofId));
          offeringOpts.push({
            offerid: ofId,
            offerlabel: ofId,
            offer_courseid: off ? off.offer_courseid : ''
          });
        });
        setOfferings(offeringOpts);

        // Build Classes
        const classSet = [];
        alloc.forEach(r => { if (r.drclassroomid && !classSet.includes(r.drclassroomid)) classSet.push(r.drclassroomid); });
        setClasses([{ classroomid: '', classroomname: '-- Select Class --' }, ...classSet.map(classroomid => ({ classroomid, classroomname: classroomid }))]);
      })
      .catch(() => {
        setRoutineAlloc([]);
        setOfferings([{ offerid: '', offerlabel: '-- Select Offer ID --', offer_courseid: '' }]);
        setClasses([{ classroomid: '', classroomname: '-- Select Class --' }]);
      });
    // eslint-disable-next-line
  }, [teacherId]);

  // Set subject id (offer_courseid) when offerId changes
  useEffect(() => {
    if (!offerId) {
      setSelectedOfferCourseId('');
      return;
    }
    let subid = '';
    const arr = Array.isArray(offerings) ? offerings : [];
    const match = arr.find(o => String(o.offerid) === String(offerId));
    if (match && match.offer_courseid) subid = match.offer_courseid;

    if (!subid) {
      const all = window.__allOfferingsCache__;
      if (all && Array.isArray(all)) {
        const off = all.find(o => String(o.offerid) === String(offerId));
        setSelectedOfferCourseId(off ? off.offer_courseid : '');
      } else {
        axios.get(OFFERING_API)
          .then(res => {
            const all2 = Array.isArray(res?.data) ? res.data : (res?.data?.offerings ?? []);
            const off = all2.find(o => String(o.offerid) === String(offerId));
            setSelectedOfferCourseId(off ? off.offer_courseid : '');
          })
          .catch(() => setSelectedOfferCourseId(''));
      }
    } else {
      setSelectedOfferCourseId(subid);
    }
  }, [offerId, offerings]);

  // Update routine for current selections — include weekday match with selected date
  useEffect(() => {
    setRoutine(null);
    if (teacherId && offerId && classId) {
      const todayName = weekdayFromDate(date);
      const found = routineAlloc.find(
        r =>
          String(r.drclassteacherid) === String(teacherId) &&
          String(r.drsubjid) === String(offerId) &&
          String(r.drclassroomid) === String(classId) &&
          String(r.drdayofweek).toLowerCase() === String(todayName).toLowerCase()
      );
      setRoutine(found || null);
    }
  }, [teacherId, offerId, classId, routineAlloc, date]);

  // Attendance already marked check
  useEffect(() => {
    setSubmitMessage('');
    if (teacherId && date && offerId && classId) {
      const key = getAttendanceKey({ teacherId, date, offerId, classId });
      const stored = window.sessionStorage.getItem(key);
      if (stored) {
        const status = JSON.parse(stored);
        setPresent(status.present);
        setAlreadyMarked(true);
      } else {
        setPresent(false);
        setAlreadyMarked(false);
      }
    } else {
      setPresent(false);
      setAlreadyMarked(false);
    }
  }, [teacherId, date, offerId, classId]);

  // Fetch attendance list
  useEffect(() => {
    if (teacherId && offerId && classId) {
      axios.get(joinUrl(ATTENDANCE_API, 'with-routine'))
        .then(res => {
          const data = res?.data ?? [];
          const filtered = (Array.isArray(data) ? data : []).filter(
            a =>
              String(a.attmaarkedbyemployee) === String(teacherId) &&
              String(a.attsubjectid) === String(offerId) &&
              String(a.attclassid) === String(classId)
          );
          setAttendanceList(filtered);
        })
        .catch(() => setAttendanceList([]));
    } else {
      setAttendanceList([]);
    }
  }, [teacherId, offerId, classId]);

  // ---- SUBMIT GUARD: only today + routine day must match selected date ----
  const todayStr = todayYMD();
  const selectedDayName = weekdayFromDate(date);
  const routineDayName = routine?.drdayofweek || '';
  const isToday = date === todayStr;
  const dayMatches = routine ? (String(routineDayName).toLowerCase() === String(selectedDayName).toLowerCase()) : false;

  useEffect(() => {
    if (!teacherId || !offerId || !classId) { setGuardMsg(''); return; }
    if (!isToday) {
      setGuardMsg(`You can only give attendance for today (${todayStr}).`);
    } else if (!routine) {
      setGuardMsg(`No routine found for ${selectedDayName}. Choose the correct Offer/Class for today.`);
    } else if (!dayMatches) {
      setGuardMsg(`This routine is for ${routineDayName}, but selected date is ${selectedDayName}.`);
    } else {
      setGuardMsg('');
    }
  }, [teacherId, offerId, classId, isToday, routine, selectedDayName, routineDayName, todayStr]);

  const canSubmit = !!teacherId && !!offerId && !!classId && !!routine && isToday && dayMatches && !alreadyMarked;

  // ---- SUBMIT ----
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setSubmitMessage('');
    if (!canSubmit) {
      setSubmitMessage(guardMsg || 'Submission blocked by rules.');
      return;
    }

    // Subject id from course-offering
    let offer_courseid = selectedOfferCourseId || '';
    if (!offer_courseid && routine?.drcourseid) {
      offer_courseid = routine.drcourseid;
    }

    const payload = {
      attid: randomId(),
      attuserid: teacherId,
      attcourseid: offer_courseid || '',  // ✅ subject id stored in DB
      attsubjectid: offerId,              // offering id
      attlat: '',
      attlong: '',
      attts_in: date + 'T09:00:00',
      attts_out: date + 'T16:00:00',
      attvalid: present,
      attvaliddesc: present ? 'Present' : 'Absent',
      attclassid: classId,
      attdeviceid: '',
      attmaarkedbyemployee: teacherId
    };

    try {
      await axios.post(ATTENDANCE_API, payload);
      setSubmitMessage('Attendance submitted successfully!');
      const key = getAttendanceKey({ teacherId, date, offerId, classId });
      window.sessionStorage.setItem(key, JSON.stringify({ present }));
      setAlreadyMarked(true);

      setTimeout(() => {
        axios.get(joinUrl(ATTENDANCE_API, 'with-routine'))
          .then(res => {
            const data = res?.data ?? [];
            const filtered = (Array.isArray(data) ? data : []).filter(
              a =>
                String(a.attmaarkedbyemployee) === String(teacherId) &&
                String(a.attsubjectid) === String(offerId) &&
                String(a.attclassid) === String(classId)
            );
            setAttendanceList(filtered);
          })
          .catch(() => {});
      }, 800);
    } catch (err) {
      setSubmitMessage('Failed to submit attendance: ' + (err?.response?.data?.error || err.message));
    }
  };

  // ✅ What to SHOW in the UI (description), computed from subject master list
  const subjectDisplay = selectedOfferCourseId
    ? subjectDescFromList(selectedOfferCourseId, subjects)
    : '--';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ background: '#f9faff', borderRadius: 16, padding: 32, boxShadow: '0 2px 12px #0001' }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, color: '#222', marginBottom: 32, letterSpacing: 0.1 }}>
          Teacher Attendance Manager
        </h2>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'flex-start', marginBottom: 16 }}>
          <div style={filterBoxStyle}>
            <label style={labelStyle}>Date:</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={inputStyle}
              max={todayStr} // you can browse past, but not future
            />
          </div>
          <div style={filterBoxStyle}>
            <label style={labelStyle}>Teacher:</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} style={inputStyle}>
              {teachers.map(opt => (
                <option key={opt.teacherid} value={opt.teacherid}>{opt.teachername}</option>
              ))}
            </select>
          </div>
          <div style={filterBoxStyle}>
            <label style={labelStyle}>Offer ID:</label>
            <select value={offerId} onChange={e => setOfferId(e.target.value)} style={inputStyle} disabled={!teacherId || offerings.length <= 1}>
              {offerings.map(opt => (
                <option key={opt.offerid} value={opt.offerid}>
                  {opt.offerlabel || opt.offerid}
                </option>
              ))}
            </select>
          </div>
          <div style={filterBoxStyle}>
            <label style={labelStyle}>Class:</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle} disabled={!teacherId || classes.length <= 1}>
              {classes.map(opt => (
                <option key={opt.classroomid} value={opt.classroomid}>
                  {opt.classroomname}
                </option>
              ))}
            </select>
          </div>
          {/* ✅ Show Subject *Description* (while DB still gets subject ID) */}
          <div style={filterBoxStyle}>
            <label style={labelStyle}>Subject:</label>
            <input
              type="text"
              value={subjectDisplay}
              readOnly
              style={{ ...inputStyle, background: '#f3f4f6', color: '#6b7280', minWidth: 220 }}
            />
          </div>
        </div>

        {/* Purple bar — shows routine info if available */}
        {routine && (
          <div style={{
            margin: '16px 0 0 0', padding: 18, borderRadius: 10,
            background: '#e0e7ff', color: '#222', fontWeight: 500
          }}>
            <span style={{ marginRight: 28 }}>Day: <b>{selectedDayName}</b></span>
            <span style={{ marginRight: 28 }}>Slot: <b>{routine.drslot}</b></span>
            <span style={{ marginRight: 28 }}>From: <b>{routine.drfrom}</b></span>
            <span>To: <b>{routine.drto}</b></span>
            <span style={{ marginLeft: 32, color: '#6349b5' }}>
              Subject: <b>{subjectDisplay}</b>
            </span>
          </div>
        )}

        {/* Guard message */}
        {guardMsg && (teacherId && offerId && classId) && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', borderRadius: 8 }}>
            {guardMsg}
          </div>
        )}

        {teacherId && offerId && classId && (
          <form onSubmit={handleSubmitAttendance}>
            <h3 style={{ color: '#6366F1', margin: '18px 0 10px 0', fontWeight: 700 }}>
              Attendance Date: <span style={{ color: '#463cf1' }}>{date}</span>
            </h3>
            <div style={{
              borderRadius: 14, background: '#fff', boxShadow: '0 2px 8px #b3b6ff29', margin: '18px 0', padding: 10
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 17 }}>
                <thead>
                  <tr style={{ background: '#eef2ff', color: '#3730a3', fontWeight: 600 }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>Teacher ID</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left' }}>Teacher Name</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Present</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 12 }}>{teacherId}</td>
                    <td style={{ padding: 12 }}>{teachers.find(t => t.teacherid === teacherId)?.teachername}</td>
                    <td style={{ textAlign: 'center', padding: 12 }}>
                      <input
                        type="checkbox"
                        checked={present}
                        onChange={() => { if (canSubmit) setPresent(p => !p); }}
                        disabled={!canSubmit}
                        title={!canSubmit ? (guardMsg || 'Complete selections first') : ''}
                      />
                      {alreadyMarked && (
                        <span style={{
                          marginLeft: 10,
                          color: present ? 'green' : 'red',
                          fontWeight: 600
                        }}>
                          {present ? 'Present' : 'Absent'}
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 38px', background: (!canSubmit ? '#ccc' : '#2563eb'), color: '#fff', border: 'none',
                borderRadius: 10, fontWeight: 700, fontSize: 19, float: 'right', marginTop: 12, cursor: (!canSubmit ? 'not-allowed' : 'pointer')
              }}
              disabled={!canSubmit}
              title={!canSubmit ? (guardMsg || 'Not allowed') : ''}
            >
              {alreadyMarked ? 'Attendance Given' : 'Submit Attendance'}
            </button>
            {submitMessage && (
              <div style={{ clear: 'both', marginTop: 12, color: submitMessage.includes('success') ? 'green' : 'red', fontWeight: 600 }}>
                {submitMessage}
              </div>
            )}
          </form>
        )}

        {attendanceList.length > 0 && (
          <div style={{ margin: '30px 0 0 0', background: '#f3f4f6', borderRadius: 12, padding: 18 }}>
            <h3 style={{ fontWeight: 700, color: '#444' }}>Attendance Records</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
              <thead>
                <tr style={{ background: '#dbeafe', color: '#3730a3', fontWeight: 600 }}>
                  <th style={{ padding: 8 }}>Date</th>
                  <th style={{ padding: 8 }}>Teacher Name</th>
                  <th style={{ padding: 8 }}>Present</th>
                  <th style={{ padding: 8 }}>Day</th>
                  <th style={{ padding: 8 }}>Slot</th>
                  <th style={{ padding: 8 }}>From</th>
                  <th style={{ padding: 8 }}>To</th>
                  <th style={{ padding: 8 }}>Subject ID</th>
                </tr>
              </thead>
              <tbody>
                {attendanceList.map((rec, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: 8 }}>{rec.attts_in?.slice(0, 10)}</td>
                    <td style={{ padding: 8 }}>
                      {teachers.find(t => t.teacherid === rec.attmaarkedbyemployee)?.teachername || rec.attmaarkedbyemployee}
                    </td>
                    <td style={{ padding: 8 }}>{rec.attvalid ? 'Present' : 'Absent'}</td>
                    <td style={{ padding: 8 }}>{rec.drdayofweek}</td>
                    <td style={{ padding: 8 }}>{rec.drslot}</td>
                    <td style={{ padding: 8 }}>{rec.drfrom}</td>
                    <td style={{ padding: 8 }}>{rec.drto}</td>
                    <td style={{ padding: 8 }}>{rec.attcourseid || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const filterBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 180
};
const labelStyle = {
  marginBottom: 6,
  fontWeight: 500,
  color: '#333',
  fontSize: 15
};
const inputStyle = {
  padding: '7px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  background: '#fff',
  fontSize: 15,
  outline: 'none'
};

export default EmployeeAttendance;
