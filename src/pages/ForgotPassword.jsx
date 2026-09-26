import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PublicNavbar from '../components/layout/PublicNavbar';
import logo from '../assets/TJADERTUPPEN_Logo.jpeg';

const RATE_LIMIT_MESSAGE = 'Password reset emails are temporarily rate-limited. Please wait 2–3 hours before trying again.';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const { data: emailExists, error: emailCheckError } = await supabase.rpc('email_exists_in_auth', {
        email_input: trimmedEmail,
      });

      if (emailCheckError) {
        throw new Error('Unable to verify this email in Supabase Authentication.');
      }

      if (!emailExists) {
        setError('This email is not registered in Supabase Authentication.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        const message = (resetError.message || '').toLowerCase();
        const isRateLimited = resetError.status === 429
          || message.includes('too many requests')
          || message.includes('rate limit')
          || message.includes('60 seconds')
          || message.includes('reset every');

        if (isRateLimited) {
          throw new Error(RATE_LIMIT_MESSAGE);
        }

        throw new Error(resetError.message || 'Unable to send password reset email.');
      }

      setSuccess('A password reset link has been sent to your registered admin email.');
      setEmail('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <PublicNavbar />
      <div className="login-container auth-compact-container">
        <section className="login-intro auth-intro-hide-mobile" aria-label="Password recovery overview">
          <div className="login-intro-copy">
            <p className="login-eyebrow">TJÄDERTUPPEN / SECURITY</p>
            <h1>Reset<br /><em>Access</em></h1>
            <p className="login-intro-description">
              Use your registered admin email to receive a secure reset link. Only authenticated admin accounts can receive the request.
            </p>
          </div>
          <div className="login-intro-bottom">
            <div className="login-feature-list">
              <div><ShieldCheck size={16} /><span>Admin-only access</span></div>
              <div><CheckCircle2 size={16} /><span>Secure email reset</span></div>
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
            <h1>Forgot Password</h1>
            <p>Enter the email address linked to your administrator account.</p>
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

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="forgot-email">Email</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your admin email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full login-submit" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </button>
          </form>

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
