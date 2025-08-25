// src/middleware_config.js

const config = {
  // ===================== Server Configuration =====================
  PORT: import.meta.env.VITE_PORT || 9090, // Use default if not provided
  BASE_URL: import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app', // Use default for BASE_URL
  API_PREFIX: import.meta.env.VITE_API_PREFIX || '/api', // Default to /api for API prefix

  // ===================== Auth & Login =====================
  LOGIN_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/login`,

  // ===================== Master Routes =====================
  COLLEGES_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/master-college`,
  MASTER_USER_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}`,
  COLLEGE_GROUP_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/college-group`,
  COURSE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/course`,
  SUBJECT_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/subject`,
  STUDENT_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/student`,
  TEACHER_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/teacher`,
  MASTER_DEPTS_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/master-depts`,
  MASTER_ACADYEAR_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/master-acadyear`,
  SUBJECT_COURSE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/subject-course`,
  MENU_MASTER_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/menu-master`,
  SUBJECT_TEACHER_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/subject-teacher`,
  USER_ROLE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/user-role`,
  MASTER_ROLE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/master-role`,
  DAILY_ROUTINE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/daily-routine`,
  CLASS_ROOM_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/class-room`,
  TEACHER_AVAILABILITY_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/teacher-availability-manager`,
  COLLEGE_DAILY_ROUTINE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/college-daily-routine`,
  COURSE_OFFERING_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/course-offering`,
  COURSE_REGISTRATION_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/course-registration`,
  COLLEGE_EXAM_ROUTINE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/college-exam-routine`,
  SUBJECT_ELECTIVE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/subject-elective`,
  EXAM_ROUTINE_MANAGER_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/exam-routine-manager`,
  COLLEGE_ATTENDANCE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/CollegeAttendenceManager`,
  EMPLOYEE_ATTENDANCE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/employee-attendance`,
  EXAM_RESULT_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/exam-result`,
  DASHBOARD_FETCHING_ID: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/student/list`,
  CHART_DATA_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/chart-data`,
  CALENDAR_ATTENDANCE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/calendar-attendance`,
  SMS_DEVICE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/sms-device`,

  // ===================== Finance (Fee/Payments) Routes =====================
  FIN_UI_FEE_STRUCTURE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/cms-fee-structure`,
  FIN_UI_PAYMENTS_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/cms-payments`,
  FIN_UI_STUDENT_FEE_INVOICE_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/cms-student-fee-invoice`,
  FIN_UI_STUDENT_SCHOLARSHIP_ROUTE: `${import.meta.env.VITE_BASE_URL || 'https://powerangers-zeo.vercel.app'}${import.meta.env.VITE_API_PREFIX || '/api'}/cms-stu-scholarship`,
};

export default config;
