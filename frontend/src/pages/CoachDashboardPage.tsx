import { useState } from 'react';
import PageTitle from '../components/PageTitle';
import LoggedInName from '../components/LoggedInName';
import './CoachDashboardPage.css';

interface AthleteRow {
  id: string;
  name: string;
  lastSession: string;
  status: 'done' | 'pending' | 'missed';
  streak: number;
}

// TEMP mock data — swap for a fetch to /api/get-athletes once wired up
const mockAthletes: AthleteRow[] = [
  { id: '1', name: 'Jane Doe',    lastSession: 'Back Squat 4x8', status: 'done',    streak: 5 },
  { id: '2', name: 'Mike Jones',  lastSession: 'Interval Run',   status: 'pending', streak: 2 },
  { id: '3', name: 'Priya Nair',  lastSession: 'Upper Push',     status: 'done',    streak: 9 },
  { id: '4', name: 'Sam Ortiz',   lastSession: 'Rest Day',       status: 'missed',  streak: 0 },
];

function CoachDashboardPage() {
  const [athletes] = useState<AthleteRow[]>(mockAthletes);
  const adherence = Math.round(
    (athletes.filter(a => a.status === 'done').length / athletes.length) * 100
  );

  return (
    <div className="coachDash">
      <PageTitle />
      <LoggedInName />

      <section className="scoreboard" aria-label="Team overview">
        <div className="scoreboard-cell">
          <span className="scoreboard-value">{athletes.length}</span>
          <span className="scoreboard-label">Athletes</span>
        </div>
        <div className="scoreboard-divider" />
        <div className="scoreboard-cell">
          <span className="scoreboard-value">{adherence}%</span>
          <span className="scoreboard-label">Adherence</span>
        </div>
        <div className="scoreboard-divider" />
        <div className="scoreboard-cell">
          <span className="scoreboard-value">3</span>
          <span className="scoreboard-label">Unread</span>
        </div>
      </section>

      <div className="rosterHeader">
        <h2>Roster</h2>
        <button type="button" className="primaryBtn">+ Assign workout</button>
      </div>

      <ul className="roster">
        {athletes.map((a, i) => (
          <li key={a.id} className="rosterCard">
            <span className="laneNumber">{String(i + 1).padStart(2, '0')}</span>
            <div className="rosterInfo">
              <span className="rosterName">{a.name}</span>
              <span className="rosterSession">{a.lastSession}</span>
            </div>
            <span className={`statusMark statusMark--${a.status}`} aria-label={a.status}>
              {a.status === 'done' ? '✓' : a.status === 'pending' ? '…' : '—'}
            </span>
            <span className="streak" title={`${a.streak}-day streak`}>
              {a.streak}<small>d streak</small>
            </span>
            <div className="rosterActions">
              <button type="button" className="ghostBtn">Message</button>
              <button type="button" className="ghostBtn">View</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CoachDashboardPage;