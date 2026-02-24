import './App.css';
import React from 'react';
import Dashboard from './pages/dashboard/Dashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './Authentication'; // Import your authentication context :contentReference[oaicite:0]{index=0}&#8203;:contentReference[oaicite:1]{index=1}
import SignIn from './pages/sign-in/SignIn';
// Import any other components for additional routes
import Student from './pages/students/Student';
import Payment from './pages/payment/Payment';
import Register from './pages/register/Register';
import Users from './pages/users/Users';
import Subject from './pages/subjects/Subject';

// --- PRIVATE ROUTE WRAPPER ---
const PrivateRoute = ({ children }) => {
  // We use 'user' to check if logged in (derived from the Token)
  const { user } = useAuth();

  // If user is null, redirect to login
  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<SignIn />} />

          {/* Protected Routes */}
          
          {/* Root Route: You can redirect this to /dashboard or /student based on role later */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Student />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/student"
            element={
              <PrivateRoute>
                <Student />
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />

          <Route
            path="/payment"
            element={
              <PrivateRoute>
                <Payment />
              </PrivateRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PrivateRoute>
                <Register />
              </PrivateRoute>
            }
          />

          <Route
            path="/subject"
            element={
              <PrivateRoute>
                <Subject />
              </PrivateRoute>
            }
          />

          {/* Catch-all: Redirect unknown URLs to Login */}
          <Route path="*" element={<Navigate to="/login" />} />
          
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;