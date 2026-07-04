import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';

// ── Helper: compute aggregated stats from habit documents ──
function computeInsights(habits) {
  let transport = 0;
  let food = 0;
  let energy = 0;

  habits.forEach((h) => {
    transport += h.travelEmission || 0;
    food += h.foodEmission || 0;
    energy += h.energyEmission || 0;
  });

  const total = transport + food + energy;

  // Determine highest-emission category
  const categories = [
    { name: 'Transport', value: transport, icon: '🚗', color: '#0ea5e9' },
    { name: 'Food', value: food, icon: '🥗', color: '#10b981' },
    { name: 'Energy', value: energy, icon: '⚡', color: '#f59e0b' },
  ];
  const highest = categories.reduce(
    (max, cat) => (cat.value > max.value ? cat : max),
    categories[0]
  );

  return {
    transport: parseFloat(transport.toFixed(2)),
    food: parseFloat(food.toFixed(2)),
    energy: parseFloat(energy.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    highest,
    categories,
  };
}

// ── Helper: generate rule-based suggestions ──
function generateSuggestions(insights) {
  const { transport, food, energy, total, highest } = insights;
  const suggestions = [];

  // Low total → congratulate
  if (total > 0 && total < 10) {
    suggestions.push({
      icon: '🏆',
      title: 'Outstanding Work!',
      text: `Your total carbon footprint is only ${total} kg CO₂ — well below 10 kg. Keep up the amazing sustainable habits!`,
      color: '#10b981',
    });
  }

  // High transport
  if (transport > 0 && highest.name === 'Transport') {
    suggestions.push({
      icon: '🚲',
      title: 'Rethink Your Commute',
      text: `Transport is your highest emission category at ${transport} kg CO₂. Consider walking, cycling, or taking public transport for shorter trips to cut emissions significantly.`,
      color: '#0ea5e9',
    });
  }

  // High food
  if (food > 0 && highest.name === 'Food') {
    suggestions.push({
      icon: '🥬',
      title: 'Shift Your Diet',
      text: `Food accounts for your largest share at ${food} kg CO₂. Reducing red meat consumption and choosing more plant-based meals can lower your dietary footprint substantially.`,
      color: '#10b981',
    });
  }

  // High energy
  if (energy > 0 && highest.name === 'Energy') {
    suggestions.push({
      icon: '💡',
      title: 'Save Energy at Home',
      text: `Energy is your top contributor at ${energy} kg CO₂. Try switching to LED bulbs, unplugging idle devices, and optimising heating/cooling schedules.`,
      color: '#f59e0b',
    });
  }

  // General advice if total >= 10
  if (total >= 10) {
    suggestions.push({
      icon: '🌍',
      title: 'Reduce Your Overall Footprint',
      text: `Your total emissions are ${total} kg CO₂. Setting small daily reduction goals across transport, food, and energy can compound into meaningful change over time.`,
      color: '#8b5cf6',
    });
  }

  // Always add secondary tips for non-highest categories if they have emissions
  if (transport > 0 && highest.name !== 'Transport') {
    suggestions.push({
      icon: '🚶',
      title: 'Transport Tip',
      text: `Your transport emissions are ${transport} kg CO₂. Carpooling or switching one car trip a week to cycling can help.`,
      color: '#0ea5e9',
    });
  }
  if (food > 0 && highest.name !== 'Food') {
    suggestions.push({
      icon: '🍃',
      title: 'Food Tip',
      text: `Your food emissions are ${food} kg CO₂. Try a meat-free day each week to reduce your dietary impact.`,
      color: '#10b981',
    });
  }
  if (energy > 0 && highest.name !== 'Energy') {
    suggestions.push({
      icon: '🔌',
      title: 'Energy Tip',
      text: `Your energy emissions are ${energy} kg CO₂. Using natural light and shorter showers can make a difference.`,
      color: '#f59e0b',
    });
  }

  return suggestions;
}

// ── Inline styles (glassmorphism, matching EcoTrack theme) ──
const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '28px',
  },
  statCard: (accentColor) => ({
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    textAlign: 'left',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }),
  statCardGlow: (accentColor) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, ${accentColor}, transparent)`,
    borderRadius: '14px 14px 0 0',
  }),
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 600,
  },
  statValue: (color) => ({
    margin: '10px 0 0 0',
    fontSize: '32px',
    fontWeight: 700,
    color: color,
    letterSpacing: '-0.02em',
  }),
  statUnit: {
    fontSize: '14px',
    fontWeight: 400,
    color: 'var(--text-secondary)',
  },
  highlightCard: {
    marginTop: '24px',
    padding: '24px',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(14, 165, 233, 0.06) 100%)',
    borderRadius: '14px',
    border: '1px solid rgba(16, 185, 129, 0.18)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  suggestionCard: (accentColor) => ({
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '14px',
    border: `1px solid ${accentColor}22`,
    textAlign: 'left',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }),
  suggestionIcon: (accentColor) => ({
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: `${accentColor}18`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  }),
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: '20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(16, 185, 129, 0.15)',
    borderTopColor: '#10b981',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyContainer: {
    padding: '60px 20px',
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.01)',
    borderRadius: '14px',
    border: '1px dashed rgba(255, 255, 255, 0.1)',
    marginTop: '28px',
  },
};

function Suggestions() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [insights, setInsights] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

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

        if (fetched.length > 0) {
          const computed = computeInsights(fetched);
          setInsights(computed);
          setSuggestions(generateSuggestions(computed));
        }
      } catch (err) {
        console.error('Error fetching habits for insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [currentUser]);

  return (
    <div className="page-container glass-card">
      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .insight-stat-card:hover {
          border-color: rgba(16, 185, 129, 0.25) !important;
          box-shadow: 0 8px 30px rgba(16, 185, 129, 0.08) !important;
          transform: translateY(-2px) !important;
        }
        .insight-suggestion-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>

      {/* Header */}
      <div>
        <h1>AI Insights & Suggestions</h1>
        <p style={{ margin: 0 }}>
          Personalized sustainability recommendations based on your logged habits.
        </p>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <span
            className="badge connecting"
            style={{ fontSize: '13px' }}
          >
            Analysing your eco-data…
          </span>
        </div>
      ) : habits.length === 0 ? (
        /* Empty state */
        <div style={styles.emptyContainer}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>
            No Habits Logged Yet
          </h2>
          <p
            style={{
              maxWidth: '480px',
              margin: '0 auto 24px auto',
              fontSize: '15px',
            }}
          >
            Start tracking your daily transportation, diet, and energy usage to
            unlock personalised AI insights and actionable recommendations.
          </p>
          <Link to="/log" className="btn" style={{ textDecoration: 'none' }}>
            📝 Log Your First Habit
          </Link>
        </div>
      ) : (
        insights && (
          <>
            {/* ── Stat Cards ── */}
            <div style={styles.statsGrid}>
              {/* Transport */}
              <div className="insight-stat-card" style={styles.statCard('#0ea5e9')}>
                <div style={styles.statCardGlow('#0ea5e9')} />
                <span style={styles.statLabel}>🚗 Transport CO₂</span>
                <h2 style={styles.statValue('#0ea5e9')}>
                  {insights.transport}{' '}
                  <span style={styles.statUnit}>kg</span>
                </h2>
              </div>

              {/* Food */}
              <div className="insight-stat-card" style={styles.statCard('#10b981')}>
                <div style={styles.statCardGlow('#10b981')} />
                <span style={styles.statLabel}>🥗 Food CO₂</span>
                <h2 style={styles.statValue('#10b981')}>
                  {insights.food}{' '}
                  <span style={styles.statUnit}>kg</span>
                </h2>
              </div>

              {/* Energy */}
              <div className="insight-stat-card" style={styles.statCard('#f59e0b')}>
                <div style={styles.statCardGlow('#f59e0b')} />
                <span style={styles.statLabel}>⚡ Energy CO₂</span>
                <h2 style={styles.statValue('#f59e0b')}>
                  {insights.energy}{' '}
                  <span style={styles.statUnit}>kg</span>
                </h2>
              </div>

              {/* Total */}
              <div className="insight-stat-card" style={styles.statCard('#8b5cf6')}>
                <div style={styles.statCardGlow('#8b5cf6')} />
                <span style={styles.statLabel}>🌍 Total Footprint</span>
                <h2 style={styles.statValue('#8b5cf6')}>
                  {insights.total}{' '}
                  <span style={styles.statUnit}>kg CO₂</span>
                </h2>
              </div>
            </div>

            {/* ── Highest Category Highlight ── */}
            <div style={styles.highlightCard}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${insights.highest.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  flexShrink: 0,
                }}
              >
                {insights.highest.icon}
              </div>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Highest Emission Category
                </span>
                <h3
                  style={{
                    margin: '4px 0 4px 0',
                    fontSize: '22px',
                    color: insights.highest.color,
                    fontWeight: 700,
                  }}
                >
                  {insights.highest.name}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Contributing{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {insights.highest.value} kg CO₂
                  </strong>{' '}
                  (
                  {insights.total > 0
                    ? ((insights.highest.value / insights.total) * 100).toFixed(
                        1
                      )
                    : 0}
                  % of total)
                </p>
              </div>
            </div>

            {/* ── Suggestions Section ── */}
            <div style={{ marginTop: '36px' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '4px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                💡 Personalised Recommendations
              </h2>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px' }}>
                Based on your emission patterns, here's what you can do to lower
                your impact.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '20px',
                }}
              >
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="insight-suggestion-card"
                    style={styles.suggestionCard(s.color)}
                  >
                    <div
                      style={styles.statCardGlow(s.color)}
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                      }}
                    >
                      <div style={styles.suggestionIcon(s.color)}>
                        {s.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '16px',
                            fontWeight: 700,
                            color: s.color,
                          }}
                        >
                          {s.title}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {s.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── CTA ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '36px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                to="/log"
                className="btn"
                style={{ textDecoration: 'none' }}
              >
                📝 Log More Habits
              </Link>
              <Link
                to="/"
                className="btn btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                📊 View Dashboard
              </Link>
            </div>
          </>
        )
      )}
    </div>
  );
}

export default Suggestions;
