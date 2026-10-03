import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  LogOut, 
  Sparkles, 
  Check, 
  UserCheck, 
  ShieldCheck, 
  BookOpen 
} from 'lucide-react';
import { api } from '../../services/api';

export default function Navbar({ currentUser, onSwitchUser, onLogout, notifications, unreadCount, onRefreshNotifications, onNotificationClick }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [personas, setPersonas] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    api.getPersonas()
      .then(res => setPersonas(res.personas || []))
      .catch(err => console.error('Failed to load personas', err));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      onRefreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'STUDENT': return <GraduationCap size={13} />;
      case 'TUTOR': return <UserCheck size={13} />;
      case 'PRINCIPAL': return <ShieldCheck size={13} />;
      default: return <BookOpen size={13} />;
    }
  };

  return (
    <>
      {/* Quick Persona Switcher Bar */}
      <div className="persona-bar">
        <div className="persona-bar-title">
          <Sparkles size={14} color="#a5b4fc" />
          <span>Interactive RBAC Switcher:</span> Test workflow personas with 1-click
        </div>

        <div className="persona-chips">
          {personas.map(p => {
            const isActive = currentUser && currentUser.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSwitchUser(p.id)}
                className={`persona-chip ${isActive ? 'active' : ''}`}
                title={`Switch to ${p.name} (${p.role})`}
              >
                {getRoleIcon(p.role)}
                <span>{p.name.split(' ')[0]}</span>
                <span className={`role-tag ${p.role.toLowerCase()}`}>{p.role}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="brand-icon">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="brand-title">LeaveFlow</div>
            <div className="brand-subtitle">Smart Academic Verification & Leave Governance</div>
          </div>
        </div>

        <div className="nav-actions">
          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              className="notif-bell-btn" 
              onClick={() => setShowDropdown(!showDropdown)}
              title="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {showDropdown && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead}>Mark all read</button>
                  )}
                </div>

                <div className="notif-list">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={async () => {
                          if (!n.is_read) {
                            await api.markRead(n.id);
                            onRefreshNotifications();
                          }
                          if (n.leave_id && onNotificationClick) {
                            onNotificationClick(n.leave_id);
                            setShowDropdown(false);
                          }
                        }}
                      >
                        <div className="notif-icon">
                          {n.title.toLowerCase().includes('approved') ? (
                            <CheckCircle2 size={18} color="#10b981" />
                          ) : n.title.toLowerCase().includes('rejected') ? (
                            <AlertCircle size={18} color="#ef4444" />
                          ) : (
                            <Clock size={18} color="#6366f1" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current User Pill */}
          {currentUser && (
            <div className="user-profile-badge">
              <div className="user-avatar">
                {currentUser.name.charAt(0)}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.name}</span>
                <span className="user-role-label">
                  {currentUser.role} &bull; {currentUser.department}
                </span>
              </div>
            </div>
          )}

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={onLogout}
            title="Log out"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
