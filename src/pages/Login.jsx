import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { normalizeSupabaseError } from '../utils/supabaseData';
import { LockKeyhole, AlertCircle, ArrowRight, CheckCircle2, Clock3, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';
import PublicNavbar from '../components/layout/PublicNavbar';
import { landingMedia } from '../config/landingMedia';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateLogin = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return 'Please enter your email address.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please enter your password.';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateLogin();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const { data: emailExists, error: emailCheckError } = await supabase.rpc('email_exists_in_auth', {
        email_input: trimmedEmail,
      });

      if (emailCheckError) {
        throw new Error('Unable to verify this email in Supabase Authentication.');
      }

      if (!emailExists) {
        throw new Error('This email is not registered in Supabase Authentication.');
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) throw normalizeSupabaseError(signInError);

      const userId = signInData?.user?.id;
      if (!userId) {
        throw new Error('Authentication failed. Please try again.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        throw new Error('Unable to verify admin access.');
      }

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('This account is not an authenticated admin user.');
      }

      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : String(submitError));
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <PublicNavbar />
      <div className="login-container">
        <section className="login-intro" aria-label={t('login_overview_label')}>
        <img
          className="login-intro-photo"
          src={landingMedia.company.worker}
          alt=""
          aria-hidden="true"
        />
        <div className="login-intro-copy">
            <p className="login-eyebrow">TJÄDERTUPPEN / 2026</p>
            <h1>{t('login_intro_title')}<br /><em>{t('login_intro_emphasis')}</em></h1>
            <p className="login-intro-description">{t('login_intro_description')}</p>
          </div>
          <div className="login-intro-bottom">
            <div className="login-feature-list">
              <div><CheckCircle2 size={16} /><span>{t('login_feature_projects')}</span></div>
              <div><Clock3 size={16} /><span>{t('login_feature_time')}</span></div>
            </div>
          </div>
        </section>

        <div className="login-card">
          <div className="login-logo">
            <img src={logo} alt="TJÄDERTUPPEN" className="login-brand-logo" />
            <div className="login-logo-text">
              <h2>TJÄDERTUPPEN</h2>
              <span>{t('login_system')}</span>
            </div>
          </div>

          <div className="login-title">
            <h1>{t('login_title_admin')}</h1>
            <p>{t('login_subtitle_admin')}</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email">{t('lbl_email')}</label>
              <div className="input-wrapper">
                <UserRound size={18} className="input-icon" />
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  placeholder={t('login_ph_username')}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('lbl_password')}</label>
              <div className="input-wrapper password-input-wrapper">
                <LockKeyhole size={18} className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('login_ph_password')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="auth-actions-row auth-actions-space-between">
              <Link to="/forgot-password" className="auth-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn btn-primary btn-full login-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  {t('login_signing_in')}
                </>
              ) : (
                <>{t('login_btn_admin')} <ArrowRight size={17} /></>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>{t('login_footer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}