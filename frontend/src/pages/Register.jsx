import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await signup(email, password, fullName);
      navigate('/');
    } catch (err) {
      console.error("Firebase Error:", err);
      alert(err.code + "\n" + err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container glass-card" style={{ maxWidth: '400px', margin: '40px auto' }}>
      <h1>Register</h1>
      <p>Start your sustainability journey today.</p>

      {error && (
        <div style={{
          padding: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#f87171',
          borderRadius: '8px',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="fullName">Full Name</label>
          <input
            className="form-input"
            type="text"
            id="fullName"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            autocomplete="name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="email">Email Address</label>
          <input
            className="form-input"
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="new-password">Password</label>
          <input
            className="form-input"
            type="password"
            id="new-password"
            name="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          className="btn"
          disabled={loading}
          style={{ width: '100%', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In here</Link>
      </p>
    </div>
  );
}

export default Register;

