import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

// Auth pages
import Login    from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';

// Layouts
import StudentLayout from '../layouts/StudentLayout.jsx';
import TeacherLayout from '../layouts/TeacherLayout.jsx';
import AdminLayout   from '../layouts/AdminLayout.jsx';

// Student pages
import StudentDashboard    from '../pages/student/Dashboard.jsx';
import CourseView          from '../pages/student/CourseView.jsx';
import SubmitAssignment    from '../pages/student/SubmitAssignment.jsx';

// Teacher pages
import TeacherDashboard    from '../pages/teacher/Dashboard.jsx';
import CourseManage        from '../pages/teacher/CourseManage.jsx';
import AssignmentCreate    from '../pages/teacher/AssignmentCreate.jsx';
import SubmissionsList     from '../pages/teacher/SubmissionsList.jsx';
import EvaluationView      from '../pages/teacher/EvaluationView.jsx';
import Analytics           from '../pages/teacher/Analytics.jsx';

// Admin pages
import AdminDashboard      from '../pages/admin/Dashboard.jsx';
import EnrollmentManager   from '../pages/admin/EnrollmentManager.jsx';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"                        element={<StudentDashboard />} />
        <Route path="courses/:courseId"                element={<CourseView />} />
        <Route path="assignments/:assignmentId/submit" element={<SubmitAssignment />} />
      </Route>

      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute role="teacher">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"                                   element={<TeacherDashboard />} />
        <Route path="courses/:courseId"                           element={<CourseManage />} />
        <Route path="courses/:courseId/assignments/create"        element={<AssignmentCreate />} />
        <Route path="courses/:courseId/assignments/:assignmentId" element={<AssignmentCreate />} />
        <Route path="assignments/:assignmentId/submissions"       element={<SubmissionsList />} />
        <Route path="submissions/:submissionId/evaluate"          element={<EvaluationView />} />
        <Route path="courses/:courseId/analytics"                 element={<Analytics />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard"   element={<AdminDashboard />} />
        <Route path="enrollments" element={<EnrollmentManager />} />
        <Route path="users"   element={<AdminDashboard />} />
        <Route path="courses" element={<AdminDashboard />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRouter;