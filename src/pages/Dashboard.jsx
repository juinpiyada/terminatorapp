// SMS-ui/src/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

import config from '../config/middleware_config';

import UserRole from './User/UserRole.jsx';
import AddCollege from '../components/AddCollege.jsx';
import AddCourse from '../components/AddCourse.jsx';
import MasterSubject from './Subject/MasterSubject.jsx';
import MasterStudent from './Student/MasterStudent.jsx';
import MasterTeacher from './Teacher/MasterTeacher.jsx';
import CollegeAcadYear from './college/collegeacadyear.jsx';
import SubjectCourse from './Subject/SubjectCourse.jsx';
import SubjectElec from './Subject/SubjectElec.jsx';
import SubjectTeacher from './Subject/SubjectTeacher.jsx';
import SubjectDepartement from './Department/MasterDepts.jsx';
import CollegeGroupManager from './CollageGroup/CollegeGroupManager.jsx';
import Manageuser from './User/Manageuser.jsx';
import TeacherAvailabilityManager from './TeacherAvailabilityManager/TeacherAvailabilityManager.jsx';
import ExamRoutineManager from './ExamRoutineManager/ExamRoutineManager.jsx';
import CourseRegistrationManager from './CourseRegistrationManager/CourseRegistrationManager.jsx';
import CourseOfferingManager from './CourseOfferingManager/CourseOfferingManager.jsx';
import DailyRoutine from './DailyRoutine/DailyRoutine.jsx';
import ClassroomManager from './classroom/ClassroomManager.jsx';
import MenuManager from './menu/MenuManager.jsx';
import MasterRole from './User/MasterRole.jsx';
import CollegeAttendenceManager from './attendance/AttendanceManager.jsx';
import EmployeeAttendanceManager from './attendance/EmployeeAttendance.jsx';
import ExamResult from './result/ExamResult.jsx';

// NEW 👉 device manager
import SmsDeviceManager from './device/SmsDeviceManager.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// ------- Helpers -------
function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem('auth') || '{}'); }
  catch { return {}; }
}

/**
 * Treat URLs like `/api`, `/api/`, or `http(s)://<host>/api` as "bare API root"
 * and skip calling them to avoid 404 noise.
 */
function isBareApiUrl(url) {
  if (!url) return true;
  try {
    const trimmed = String(url).trim();
    if (!trimmed || trimmed === '/' || trimmed === '/api' || trimmed === '/api/') return true;
    const u = new URL(trimmed, window.location.origin);
    const path = u.pathname.replace(/\/+$/, ''); // strip trailing slash
    return path === '' || path === '/api';
  } catch {
    return false;
  }
}

async function safeGet(url, fallback) {
  if (isBareApiUrl(url)) {
    return { data: fallback, _skipped: true };
  }
  try {
    const res = await axios.get(url);
    return res;
  } catch (err) {
    console.warn(`GET failed: ${url}`, err?.message || err);
    return { data: fallback, _error: err };
  }
}

function readJSON(key, storage = window.localStorage) {
  try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; }
}
function getCurrentSessionToken() {
  const ss = readJSON('sessionUser', window.sessionStorage) || {};
  const lsSess = readJSON('sessionUser', window.localStorage) || {};
  const auth = readJSON('auth', window.localStorage) || {};
  const uid = ss.userid || ss.userId || ss.username ||
              lsSess.userid || lsSess.userId || lsSess.username ||
              auth.userId || auth.userid || auth.username || '';
  const ts = ss.login_time || lsSess.login_time || auth.login_time || '';
  return `${uid || 'anon'}|${ts || ''}`;
}

// ---------- Role helpers ----------
function normalizeRoles(user) {
  const pool = [];
  if (user?.user_role) pool.push(String(user.user_role));
  if (user?.role) pool.push(String(user.role));
  if (user?.userroledesc) pool.push(String(user.userroledesc));
  if (user?.userrolesid) pool.push(String(user.userrolesid));
  if (user?.userroles) {
    if (Array.isArray(user.userroles)) pool.push(...user.userroles.map(String));
    else pool.push(String(user.userroles));
  }
  if (Array.isArray(user?.roles)) pool.push(...user.roles.map(String));

  return new Set(
    pool
      .flatMap(r => String(r).split(/[,\s]+/))
      .map(t => t.trim().toLowerCase())
      .filter(Boolean)
  );
}
const hasAny = (set, ...keys) => keys.some(k => set.has(k.toLowerCase()));
function friendlyRoleLabel(set) {
  if (hasAny(set, 'sms_superadm', 'super_user', 'superadmin', 'super_admin')) return 'super_user';
  if (hasAny(set, 'admin', 'grp_adm', 'group_admin')) return 'admin';
  if (hasAny(set, 'teacher', 'usr_tchr', 'instructor', 'professor')) return 'teacher';
  if (hasAny(set, 'student', 'stu_curr', 'stu_onboard', 'stu_passed')) return 'student';
  return Array.from(set)[0] || 'user';
}

/* =========================
   ICONS
   ========================= */
const Icon = ({ name, size = 18, style = {} }) => (
  <span
    className="material-symbols-outlined"
    aria-hidden="true"
    style={{ fontSize: size, lineHeight: 1, verticalAlign: 'middle', ...style }}
  >
    {name}
  </span>
);

const MATERIAL_ICONS = {
  home: 'home',
  menu: 'folder_open',
  manageUser: 'person',
  userRole: 'admin_panel_settings',
  MasterRole: 'badge',
  addCollege: 'school',
  addGroup: 'groups',
  department: 'apartment',
  subjects: 'menu_book',
  addCourse: 'library_add',
  masterStudent: 'face',
  masterTeacher: 'person_outline',
  collegeAcadYear: 'event',
  subjectCourse: 'sync_alt',
  subjectElec: 'bolt',
  subjectTeacher: 'handshake',
  dailyRoutine: 'calendar_month',
  classroomManager: 'meeting_room',
  teacherAvailability: 'schedule',
  examRoutine: 'assignment',
  CollegeAttendenceManager: 'how_to_reg',
  EmployeeAttendanceManager: 'badge',
  courseRegistration: 'edit_note',
  courseOffering: 'workspace_premium',
  examResult: 'military_tech',
  deviceManager: 'devices',
  logout: 'logout'
};

const GROUP_ICONS = {
  'User Management': 'group',
  'Academic Structure': 'domain',
  'Curriculum': 'library_books',
  'People': 'diversity_3',
  'Operations': 'tune',
  'Routines': 'calendar_month',
  'Reports': 'insights'
};

const styles = {
  layout: { display: 'flex', height: '100vh', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  sidebar: { width: 280, background: '#0f172a', color: '#e2e8f0', padding: 16, overflowY: 'auto', boxShadow: '2px 0 12px rgba(15,23,42,.35)' },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sidebarTitle: { fontSize: 20, fontWeight: 800, letterSpacing: .4 },
  rolePill: { fontSize: 11, background: '#1e293b', border: '1px solid #334155', padding: '4px 8px', borderRadius: 999, color: '#93c5fd' },
  searchWrap: { margin: '10px 0 14px', position: 'relative' },
  searchInput: {
    width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
    border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0',
    outline: 'none', fontSize: 14
  },
  searchIcon: { position: 'absolute', left: 10, top: 9, opacity: .7 },

  menuList: { listStyle: 'none', padding: 0, margin: 0 },
  homeItem: {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    background: 'linear-gradient(90deg, #1f2937 0%, #111827 100%)',
    color: '#e5e7eb', padding: '12px 14px', border: '1px solid #334155', borderRadius: 10,
    cursor: 'pointer', fontSize: 15, marginBottom: 10
  },

  group: { marginBottom: 10, border: '1px solid #233046', borderRadius: 12, background: 'rgba(17,24,39,.55)' },
  groupHeader: (open) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', padding: '12px 14px', cursor: 'pointer', borderRadius: 12,
    background: open ? 'linear-gradient(90deg, rgba(2,132,199,.18), rgba(30,64,175,.16))' : 'transparent',
    borderBottomLeftRadius: open ? 0 : 12, borderBottomRightRadius: open ? 0 : 12
  }),
  groupHeaderLeft: { display: 'flex', alignItems: 'center', gap: 10, color: '#cbd5e1', fontWeight: 700, fontSize: 14.5 },
  caret: (open) => ({ transform: `rotate(${open ? 90 : 0}deg)`, transition: 'transform .15s ease', opacity: .8 }),
  groupBody: { padding: '8px 10px 10px' },
  leafBtn: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: active ? '#1f2937' : 'transparent',
    color: active ? '#93c5fd' : '#cbd5e1', padding: '9px 10px', border: 'none', borderRadius: 10, cursor: 'pointer',
    textAlign: 'left', fontSize: 14, marginTop: 6
  }),
};

// --- normalizer for generic payloads ---
function normalizeChartPayload(payload, fallbackCounts) {
  try {
    if (Array.isArray(payload?.labels) && Array.isArray(payload?.values)) {
      return { labels: payload.labels, values: payload.values.map(v => Number(v) || 0) };
    }
    const items = Array.isArray(payload?.items) ? payload.items
                : (Array.isArray(payload) ? payload : null);
    if (Array.isArray(items)) {
      const labels = [], values = [];
      for (const it of items) {
        const label = it?.label ?? it?.name ?? it?.title ?? it?.key ?? it?.category;
        const value = it?.value ?? it?.count ?? it?.total ?? it?.y ?? it?.n;
        if (label != null && value != null) {
          labels.push(String(label));
          values.push(Number(value) || 0);
        }
      }
      if (labels.length) return { labels, values };
    }
    if (payload && typeof payload === 'object') {
      const entries = Object.entries(payload).filter(([, v]) => typeof v === 'number' || !isNaN(Number(v)));
      if (entries.length) {
        const labels = entries.map(([k]) => k.toString());
        const values = entries.map(([, v]) => Number(v) || 0);
        return { labels, values };
      }
    }
  } catch {}
  const labels = Object.keys(fallbackCounts);
  const values = labels.map(k => Number(fallbackCounts[k]) || 0);
  return { labels, values };
}

function titleizeSnake(s) {
  return String(s)
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ===== Attendance helpers =====
function toISODateOnly(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}
function todayISO() { return toISODateOnly(new Date()); }
function addDaysISO(dateISO, days) {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODateOnly(d);
}
function fmtDateLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}
function sum(arr, key) {
  return (arr || []).reduce((acc, r) => acc + Number(r?.[key] ?? 0), 0);
}

// ---- NEW: read chart visibility from session/auth ----
function readHideChartsFlag() {
  try {
    const sess = sessionStorage.getItem('dashboard_hide_charts');
    if (sess !== null) return sess === 'true';
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    if (typeof auth?.hide_charts === 'boolean') return auth.hide_charts;
  } catch {}
  return false;
}

/* ========= NEW: name helpers for Latest Attendance Updates & student scoping ========= */
function bestName(o = {}) {
  const candidates = [
    o.name, o.fullName, o.fullname, o.displayName,
    o.studentname, o.student_name, o.stuname, o.stu_name,
    (o.first_name && o.last_name) ? `${o.first_name} ${o.last_name}` : null,
    (o.firstname && o.lastname) ? `${o.firstname} ${o.lastname}` : null,
    (o.fname && o.lname) ? `${o.fname} ${o.lname}` : null
  ].map(v => (v && String(v).trim()) || '');
  const picked = candidates.find(Boolean);
  return picked || String(o.username || o.userId || o.userid || o.id || '').trim();
}
function idCandidates(o = {}) {
  return [
    o.stuuserid, o.student_userid, o.stuid, o.studentid,
    o.userid, o.userId, o.username, o.id, o.rollno, o.roll_no
  ].filter(v => v !== undefined && v !== null).map(v => String(v));
}
const eqi = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

export default function Dashboard() {
  // Persist activeTab in localStorage — but reset to Home on a fresh login
  const initialActiveTab = (() => {
    const stored = localStorage.getItem('activeTab') || 'home';
    const token = getCurrentSessionToken();
    const lastToken = sessionStorage.getItem('dashboard_session_token') || '';
    if (!lastToken || token !== lastToken) {
      sessionStorage.setItem('dashboard_session_token', token);
      localStorage.setItem('activeTab', 'home');
      return 'home';
    }
    return stored;
  })();

  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [user, setUser] = useState(getLoggedInUser());
  const [query, setQuery] = useState('');
  const [chartData, setChartData] = useState(null);
  const [chartError, setChartError] = useState('');
  const [pieData, setPieData] = useState(null);

  // >>> NEW: chart visibility state from session
  const [hideCharts, setHideCharts] = useState(readHideChartsFlag());

  // >>> NEW: Today's routine state + small counters from chart API
  const [todayRoutines, setTodayRoutines] = useState([]);
  const [todayDate, setTodayDate] = useState('');
  const [todayRtLoading, setTodayRtLoading] = useState(false);
  const [todayRtError, setTodayRtError] = useState('');
  const [todayCounts, setTodayCounts] = useState({ total: null, updated: null });

  // ===== Attendance state =====
  const defaultEnd = todayISO();
  const defaultStart = addDaysISO(defaultEnd, -14);
  const [attStart, setAttStart] = useState(defaultStart);
  const [attEnd, setAttEnd] = useState(defaultEnd);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState('');
  const [latestEvents, setLatestEvents] = useState([]);
  const [studentSummary, setStudentSummary] = useState([]);
  const [employeeSummary, setEmployeeSummary] = useState([]);

  const DEFAULT_OPEN_GROUPS = {
    'User Management': false,
    'Academic Structure': false,
    'Curriculum': false,
    'People': false,
    'Operations': false,
    'Routines': false,
    'Reports': false
  };
  const [openGroups, setOpenGroups] = useState(DEFAULT_OPEN_GROUPS);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // react if login changes in another tab or just happened
  useEffect(() => {
    const checkSessionChange = () => {
      const token = getCurrentSessionToken();
      const lastToken = sessionStorage.getItem('dashboard_session_token') || '';
      if (!lastToken || token !== lastToken) {
        sessionStorage.setItem('dashboard_session_token', token);
        setUser(getLoggedInUser());
        setActiveTab('home');
        localStorage.setItem('activeTab', 'home');
        setHideCharts(readHideChartsFlag());
      }
    };
    const onStorage = (e) => {
      if (e.key === 'auth' || e.key === 'sessionUser' || e.key === 'dashboard_hide_charts') {
        checkSessionChange();
      }
    };
    const onFocus = () => checkSessionChange();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    const t = setTimeout(checkSessionChange, 0);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      clearTimeout(t);
    };
  }, []);

  const navigate = useNavigate();

  // Role flags
  const roleSet = normalizeRoles(user);
  const isAdmin = hasAny(roleSet, 'admin', 'super_user', 'sms_superadm', 'grp_adm', 'superadmin', 'super_admin');
  const isTeacher = hasAny(roleSet, 'teacher', 'usr_tchr', 'instructor', 'professor');
  const isStudent = hasAny(roleSet, 'student', 'stu_curr', 'stu_onboard', 'stu_passed');
  const userName = user.name || user.userId || 'User';
  const displayRole = friendlyRoleLabel(roleSet).toUpperCase();

  // >>> Student identity (from auth / user role payload)
  const studentId = useMemo(() => {
    return user?.stuuserid || user?.student_userid || user?.userId || user?.userid || user?.username || null;
  }, [user]);
  const studentSection = useMemo(() => {
    return user?.stu_section || user?.student_section || user?.section || null;
  }, [user]);
  const studentSemester = useMemo(() => {
    return user?.stu_curr_semester || user?.student_semester || user?.stu_semester || user?.semester || null;
  }, [user]);
  const studentName = useMemo(() => {
    // prioritize stuname-style fields for display
    return user?.stuname || user?.stu_name || user?.studentname || bestName(user);
  }, [user]);

  // Fetch core dashboard data
  useEffect(() => {
    const fetchAll = async () => {
      const DASHBOARD_FETCH_URL =
        config?.VITE_DASHBOARD_FETCHING_ID ??
        import.meta.env?.VITE_DASHBOARD_FETCHING_ID ??
        config?.DASHBOARD_FETCHING_ID ?? '';

      const [stuRes, teachRes, userRes, roleRes] = await Promise.all([
        safeGet(DASHBOARD_FETCH_URL, { students: [] }),
        safeGet(config?.TEACHER_ROUTE, []),
        safeGet(config?.MASTER_USER_ROUTE, { users: [] }),
        safeGet(config?.USER_ROLE_ROUTE, { roles: [] })
      ]);

      const normStudents =
        Array.isArray(stuRes.data?.students) ? stuRes.data.students
        : Array.isArray(stuRes.data) ? stuRes.data
        : [];

      const normTeachers =
        Array.isArray(teachRes.data?.teachers) ? teachRes.data.teachers
        : Array.isArray(teachRes.data) ? teachRes.data
        : [];

      const normUsers =
        Array.isArray(userRes.data?.users) ? userRes.data.users
        : Array.isArray(userRes.data) ? userRes.data
        : [];

      const normRoles =
        Array.isArray(roleRes.data?.roles) ? roleRes.data.roles
        : Array.isArray(roleRes.data) ? roleRes.data
        : [];

      setStudents(normStudents);
      setTeachers(normTeachers);
      setUsers(normUsers);
      setUserRoles(normRoles);

      if (isBareApiUrl(DASHBOARD_FETCH_URL)) {
        console.warn('VITE_DASHBOARD_FETCHING_ID / DASHBOARD_FETCHING_ID points to a bare /api; students defaulted to [].');
      }
    };

    fetchAll();
  }, []);

  // -------- Build fast lookup maps for names by id --------
  const nameLookup = useMemo(() => {
    const sMap = new Map();
    const uMap = new Map();
    const tMap = new Map();

    students.forEach(s => {
      const nm = bestName(s);
      idCandidates(s).forEach(id => sMap.set(String(id), nm));
    });
    users.forEach(u => {
      const nm = bestName(u);
      idCandidates(u).forEach(id => uMap.set(String(id), nm));
    });
    teachers.forEach(t => {
      const nm = bestName(t);
      idCandidates(t).forEach(id => tMap.set(String(id), nm));
    });

    return { sMap, uMap, tMap };
  }, [students, users, teachers]);

  const displayStudentName = (anyId) => {
    const key = String(anyId ?? '').trim();
    if (!key) return '';
    return nameLookup.sMap.get(key) || nameLookup.uMap.get(key) || key;
  };
  const displayEmployeeName = (anyId) => {
    const key = String(anyId ?? '').trim();
    if (!key) return '';
    return nameLookup.tMap.get(key) || nameLookup.uMap.get(key) || key;
  };

  // Fetch chart data — will SKIP entirely if hideCharts=true
  useEffect(() => {
    const CHART_API = import.meta.env?.VITE_CHART_DATA_ROUTE || config?.CHART_DATA_ROUTE || '';

    const fallbackCounts = {
      Students: students.length,
      Teachers: teachers.length,
      Users: users.length,
      Roles: userRoles.length
    };

    const buildChart = (labels, values) => ({
      labels,
      datasets: [
        {
          label: 'Counts',
          data: values,
          backgroundColor: '#4B9AFF',
          borderColor: '#007BFF',
          borderWidth: 1
        }
      ]
    });

    const buildPie = (studentsCount, teachersCount) => ({
      labels: ['Students', 'Teachers'],
      datasets: [
        {
          data: [studentsCount, teachersCount],
          backgroundColor: ['#4B9AFF', '#F59E42'],
          borderColor: ['#007BFF', '#F59E42'],
          borderWidth: 1
        }
      ]
    });

    const loadChart = async () => {
      setChartError('');

      if (hideCharts) {
        setChartData(null);
        setPieData(null);
        return;
      }

      try {
        if (!CHART_API || isBareApiUrl(CHART_API)) {
          const { labels, values } = normalizeChartPayload(null, fallbackCounts);
          setChartData(buildChart(labels, values));
          setPieData(buildPie(fallbackCounts.Students, fallbackCounts.Teachers));
          setTodayCounts({ total: null, updated: null });
          return;
        }

        const res = await axios.get(CHART_API);
        const apiData = res?.data?.data ?? res?.data;

        if (!apiData || typeof apiData !== 'object') {
          throw new Error('Unexpected chart API payload');
        }

        const entries = Object.entries(apiData)
          .filter(([, v]) => typeof v === 'number' || !isNaN(Number(v)));

        if (!entries.length) throw new Error('Empty chart dataset');

        const labels = entries.map(([k]) => titleizeSnake(k));
        const values = entries.map(([, v]) => Number(v) || 0);

        setChartData(buildChart(labels, values));
        setPieData(buildPie(apiData.students ?? fallbackCounts.Students, apiData.teachers ?? fallbackCounts.Teachers));
        setTodayCounts({
          total: apiData.today_daily_routine_total ?? null,
          updated: apiData.today_daily_routine_updated ?? null
        });
      } catch (e) {
        console.error('❌ Chart API error:', e?.message || e);
        setChartError('Could not load chart from CHART_DATA_ROUTE. Showing local counts.');
        const { labels, values } = normalizeChartPayload(null, fallbackCounts);
        setChartData(buildChart(labels, values));
        setPieData(buildPie(fallbackCounts.Students, fallbackCounts.Teachers));
        setTodayCounts({ total: null, updated: null });
      }
    };

    loadChart();
  }, [students.length, teachers.length, users.length, userRoles.length, hideCharts]);

  // ===== Load Attendance (STUDENT-SCOPED) =====
  useEffect(() => {
    const base = config?.CALENDAR_ATTENDANCE_ROUTE || '/api/calendar-attendance';

    const buildQS = (obj) => {
      const params = new URLSearchParams();
      Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, v);
      });
      return params.toString();
    };

    const load = async () => {
      setAttLoading(true);
      setAttError('');
      try {
        // --- shared range ---
        const commonBase = { start: attStart, end: attEnd };

        // --- events (can include section/semester) ---
        const commonEvents = { ...commonBase };
        if (isStudent) {
          if (studentId) commonEvents.stuid = String(studentId);
          if (studentSection) commonEvents.section = String(studentSection);
          if (studentSemester) commonEvents.semester = String(studentSemester);
        }

        // --- summary (STRICTLY stuid ONLY to avoid over-filter) ---
        const commonSummary = { ...commonBase };
        if (isStudent && studentId) {
          commonSummary.stuid = String(studentId);
          // DO NOT pass section/semester here
        }

        // Combined events used in "Latest Attendance Updates"
        const eventsUrl = `${base}/combined-events?${buildQS(commonEvents)}`;
        const eventsRes = await safeGet(eventsUrl, { events: [], range: {} });
        const allEvents = Array.isArray(eventsRes.data?.events) ? eventsRes.data.events : [];

        // Extra client-side enforcement: only THIS student's events
        const filteredEvents = isStudent
          ? allEvents.filter((e) => {
              const xp = e?.extendedProps || {};
              const isStuType = (xp.type || '').toString().toLowerCase() === 'student';

              // candidate IDs/names/section/semester in the event
              const uid = xp.attuserid ?? xp.userid ?? xp.studentid ?? xp.stuid ?? e?.userId ?? '';
              const evName = xp.stuname || xp.studentname || xp.student_name || xp.name || '';
              const evSection = xp.stu_section || xp.section || '';
              const evSemester = xp.stu_curr_semester || xp.semester || '';

              const idMatch = String(uid) === String(studentId || '');
              const nameMatch = studentName ? eqi(evName, studentName) : false;
              const sectionOk = !studentSection || eqi(evSection, studentSection);
              const semesterOk = !studentSemester || eqi(evSemester, studentSemester);

              return isStuType && (idMatch || nameMatch) && sectionOk && semesterOk;
            })
          : allEvents;

        setLatestEvents(filteredEvents.slice(0, 30));

        // Student summary — send ONLY stuid to server
        const stuSumUrl = `${base}/student-summary?${buildQS(commonSummary)}`;
        const stuRes = await safeGet(stuSumUrl, { days: [] });
        const stuDays = Array.isArray(stuRes.data?.days) ? stuRes.data.days : [];
        setStudentSummary(stuDays);

        // Employees hidden for student
        if (isStudent) {
          setEmployeeSummary([]);
        } else {
          const empSumUrl = `${base}/employee-summary?${buildQS({ start: attStart, end: attEnd })}`;
          const empRes = await safeGet(empSumUrl, { days: [] });
          const empDays = Array.isArray(empRes.data?.days) ? empRes.data.days : [];
          setEmployeeSummary(empDays);
        }
      } catch (e) {
        console.error('Attendance load error:', e?.message || e);
        setAttError('Could not load attendance data.');
      } finally {
        setAttLoading(false);
      }
    };

    load();
  }, [attStart, attEnd, isStudent, studentId, studentSection, studentSemester, studentName]);

  /* ============== CHANGED BLOCK: Load Today’s Updated Routine (strict student scoping) ============== */
  useEffect(() => {
    const baseDaily = config?.DAILY_ROUTINE_ROUTE || '/api/daily-routine';
    const baseCal   = config?.CALENDAR_ATTENDANCE_ROUTE || '/api/calendar-attendance';
    if (activeTab !== 'home') return;

    const today = todayISO();

    // who am I
    const userId =
      user?.userId || user?.userid || user?.username || user?.email || '';

    const stuSection =
      user?.stu_section || user?.section || '';

    const stuSemester =
      user?.stu_curr_semester || user?.stu_semester || user?.semester || '';

    // matcher ensures student only sees their own classroom/semester
    const matchesStudent = (r) => {
      if (!isStudent) return true;

      const uid = r.attuserid ?? r.stuid ?? r.userid ?? r.studentid ?? r.userId ?? '';
      const evSection = r.stu_section ?? r.section ?? r.attclassid ?? r.drclassroomid ?? '';
      const evSemester = r.stu_curr_semester ?? r.semester ?? '';

      const uidOk      = userId ? String(uid) === String(userId) : true;
      const sectionOk  = stuSection ? eqi(evSection, stuSection) : true;
      const semesterOk = stuSemester ? eqi(evSemester, stuSemester) : true;

      // require either exact UID or BOTH section+semester to avoid leaking other classrooms
      return uidOk || (sectionOk && semesterOk);
    };

    const normalizeFromDaily = (arr = []) => {
      const rows = Array.isArray(arr) ? arr : [];
      return rows
        .filter(matchesStudent)
        .map((r) => ({
          // keep original fields for table
          ...r,
          // defensive: make sure times and keys exist
          _from: r.drfrom ?? r.from ?? '',
          _to:   r.drto   ?? r.to   ?? '',
          _subject: r.drsubjid ?? r.subject ?? r.attsubjectid ?? '—',
          _room:    r.drclassroomid ?? r.attclassid ?? r.stu_section ?? '—',
          _semester: r.stu_curr_semester ?? r.semester ?? '—',
          _section:  r.stu_section ?? r.section ?? '—',
          _teacher:  r.drclassteacherid ?? r.teacherid ?? '—',
          _updated:  r.updatedat ?? r.updatedAt ?? null
        }));
    };

    const normalizeFromCal = (events = []) => {
      // use only student-type events with routine fields, for TODAY
      return events
        .filter((e) => {
          const xp = e?.extendedProps || {};
          const isStu = (xp.type || '').toString().toLowerCase() === 'student';
          const day = (e?.start || '').slice(0,10);
          return isStu && day === today;
        })
        .map((e) => {
          const xp = e.extendedProps || {};
          return {
            drfrom: xp.drfrom, drto: xp.drto,
            drsubjid: xp.drsubjid,
            drclassroomid: xp.drclassroomid,
            stu_curr_semester: xp.stu_curr_semester,
            stu_section: xp.stu_section,
            drclassteacherid: xp.teacherid,
            attuserid: xp.attuserid,
            attclassid: xp.attclassid,
            updatedat: null
          };
        })
        .filter(matchesStudent)
        // de-dup by time + subject + room
        .reduce((acc, r) => {
          const key = `${r.drfrom}|${r.drto}|${r.drsubjid}|${r.drclassroomid}`;
          if (!acc._seen.has(key)) { acc._seen.add(key); acc.list.push(r); }
          return acc;
        }, { _seen: new Set(), list: [] }).list
        .map((r) => ({
          ...r,
          _from: r.drfrom ?? '',
          _to: r.drto ?? '',
          _subject: r.drsubjid ?? '—',
          _room: r.drclassroomid ?? r.attclassid ?? r.stu_section ?? '—',
          _semester: r.stu_curr_semester ?? '—',
          _section: r.stu_section ?? '—',
          _teacher: r.drclassteacherid ?? '—',
          _updated: r.updatedat ?? null
        }));
    };

    const buildParams = () => {
      const p = {};
      if (isStudent) {
        if (userId)      { p.stuid = userId; p.attuserid = userId; }
        if (stuSection)  { p.section = stuSection; p.classid = stuSection; } // attclassid ≈ section/class
        if (stuSemester) { p.semester = stuSemester; }
      }
      if (isTeacher) {
        if (userId) p.teacherid = userId;
      }
      return p;
    };

    const fetchToday = async () => {
      setTodayRtLoading(true);
      setTodayRtError('');
      try {
        // 1) Try dedicated daily-routine endpoint (kept from your code)
        const params = buildParams();
        const res = await axios.get(`${baseDaily}/today/updated`, { params });
        const raw = Array.isArray(res?.data?.routines) ? res.data.routines : [];
        let rows = normalizeFromDaily(raw);

        // 2) If nothing came back for a student, fall back to calendar-attendance (joined with routine)
        if (rows.length === 0 && isStudent) {
          const q = new URLSearchParams({
            start: today, end: today,
            ...(studentId ? { stuid: String(studentId) } : {}),
            ...(stuSection ? { section: String(stuSection), classid: String(stuSection) } : {}),
            ...(stuSemester ? { semester: String(stuSemester) } : {})
          }).toString();

          const cal = await safeGet(`${baseCal}/combined-events?${q}`, { events: [] });
          const events = Array.isArray(cal?.data?.events) ? cal.data.events : [];
          rows = normalizeFromCal(events);
        }

        // sort by time if available
        rows.sort((a, b) => String(a._from || '').localeCompare(String(b._from || '')));

        setTodayRoutines(rows);
        setTodayDate(today);
      } catch (e) {
        console.error('today/updated fetch error', e?.message || e);
        setTodayRtError('Could not load today’s updated routine.');
        setTodayRoutines([]);
        setTodayDate(today);
      } finally {
        setTodayRtLoading(false);
      }
    };

    fetchToday();
  }, [isStudent, isTeacher, user, activeTab]);
  /* ========================== END CHANGED BLOCK ========================== */

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('activeTab');
    sessionStorage.removeItem('dashboard_session_token');
    sessionStorage.removeItem('dashboard_hide_charts');
    navigate('/');
  };

  // ---------- Grouped Menu Definition ----------
  const ALL_GROUPS = useMemo(() => {
    const vis = (key) => {
      if (isTeacher && !isAdmin) {
        const teacherAllowed = new Set([
          'home', 'dailyRoutine', 'CollegeAttendenceManager', 'logout'
        ]);
        return teacherAllowed.has(key);
      }

      if (key === 'EmployeeAttendanceManager') return isAdmin;
      const adminPreferred = new Set([
        'menu','manageUser','userRole','MasterRole',
        'addCollege','addGroup','department','collegeAcadYear',
        'subjects','addCourse','subjectCourse','subjectElec',
        'masterStudent','masterTeacher','subjectTeacher','teacherAvailability',
        'courseRegistration','courseOffering','classroomManager',
        'deviceManager'
      ]);
      if (adminPreferred.has(key)) return isAdmin;

      if (key === 'CollegeAttendenceManager') return isAdmin;

      const studentAllowed = new Set(['dailyRoutine','examRoutine','classroomManager']);
      if (studentAllowed.has(key)) return isStudent || isAdmin;

      const openToAll = new Set(['home','examResult','logout']);
      if (openToAll.has(key)) return true;

      return false;
    };

    const groups = [
      {
        group: 'User Management',
        items: [
          { key: 'manageUser', label: 'Users' },
          { key: 'userRole', label: 'User Roles' },
          { key: 'MasterRole', label: 'Master Role' }
        ]
      },
      {
        group: 'Academic Structure',
        items: [
          { key: 'addCollege', label: 'Colleges' },
          { key: 'addGroup', label: 'College Groups' },
          { key: 'department', label: 'Departments' },
          { key: 'collegeAcadYear', label: 'Academic Year' }
        ]
      },
      {
        group: 'Curriculum',
        items: [
          { key: 'subjects', label: 'Subjects' },
          { key: 'addCourse', label: 'Courses' },
          { key: 'subjectCourse', label: 'Subject Courses' },
          { key: 'subjectElec', label: 'Electives' }
        ]
      },
      {
        group: 'People',
        items: [
          { key: 'masterStudent', label: 'Students' },
          { key: 'masterTeacher', label: 'Teachers' },
          { key: 'subjectTeacher', label: 'Subject-Teacher' },
          { key: 'teacherAvailability', label: 'Teacher Availability' }
        ]
      },
      {
        group: 'Operations',
        items: [
          { key: 'courseRegistration', label: 'Course Registration' },
          { key: 'courseOffering', label: 'Course Offering' },
          { key: 'classroomManager', label: 'Classrooms' },
          { key: 'deviceManager', label: 'Devices' }
        ]
      },
      {
        group: 'Routines',
        items: [
          { key: 'dailyRoutine', label: 'Daily Routines' },
          { key: 'examRoutine', label: 'Exam Routine' }
        ]
      },
      {
        group: 'Reports',
        items: [
          ...(isAdmin ? [{ key: 'CollegeAttendenceManager', label: 'College Attendance' }] : []),
          ...(isAdmin ? [{ key: 'EmployeeAttendanceManager', label: 'Employee Attendance' }] : []),
          { key: 'examResult', label: 'Exam Results' }
        ]
      }
    ];

    const home = { key: 'home', label: 'Home' };
    const menu = { key: 'menu', label: 'Menus' };
    const logout = { key: 'logout', label: 'Logout' };

    const q = query.trim().toLowerCase();
    const match = (txt) => (!q || String(txt).toLowerCase().includes(q));

    const filterLeaf = (item) => vis(item.key) && match(`${item.label} ${item.key}`);

    const filteredGroups = groups
      .map(g => ({ ...g, items: g.items.filter(filterLeaf) }))
      .filter(g => g.items.length > 0);

    const filteredHome = vis(home.key) && match('home');
    const filteredMenu = vis(menu.key) && match(`${menu.label} ${menu.key}`);
    const filteredLogout = vis(logout.key) && match('logout');

    return { filteredGroups, filteredHome, filteredMenu, filteredLogout, home, menu, logout };
  }, [isAdmin, isStudent, isTeacher, query]);

  const toggleGroup = (name) =>
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }));

  const Leaf = ({ item }) => (
    <button
      style={styles.leafBtn(activeTab === item.key)}
      onClick={item.key === 'logout'
        ? handleLogout
        : () => setActiveTab(item.key)
      }
      title={item.label}
    >
      <Icon name={MATERIAL_ICONS[item.key] || 'circle'} />
      <span>{item.label}</span>
    </button>
  );

  const Group = ({ group, items }) => {
    const open = !!openGroups[group];
    return (
      <div style={styles.group}>
        <div style={styles.groupHeader(open)} onClick={() => toggleGroup(group)}>
          <div style={styles.groupHeaderLeft}>
            <Icon name={GROUP_ICONS[group] || 'folder'} />
            <span>{group}</span>
          </div>
          <span style={styles.caret(open)}>▶</span>
        </div>
        {open && (
          <div style={styles.groupBody}>
            {items.map(it => <Leaf key={it.key} item={it} />)}
          </div>
        )}
      </div>
    );
  };

  // ===== KPI computations from summaries =====
  const kpiStudentPresent = useMemo(() => sum(studentSummary, 'present'), [studentSummary]);
  const kpiStudentAbsent  = useMemo(() => sum(studentSummary, 'absent'),  [studentSummary]);
  const kpiEmployeePresent = useMemo(() => sum(employeeSummary, 'present'), [employeeSummary]);

  /* ===== NEW: Monthly student attendance pie (Present vs Absent) ===== */
  const monthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const monthRows = useMemo(
    () => studentSummary.filter(r => String(r?.day || '').startsWith(monthKey)),
    [studentSummary, monthKey]
  );
  const monthPresent = useMemo(() => sum(monthRows, 'present'), [monthRows]);
  const monthAbsent  = useMemo(() => sum(monthRows, 'absent'),  [monthRows]);
  const monthTotal   = monthPresent + monthAbsent;

  const attPieData = useMemo(() => ({
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [monthPresent, monthAbsent],
        // Blue for Present, Red for Absent
        backgroundColor: ['#2563eb', '#ef4444'],
        borderColor: ['#1d4ed8', '#b91c1c'],
        borderWidth: 1
      }
    ]
  }), [monthPresent, monthAbsent]);

  const attPieOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed || 0;
            const pct = monthTotal ? ((val * 100) / monthTotal).toFixed(1) : '0.0';
            return `${ctx.label}: ${pct}% (${val})`;
          }
        }
      },
      title: { display: false }
    }
  }), [monthTotal]);

  return (
    <div style={styles.layout}>
      {/* ======= SIDEBAR ======= */}
      <nav style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>Dashboard</div>
          <div style={styles.rolePill}>{displayRole}</div>
        </div>

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}><Icon name="search" /></span>
          <input
            style={styles.searchInput}
            placeholder="Search menu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <ul style={styles.menuList}>
          {ALL_GROUPS.filteredHome && (
            <li>
              <button
                style={{
                  ...styles.homeItem,
                  outline: activeTab === 'home' ? '2px solid #2563eb' : 'none'
                }}
                onClick={() => setActiveTab('home')}
              >
                <Icon name={MATERIAL_ICONS.home} />
                <span>Home</span>
              </button>
            </li>
          )}

          {ALL_GROUPS.filteredMenu && (
            <li>
              <button
                style={styles.leafBtn(activeTab === 'menu')}
                onClick={() => setActiveTab('menu')}
                title="Menus"
              >
                <Icon name={MATERIAL_ICONS.menu} />
                <span>Menus</span>
              </button>
            </li>
          )}

          {ALL_GROUPS.filteredGroups.map(g => (
            <li key={g.group}>
              <Group group={g.group} items={g.items} />
            </li>
          ))}

          {ALL_GROUPS.filteredLogout && (
            <li>
              <Leaf item={ALL_GROUPS.logout} />
            </li>
          )}
        </ul>
      </nav>

      {/* ======= MAIN ======= */}
      <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">🎓 School Management Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {userName}! You are logged in as <b>{displayRole}</b>.
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-slate-200 p-5">
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">📊 Overview</h2>
              </div>

              {/* Top counters - hidden for students */}
              {!isStudent && (
                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[120px] flex-1 rounded-lg bg-indigo-50 border border-indigo-100 p-4 text-center">
                    <div className="text-3xl font-extrabold text-indigo-600">{students.length}</div>
                    <div className="text-sm text-slate-700 mt-1">Students</div>
                  </div>
                  <div className="min-w-[120px] flex-1 rounded-lg bg-amber-50 border border-amber-100 p-4 text-center">
                    <div className="text-3xl font-extrabold text-amber-600">{teachers.length}</div>
                    <div className="text-sm text-amber-700 mt-1">Teachers</div>
                  </div>
                </div>
              )}

              {/* OLD pie hidden for students; remains for admin/teacher */}
              {!hideCharts && !isStudent && (
                <div className="h-56">
                  {pieData ? (
                    <Pie
                      data={pieData}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: true, position: 'bottom' }, title: { display: false } },
                        maintainAspectRatio: false
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      Loading pie chart...
                    </div>
                  )}
                </div>
              )}

              {/* Attendance header + range pickers */}
              <div className="flex flex-wrap items-end gap-3">
                <h3 className="text-base font-semibold text-slate-800">
                  {isStudent ? '🗓️ Your Attendance (Daily) — Summary' : '🗓️ Attendance (Daily) — Summary'}
                </h3>
                {isStudent && (
                  <div className="text-xs text-slate-600 bg-slate-50 ring-1 ring-slate-200 rounded-md px-2 py-1">
                    Viewing as: <b>{studentName || 'Student'}</b>
                    {studentSection ? <> • Section <b>{studentSection}</b></> : null}
                    {studentSemester ? <> • Semester <b>{studentSemester}</b></> : null}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-indigo-50 rounded-md px-3 py-2 ring-1 ring-indigo-100">
                    <span className="text-xs text-slate-700">Start</span>
                    <input
                      id="attStart"
                      type="date"
                      value={attStart}
                      onChange={(e) => setAttStart(e.target.value)}
                      className="rounded border border-indigo-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                  <label className="flex items-center gap-2 bg-indigo-50 rounded-md px-3 py-2 ring-1 ring-indigo-100">
                    <span className="text-xs text-slate-700">End</span>
                    <input
                      id="attEnd"
                      type="date"
                      value={attEnd}
                      onChange={(e) => setAttEnd(e.target.value)}
                      className="rounded border border-indigo-200 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </label>
                </div>
              </div>

              {/* KPI tiles */}
              <div className={`grid gap-4 ${!isStudent ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'}`}>
                <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                  <div className="text-xs text-cyan-800 mb-1">{isStudent ? 'You Present' : 'Student Present'}</div>
                  <div className="text-2xl font-extrabold text-cyan-800">{kpiStudentPresent}</div>
                  <div className="text-xs text-slate-600 mt-1">{attStart} → {attEnd}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs text-amber-800 mb-1">{isStudent ? 'You Absent' : 'Student Absent'}</div>
                  <div className="text-2xl font-extrabold text-amber-800">{kpiStudentAbsent}</div>
                  <div className="text-xs text-slate-600 mt-1">{attStart} → {attEnd}</div>
                </div>

                {!isStudent && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="text-xs text-emerald-800 mb-1">Employee Present</div>
                    <div className="text-2xl font-extrabold text-emerald-800">{kpiEmployeePresent}</div>
                    <div className="text-xs text-slate-600 mt-1">{attStart} → {attEnd}</div>
                  </div>
                )}
              </div>

              {/* Summary tables + NEW student monthly pie beside it */}
              <div className={`grid gap-4 ${!isStudent ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-2">{isStudent ? 'Your Summary (per day)' : 'Student Summary (per day)'}</h4>
                  <div className="max-h-60 overflow-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-700 text-left">
                        <tr>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium text-center">Present</th>
                          <th className="px-3 py-2 font-medium text-center">Absent</th>
                          <th className="px-3 py-2 font-medium text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSummary.map((r, idx) => (
                          <tr key={r.day} className={idx % 2 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-3 py-2 border-t border-slate-100">{r.day}</td>
                            <td className="px-3 py-2 border-t border-slate-100 text-green-600 font-semibold text-center">{r.present}</td>
                            <td className="px-3 py-2 border-t border-slate-100 text-red-600 font-semibold text-center">{r.absent}</td>
                            <td className="px-3 py-2 border-t border-slate-100 text-center">{r.total}</td>
                          </tr>
                        ))}
                        {studentSummary.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-slate-500 text-center">No data for selected range.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* NEW: Only for students — Monthly attendance pie (Present blue, Absent red) */}
                {isStudent ? (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Your Attendance — This Month</h4>
                    <div className="h-60 rounded-lg border border-slate-200 bg-white p-3">
                      <Pie data={attPieData} options={attPieOptions} />
                      <div className="text-center text-xs text-slate-600 mt-2">
                        Present: <b>{monthPresent}</b> • Absent: <b>{monthAbsent}</b> • Total: <b>{monthTotal}</b>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* For non-students, keep the existing employee table in this slot */
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 mb-2">Employee Summary (per day)</h4>
                    <div className="max-h-60 overflow-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-700 text-left">
                          <tr>
                            <th className="px-3 py-2 font-medium">Date</th>
                            <th className="px-3 py-2 font-medium text-center">Present</th>
                            <th className="px-3 py-2 font-medium text-center">Absent</th>
                            <th className="px-3 py-2 font-medium text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeSummary.map((r, idx) => (
                            <tr key={r.day} className={idx % 2 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="px-3 py-2 border-t border-slate-100">{r.day}</td>
                              <td className="px-3 py-2 border-t border-slate-100 text-green-600 font-semibold text-center">{r.present}</td>
                              <td className="px-3 py-2 border-t border-slate-100 text-red-600 font-semibold text-center">{r.absent}</td>
                              <td className="px-3 py-2 border-t border-slate-100 text-center">{r.total}</td>
                            </tr>
                          ))}
                          {employeeSummary.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-3 py-3 text-slate-500 text-center">No data for selected range.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Chart — HIDDEN when hideCharts=true */}
              {chartError && !hideCharts && (
                <div className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  {chartError}
                </div>
              )}
              {!hideCharts && (
                <div className="h-72">
                  {chartData ? (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: true }, title: { display: false } },
                        maintainAspectRatio: false
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      Loading chart...
                    </div>
                  )}
                </div>
              )}

              {/* Today’s Updated Routine */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-slate-800">🗓️ Today’s Updated Routine</h3>

                  {todayCounts.total != null && (
                    <span className="text-xs rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700">
                      Total Today: <b>{todayCounts.total}</b>
                    </span>
                  )}
                  {todayCounts.updated != null && (
                    <span className="text-xs rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-indigo-800">
                      Updated Today: <b>{todayCounts.updated}</b>
                    </span>
                  )}

                  <span className="ml-auto text-xs text-slate-500">
                    {todayDate ? `Date: ${todayDate}` : ''}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Subject</th>
                        <th className="px-3 py-2 font-medium">Classroom</th>
                        <th className="px-3 py-2 font-medium">Semester</th>
                        <th className="px-3 py-2 font-medium">Section</th>
                        {/* Hide Teacher and Updated At columns for students */}
                        {!isStudent && <th className="px-3 py-2 font-medium">Teacher</th>}
                        {!isStudent && <th className="px-3 py-2 text-left font-medium">Updated At</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {todayRtLoading && (
                        <tr>
                          <td colSpan={isStudent ? 5 : 7} className="px-3 py-3 text-slate-500 text-center">
                            Loading today’s updated routine...
                          </td>
                        </tr>
                      )}

                      {!todayRtLoading && todayRoutines.map((r, idx) => (
                        <tr key={r.routineid ?? `${r.drsubjid}-${r.drclassroomid}-${idx}`} className={idx % 2 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="px-3 py-2 border-t border-slate-100 text-left">
                            {(r._from || r._to) ? `${r._from ?? ''} – ${r._to ?? ''}` : ((r.drfrom || r.drto) ? `${r.drfrom ?? ''} – ${r.drto ?? ''}` : '—')}
                          </td>
                          <td className="px-3 py-2 border-t border-slate-100 text-center">{r._subject ?? r.drsubjid ?? '—'}</td>
                          <td className="px-3 py-2 border-t border-slate-100 text-center">{r._room ?? r.drclassroomid ?? '—'}</td>
                          <td className="px-3 py-2 border-t border-slate-100 text-center">{r._semester ?? r.stu_curr_semester ?? '—'}</td>
                          <td className="px-3 py-2 border-t border-slate-100 text-center">{r._section ?? r.stu_section ?? '—'}</td>
                          {/* Hide Teacher and Updated At columns for students */}
                          {!isStudent && (
                            <td className="px-3 py-2 border-t border-slate-100 text-center">{r._teacher ?? r.drclassteacherid ?? '—'}</td>
                          )}
                          {!isStudent && (
                            <td className="px-3 py-2 border-t border-slate-100 text-left text-slate-600">
                              {r._updated ? new Date(r._updated).toLocaleString() : (r.updatedat ? new Date(r.updatedat).toLocaleString() : '—')}
                            </td>
                          )}
                        </tr>
                      ))}

                      {!todayRtLoading && todayRoutines.length === 0 && (
                        <tr>
                          <td colSpan={isStudent ? 5 : 7} className="px-3 py-3 text-slate-500 text-center">
                            {todayRtError || 'No updates today.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Pages */}
          {activeTab === 'menu' && <MenuManager readOnly={isStudent} />}
          {activeTab === 'manageUser' && <Manageuser readOnly={isStudent} users={users} />}
          {activeTab === 'userRole' && <UserRole readOnly={isStudent} roles={userRoles} />}
          {activeTab === 'MasterRole' && <MasterRole readOnly={isStudent} />}

          {activeTab === 'addCollege' && <AddCollege readOnly={isStudent} />}
          {activeTab === 'addGroup' && <CollegeGroupManager readOnly={isStudent} />}
          {activeTab === 'department' && <SubjectDepartement readOnly={isStudent} />}
          {activeTab === 'collegeAcadYear' && <CollegeAcadYear readOnly={isStudent} />}

          {activeTab === 'subjects' && <MasterSubject readOnly={isStudent} />}
          {activeTab === 'addCourse' && <AddCourse readOnly={isStudent} />}
          {activeTab === 'subjectCourse' && <SubjectCourse readOnly={isStudent} />}
          {activeTab === 'subjectElec' && <SubjectElec readOnly={isStudent} />}

          {activeTab === 'masterStudent' && <MasterStudent readOnly={isStudent} students={students} />}
          {activeTab === 'masterTeacher' && <MasterTeacher readOnly={isStudent} teachers={teachers} />}
          {activeTab === 'subjectTeacher' && <SubjectTeacher readOnly={isStudent} />}
          {activeTab === 'teacherAvailability' && <TeacherAvailabilityManager readOnly={isStudent} />}
          {activeTab === 'courseRegistration' && <CourseRegistrationManager readOnly={isStudent} />}
          {activeTab === 'courseOffering' && <CourseOfferingManager readOnly={isStudent} />}
          {activeTab === 'classroomManager' && <ClassroomManager readOnly={isStudent} />}
          {activeTab === 'dailyRoutine' && <DailyRoutine readOnly={isStudent} />}
          {activeTab === 'examRoutine' && <ExamRoutineManager readOnly={isStudent} />}

          {/* CollegeAttendance page hidden for students via menu gating; still guard readOnly */}
          {activeTab === 'CollegeAttendenceManager' && <CollegeAttendenceManager readOnly={isStudent} />}

          {/* EmployeeAttendance page is admin only */}
          {activeTab === 'EmployeeAttendanceManager' && <EmployeeAttendanceManager readOnly={isStudent} />}

          {activeTab === 'examResult' && <ExamResult readOnly={isStudent} />}

          {/* NEW 👉 Devices page mount */}
          {activeTab === 'deviceManager' && <SmsDeviceManager readOnly={isStudent} />}
        </div>
      </div>
    </div>
  );
}
