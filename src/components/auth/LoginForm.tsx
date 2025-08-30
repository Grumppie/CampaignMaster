import React, { useState } from 'react';
import { signInWithGoogle, signInWithUsernameOrEmail, resetPassword } from '../../services/auth';
import './LoginForm.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const trimmedIdentifier = formData.identifier.trim();
      const trimmedPassword = formData.password.trim();
      
      if (!trimmedIdentifier || !trimmedPassword) {
        setError('Please fill in all fields.');
        return;
      }
      
      await signInWithUsernameOrEmail(trimmedIdentifier, trimmedPassword);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    try {
      const trimmedEmail = resetEmail.trim();
      
      if (!trimmedEmail) {
        setResetMessage('Please enter a valid email address.');
        return;
      }
      
      await resetPassword(trimmedEmail);
      setResetMessage('Password reset email sent! Check your inbox.');
      setResetEmail('');
    } catch (err: any) {
      setResetMessage(err.message || 'Failed to send reset email.');
    } finally {
      setResetLoading(false);
    }
  };

  if (showResetPassword) {
    return (
      <div className="login-form-container">
        <div className="form-header">
          <div className="form-icon">🔐</div>
          <h2>Reset Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>
        
        <form onSubmit={handleResetPassword} className="login-form">
          {resetMessage && (
            <div className={`message ${resetMessage.includes('sent') ? 'success' : 'error'}`}>
              {resetMessage}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="resetEmail">Email Address</label>
            <input
              type="email"
              id="resetEmail"
              name="resetEmail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setShowResetPassword(false)}
              className="btn-secondary"
              disabled={resetLoading}
            >
              Back to Login
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="login-form-container">
      <div className="form-header">
        <div className="form-icon">⚔️</div>
        <h2>Welcome Back, Adventurer</h2>
        <p>Continue your epic journey</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="identifier">Username or Email</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleInputChange}
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <div className="form-options">
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="link-button"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          className="btn-primary btn-full"
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        {/* <div className="divider">
          <span>or</span>
        </div> */}

        {/* <button
          type="button"
          onClick={handleGoogleSignIn}
          className="btn-google"
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button> */}

        <div className="register-link">
          <p>
            New to the realm?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="link-button"
            >
              Create your account
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
