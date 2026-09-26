import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { normalizeSupabaseError } from '../utils/supabaseData';
import { LockKeyhole, AlertCircle, ArrowRight, CheckCircle2, Clock3, ShieldCheck, UserRound } from 'lucide-react';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';
import PublicNavbar from '../components/layout/PublicNavbar';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw normalizeSupabaseError(signInError);
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
              <div className="input-wrapper">
                <LockKeyhole size={18} className="input-icon" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('login_ph_password')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
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