import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Authentication'; 
import SignIn from './pages/sign-in/SignIn';

// --- ADMIN PAGES ---
import Dashboard from './pages/dashboard/Dashboard';
import Student from './pages/students/Student';
import Payment from './pages/payment/Payment';
import Register from './pages/register/Register';
import Users from './pages/users/Users';
import Subject from './pages/subjects/Subject';

// --- TEACHER PAGES ---
import Assessments from './pages/teacher-portal/Assessments';
import TeacherAnalytics from './pages/teacher-portal/TeacherAnalytics';
// --- STUDENT PAGES ---
import Academics from './pages/student-portal/Academics';
import Finance from './pages/student-portal/Finance';

// --- ROLE-BASED ROUTE GUARD ---
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // 1. Not logged in? Send to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in, but wrong role? Send back to root (which redirects to their proper dashboard)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. Authorized! Render the page.
  return children;
};

// --- DYNAMIC ROOT REDIRECTOR ---
// When a user logs in and goes to "/", this decides where they should land.
const RootRedirect = () => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/grading" replace />;
  if (user.role === 'student') return <Navigate to="/student/academics" replace />;
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<SignIn />} />

          {/* Root Redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* ==========================================
              ADMIN ROUTES
          ========================================== */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
          <Route path="/student" element={<ProtectedRoute allowedRoles={['admin']}><Student /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute allowedRoles={['admin']}><Payment /></ProtectedRoute>} />
          <Route path="/subject" element={<ProtectedRoute allowedRoles={['admin']}><Subject /></ProtectedRoute>} />

          {/* ==========================================
              SHARED ROUTES (Admin & Teacher)
          ========================================== */}
          <Route path="/register" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Register /></ProtectedRoute>} />

          {/* ==========================================
              TEACHER ROUTES
          ========================================== */}
          <Route path="/teacher/assessments" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Assessments /></ProtectedRoute>} />
         <Route path="/teacher/analytics" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><TeacherAnalytics /></ProtectedRoute>} />

          {/* ==========================================
              STUDENT ROUTES
          ========================================== */}
          <Route path="/student/academics" element={<ProtectedRoute allowedRoles={['student']}><Academics /></ProtectedRoute>} />
          <Route path="/student/finance" element={<ProtectedRoute allowedRoles={['student']}><Finance /></ProtectedRoute>} />

          {/* Catch-all: Redirect unknown URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;