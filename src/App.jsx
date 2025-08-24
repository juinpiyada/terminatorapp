// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AddCollege from './components/AddCollege.jsx';
import AddCourse from './components/AddCourse.jsx';
import CollegeGroupManager from './pages/CollageGroup/CollegeGroupManager.jsx';
import Manageuser from './pages/User/Manageuser.jsx';
import MasterStudent from './pages/Student/MasterStudent.jsx'; // ✅ Corrected path and name
import MasterSubject from './pages/Subject/MasterSubject.jsx';
import MasterTeacher from './pages/Teacher/MasterTeacher.jsx';
import MasterDepts from './pages/Department/MasterDepts.jsx';
import UserRole from './pages/User/UserRole.jsx';
import TeacherAvailabilityManager from './pages/TeacherAvailabilityManager/TeacherAvailabilityManager.jsx';
import ExamRoutineManager from './pages/ExamRoutineManager/ExamRoutineManager.jsx';
import CourseRegistrationManager from './pages/CourseRegistrationManager/CourseRegistrationManager.jsx';
import CourseOfferingManager from './pages/CourseOfferingManager/CourseOfferingManager.jsx';
import DailyRoutine from './pages/DailyRoutine/DailyRoutine.jsx'; // ✅ Added DailyRoutine import
import ClassroomManager from './pages/classroom/ClassroomManager.jsx'; // Assuming you have this component
import MenuManager from './pages/menu/MenuManager';
import MasterRole from './pages/User/MasterRole.jsx';
import CollegeAttendenceManager from './pages/attendance/AttendanceManager.jsx';
import EmployeeAttendanceManager from './pages/attendance/EmployeeAttendance.jsx'; // ✅ Added EmployeeAttendanceManager import
import ExamResult from './pages/result/ExamResult.jsx'; // ✅ Added ExamResult import
import SmsDeviceManager from "./pages/device/SmsDeviceManager.jsx";
import FeeStructureManager from "./pages/cms-fin/FeeStructure.jsx"; // ✅ Added FeeStructureManager import
import PaymentManager from "./pages/cms-fin/Payment.jsx"; // Assuming you have this component
import StudentFeelInvoiceManager from "./pages/cms-fin/StudentFeeInvoice.jsx"; // Assuming you have this component
import StuScholarshipManager from "./pages/cms-fin/StuScholarship.jsx"; // Assuming you have this component
import FinDashbordManager from "./pages/cms-fin/FinDashbord.jsx"; // Assuming you have this component

export default function App() {
  return (
    <Router>
      <div
        style={{
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          minHeight: '100vh'
        }}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-college" element={<AddCollege />} />
          <Route path="/add-course" element={<AddCourse />} />
          <Route path="/college-group-manager" element={<CollegeGroupManager />} />
          <Route path="/manage-user" element={<Manageuser />} />
          <Route path="/master-student" element={<MasterStudent />} />
          <Route path="/master-subject" element={<MasterSubject />} />
          <Route path="/master-teacher" element={<MasterTeacher />} />
          <Route path="/master-depts" element={<MasterDepts />} />
          <Route path='/user-role' element={<UserRole />} />
          <Route path="/teacher-availability-manager" element={<TeacherAvailabilityManager />} />
          <Route path="/exam-routine-manager" element={<ExamRoutineManager />} />
          <Route path="/course-registration-manager" element={<CourseRegistrationManager />} />
          <Route path="/course-offering" element={<CourseOfferingManager />} />
          <Route path="/daily-routine" element={<DailyRoutine />} /> {/* ✅ Added DailyRoutine route */}
          <Route path="/class-room" element={<ClassroomManager />} /> {/* Assuming you have this component */}
          <Route path="/course-registration" element={<CourseRegistrationManager />} />
          <Route path="/menu" element={<MenuManager />} />
          <Route path="/master-role" element={<MasterRole />} /> {/* ✅ Added MasterRole route */}
          <Route path="/CollegeAttendenceManager" element={<CollegeAttendenceManager />} /> {/* ✅ Added CollegeAttendenceManager route */}
          <Route path="/employee-attendance" element={<EmployeeAttendanceManager />} /> {/* ✅ Added EmployeeAttendance route */}
          <Route path="/exam-result" element={<ExamResult />} /> {/* ✅ Added ExamResult route */}
          <Route path="/sms-device" element={<SmsDeviceManager />} /> {/* ✅ Added SmsDeviceManager route */}
          <Route path="/cmsFeeStructure" element={<FeeStructureManager />} /> {/* ✅ Added FeeStructureManager route */}
          <Route path="/cmsPayments" element={<PaymentManager />} /> {/* Assuming you have this component */}
          <Route path="/cmsStuFeeInvoice" element={<StudentFeelInvoiceManager />} /> {/* Assuming you have this component */}
          <Route path="/cmsStuScholarship" element={<StuScholarshipManager />} /> {/* Assuming you have this component */}
          <Route path="/finDashbord" element={<FinDashbordManager />} /> {/* Assuming you have this component */}

        </Routes>
      </div>
    </Router>
  );
}