import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FiActivity,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiCloud,
  FiCpu,
  FiPlus,
  FiTarget,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';

const targetDaily = 11.0;
const categoryColors = ['#00c2a8', '#7c5cff', '#ffb545'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const cardHoverMotion = {
  y: -5,
  scale: 1.012,
  transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] },
};

const formatKg = (value, digits = 1) => Number(value || 0).toFixed(digits);

const toDateKey = (date) => date.toISOString().split('T')[0];

const formatShortDate = (dateKey) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return toDateKey(date);
  });
}

function Dashboard() {
  const { currentUser } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    weeklyAverage: 0,
    monthlyTotal: 0,
    transport: 0,
    diet: 0,
    energy: 0,
    activeDays: 0,
  });
  const [todayFootprint, setTodayFootprint] = useState(0);
  const [latestHabit, setLatestHabit] = useState(null);

  const ecoScore = useMemo(() => {
    if (loading) {
      return 'Loading...';
    }
    if (!stats || stats.activeDays === 0) {
      return 'No tracked days';
    }
    const averageDaily = stats.weeklyAverage > 0 ? stats.weeklyAverage : (stats.total / stats.activeDays);
    if (isNaN(averageDaily) || averageDaily === null) {
      return 'No data';
    }
    const score = Math.max(0, Math.round(100 - Math.min((averageDaily / targetDaily) * 100, 100)));
    return score;
  }, [stats, loading]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  useEffect(() => {
    // Keep backend connection health check log
    console.log('Backend connection status:', isConnected ? 'Online' : 'Offline');
  }, [isConnected]);

  useEffect(() => {
    api
      .get('/api/test')
      .then(() => {
        setIsConnected(true);
      })
      .catch(() => {
        setIsConnected(false);
      });
  }, []);

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

        const todayStr = toDateKey(new Date());
        const weekKeys = getLastSevenDays();
        const monthPrefix = todayStr.slice(0, 7);
        const uniqueDays = new Set(fetched.map((h) => h.date).filter(Boolean));
        let total = 0;
        let transport = 0;
        let diet = 0;
        let energy = 0;
        let todayTotal = 0;
        let weeklyTotal = 0;
        let monthlyTotal = 0;

        fetched.forEach((habit) => {
          const footprint = habit.totalCarbonFootprint || 0;
          total += footprint;
          transport += habit.travelEmission || 0;
          diet += habit.foodEmission || 0;
          energy += habit.energyEmission || 0;

          if (habit.date === todayStr) todayTotal += footprint;
          if (weekKeys.includes(habit.date)) weeklyTotal += footprint;
          if (habit.date?.startsWith(monthPrefix)) monthlyTotal += footprint;
        });

        setHabits(fetched);
        setLatestHabit(fetched[0] || null);
        setTodayFootprint(Number(todayTotal.toFixed(2)));
        setStats({
          total: Number(total.toFixed(1)),
          weeklyAverage: Number((weeklyTotal / 7).toFixed(1)),
          monthlyTotal: Number(monthlyTotal.toFixed(1)),
          transport: Number(transport.toFixed(1)),
          diet: Number(diet.toFixed(1)),
          energy: Number(energy.toFixed(1)),
          activeDays: uniqueDays.size,
        });
      } catch (err) {
        console.error('Error fetching habits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [currentUser]);

  const weeklyData = useMemo(() => {
    const dailyTotals = getLastSevenDays().map((dateKey) => ({
      dateKey,
      day: formatShortDate(dateKey),
      emissions: 0,
    }));

    habits.forEach((habit) => {
      const match = dailyTotals.find((day) => day.dateKey === habit.date);
      if (match) match.emissions += habit.totalCarbonFootprint || 0;
    });

    return dailyTotals.map((day) => ({
      ...day,
      emissions: Number(day.emissions.toFixed(2)),
    }));
  }, [habits]);

  const categoryData = useMemo(
    () => [
      { name: 'Transport', value: stats.transport },
      { name: 'Food', value: stats.diet },
      { name: 'Energy', value: stats.energy },
    ],
    [stats.diet, stats.energy, stats.transport]
  );

  const progressPercent = Math.min((todayFootprint / targetDaily) * 100, 100);
  const remainingToday = Math.max(targetDaily - todayFootprint, 0);
  const goalTone = todayFootprint <= targetDaily ? 'good' : 'warning';
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const displayName =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Eco Tracker';
  const primaryCategory = [...categoryData].sort((a, b) => b.value - a.value)[0];
  const recommendation =
    stats.activeDays === 0
      ? 'Log your first day to unlock tailored recommendations from your footprint pattern.'
      : todayFootprint > targetDaily
        ? `Today's footprint is above goal. Start with ${primaryCategory.name.toLowerCase()}, your largest category, for the fastest reduction.`
        : `You are ${formatKg(remainingToday)} kg under today's goal. Keep the same rhythm and consider batching trips to protect the streak.`;

  const statCards = [
    {
      label: "Today's Carbon Footprint",
      value: formatKg(todayFootprint, 2),
      unit: 'kg CO2',
      icon: FiCloud,
      accent: 'mint',
    },
    {
      label: 'Weekly Average',
      value: formatKg(stats.weeklyAverage),
      unit: 'kg/day',
      icon: FiTrendingUp,
      accent: 'violet',
    },
    {
      label: 'Monthly Total',
      value: formatKg(stats.monthlyTotal),
      unit: 'kg CO2',
      icon: FiCalendar,
      accent: 'amber',
    },
    {
      label: 'Days Tracked',
      value: stats.activeDays,
      unit: 'days',
      icon: FiCheckCircle,
      accent: 'blue',
    },
  ];

  return (
    <motion.div
      className="dashboard-shell"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="dashboard-hero" variants={cardVariants}>
        <div>
          <span className="dashboard-eyebrow">
            <FiActivity aria-hidden="true" />
            Carbon intelligence
          </span>
          <h1>{greeting}, {displayName} 👋</h1>
          <p>
            Track your carbon footprint and make smarter eco-friendly choices every day.
          </p>
        </div>

        <div className="dashboard-hero-actions">
          <div className="dashboard-hero-badge eco-score-badge">
            <span className="dashboard-hero-badge-icon">🌱</span>
            <div className="dashboard-hero-badge-content">
              <span className="dashboard-hero-badge-label">Eco Score</span>
              <span className="dashboard-hero-badge-value green-accent">
                {typeof ecoScore === 'number' ? `${ecoScore} / 100` : ecoScore}
              </span>
            </div>
          </div>
          <div className="dashboard-hero-badge date-badge">
            <span className="dashboard-hero-badge-icon">📅</span>
            <div className="dashboard-hero-badge-content">
              <span className="dashboard-hero-badge-label">Today's Date</span>
              <span className="dashboard-hero-badge-value">{formattedDate}</span>
            </div>
          </div>
          <Link to="/log" className="dashboard-primary-action">
            <FiPlus aria-hidden="true" />
            Log Activity
          </Link>
        </div>
      </motion.section>

      {loading ? (
        <motion.div className="dashboard-loading glass-panel" variants={cardVariants}>
          <FiZap aria-hidden="true" />
          Loading your eco-metrics...
        </motion.div>
      ) : habits.length === 0 ? (
        <motion.section className="dashboard-empty glass-panel" variants={cardVariants}>
          <FiTarget aria-hidden="true" />
          <h2>Start your first tracking streak</h2>
          <p>
            Log transportation, diet, and energy habits to unlock charts, goal progress, and
            tailored recommendations.
          </p>
          <Link to="/log" className="dashboard-primary-action">
            <FiPlus aria-hidden="true" />
            Start Tracking
          </Link>
        </motion.section>
      ) : (
        <>
          <section className="dashboard-stats-grid" aria-label="Carbon footprint statistics">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  className={`dashboard-stat-card glass-panel dashboard-interactive-card ${item.accent}`}
                  variants={cardVariants}
                  whileHover={cardHoverMotion}
                  key={item.label}
                >
                  <div className="dashboard-stat-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <span>{item.label}</span>
                  <strong>
                    {item.value} <small>{item.unit}</small>
                  </strong>
                </motion.article>
              );
            })}
          </section>

          <section className="dashboard-main-grid">
            <motion.article
              className="dashboard-chart-card glass-panel dashboard-interactive-card wide"
              variants={cardVariants}
              whileHover={cardHoverMotion}
            >
              <div className="dashboard-card-heading">
                <div>
                  <span>Weekly emissions</span>
                  <h2>Last 7 days</h2>
                </div>
                <FiArrowUpRight aria-hidden="true" />
              </div>
              <div className="dashboard-line-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emissionsGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8ff8df" stopOpacity={0.55} />
                        <stop offset="35%" stopColor="#00c2a8" stopOpacity={0.28} />
                        <stop offset="70%" stopColor="#00c2a8" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#00c2a8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="emissionsStroke" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#a7ffe7" />
                        <stop offset="50%" stopColor="#00c2a8" />
                        <stop offset="100%" stopColor="#7c5cff" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(236, 244, 255, 0.62)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(236, 244, 255, 0.62)', fontSize: 12 }}
                    />
                    <Tooltip content={<DashboardTooltip suffix=" kg CO2" />} />
                    <Area
                      type="monotone"
                      dataKey="emissions"
                      stroke="url(#emissionsStroke)"
                      strokeWidth={2.5}
                      fill="url(#emissionsGradient)"
                      dot={{ r: 4, strokeWidth: 2, fill: '#0b0f19', stroke: '#00c2a8' }}
                      activeDot={{
                        r: 7,
                        strokeWidth: 2,
                        fill: '#00c2a8',
                        stroke: '#a7ffe7',
                      }}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.article>

            <motion.article
              className="dashboard-chart-card glass-panel dashboard-interactive-card"
              variants={cardVariants}
              whileHover={cardHoverMotion}
            >
              <div className="dashboard-card-heading">
                <div>
                  <span>Category breakdown</span>
                  <h2>Emission mix</h2>
                </div>
                <FiCpu aria-hidden="true" />
              </div>
              <div className="dashboard-doughnut-wrap">
                <ResponsiveContainer width="100%" height={238}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="62%"
                      outerRadius="86%"
                      paddingAngle={4}
                      isAnimationActive
                      animationDuration={850}
                      animationEasing="ease-out"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={categoryColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DashboardTooltip suffix=" kg CO2" />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-doughnut-total">
                  <span>Total emissions</span>
                  <strong>{formatKg(stats.total)}</strong>
                  <small>kg CO2</small>
                </div>
              </div>
              <div className="dashboard-category-list">
                {categoryData.map((item, index) => (
                  <div key={item.name}>
                    <span style={{ '--dot-color': categoryColors[index] }} />
                    <p>{item.name}</p>
                    <strong>{formatKg(item.value)} kg</strong>
                  </div>
                ))}
              </div>
            </motion.article>
          </section>

          <section className="dashboard-insight-grid">
            <motion.article
              className="dashboard-goal-card glass-panel dashboard-interactive-card"
              variants={cardVariants}
              whileHover={cardHoverMotion}
            >
              <div className="dashboard-card-heading">
                <div>
                  <span>Daily goal</span>
                  <h2>{formatKg(todayFootprint, 2)} / {targetDaily.toFixed(1)} kg CO2</h2>
                </div>
                <FiTarget aria-hidden="true" />
              </div>
              <div className="dashboard-progress-track" aria-label="Daily goal progress">
                <motion.div
                  className={`dashboard-progress-fill ${goalTone}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p>
                {todayFootprint <= targetDaily
                  ? `${formatKg(remainingToday)} kg CO2 remaining before today's baseline.`
                  : 'Today is above the baseline. A lower-impact commute or lighter dinner can help rebalance it.'}
              </p>
            </motion.article>

            <motion.article
              className="dashboard-ai-card glass-panel dashboard-interactive-card"
              variants={cardVariants}
              whileHover={cardHoverMotion}
            >
              <div className="dashboard-card-heading">
                <div>
                  <span>AI recommendation</span>
                  <h2>Next best action</h2>
                </div>
                <FiZap aria-hidden="true" />
              </div>
              <p>{recommendation}</p>
              {latestHabit && (
                <div className="dashboard-latest-entry">
                  <span>Latest log</span>
                  <strong>{formatKg(latestHabit.totalCarbonFootprint, 2)} kg CO2</strong>
                  <small>
                    {latestHabit.date}
                    {latestHabit.travel?.transportMode ? ` - ${latestHabit.travel.transportMode}` : ''}
                    {latestHabit.food?.dietType ? ` - ${latestHabit.food.dietType}` : ''}
                  </small>
                </div>
              )}
            </motion.article>
          </section>
        </>
      )}
    </motion.div>
  );
}

function DashboardTooltip({ active, payload, label, suffix }) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const name = item.name || label;
  const value = item.value ?? 0;

  return (
    <div className="dashboard-tooltip">
      <span className="dashboard-tooltip-label">{name}</span>
      <strong className="dashboard-tooltip-value">
        {formatKg(value, 2)}
        {suffix}
      </strong>
    </div>
  );
}

export default Dashboard;
