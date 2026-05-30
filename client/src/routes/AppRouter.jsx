import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';

import Login    from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import NotFound from '../pages/NotFound.jsx';

import StudentLayout from '../layouts/StudentLayout.jsx';
import TeacherLayout from '../layouts/TeacherLayout.jsx';
import AdminLayout   from '../layouts/AdminLayout.jsx';

import StudentDashboard  from '../pages/student/Dashboard.jsx';
import CourseView        from '../pages/student/CourseView.jsx';
import SubmitAssignment  from '../pages/student/SubmitAssignment.jsx';

import TeacherDashboard  from '../pages/teacher/Dashboard.jsx';
import CourseManage      from '../pages/teacher/CourseManage.jsx';
import AssignmentCreate  from '../pages/teacher/AssignmentCreate.jsx';
import SubmissionsList   from '../pages/teacher/SubmissionsList.jsx';
import EvaluationView    from '../pages/teacher/EvaluationView.jsx';
import Analytics         from '../pages/teacher/Analytics.jsx';

import AdminDashboard    from '../pages/admin/Dashboard.jsx';
import EnrollmentManager from '../pages/admin/EnrollmentManager.jsx';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/"         element={<Navigate to="/login" replace />} />

      {/* Student */}
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

      {/* Teacher */}
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

      {/* Admin */}
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
      </Route>

      {/* 404 — replaces silent redirect to login */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;