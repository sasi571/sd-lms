import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import Navbar from './components/common/Navbar';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './components/student/StudentDashboard';
import TutorDashboard from './components/tutor/TutorDashboard';
import PrincipalDashboard from './components/principal/PrincipalDashboard';
import LeaveDetailsModal from './components/common/LeaveDetailsModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [notifLeaveId, setNotifLeaveId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Load user profile on mount
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('lms_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid token', err);
      localStorage.removeItem('lms_token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch leaves & stats for current user
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [leavesRes, statsRes, notifRes, unreadRes] = await Promise.all([
        api.getLeaves(),
        api.getStats(),
        api.getNotifications(),
        api.getUnreadCount()
      ]);
      setLeaves(leavesRes.leaves || []);
      setStats(statsRes.summary || null);
      setNotifications(notifRes.notifications || []);
      setUnreadCount(unreadRes.unread_count || 0);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
      // Poll notifications every 5 seconds for responsive notifications
      const timer = setInterval(() => {
        api.getUnreadCount().then(r => setUnreadCount(r.unread_count || 0)).catch(() => {});
        api.getNotifications().then(r => setNotifications(r.notifications || [])).catch(() => {});
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [currentUser, refreshData]);

  // Handle switching personas directly from the top bar
  const handleSwitchPersona = async (userId) => {
    try {
      const res = await api.switchPersona(userId);
      localStorage.setItem('lms_token', res.token);
      setCurrentUser(res.user);
      showToast(`Switched view to ${res.user.name} (${res.user.role})`);
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('lms_token');
    setCurrentUser(null);
    setLeaves([]);
    setNotifications([]);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#6366f1', fontWeight: 600 }}>
        Initializing LeaveFlow System...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}! Signed in as ${user.role}.`);
        }} 
      />
    );
  }

  return (
    <div className="app-container">
      <Navbar 
        currentUser={currentUser}
        onSwitchUser={handleSwitchPersona}
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefreshNotifications={refreshData}
        onNotificationClick={(leaveId) => setNotifLeaveId(leaveId)}
      />

      <main className="main-content">
        {currentUser.role === 'STUDENT' && (
          <StudentDashboard 
            user={currentUser}
            leaves={leaves}
            stats={stats}
            onRefresh={() => {
              refreshData();
              showToast('Leave request submitted successfully!');
            }}
          />
        )}

        {currentUser.role === 'TUTOR' && (
          <TutorDashboard 
            user={currentUser}
            leaves={leaves}
            stats={stats}
            onRefresh={() => {
              refreshData();
              showToast('Physical verification recorded & request forwarded to Principal!');
            }}
          />
        )}

        {(currentUser.role === 'PRINCIPAL' || currentUser.role === 'ADMIN') && (
          <PrincipalDashboard 
            user={currentUser}
            leaves={leaves}
            stats={stats}
            onRefresh={() => {
              refreshData();
              showToast('Executive decision recorded & student notified!');
            }}
          />
        )}
      </main>

      {/* Notification → Leave Timeline Modal */}
      <LeaveDetailsModal
        isOpen={!!notifLeaveId}
        leaveId={notifLeaveId}
        onClose={() => setNotifLeaveId(null)}
      />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="toast-banner">
          <CheckCircle2 size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
