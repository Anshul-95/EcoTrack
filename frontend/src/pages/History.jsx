import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import {
  FiClock,
  FiCalendar,
  FiSearch,
  FiChevronDown,
  FiNavigation,
  FiCoffee,
  FiZap,
  FiLayers,
  FiTrendingUp,
  FiCloud
} from 'react-icons/fi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const cardHoverMotion = {
  y: -3,
  scale: 1.005,
  transition: { duration: 0.2, ease: 'easeInOut' }
};

function History() {
  const { currentUser } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI-only search, filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('Newest');

  useEffect(() => {
    if (!currentUser) return;

    const fetchHabits = async () => {
      setLoading(true);
      setError('');
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
        console.error('Error fetching habits:', err);
        setError('Failed to load carbon history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [currentUser]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    // dateStr is "YYYY-MM-DD"
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // Build rows from habit documents — one row per category per entry
  const rows = useMemo(() => {
    const fetchedRows = [];
    habits.forEach((habit) => {
      const dateStr = formatDate(habit.date);

      // Travel row
      if (habit.travel && (habit.travel.distance > 0 || habit.travel.transportMode === 'Walking' || habit.travel.transportMode === 'Cycling')) {
        fetchedRows.push({
          id: `${habit.id}-travel`,
          date: dateStr,
          rawDate: habit.date,
          category: 'Travel',
          details: `${habit.travel.transportMode} (${habit.travel.distance} km${
            ['Car Petrol', 'Car Diesel', 'Bike'].includes(habit.travel.transportMode)
              ? `, ${habit.travel.passengers} passenger(s)`
              : ''
          })`,
          emissions: `${(habit.travelEmission || 0).toFixed(1)} kg`,
        });
      }

      // Food row
      if (habit.food) {
        fetchedRows.push({
          id: `${habit.id}-food`,
          date: dateStr,
          rawDate: habit.date,
          category: 'Food',
          details: `${habit.food.dietType} diet — Food waste: ${habit.food.foodWaste}`,
          emissions: `${(habit.foodEmission || 0).toFixed(1)} kg`,
        });
      }

      // Energy row
      if (habit.energy && ((habit.energy.electricityUsage || 0) > 0 || (habit.energy.lpgUsage || 0) > 0 || (habit.energy.acUsage || 0) > 0)) {
        const parts = [];
        if (habit.energy.electricityUsage > 0) parts.push(`${habit.energy.electricityUsage} kWh elec`);
        if (habit.energy.lpgUsage > 0) parts.push(`${habit.energy.lpgUsage} hr LPG`);
        if (habit.energy.acUsage > 0) parts.push(`${habit.energy.acUsage} hr AC`);
        fetchedRows.push({
          id: `${habit.id}-energy`,
          date: dateStr,
          rawDate: habit.date,
          category: 'Energy',
          details: parts.join(', '),
          emissions: `${(habit.energyEmission || 0).toFixed(1)} kg`,
        });
      }
    });
    return fetchedRows;
  }, [habits]);

  // Global Statistics (Calculated from unfiltered rows)
  const totalRecords = rows.length;
  const totalCO2 = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.emissions) || 0), 0);
  }, [rows]);

  const categorySums = useMemo(() => {
    return rows.reduce((acc, row) => {
      const val = parseFloat(row.emissions) || 0;
      acc[row.category] = (acc[row.category] || 0) + val;
      return acc;
    }, { Travel: 0, Food: 0, Energy: 0 });
  }, [rows]);

  const highestCategory = useMemo(() => {
    let highest = '—';
    let maxVal = -1;
    Object.entries(categorySums).forEach(([cat, val]) => {
      if (val > maxVal && val > 0) {
        maxVal = val;
        highest = cat;
      }
    });
    return highest;
  }, [categorySums]);

  const avgDaily = useMemo(() => {
    const uniqueDates = new Set(rows.map(r => r.rawDate)).size;
    return uniqueDates > 0 ? totalCO2 / uniqueDates : 0;
  }, [rows, totalCO2]);

  const statCards = [
    {
      label: 'Total Records',
      value: totalRecords,
      unit: 'logs',
      icon: FiLayers,
      accent: 'blue',
    },
    {
      label: 'Total CO₂ Logged',
      value: totalCO2.toFixed(1),
      unit: 'kg',
      icon: FiCloud,
      accent: 'mint',
    },
    {
      label: 'Highest Category',
      value: highestCategory,
      unit: highestCategory !== '—' ? `${categorySums[highestCategory].toFixed(1)} kg` : '',
      icon: FiTrendingUp,
      accent: 'amber',
    },
    {
      label: 'Average Daily',
      value: avgDaily.toFixed(1),
      unit: 'kg/day',
      icon: FiZap,
      accent: 'violet',
    },
  ];

  // Filtering & Sorting Logic
  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => row.details.toLowerCase().includes(term));
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter(row => row.category === categoryFilter);
    }

    // Date filter
    if (dateFilter) {
      result = result.filter(row => row.rawDate === dateFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'Newest') {
        return new Date(b.rawDate) - new Date(a.rawDate);
      } else if (sortBy === 'Oldest') {
        return new Date(a.rawDate) - new Date(b.rawDate);
      } else if (sortBy === 'Highest Emission') {
        const valA = parseFloat(a.emissions) || 0;
        const valB = parseFloat(b.emissions) || 0;
        if (valB !== valA) {
          return valB - valA;
        }
        return new Date(b.rawDate) - new Date(a.rawDate);
      }
      return 0;
    });

    return result;
  }, [rows, searchTerm, categoryFilter, dateFilter, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('All');
    setDateFilter('');
    setSortBy('Newest');
  };

  return (
    <motion.div
      className="history-shell"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.section className="history-hero" variants={cardVariants}>
        <div className="history-hero-content">
          <span className="history-eyebrow">
            <FiClock aria-hidden="true" />
            Activity Ledger
          </span>
          <h1>Carbon Emission History</h1>
          <p>
            Review and analyze your previous carbon activities, track changes, and observe environmental trends over time.
          </p>
        </div>

        <div className="history-hero-actions">
          <div className="dashboard-hero-badge date-badge">
            <span className="dashboard-hero-badge-icon">📅</span>
            <div className="dashboard-hero-badge-content">
              <span className="dashboard-hero-badge-label">Today's Date</span>
              <span className="dashboard-hero-badge-value">{formattedDate}</span>
            </div>
          </div>
        </div>
      </motion.section>

      {loading ? (
        <motion.div className="dashboard-loading glass-panel" variants={cardVariants} style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiZap aria-hidden="true" className="animate-pulse" style={{ fontSize: '32px', marginBottom: '16px', color: 'var(--primary)' }} />
          <div>Loading emission history...</div>
        </motion.div>
      ) : error ? (
        <motion.div
          variants={cardVariants}
          style={{
            padding: '16px 20px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            borderRadius: '16px',
            fontSize: '14px',
            textAlign: 'left'
          }}
        >
          {error}
        </motion.div>
      ) : rows.length === 0 ? (
        /* Entirely empty database state */
        <motion.section className="history-empty-container" variants={cardVariants}>
          <FiCloud aria-hidden="true" className="history-empty-icon" />
          <h2 className="history-empty-title">No activities logged yet</h2>
          <p className="history-empty-text">
            Start tracking your carbon footprint and log your environmental habits today!
          </p>
          <Link to="/log" className="btn">
            Log Activity
          </Link>
        </motion.section>
      ) : (
        <>
          {/* Summary Cards */}
          <section className="history-stats-grid" aria-label="History summary metrics">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.article
                  className={`history-stat-card glass-panel history-interactive-card ${item.accent}`}
                  variants={cardVariants}
                  whileHover={cardHoverMotion}
                  key={item.label}
                >
                  <div className="history-stat-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <span>{item.label}</span>
                  <strong>
                    {item.value} {item.unit && <small>{item.unit}</small>}
                  </strong>
                </motion.article>
              );
            })}
          </section>

          {/* Interactive Toolbar */}
          <motion.section className="history-toolbar" variants={cardVariants}>
            <div className="history-toolbar-left">
              {/* Search activity */}
              <div className="history-search-input-wrapper">
                <FiSearch className="history-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search by activity..."
                  className="history-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search carbon activities"
                />
              </div>

              {/* Category chips filter */}
              <div className="filter-chips" aria-label="Filter by category">
                {['All', 'Travel', 'Food', 'Energy'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-chip ${categoryFilter === cat ? `active chip-${cat.toLowerCase()}` : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="history-date-filter-wrapper">
                <FiCalendar className="history-date-icon" aria-hidden="true" />
                <input
                  type="date"
                  className="history-date-input"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  aria-label="Filter by date"
                />
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => setDateFilter('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    aria-label="Clear date filter"
                  >
                    <span style={{ fontSize: '18px' }}>&times;</span>
                  </button>
                )}
              </div>
            </div>

            <div className="history-toolbar-right">
              {/* Sort Select */}
              <div className="history-select-wrapper">
                <select
                  className="history-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort activities list"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Highest Emission">Highest Emission</option>
                </select>
                <FiChevronDown className="history-select-arrow" aria-hidden="true" />
              </div>
            </div>
          </motion.section>

          {/* Cards List / Empty State if no matches */}
          {filteredRows.length === 0 ? (
            <motion.section className="history-empty-container" variants={cardVariants}>
              <FiCloud aria-hidden="true" className="history-empty-icon" style={{ opacity: 0.4 }} />
              <h2 className="history-empty-title">No activities match filters</h2>
              <p className="history-empty-text">
                Try adjusting your search terms, changing the selected category, or resetting all filters.
              </p>
              <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            </motion.section>
          ) : (
            <motion.section
              className="history-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              aria-label="Carbon emission ledger entries"
            >
              {filteredRows.map((row) => {
                const isTravel = row.category === 'Travel';
                const isFood = row.category === 'Food';
                const isEnergy = row.category === 'Energy';

                let Icon = FiCloud;
                let catClass = '';
                if (isTravel) {
                  Icon = FiNavigation;
                  catClass = 'travel';
                } else if (isFood) {
                  Icon = FiCoffee;
                  catClass = 'food';
                } else if (isEnergy) {
                  Icon = FiZap;
                  catClass = 'energy';
                }

                return (
                  <motion.article
                    key={row.id}
                    className={`history-entry-card card-${catClass}`}
                    variants={cardVariants}
                    whileHover={cardHoverMotion}
                  >
                    <div className="history-card-left">
                      <div className={`history-icon-wrapper icon-${catClass}`}>
                        <Icon aria-hidden="true" />
                      </div>
                      <div className="history-card-info">
                        <h3 className="history-card-details">{row.details}</h3>
                        <div className="history-card-meta">
                          <span className="history-card-date">
                            <FiCalendar aria-hidden="true" />
                            {row.date}
                          </span>
                          <span className={`badge badge-${catClass}`}>
                            {row.category}
                          </span>
                          <span className="badge badge-logged">
                            Logged
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="history-card-right">
                      <span className="history-emission-value">
                        {parseFloat(row.emissions).toFixed(1)}
                      </span>
                      <span className="history-emission-unit">
                        kg CO₂
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </motion.section>
          )}
        </>
      )}
    </motion.div>
  );
}

export default History;

