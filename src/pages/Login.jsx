import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, LogIn, Shield, User } from 'lucide-react';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [role, setRole]         = useState('admin'); // 'admin' | 'employee'
  const [form, setForm]         = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(form.username, form.password, role);
      if (result.success) {
        if (result.role === 'admin') navigate('/dashboard');
        else navigate('/employee/dashboard');
      } else {
        setError(
          role === 'admin'
            ? 'Invalid admin credentials. Try admin / admin123'
            : 'Invalid employee ID or password. Use your Employee ID and password emp123'
        );
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern" />
      <div className="login-card" style={{ maxWidth: 440 }}>

        {/* Logo */}
        <div className="login-logo">
          <img
            src={logo}
            alt="TJÄDERTUPPEN"
            className="login-brand-logo"
          />
          <div className="login-logo-text">
            <h1>TJÄDERTUPPEN</h1>
            <span>Project Management System</span>
          </div>
        </div>

        {/* Role Selector */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 28
        }}>
          <button
            type="button"
            onClick={() => { setRole('admin'); setError(''); setForm({ username: '', password: '' }); }}
            style={{
              flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: role === 'admin' ? 'var(--color-primary)' : 'transparent',
              color: role === 'admin' ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s',
            }}
          >
            <Shield size={15} /> Admin
          </button>
          <button
            type="button"
            onClick={() => { setRole('employee'); setError(''); setForm({ username: '', password: '' }); }}
            style={{
              flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              background: role === 'employee' ? '#16A34A' : 'transparent',
              color: role === 'employee' ? '#fff' : 'rgba(255,255,255,0.45)',
              transition: 'all 0.2s',
            }}
          >
            <User size={15} /> Employee
          </button>
        </div>

        <h2 className="login-title" style={{ fontSize: 20 }}>
          {role === 'admin' ? 'Admin Sign In' : 'Employee Sign In'}
        </h2>
        <p className="login-subtitle">
          {role === 'admin' ? 'Access the full project management dashboard' : 'Access your personal attendance portal'}
        </p>

        {/* Demo credentials hint */}
        <div className="login-demo">
          {role === 'admin' ? (
            <>
              <p>Admin demo credentials:</p>
              <strong>Username: admin &nbsp;|&nbsp; Password: admin123</strong>
            </>
          ) : (
            <>
              <p>Employee demo credentials:</p>
              <strong>Employee ID: EMP-001 &nbsp;|&nbsp; Password: emp123</strong>
            </>
          )}
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{role === 'admin' ? 'Username' : 'Employee ID'}</label>
            <input
              type="text"
              placeholder={role === 'admin' ? 'Enter admin username' : 'Enter Employee ID (e.g. EMP-001)'}
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                autoComplete="current-password"
                style={{ paddingRight: 42 }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#FCA5A5', fontSize: 12.5, lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <button type="submit"
            style={{
              width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14,
              background: role === 'admin' ? 'var(--color-primary)' : '#16A34A',
              display: 'flex', alignItems: 'center', gap: 8,
              border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              boxShadow: role === 'admin' ? '0 4px 12px rgba(29,78,216,0.4)' : '0 4px 12px rgba(22,163,74,0.4)',
              transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? '● Signing in...' : <><LogIn size={16} /> Sign In as {role === 'admin' ? 'Admin' : 'Employee'}</>}
          </button>
        </form>

        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 24 }}>
          TJÄDERTUPPEN © 2026 — Project Management System
        </p>
      </div>
    </div>
  );
}
