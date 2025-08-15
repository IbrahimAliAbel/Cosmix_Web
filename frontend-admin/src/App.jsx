import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './admin-dashboard';
import UserDashboard from './user-dashboard';
import LoginPage from './login-dashboard';
import RegisterPage from './register-dashboard'; 
import PaymentSuccess from '../components/PaymentSucces';
import ProtectedRoute from './ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> 

          {/* Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['user']} />}>
          <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/user" element={<UserDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Redirect all unknown routes */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
