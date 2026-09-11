'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, KeyRound, RefreshCw } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

type AuthMode = 'login' | 'forgot_step1' | 'forgot_step2';

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  // Login states
  const [identifier, setIdentifier] = useState('diecasthubmanjeri');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Mode state
  const [mode, setMode] = useState<AuthMode>('login');

  // Forgot password states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [targetEmail, setTargetEmail] = useState('diecasthubmanjeri@gmail.com');

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Unable to connect to authentication server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
        }
        setError(data.error || 'Failed to dispatch security code.');
        return;
      }

      setSuccessMessage(data.message || 'Verification PIN sent to diecasthubmanjeri@gmail.com');
      setCooldown(60); // 60-second cooldown
      setMode('forgot_step2');
    } catch (err) {
      setError('Failed to reach recovery server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = otp.trim();

    if (!cleanPin || cleanPin.length !== 6) {
      setError('Please enter the 6-digit security code received in your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: cleanPin,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to verify PIN or update password.');
        return;
      }

      // Successful reset
      setMode('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password successfully updated! Please log in with your new password.');
    } catch (err) {
      setError('Failed to reach password reset server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          padding: '36px 32px',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#2563eb',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            color: '#ffffff',
            boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.5)',
          }}
        >
          {mode === 'login' ? <Shield size={28} /> : <KeyRound size={28} />}
        </div>

        <h2
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#f8fafc',
            marginBottom: '6px',
            letterSpacing: '-0.3px',
          }}
        >
          {mode === 'login' && 'Diecast Hub Admin Portal'}
          {mode === 'forgot_step1' && 'Reset Admin Password'}
          {mode === 'forgot_step2' && 'Enter 6-Digit PIN'}
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          {mode === 'login' && 'Sign in with your master credentials to manage your store.'}
          {mode === 'forgot_step1' &&
            'We will send a secure 6-digit verification code to the registered owner email.'}
          {mode === 'forgot_step2' &&
            `A 6-digit PIN has been dispatched to ${targetEmail}.`}
        </p>

        {/* Notifications */}
        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid #22c55e',
              color: '#86efac',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ----------------- MODE 1: LOGIN FORM ----------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username or Email Input */}
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="diecasthubmanjeri"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_step1');
                    setError('');
                    setSuccessMessage('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Forgot Password?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              style={{
                width: '100%',
                padding: '13px 18px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Verifying Credentials...
                </>
              ) : (
                'Unlock Admin Portal'
              )}
            </button>
          </form>
        )}

        {/* ----------------- MODE 2: FORGOT PASSWORD - STEP 1 (REQUEST OTP) ----------------- */}
        {mode === 'forgot_step1' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Registered Store Admin Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={targetEmail}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#94a3b8',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'not-allowed',
                  }}
                />
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Protected email: Security codes can only be sent to the official owner inbox.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              style={{
                width: '100%',
                padding: '13px 18px',
                backgroundColor: cooldown > 0 ? '#475569' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                marginTop: '6px',
              }}
            >
              {loading
                ? 'Dispatching Security PIN...'
                : cooldown > 0
                ? `Resend Code in ${cooldown}s`
                : 'Send 6-Digit PIN to Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </form>
        )}

        {/* ----------------- MODE 3: FORGOT PASSWORD - STEP 2 (ENTER OTP & RESET) ----------------- */}
        {mode === 'forgot_step2' && (
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 6-Digit OTP input */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#cbd5e1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  6-Digit Verification PIN
                </label>
                {cooldown > 0 ? (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Resend in {cooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Resend PIN
                  </button>
                )}
              </div>

              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #3b82f6',
                  backgroundColor: '#0f172a',
                  color: '#60a5fa',
                  fontSize: '22px',
                  fontWeight: 800,
                  letterSpacing: '6px',
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* New Password */}
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ textAlign: 'left' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    backgroundColor: '#0f172a',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
              </div>
            </div>

            {/* Submit Reset */}
            <button
              type="submit"
              disabled={loading || otp.trim().length !== 6 || newPassword.length < 6}
              style={{
                width: '100%',
                padding: '13px 18px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'background-color 0.2s',
                marginTop: '6px',
              }}
            >
              {loading ? 'Verifying PIN & Updating...' : 'Verify PIN & Update Password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMessage('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '4px',
              }}
            >
              <ArrowLeft size={16} /> Cancel & Return to Sign In
            </button>
          </form>
        )}

        {/* Security Footer Notice */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: '1px solid #334155',
            fontSize: '11px',
            color: '#64748b',
            lineHeight: 1.5,
          }}
        >
          🔒 Backend-protected with PBKDF2 cryptography, HMAC-SHA256 tokens & brute force lockout.
        </div>
      </div>
    </div>
  );
}
