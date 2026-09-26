import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Save, UserRound } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { t } = useLanguage();
  const { auth, updateAdmin } = useApp();
  const [form, setForm] = useState({ username: '', email: '', current_password: '', password: '', confirm_password: '' });
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    if (!auth.user) return;
    setForm(current => ({
      ...current,
      username: auth.user.username || '',
      email: auth.user.email || '',
    }));
  }, [auth.user]);

  const setField = (field) => (event) => setForm(current => ({ ...current, [field]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault();
    setState({ loading: true, error: '', success: '' });
    const username = form.username.trim();
    const email = form.email.trim();
    if (username.length < 3 || username.length > 50) {
      setState({ loading: false, error: t('settings_username_invalid'), success: '' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState({ loading: false, error: t('settings_email_invalid'), success: '' });
      return;
    }

    const passwordChanged = Boolean(form.password);
    const emailChanged = email.toLowerCase() !== (auth.user?.email || '').toLowerCase();
    const needsCurrentPassword = passwordChanged || emailChanged;

    if (needsCurrentPassword && !form.current_password) {
      setState({ loading: false, error: t('settings_current_password_required'), success: '' });
      return;
    }
    if (form.password && form.password.length < 8) {
      setState({ loading: false, error: t('settings_password_short'), success: '' });
      return;
    }
    if (form.password && form.password !== form.confirm_password) {
      setState({ loading: false, error: t('settings_password_mismatch'), success: '' });
      return;
    }
    try {
      const updated = await updateAdmin({
        username,
        email,
        ...(needsCurrentPassword ? { current_password: form.current_password } : {}),
        ...(form.password ? { password: form.password } : {}),
      });
      setForm(current => ({ ...current, ...updated, current_password: '', password: '', confirm_password: '' }));
      setState({ loading: false, error: '', success: t('settings_saved') });
    } catch (error) {
      setState({ loading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div><span className="eyebrow">{t('settings_eyebrow')}</span><h2>{t('settings_title')}</h2><p>{t('settings_subtitle')}</p></div>
      </div>
      <div className="card settings-card">
        <div className="card-header"><div><h3><UserRound size={18} /> {t('settings_account')}</h3><p>{t('settings_account_sub')}</p></div></div>
        <form className="card-body settings-form" onSubmit={handleSubmit}>
          <div className="settings-grid">
            <div className="form-group"><label htmlFor="settings-username">{t('lbl_username')}</label><input id="settings-username" value={form.username} onChange={setField('username')} required minLength="3" /></div>
            <div className="form-group"><label htmlFor="settings-email">{t('lbl_email')}</label><input id="settings-email" type="email" value={form.email} onChange={setField('email')} required /></div>
          </div>
          <div className="settings-divider"><KeyRound size={18} /><div><h4>{t('settings_password')}</h4><p>{t('settings_password_sub')}</p></div></div>
          <div className="settings-grid">
            <div className="form-group"><label htmlFor="settings-password">{t('settings_new_password')}</label><input id="settings-password" type="password" autoComplete="new-password" value={form.password} onChange={setField('password')} minLength="8" placeholder={t('settings_password_optional')} /></div>
            <div className="form-group"><label htmlFor="settings-confirm-password">{t('settings_confirm_password')}</label><input id="settings-confirm-password" type="password" autoComplete="new-password" value={form.confirm_password} onChange={setField('confirm_password')} minLength="8" /></div>
          </div>
          <div className="form-group"><label htmlFor="settings-current-password">{t('settings_current_password')}</label><input id="settings-current-password" type="password" autoComplete="current-password" value={form.current_password} onChange={setField('current_password')} required /></div>
          {state.error && <p className="form-message error">{state.error}</p>}
          {state.success && <p className="form-message success"><CheckCircle2 size={16} /> {state.success}</p>}
          <button className="btn btn-primary" type="submit" disabled={state.loading}><Save size={16} /> {state.loading ? t('settings_saving') : t('btn_save')}</button>
        </form>
      </div>
    </div>
  );
}
