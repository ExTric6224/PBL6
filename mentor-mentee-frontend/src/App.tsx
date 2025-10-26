import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OtpRegister from './components/Auth/OtpRegister';
import ForgotPassword from './components/Auth/ForgotPassword';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation/Navigation';
import PermissionDashboard from './components/Permissions/PermissionDashboard';
import PostList from './components/Posts/PostList';
import ScheduleList from './components/Schedules/ScheduleList';
import BookingList from './components/Bookings/BookingList';
import FeedbackForm from './components/Feedbacks/FeedbackForm';
import ProfileForm from './components/Profile/ProfileForm';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - No navigation */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-otp" element={<OtpRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes - With navigation */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/posts" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <PostList />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/schedules" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <ScheduleList />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <BookingList />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/feedback" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <FeedbackForm />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/feedback/create" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <FeedbackForm />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <ProfileForm />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/permissions" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <PermissionDashboard />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;