import { useState, useEffect } from 'react';
import { Container, ListGroup, Form, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import { getMyAssignments, logExerciseTime, logMeal, getMyMeals } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AthleteDashboard() {
  const [range, setRange] = useState('today');
  const [assignments, setAssignments] = useState([]);
  const [meal, setMeal] = useState({ name: '', calories: '' , time: '', date: ''});
  const [meals, setMeals] = useState([]);
  const [msg, setMsg] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
  logout();
  navigate('/login');
  };

  useEffect(() => {
    let cancelled = false;

    getMyAssignments(range)
      .then(({ data }) => { if (!cancelled) setAssignments(data); })
      .catch((err) => { if (!cancelled) setMsg(err.response?.data?.error || 'Failed to load assignments.'); });
    return () => { cancelled = true; };
  }, [range]);
  useEffect(() => {
  getMyMeals().then(({ data }) => setMeals(data));
  }, []);

  const handleLogTime = async (assignmentId, minutes) => {
    try{
      await logExerciseTime(assignmentId, minutes);
      setMsg('Time logged.');
      const { data } = await getMyAssignments(range);
      setAssignments(data);
    }catch (err)
    {
      setMsg(err.response?.data?.error || 'Failed to log time.');
    }
  };

  const handleLogMeal = async (e) => {
    try{
      e.preventDefault();
      await logMeal({ ...meal, date: new Date().toISOString() });
      setMeal({ name: '', calories: '' });
      const { data } = await getMyMeals();
      setMeals(data);
    }catch (err)
    {
      setMsg(err.response?.data?.error || 'Failed to log meals.');
    }
  };

  return (
    <Container className="mt-4">
      <h2>My Calendar</h2>
      {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}
    
      <Tabs activeKey={range} onSelect={(k) => setRange(k)} className="mb-3">
        <Tab eventKey="today" title="Today" />
        <Tab eventKey="week" title="This Week" />
      </Tabs>

      <ListGroup className="mb-4">
        {assignments.length === 0 && (
          <ListGroup.Item className="text-muted">Nothing assigned for this range.</ListGroup.Item>
        )}
        {assignments.map((a) => (
          <ListGroup.Item key={a._id} className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{a.exercise.name}</strong> — due {new Date(a.dueDate).toLocaleDateString()}
              {a.loggedMinutes && <span className="text-success ms-2">✓ {a.loggedMinutes} min logged</span>}
            </div>
            {!a.loggedMinutes && (
              <LogTimeInline onLog={(minutes) => handleLogTime(a._id, minutes)} />
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>

      <h5>Log a Meal</h5>
      <Form onSubmit={handleLogMeal} className="d-flex gap-2">
        <Form.Control
          placeholder="Meal name" value={meal.name}
          onChange={(e) => setMeal({ ...meal, name: e.target.value })} required
        />
        <Form.Control
          type="number" placeholder="Calories" style={{ maxWidth: 140 }}
          value={meal.calories}
          onChange={(e) => setMeal({ ...meal, calories: e.target.value })} required
        />
        <Button type="submit">Log</Button>
      </Form>
      <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Sign Out</Button>
    </Container>
  );
}

function LogTimeInline({ onLog }) {
  const [minutes, setMinutes] = useState('');
  return (
    <Form
      className="d-flex gap-2"
      onSubmit={(e) => { e.preventDefault(); onLog(Number(minutes)); }}
    >
      <Form.Control
        size="sm" type="number" placeholder="min" style={{ width: 70 }}
        value={minutes} onChange={(e) => setMinutes(e.target.value)} required
      />
      <Button size="sm" type="submit">Log</Button>
    </Form>
  );
}
