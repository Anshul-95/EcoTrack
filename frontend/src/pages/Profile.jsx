import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  History,
  LayoutDashboard,
  Leaf,
  Mail,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const DAILY_GOAL_KG = 11.0;

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } },
};

const formatKg = (value, digits = 1) => `${Number(value || 0).toFixed(digits)} kg`;

const formatDate = (value) => {
  if (!value) return 'Not available';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getInitials = (name, email) => {
  const source = name || email || 'Eco Tracker';
  const parts = source.includes('@') ? [source.charAt(0)] : source.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const calculateStreak = (dates) => {
  const dateSet = new Set(dates.filter(Boolean));
  if (dateSet.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();

  while (dateSet.has(cursor.toISOString().split('T')[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

function Profile() {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchHabits = async () => {
      setLoading(true);
      try {
        const habitsRef = collection(db, 'users', currentUser.uid, 'habits');
        const q = query(habitsRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetched = [];

        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() });
        });

        setHabits(fetched);
      } catch (err) {
        console.error('Error fetching profile habits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [currentUser]);

  const profileStats = useMemo(() => {
    const totalCarbon = habits.reduce((sum, habit) => sum + (habit.totalCarbonFootprint || 0), 0);
    const activeDates = [...new Set(habits.map((habit) => habit.date).filter(Boolean))];
    const daysActive = activeDates.length;
    const averageDaily = daysActive > 0 ? totalCarbon / daysActive : 0;
    const categoryTotals = [
      { label: 'Transport', value: habits.reduce((sum, habit) => sum + (habit.travelEmission || 0), 0) },
      { label: 'Food', value: habits.reduce((sum, habit) => sum + (habit.foodEmission || 0), 0) },
      { label: 'Energy', value: habits.reduce((sum, habit) => sum + (habit.energyEmission || 0), 0) },
    ];
    const highestPerformingCategory =
      habits.length === 0
        ? 'Not available'
        : [...categoryTotals].sort((a, b) => a.value - b.value)[0].label;
    const goalProgress = Math.min((averageDaily / DAILY_GOAL_KG) * 100, 100);
    const ecoScore = habits.length === 0
      ? null
      : Math.max(0, Math.round(100 - Math.min((averageDaily / DAILY_GOAL_KG) * 100, 100)));

    return {
      totalHabits: habits.length,
      totalCarbon,
      averageDaily,
      daysActive,
      currentStreak: calculateStreak(activeDates),
      highestPerformingCategory,
      goalProgress,
      ecoScore,
    };
  }, [habits]);

  const displayName = currentUser?.displayName || 'Eco Tracker';
  const email = currentUser?.email || 'Not available';
  const initials = getInitials(displayName, email);
  const shortUserId = currentUser?.uid ? `${currentUser.uid.slice(0, 6)}...${currentUser.uid.slice(-4)}` : 'Not available';
  const joinDate = formatDate(currentUser?.metadata?.creationTime);
  const lastLogin = formatDate(currentUser?.metadata?.lastSignInTime);
  const accountStatus = currentUser?.emailVerified ? 'Verified' : 'Active';

  const summaryCards = [
    {
      label: 'Total Habits Logged',
      value: loading ? '...' : profileStats.totalHabits,
      icon: Activity,
      tone: 'mint',
    },
    {
      label: 'Total Carbon Tracked',
      value: loading ? '...' : formatKg(profileStats.totalCarbon),
      icon: Leaf,
      tone: 'blue',
    },
    {
      label: 'Average Daily CO₂',
      value: loading ? '...' : formatKg(profileStats.averageDaily),
      icon: Target,
      tone: 'purple',
    },
    {
      label: 'Days Active',
      value: loading ? '...' : profileStats.daysActive,
      icon: CalendarDays,
      tone: 'amber',
    },
  ];

  const accountRows = [
    { label: 'Name', value: displayName, icon: User },
    { label: 'Email', value: email, icon: Mail },
    { label: 'User ID', value: shortUserId, icon: ShieldCheck },
    { label: 'Account Status', value: accountStatus, icon: CheckCircle2 },
    { label: 'Last Login', value: lastLogin, icon: Clock },
  ];

  const quickActions = [
    { to: '/', label: 'View Dashboard', icon: LayoutDashboard },
    { to: '/log', label: 'Log Habit', icon: PenLine },
    { to: '/suggestions', label: 'AI Insights', icon: Bot },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <motion.div
      className="profile-shell"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="profile-hero" variants={sectionVariants}>
        <span className="profile-eyebrow">
          <Sparkles size={16} aria-hidden="true" />
          Account overview
        </span>
        <h1>Profile</h1>
        <p>Manage your account and track your sustainability journey.</p>
      </motion.section>

      <section className="profile-layout">
        <motion.article
          className="profile-card profile-glass"
          variants={sectionVariants}
          whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
        >
          <div className="profile-avatar" aria-label={`${displayName} avatar`}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="profile-identity">
            <h2>{displayName}</h2>
            <p>{email}</p>
            <span className="profile-badge">🌱 EcoTracker</span>
          </div>
          <div className="profile-joined">
            <span>Joined</span>
            <strong>{joinDate}</strong>
          </div>
        </motion.article>

        <motion.article className="profile-progress profile-glass" variants={sectionVariants}>
          <div className="profile-section-heading">
            <div>
              <span>Sustainability progress</span>
              <h2>Journey metrics</h2>
            </div>
            <Award aria-hidden="true" />
          </div>

          <div className="profile-progress-block">
            <div>
              <span>Carbon Goal Progress</span>
              <strong>{loading ? '...' : `${Math.round(profileStats.goalProgress)}%`}</strong>
            </div>
            <div className="profile-progress-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileStats.goalProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          <div className="profile-progress-grid">
            <ProfileMiniMetric label="Eco Score" value={loading ? '...' : profileStats.ecoScore ?? 'Not available'} />
            <ProfileMiniMetric label="Highest Performing Category" value={loading ? '...' : profileStats.highestPerformingCategory} />
            <ProfileMiniMetric label="Current Streak" value={loading ? '...' : `${profileStats.currentStreak} days`} />
          </div>
        </motion.article>
      </section>

      <motion.section className="profile-stats-grid" variants={sectionVariants} aria-label="Personal statistics">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.article
              className={`profile-stat-card profile-glass ${card.tone}`}
              key={card.label}
              whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
            >
              <div className="profile-stat-icon">
                <Icon aria-hidden="true" />
              </div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </motion.article>
          );
        })}
      </motion.section>

      <section className="profile-detail-grid">
        <motion.article className="profile-info-card profile-glass" variants={sectionVariants}>
          <div className="profile-section-heading">
            <div>
              <span>Account information</span>
              <h2>Secure details</h2>
            </div>
            <ShieldCheck aria-hidden="true" />
          </div>
          <div className="profile-info-list">
            {accountRows.map((row) => {
              const Icon = row.icon;
              return (
                <div className="profile-info-row" key={row.label}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              );
            })}
          </div>
        </motion.article>

        <motion.article className="profile-actions-card profile-glass" variants={sectionVariants}>
          <div className="profile-section-heading">
            <div>
              <span>Quick actions</span>
              <h2>Keep moving</h2>
            </div>
            <Flame aria-hidden="true" />
          </div>
          <div className="profile-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link className="profile-action-link" to={action.to} key={action.to}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{action.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.article>
      </section>
    </motion.div>
  );
}

function ProfileMiniMetric({ label, value }) {
  return (
    <div className="profile-mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default Profile;
