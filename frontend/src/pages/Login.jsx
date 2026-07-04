import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';

/* ─────────────────────────────────────────────
   Framer Motion variants — pure UI, no logic
   ───────────────────────────────────────────── */
const pageVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut', staggerChildren: 0.12 } },
};

const heroVariants = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 36, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

const errorVariants = {
  hidden:  { opacity: 0, y: -10, height: 0 },
  visible: { opacity: 1,  y:  0, height: 'auto', transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0,  y: -10, height: 0,      transition: { duration: 0.2 } },
};

const featureVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ─── Static data — hero features ─── */
const FEATURES = [
  {
    icon: '🌱',
    title: 'AI Recommendations',
    desc:  'Personalized suggestions that help reduce your carbon emissions.',
  },
  {
    icon: '📊',
    title: 'Interactive Dashboard',
    desc:  'Visualize trends with modern charts and real-time statistics.',
  },
  {
    icon: '🌍',
    title: 'Sustainable Lifestyle',
    desc:  'Monitor travel, food, and energy habits in one place.',
  },
];

const TRUST_ITEMS = ['Carbon Tracking', 'AI Insights', 'Real-time Analytics'];

/* ─── Earth SVG illustration ─── */
function EarthIllustration() {
  return (
    <div className="lp-earth-wrap" aria-hidden="true">
      {/* Glow ring behind globe */}
      <div className="lp-earth-glow" />

      {/* Globe */}
      <div className="lp-earth-globe">
        <svg
          className="lp-earth-svg"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Rotating Earth illustration"
        >
          <defs>
            {/* Ocean gradient */}
            <radialGradient id="ocean" cx="38%" cy="35%" r="65%">
              <stop offset="0%"   stopColor="#1e6b7f" />
              <stop offset="40%"  stopColor="#0d4a5e" />
              <stop offset="100%" stopColor="#062233" />
            </radialGradient>
            {/* Land green gradient */}
            <radialGradient id="land" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </radialGradient>
            {/* Atmosphere rim */}
            <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
              <stop offset="82%"  stopColor="transparent" />
              <stop offset="100%" stopColor="rgba(0,194,168,0.25)" />
            </radialGradient>
            {/* Specular highlight */}
            <radialGradient id="spec" cx="32%" cy="28%" r="38%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.18)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {/* Shadow side */}
            <radialGradient id="shadow" cx="75%" cy="60%" r="55%">
              <stop offset="0%"   stopColor="rgba(0,0,0,0.55)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <clipPath id="earthClip">
              <circle cx="100" cy="100" r="96" />
            </clipPath>
          </defs>

          {/* Ocean base */}
          <circle cx="100" cy="100" r="96" fill="url(#ocean)" />

          {/* Land masses */}
          <g clipPath="url(#earthClip)" fill="url(#land)">
            {/* North America */}
            <ellipse cx="52" cy="72" rx="22" ry="28" transform="rotate(-12 52 72)" opacity="0.92" />
            <ellipse cx="48" cy="98" rx="14" ry="18" transform="rotate(8 48 98)"  opacity="0.85" />
            {/* South America */}
            <ellipse cx="62" cy="136" rx="13" ry="22" transform="rotate(5 62 136)" opacity="0.88" />
            {/* Europe / Africa */}
            <ellipse cx="104" cy="68" rx="14" ry="18" transform="rotate(-5 104 68)" opacity="0.9" />
            <ellipse cx="110" cy="106" rx="18" ry="32" transform="rotate(4 110 106)" opacity="0.86" />
            {/* Asia */}
            <ellipse cx="148" cy="64" rx="28" ry="22" transform="rotate(-8 148 64)" opacity="0.9" />
            <ellipse cx="156" cy="92" rx="18" ry="16" transform="rotate(6 156 92)"  opacity="0.82" />
            {/* Australia */}
            <ellipse cx="158" cy="138" rx="16" ry="12" transform="rotate(-4 158 138)" opacity="0.84" />
            {/* Antarctica hint */}
            <ellipse cx="100" cy="188" rx="40" ry="10" opacity="0.35" fill="#cffafe" />
            {/* Ice cap */}
            <ellipse cx="100" cy="12"  rx="28" ry="10" opacity="0.3"  fill="#e0f2fe" />
          </g>

          {/* Atmosphere rim */}
          <circle cx="100" cy="100" r="96" fill="url(#atmo)" />

          {/* Specular highlight (light reflection) */}
          <circle cx="100" cy="100" r="96" fill="url(#spec)" />

          {/* Shadow side */}
          <circle cx="100" cy="100" r="96" fill="url(#shadow)" />

          {/* Grid lines (latitude/longitude) */}
          <g clipPath="url(#earthClip)" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" fill="none">
            {/* Latitude lines */}
            <ellipse cx="100" cy="100" rx="96" ry="30" />
            <ellipse cx="100" cy="100" rx="96" ry="60" />
            <ellipse cx="100" cy="100" rx="96" ry="85" />
            {/* Longitude lines */}
            <line x1="100" y1="4"   x2="100" y2="196" />
            <line x1="4"   y1="100" x2="196" y2="100" />
            <line x1="32"  y1="20"  x2="168" y2="180" />
            <line x1="168" y1="20"  x2="32"  y2="180" />
          </g>

          {/* Outer border */}
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(0,194,168,0.22)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Orbit ring */}
      <div className="lp-earth-orbit" />
      {/* Orbit dot */}
      <div className="lp-earth-orbit-dot" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Login component
   ALL auth logic below is completely unchanged
   ───────────────────────────────────────────── */
function Login() {
  /* ════════════ UNTOUCHED AUTH STATE & LOGIC ════════════ */
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        setError('Invalid email or password.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }
  /* ═════════════════════════════════════════════════════ */

  /* UI-only state */
  const [showPassword, setShowPassword] = useState(false);

  return (
    <motion.div
      className="lp-shell"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Background layer: blobs + particles ── */}
      <div className="lp-bg" aria-hidden="true">
        <div className="lp-blob lp-blob--mint"   />
        <div className="lp-blob lp-blob--violet" />
        <div className="lp-blob lp-blob--teal"   />
        <div className="lp-blob lp-blob--navy"   />
        {/* Floating particles */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className={`lp-particle lp-particle--${i + 1}`} />
        ))}
      </div>

      {/* ══════════════════════════════════════════
          LEFT — Hero Section
          ══════════════════════════════════════════ */}
      <motion.section
        className="lp-hero"
        variants={heroVariants}
        aria-label="EcoTrack hero section"
      >
        {/* Brand */}
        <div className="lp-hero-brand">
          <span className="lp-hero-logo" aria-hidden="true">🌿</span>
          <span className="lp-hero-brand-name">EcoTrack</span>
        </div>

        {/* Earth centerpiece */}
        <EarthIllustration />

        {/* Headline */}
        <div className="lp-hero-copy">
          <h2 className="lp-hero-title">Track Your Carbon Footprint</h2>
          <p className="lp-hero-desc">
            Build sustainable habits with AI-powered insights, interactive analytics,
            and smarter eco-friendly decisions every day.
          </p>
        </div>

        {/* Feature cards */}
        <motion.div
          className="lp-features"
          variants={pageVariants}
          initial="hidden"
          animate="visible"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} className="lp-feature-card" variants={featureVariants}>
              <span className="lp-feature-icon" aria-hidden="true">{f.icon}</span>
              <div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p  className="lp-feature-desc">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust strip */}
        <div className="lp-trust-strip" aria-label="Platform features">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="lp-trust-item">
              <FiCheck aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </motion.section>

      {/* ══════════════════════════════════════════
          RIGHT — Login Card
          ══════════════════════════════════════════ */}
      <div className="lp-right">
        <motion.div className="lp-card" variants={cardVariants}>
          {/* Card ambient glow */}
          <div className="lp-card-glow" aria-hidden="true" />

          {/* Mobile-only brand */}
          <div className="lp-card-brand-mobile" aria-hidden="true">
            <span className="lp-hero-logo">🌿</span>
            <span className="lp-hero-brand-name">EcoTrack</span>
          </div>

          {/* Heading */}
          <header className="lp-card-header">
            <h1 className="lp-card-title">Welcome Back</h1>
            <p  className="lp-card-subtitle">Sign in to continue tracking your carbon footprint.</p>
          </header>

          {/* ── Error banner — UNCHANGED logic ── */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="lp-error"
                role="alert"
                aria-live="polite"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <FiAlertCircle aria-hidden="true" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form — ALL handlers/ids/names/autocomplete UNCHANGED ── */}
          <form onSubmit={handleSubmit} className="lp-form" noValidate>

            {/* Email */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">Email Address</label>
              <div className="lp-input-wrap">
                <FiMail className="lp-input-icon" aria-hidden="true" />
                <input
                  className="lp-input"
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="password">Password</label>
              <div className="lp-input-wrap">
                <FiLock className="lp-input-icon" aria-hidden="true" />
                <input
                  className="lp-input lp-input--pw"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="lp-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword
                    ? <FiEyeOff aria-hidden="true" />
                    : <FiEye   aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Submit — UNCHANGED disabled/loading logic */}
            <button
              type="submit"
              className="lp-submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading && <span className="lp-spinner" aria-hidden="true" />}
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="lp-footer">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="lp-register-link">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Login;
