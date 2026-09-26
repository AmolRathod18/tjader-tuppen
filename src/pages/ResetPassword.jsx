import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PublicNavbar from '../components/layout/PublicNavbar';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setVerifying(false);
      setError('The reset link is invalid or expired. Please request a new password reset email.');
      return;
    }

    const verifyReset = async () => {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          throw exchangeError;
        }

        setVerifying(false);
      } catch (verifyError) {
        setVerifying(false);
        setError(verifyError instanceof Error ? verifyError.message : 'Unable to verify the reset link.');
      }
    };

    verifyReset();
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        const message = (updateError.message || '').toLowerCase();
        if (updateError.status === 429 || message.includes('too many requests') || message.includes('rate limit')) {
          throw new Error('Too many password change attempts. Please try again in a few hours.');
        }
        throw new Error(updateError.message || 'Unable to update password.');
      }

      setSuccess('Password updated successfully. Redirecting to login...');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <PublicNavbar />
      <div className="login-container auth-compact-container">
        <section className="login-intro auth-intro-hide-mobile" aria-label="Password reset overview">
          <div className="login-intro-copy">
            <p className="login-eyebrow">TJÄDERTUPPEN / SECURITY</p>
            <h1>Create<br /><em>New Password</em></h1>
            <p className="login-intro-description">
              Choose a strong password for your administrator account. Your new login will be used for all future admin access.
            </p>
          </div>
          <div className="login-intro-bottom">
            <div className="login-feature-list">
              <div><CheckCircle2 size={16} /><span>Strong password required</span></div>
              <div><LockKeyhole size={16} /><span>Secure account recovery</span></div>
            </div>
          </div>
        </section>

        <div className="login-card auth-card-compact">
          <div className="login-logo">
            <img src={logo} alt="TJÄDERTUPPEN" className="login-brand-logo" />
            <div className="login-logo-text">
              <h2>TJÄDERTUPPEN</h2>
              <span>Admin portal</span>
            </div>
          </div>

          <div className="login-title">
            <h1>Set New Password</h1>
            <p>Choose a password that is strong and unique.</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          {!verifying && !error && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <div className="input-wrapper">
                  <LockKeyhole size={18} className="input-icon" />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm password</label>
                <div className="input-wrapper">
                  <LockKeyhole size={18} className="input-icon" />
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full login-submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Update password'}
              </button>
            </form>
          )}

          {verifying && !error && (
            <div className="auth-inline-state">
              <div className="spinner" />
              <span>Verifying reset link...</span>
            </div>
          )}

          <div className="auth-actions-row">
            <Link to="/login" className="auth-link back-link">
              <ArrowLeft size={15} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
