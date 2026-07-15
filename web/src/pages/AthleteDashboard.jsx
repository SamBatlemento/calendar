import { useState, useEffect } from 'react';
import { Container, ListGroup, Form, Button, Tabs, Tab, Alert, Badge } from 'react-bootstrap';
import { getMyAssignments, logExerciseTime, logMeal, getMyMeals } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dayjsLocalizer(dayjs);

export default function AthleteDashboard() {
  const [range, setRange] = useState({start: dayjs().startOf('month').toISOString(), end: dayjs().endOf('month').toISOString(),});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [meal, setMeal] = useState({ name: '', calories: '', time: 'Breakfast', date: '' });
  const [meals, setMeals] = useState([]);
  const [msg, setMsg] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
  logout();
  navigate('/login');
  };

  useEffect(() => {
    getMyAssignments(range).then(({ data }) => setAssignments(data))
      .catch((err) => setMsg(err.response?.data?.error || 'Failed to load assignments.'));
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
    e.preventDefault();
    await logMeal({
      ...meal,
      date: meal.date ? new Date(meal.date).toISOString() : new Date().toISOString(),
    });
    setMeal({ name: '', calories: '', time: 'Breakfast', date: '' });
    const { data } = await getMyMeals();
    setMeals(data);
  };

  const events = assignments.map((a) => ({
    id: a._id,
    title: a.loggedMinutes ? `✓ ${a.exercise.name}` : a.exercise.name,
    start: new Date(a.dueDate),
    end: new Date(a.dueDate),
    allDay: true,
    resource: a,
  }));

const handleRangeChange = (visibleRange) => {
  const start = Array.isArray(visibleRange) ? visibleRange[0] : visibleRange.start;
  const end = Array.isArray(visibleRange) ? visibleRange[visibleRange.length - 1] : visibleRange.end;
  setRange({ start: dayjs(start).toISOString(), end: dayjs(end).toISOString() });
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

      <Form onSubmit={handleLogMeal} className="d-flex gap-2 flex-wrap">
        <Form.Control
          placeholder="Meal name" value={meal.name}
          onChange={(e) => setMeal({ ...meal, name: e.target.value })} required
        />
        <Form.Control
          type="number" placeholder="Calories" style={{ maxWidth: 140 }}
          value={meal.calories}
          onChange={(e) => setMeal({ ...meal, calories: e.target.value })} required
        />
        <Form.Select
          style={{ maxWidth: 160 }}
          value={meal.time}
          onChange={(e) => setMeal({ ...meal, time: e.target.value })}
        >
          <option>Breakfast</option>
          <option>Lunch</option>
          <option>Dinner</option>
          <option>Snack</option>
        </Form.Select>
        <Form.Control
          type="date" style={{ maxWidth: 180 }}
          value={meal.date}
          onChange={(e) => setMeal({ ...meal, date: e.target.value })}
        />
        <Button type="submit">Log</Button>
      </Form>

      <ListGroup className="mt-3">
        {meals.map((m) => (
          <ListGroup.Item key={m._id} className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{m.meal}</strong> — {m.calories} cal
              <span className="text-muted ms-2">{new Date(m.date).toLocaleDateString()}</span>
            </div>
            <Badge bg="secondary">{m.time}</Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>
      <div style={{ height: 600 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={(event) => setSelectedEvent(event)}
          onRangeChange={handleRangeChange}
          eventPropGetter={(event) => ({
            style: { backgroundColor: event.resource.loggedMinutes ? '#2f8f5b' : '#ff6b4a' },
          })}
        />
      </div>
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
