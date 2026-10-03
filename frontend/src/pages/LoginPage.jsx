import React, { useState } from 'react';
import { GraduationCap, ShieldCheck, UserCheck, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      name: 'Rahul Sharma',
      role: 'STUDENT',
      email: 'rahul@college.edu',
      password: 'student123',
      dept: 'Computer Science (Roll: 2024-CS-042)',
      icon: <GraduationCap size={20} color="#3b82f6" />,
      desc: 'Applies for leaves and tracks status'
    },
    {
      name: 'Prof. Arvind Kumar',
      role: 'TUTOR',
      email: 'arvind@college.edu',
      password: 'tutor123',
      dept: 'Class Tutor (CSE)',
      icon: <UserCheck size={20} color="#a855f7" />,
      desc: 'Conducts physical verification & forwards'
    },
    {
      name: 'Dr. K. Ramanathan',
      role: 'PRINCIPAL',
      email: 'principal@college.edu',
      password: 'principal123',
      dept: 'Institutional Head',
      icon: <ShieldCheck size={20} color="#eab308" />,
      desc: 'Final sanction authority & notifications'
    }
  ];

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(email, password);
      localStorage.setItem('lms_token', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc) => {
    setError('');
    setLoading(true);
    try {
      const res = await api.login(acc.email, acc.password);
      localStorage.setItem('lms_token', res.token);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '960px', width: '100%', background: '#ffffff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        
        {/* Left Side: Brand & Quick Demo Persona Login */}
        <div style={{ padding: '40px 32px', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', color: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}>
                <GraduationCap size={26} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  LeaveFlow
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Academic Leave & Verification Engine</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#a5b4fc', fontWeight: 600, marginBottom: '8px' }}>
                <Sparkles size={16} />
                <span>Select Demo Persona (Instant 1-Click Sign In)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Experience the exact Role-Based Access Control (RBAC) flow across Student, Tutor, and Principal.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {demoAccounts.map(acc => (
                <div 
                  key={acc.role}
                  onClick={() => handleQuickLogin(acc)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '14px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '10px', borderRadius: '10px' }}>
                      {acc.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{acc.dept}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{acc.desc}</div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px', borderRadius: '50%' }}>
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '28px', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
            Built with Node.js &bull; SQLite &bull; React &bull; RBAC Engine
          </div>
        </div>

        {/* Right Side: Manual Credentials Login */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Sign In with Credentials
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px' }}>
            Enter your college email and password to access your role-specific dashboard.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleManualLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
            <strong>Demo Credentials:</strong>
            <ul style={{ paddingLeft: '18px', marginTop: '6px', lineHeight: '1.5' }}>
              <li>Student: <code>rahul@college.edu</code> / <code>student123</code></li>
              <li>Tutor: <code>arvind@college.edu</code> / <code>tutor123</code></li>
              <li>Principal: <code>principal@college.edu</code> / <code>principal123</code></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
