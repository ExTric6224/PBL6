import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import AxiosSetup from './components/AxiosSetup';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OtpRegister from './components/Auth/OtpRegister';
import ForgotPassword from './components/Auth/ForgotPassword';
import ChangePassword from './components/Auth/ChangePassword';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation/Navigation';
import PermissionDashboard from './components/Permissions/PermissionDashboard';
import PostList from './components/Posts/PostList';
import PostDetail from './components/Posts/PostDetail';
import ScheduleList from './components/Schedules/ScheduleList';
import ScheduleDetail from './components/Schedules/ScheduleDetail';
import BookingList from './components/Bookings/BookingList';
import BookingDetail from './components/Bookings/BookingDetail';
import FeedbackForm from './components/Feedbacks/FeedbackForm';
import ProfileForm from './components/Profile/ProfileForm';
import PublicProfile from './components/Profile/PublicProfile';
import SessionList from './components/Sessions/SessionList';
import SessionDetail from './components/Sessions/SessionDetail';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminUserManagement from './components/Admin/AdminUserManagement';
import AdminPermissionManagement from './components/Admin/AdminPermissionManagement';
import AdminUserPermissions from './components/Admin/AdminUserPermissions';
import AdminPostManagement from './components/Admin/AdminPostManagement';
import AdminBookingManagement from './components/Admin/AdminBookingManagement';
import AdminScheduleManagement from './components/Admin/AdminScheduleManagement';
import AdminSessionManagement from './components/Admin/AdminSessionManagement';
import AdminFeedbackManagement from './components/Admin/AdminFeedbackManagement';
import './App.css';

function App() {
  return (
    <ErrorProvider>
      <AuthProvider>
        <Router>
          <AxiosSetup />
          <div className="App">
          <Routes>
            {/* Public routes - No navigation */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-otp" element={<OtpRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes - With navigation */}
            <Route 
              path="/change-password" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <ChangePassword />
                  </>
                </ProtectedRoute>
              } 
            />
            
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
              path="/posts/:id" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <PostDetail />
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
              path="/schedules/:id" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <ScheduleDetail />
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
              path="/bookings/:id" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <BookingDetail />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <SessionList />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/sessions/:id" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <SessionDetail />
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
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <PublicProfile />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminDashboard />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminUserManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/posts" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminPostManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/schedules" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminScheduleManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/bookings" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminBookingManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/sessions" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminSessionManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/feedbacks" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminFeedbackManagement />
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
                    <AdminPermissionManagement />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/users/:userId/permissions" 
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <AdminUserPermissions />
                  </>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/permissions" 
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
    </ErrorProvider>
  );
}

export default App;