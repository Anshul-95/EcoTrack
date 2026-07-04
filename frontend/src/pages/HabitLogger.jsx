import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bike,
  Bus,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  Plane,
  RotateCcw,
  Salad,
  Save,
  Sparkles,
  Train,
  Utensils,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// ── Emission Factors ──────────────────────────────────────────────
const TRAVEL_FACTORS = {
  'Car Petrol': 0.18,
  'Car Diesel': 0.17,
  'Bike': 0.10,
  'Bus': 0.04,
  'Train': 0.03,
  'Flight': 0.25,
  'Walking': 0.0,
  'Cycling': 0.0,
};

const FOOD_FACTORS = {
  'Vegan': 1.5,
  'Vegetarian': 2.5,
  'Eggetarian': 3.0,
  'Non-Vegetarian': 4.0,
};
const FOOD_WASTE_PENALTY = 0.5; // kg CO₂ added when food is wasted

const ENERGY_FACTORS = {
  electricity: 0.82, // kg CO₂ per kWh
  lpg: 2.0,          // kg CO₂ per hour
  ac: 0.9,           // kg CO₂ per hour
};

// ── Helpers ───────────────────────────────────────────────────────
const PERSONAL_VEHICLES = ['Car Petrol', 'Car Diesel', 'Bike'];

const TRANSPORT_OPTIONS = [
  { value: 'Car Petrol', label: 'Car Petrol', icon: Car, hint: 'Private commute' },
  { value: 'Car Diesel', label: 'Car Diesel', icon: Car, hint: 'Private commute' },
  { value: 'Bike', label: 'Bike', icon: Bike, hint: 'Motorbike / Scooter' },
  { value: 'Bus', label: 'Bus', icon: Bus, hint: 'Public transit' },
  { value: 'Train', label: 'Train', icon: Train, hint: 'Rail / Metro' },
  { value: 'Flight', label: 'Flight', icon: Plane, hint: 'Aviation' },
  { value: 'Walking', label: 'Walking', icon: Leaf, hint: 'Zero direct CO2' },
  { value: 'Cycling', label: 'Cycling', icon: Bike, hint: 'Zero direct CO2' },
];

const DIET_OPTIONS = [
  { value: 'Vegan', label: 'Vegan', hint: 'Plant-based', tone: 'mint' },
  { value: 'Vegetarian', label: 'Vegetarian', hint: 'No meat', tone: 'blue' },
  { value: 'Eggetarian', label: 'Eggetarian', hint: 'Includes eggs', tone: 'violet' },
  { value: 'Non-Vegetarian', label: 'Non-Vegetarian', hint: 'Meat-based', tone: 'amber' },
];

const ENERGY_FIELDS = [
  {
    name: 'electricityUsage',
    label: 'Electricity Usage',
    unit: 'kWh',
    max: 30,
    step: '0.5',
    hint: 'Average Indian household uses ~3-5 kWh/day.',
  },
  {
    name: 'lpgUsage',
    label: 'LPG Usage',
    unit: 'hours',
    max: 8,
    step: '0.25',
    hint: 'Typical cooking: 0.5-2 hours/day.',
  },
  {
    name: 'acUsage',
    label: 'AC Usage',
    unit: 'hours',
    max: 16,
    step: '0.25',
    hint: 'Each hour of AC adds ~0.9 kg CO2.',
  },
];

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } },
};

function calculateTravelEmission(travel) {
  const factor = TRAVEL_FACTORS[travel.transportMode] || 0;
  const distance = parseFloat(travel.distance) || 0;
  const passengers = Math.max(parseInt(travel.passengers) || 1, 1);
  if (PERSONAL_VEHICLES.includes(travel.transportMode)) {
    return (distance * factor) / passengers;
  }
  return distance * factor;
}

function calculateFoodEmission(food) {
  const base = FOOD_FACTORS[food.dietType] || 2.5;
  const wastePenalty = food.foodWaste === 'Yes' ? FOOD_WASTE_PENALTY : 0;
  return base + wastePenalty;
}

function calculateEnergyEmission(energy) {
  const elec = (parseFloat(energy.electricityUsage) || 0) * ENERGY_FACTORS.electricity;
  const lpg  = (parseFloat(energy.lpgUsage) || 0) * ENERGY_FACTORS.lpg;
  const ac   = (parseFloat(energy.acUsage) || 0) * ENERGY_FACTORS.ac;
  return elec + lpg + ac;
}

// ── Component ─────────────────────────────────────────────────────
function HabitLogger() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [travel, setTravel] = useState({
    transportMode: 'Walking',
    distance: '',
    passengers: '1',
  });

  const [food, setFood] = useState({
    dietType: 'Vegetarian',
    foodWaste: 'No',
  });

  const [energy, setEnergy] = useState({
    electricityUsage: '',
    lpgUsage: '',
    acUsage: '',
  });

  // Derived emissions (computed when reaching step 4)
  const [emissions, setEmissions] = useState(null);

  // ── Input handlers ──────────────────────────────────────────────
  const handleTravelChange = (e) => {
    const { name, value } = e.target;
    setTravel((prev) => ({ ...prev, [name]: value }));
  };

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setFood((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnergyChange = (e) => {
    const { name, value } = e.target;
    setEnergy((prev) => ({ ...prev, [name]: value }));
  };

  // ── Validation ──────────────────────────────────────────────────
  const validateStep = () => {
    setError('');
    if (step === 1) {
      const dist = parseFloat(travel.distance);
      if (travel.distance === '' || isNaN(dist) || dist < 0) {
        setError('Please enter a valid distance (0 or more).');
        return false;
      }
      if (PERSONAL_VEHICLES.includes(travel.transportMode)) {
        const p = parseInt(travel.passengers);
        if (isNaN(p) || p < 1) {
          setError('Number of passengers must be at least 1.');
          return false;
        }
      }
    } else if (step === 3) {
      const elec = parseFloat(energy.electricityUsage);
      const lpg = parseFloat(energy.lpgUsage);
      const ac = parseFloat(energy.acUsage);
      if (energy.electricityUsage !== '' && (isNaN(elec) || elec < 0)) {
        setError('Electricity usage must be 0 or more.');
        return false;
      }
      if (energy.lpgUsage !== '' && (isNaN(lpg) || lpg < 0)) {
        setError('LPG usage must be 0 or more.');
        return false;
      }
      if (energy.acUsage !== '' && (isNaN(ac) || ac < 0)) {
        setError('AC usage must be 0 or more.');
        return false;
      }
    }
    return true;
  };

  // ── Navigation ──────────────────────────────────────────────────
  const handleNext = () => {
    if (!validateStep()) return;
    const nextStep = step + 1;

    // When entering step 4 (Summary), compute emissions
    if (nextStep === 4) {
      const travelCO2 = calculateTravelEmission(travel);
      const foodCO2 = calculateFoodEmission(food);
      const energyCO2 = calculateEnergyEmission(energy);
      setEmissions({
        travel: parseFloat(travelCO2.toFixed(2)),
        food: parseFloat(foodCO2.toFixed(2)),
        energy: parseFloat(energyCO2.toFixed(2)),
        total: parseFloat((travelCO2 + foodCO2 + energyCO2).toFixed(2)),
      });
    }
    setStep(nextStep);
  };

  const handleBack = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  // ── Save to Firestore ───────────────────────────────────────────
  const handleSave = async () => {
    if (!currentUser || !emissions) return;
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      await addDoc(collection(db, 'users', currentUser.uid, 'habits'), {
        date: today.toISOString().split('T')[0],
        timestamp: serverTimestamp(),
        travel: {
          transportMode: travel.transportMode,
          distance: parseFloat(travel.distance) || 0,
          passengers: parseInt(travel.passengers) || 1,
        },
        food: {
          dietType: food.dietType,
          foodWaste: food.foodWaste,
        },
        energy: {
          electricityUsage: parseFloat(energy.electricityUsage) || 0,
          lpgUsage: parseFloat(energy.lpgUsage) || 0,
          acUsage: parseFloat(energy.acUsage) || 0,
        },
        travelEmission: emissions.travel,
        foodEmission: emissions.food,
        energyEmission: emissions.energy,
        totalCarbonFootprint: emissions.total,
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error saving habit:', err);
      setError('Failed to save habit log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setError('');
    setSuccess(false);
    setEmissions(null);
    setTravel({
      transportMode: 'Walking',
      distance: '',
      passengers: '1',
    });
    setFood({
      dietType: 'Vegetarian',
      foodWaste: 'No',
    });
    setEnergy({
      electricityUsage: '',
      lpgUsage: '',
      acUsage: '',
    });
  };

  // ── Render helpers ──────────────────────────────────────────────
  const stepNames = ['Travel', 'Food', 'Energy', 'Summary'];
  const progress = ((step - 1) / (stepNames.length - 1)) * 100;
  const liveEmissions = useMemo(() => {
    const travelCO2 = calculateTravelEmission(travel);
    const foodCO2 = calculateFoodEmission(food);
    const energyCO2 = calculateEnergyEmission(energy);

    return {
      travel: parseFloat(travelCO2.toFixed(2)),
      food: parseFloat(foodCO2.toFixed(2)),
      energy: parseFloat(energyCO2.toFixed(2)),
      total: parseFloat((travelCO2 + foodCO2 + energyCO2).toFixed(2)),
    };
  }, [travel, food, energy]);
  const visibleEmissions = emissions || liveEmissions;
  const distanceInvalid = error.includes('distance');
  const passengersInvalid = error.includes('passengers');
  const electricityInvalid = error.includes('Electricity');
  const lpgInvalid = error.includes('LPG');
  const acInvalid = error.includes('AC');
  const hasInlineValidation =
    distanceInvalid || passengersInvalid || electricityInvalid || lpgInvalid || acInvalid;

  return (
    <motion.div
      className="habit-shell"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="habit-hero" variants={cardVariants}>
        <div>
          <span className="habit-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Daily carbon entry
          </span>
          <h1>Log Today's Habits</h1>
          <p>Capture travel, food, and energy habits to estimate your daily carbon footprint.</p>
        </div>
        <div className="habit-step-pill">Step {step} of {stepNames.length}</div>
      </motion.section>

      <motion.div className="habit-progress-card habit-glass" variants={cardVariants}>
        <div className="habit-progress-line" aria-hidden="true">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
        <div className="habit-stepper" aria-label="Habit logging progress">
          {stepNames.map((name, index) => {
            const num = index + 1;
            const isDone = step > num;
            const isCurrent = step === num;
            return (
              <div className={`habit-step-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`} key={name}>
                <span>{isDone ? <Check size={15} aria-hidden="true" /> : num}</span>
                <strong>{name}</strong>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="habit-layout">
        <motion.div className="habit-workspace" variants={cardVariants}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.section
                key="travel"
                className="habit-step-card habit-glass"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
              >
                <StepHeading icon={<Car aria-hidden="true" />} title="Travel" subtitle="Choose how you moved today." />

                <div className="habit-option-grid transport">
                  {TRANSPORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = travel.transportMode === option.value;
                    return (
                      <label className={`habit-option-card ${selected ? 'selected' : ''}`} key={option.value}>
                        <input
                          type="radio"
                          name="transportMode"
                          value={option.value}
                          checked={selected}
                          onChange={handleTravelChange}
                        />
                        <Icon size={22} aria-hidden="true" />
                        <strong>{option.label}</strong>
                        <span>{option.hint}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="habit-field-grid">
                  <div className={`habit-field ${distanceInvalid ? 'invalid' : ''}`}>
                    <label htmlFor="distance">Distance</label>
                    <div className="habit-input-wrap">
                      <input
                        type="number"
                        id="distance"
                        name="distance"
                        placeholder="15"
                        value={travel.distance}
                        onChange={handleTravelChange}
                        min="0"
                        step="any"
                        required
                      />
                      <span>km</span>
                    </div>
                    {distanceInvalid && <small>{error}</small>}
                  </div>

                  {PERSONAL_VEHICLES.includes(travel.transportMode) && (
                    <div className={`habit-field ${passengersInvalid ? 'invalid' : ''}`}>
                      <label htmlFor="passengers">Passengers</label>
                      <div className="habit-input-wrap">
                        <input
                          type="number"
                          id="passengers"
                          name="passengers"
                          value={travel.passengers}
                          onChange={handleTravelChange}
                          min="1"
                          required
                        />
                        <span>people</span>
                      </div>
                      <small>{passengersInvalid ? error : 'Sharing rides splits travel emissions.'}</small>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="food"
                className="habit-step-card habit-glass"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
              >
                <StepHeading icon={<Salad aria-hidden="true" />} title="Food" subtitle="Select your meal profile and waste impact." />

                <div className="habit-option-grid food">
                  {DIET_OPTIONS.map((option) => {
                    const selected = food.dietType === option.value;
                    return (
                      <label className={`habit-option-card ${option.tone} ${selected ? 'selected' : ''}`} key={option.value}>
                        <input
                          type="radio"
                          name="dietType"
                          value={option.value}
                          checked={selected}
                          onChange={handleFoodChange}
                        />
                        <Utensils size={22} aria-hidden="true" />
                        <strong>{option.label}</strong>
                        <span>{option.hint}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="habit-chip-group" role="radiogroup" aria-label="Food waste">
                  <span>Food Waste</span>
                  <div>
                    {['No', 'Yes'].map((opt) => (
                      <label className={`habit-chip ${food.foodWaste === opt ? 'selected' : ''}`} key={opt}>
                        <input
                          type="radio"
                          name="foodWaste"
                          value={opt}
                          checked={food.foodWaste === opt}
                          onChange={handleFoodChange}
                        />
                        {opt === 'No' ? 'Low waste' : 'Food wasted'}
                      </label>
                    ))}
                  </div>
                  <small>Food waste adds +{FOOD_WASTE_PENALTY} kg CO2 to your daily food footprint.</small>
                </div>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                key="energy"
                className="habit-step-card habit-glass"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
              >
                <StepHeading icon={<Zap aria-hidden="true" />} title="Energy" subtitle="Estimate household energy usage for today." />

                <div className="habit-energy-grid">
                  {ENERGY_FIELDS.map((field) => {
                    const invalid =
                      (field.name === 'electricityUsage' && electricityInvalid) ||
                      (field.name === 'lpgUsage' && lpgInvalid) ||
                      (field.name === 'acUsage' && acInvalid);
                    const value = energy[field.name];

                    return (
                      <div className={`habit-energy-card ${invalid ? 'invalid' : ''}`} key={field.name}>
                        <div className="habit-energy-label">
                          <label htmlFor={field.name}>{field.label}</label>
                          <strong>{value || 0} {field.unit}</strong>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={field.max}
                          step={field.step}
                          name={field.name}
                          value={Math.min(parseFloat(value) || 0, field.max)}
                          onChange={handleEnergyChange}
                          aria-label={`${field.label} slider`}
                        />
                        <div className="habit-input-wrap compact">
                          <input
                            type="number"
                            id={field.name}
                            name={field.name}
                            placeholder="0"
                            value={value}
                            onChange={handleEnergyChange}
                            min="0"
                            step="any"
                          />
                          <span>{field.unit}</span>
                        </div>
                        <small>{invalid ? error : field.hint}</small>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {step === 4 && emissions && (
              <motion.section
                key="summary"
                className="habit-step-card habit-glass"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
              >
                <StepHeading icon={<Flame aria-hidden="true" />} title="Summary" subtitle="Review the estimate before saving." />

                <div className="habit-total-card">
                  <span>Estimated Carbon Footprint</span>
                  <strong>{emissions.total} <small>kg CO2</small></strong>
                </div>

                <div className="habit-review-grid">
                  <ReviewCard label="Travel" value={`${travel.transportMode} - ${travel.distance || 0} km`} amount={emissions.travel} />
                  <ReviewCard label="Food" value={`${food.dietType} - Waste: ${food.foodWaste}`} amount={emissions.food} />
                  <ReviewCard label="Energy" value={`${energy.electricityUsage || 0} kWh, ${energy.lpgUsage || 0} LPG hr, ${energy.acUsage || 0} AC hr`} amount={emissions.energy} />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {error && !hasInlineValidation && (
            <motion.div className="habit-alert error" variants={cardVariants}>
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div className="habit-alert success" variants={cardVariants}>
              <Check size={18} aria-hidden="true" />
              Habit logged successfully. Redirecting to Dashboard...
            </motion.div>
          )}

          <motion.div className="habit-actions" variants={cardVariants}>
            <button
              type="button"
              className="habit-btn secondary"
              onClick={handleReset}
              disabled={loading || success}
            >
              <RotateCcw size={17} aria-hidden="true" />
              Reset
            </button>

            <div className="habit-action-group">
              {step > 1 && (
                <button
                  type="button"
                  className="habit-btn ghost"
                  onClick={handleBack}
                  disabled={loading || success}
                >
                  <ChevronLeft size={17} aria-hidden="true" />
                  Back
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="habit-btn primary" onClick={handleNext}>
                  Next
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="habit-btn primary"
                  onClick={handleSave}
                  disabled={loading || success || !emissions}
                >
                  <Save size={17} aria-hidden="true" />
                  {loading ? 'Saving...' : success ? 'Saved' : 'Confirm & Log Habit'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>

        <motion.aside className="habit-summary habit-glass" variants={cardVariants}>
          <div className="habit-summary-heading">
            <span>Live summary</span>
            <strong>{visibleEmissions.total} kg CO2</strong>
          </div>

          <div className="habit-summary-list">
            <SummaryRow label="Travel" value={`${visibleEmissions.travel} kg`} active={step >= 1} />
            <SummaryRow label="Food" value={`${visibleEmissions.food} kg`} active={step >= 2} />
            <SummaryRow label="Energy" value={`${visibleEmissions.energy} kg`} active={step >= 3} />
          </div>

          <div className="habit-summary-total">
            <span>Estimated Carbon Footprint</span>
            <strong>{visibleEmissions.total} <small>kg CO2</small></strong>
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}

function StepHeading({ icon, title, subtitle }) {
  return (
    <div className="habit-step-heading">
      <div className="habit-step-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, active }) {
  return (
    <div className={`habit-summary-row ${active ? 'active' : ''}`}>
      <span>{active ? '✓' : '•'} {label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ReviewCard({ label, value, amount }) {
  return (
    <div className="habit-review-card">
      <span>✓ {label}</span>
      <p>{value}</p>
      <strong>{amount} kg</strong>
    </div>
  );
}

export default HabitLogger;
