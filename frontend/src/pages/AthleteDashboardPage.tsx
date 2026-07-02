import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import './AthleteDashboardPage.css';

interface SetRow { label: string; target: string; }

// TEMP mock data — swap for fetches once /api/get-today-workout etc exist
const todaysSets: SetRow[] = [
  { label: 'Back Squat', target: '4 × 8 @ 185lb' },
  { label: 'Romanian Deadlift', target: '3 × 10' },
  { label: 'Walking Lunge', target: '3 × 12 / side' },
];

const last7Days = [true, true, false, true, true, true, false]; // punch card, oldest → today
const macros = { protein: 148, carbs: 210, fat: 62, calorieGoal: 2400, caloriesSoFar: 1680 };

function AthleteDashboardPage() {
  const [completed, setCompleted] = useState(false);
  const pct = Math.round((macros.caloriesSoFar / macros.calorieGoal) * 100);

  return (
    <div className="athleteDash">
      <PageTitle />
      <LoggedInName />

      <section className="laneCard">
        <div className="laneCard-info">
          <span className="laneCard-eyebrow">Today's session</span>
          <h2 className="laneCard-title">Lower Body Strength</h2>
          <ul className="splitList">
            {todaysSets.map((s) => (
              <li key={s.label}>
                <span className="splitLabel">{s.label}</span>
                <span className="splitDots" />
                <span className="splitTarget">{s.target}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`completeBtn ${completed ? 'completeBtn--done' : ''}`}
            onClick={() => setCompleted(!completed)}
          >
            {completed ? '✓ Marked complete' : 'Mark session complete'}
          </button>
        </div>

        <div className="chalkRing" role="img" aria-label={completed ? 'Session complete' : 'Session pending'}>
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" className="ring-track" />
            <circle
              cx="60" cy="60" r="52"
              className="ring-progress"
              style={{ strokeDashoffset: completed ? 0 : 326.7 * 0.35 }}
            />
          </svg>
          <span className="ringLabel">{completed ? 'DONE' : '3 EXER.'}</span>
        </div>
      </section>

      <section className="streakBlock">
        <h3>Last 7 days</h3>
        <div className="punchCard">
          {last7Days.map((done, i) => (
            <span key={i} className={`punch ${done ? 'punch--filled' : ''}`} />
          ))}
        </div>
      </section>

      <section className="nutritionBlock">
        <h3>Today's fuel</h3>
        <div className="macroBar">
          <div className="macroBar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <p className="macroText">
          <span className="macroNum">{macros.caloriesSoFar}</span> / {macros.calorieGoal} kcal
        </p>
        <div className="macroGrid">
          <div><span className="macroNum">{macros.protein}g</span><small>Protein</small></div>
          <div><span className="macroNum">{macros.carbs}g</span><small>Carbs</small></div>
          <div><span className="macroNum">{macros.fat}g</span><small>Fat</small></div>
        </div>
      </section>

      <section className="coachNote">
        <span className="coachNote-eyebrow">From your coach</span>
        <p>"Great work on last week's session — let's push the squat weight up a bit."</p>
      </section>
    </div>
  );
}

export default AthleteDashboardPage;