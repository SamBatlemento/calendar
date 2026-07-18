import { useState, useEffect } from 'react';
import { Container, Form, Button, ListGroup, Alert, Badge, Modal, Card, Row, Col } from 'react-bootstrap';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  getMyAssignments, logExerciseTime, logMeal, getMyMeals,
  updateMeal, deleteMeal, getGames,
} from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const localizer = dayjsLocalizer(dayjs);

export default function AthleteDashboard() {
  const [range, setRange] = useState({
    start: dayjs().startOf('month').toISOString(),
    end: dayjs().endOf('month').toISOString(),
  });
  const [assignments, setAssignments] = useState([]);
  const [games, setGames] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null); // drives the bottom panel now, not a modal
  const [minutes, setMinutes] = useState('');

  const [meals, setMeals] = useState([]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [mealDate, setMealDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [meal, setMeal] = useState({ name: '', calories: '', time: 'Breakfast', date: mealDate });

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
    getGames(range)
      .then(({ data }) => { if (!cancelled) setGames(data); })
      .catch((err) => { if (!cancelled) setMsg(err.response?.data?.error || 'Failed to load games.'); });
    return () => { cancelled = true; };
  }, [range]);

  useEffect(() => {
    getMyMeals(mealDate).then(({ data }) => setMeals(data));
  }, [mealDate]);


  const handleRangeChange = (visibleRange) => {
    const start = Array.isArray(visibleRange) ? visibleRange[0] : visibleRange.start;
    const end = Array.isArray(visibleRange) ? visibleRange[visibleRange.length - 1] : visibleRange.end;
    setRange({ start: dayjs(start).toISOString(), end: dayjs(end).toISOString() });
  };

  const exerciseEvents = assignments.map((a) => ({
    id: a._id,
    type: 'exercise',
    title: a.loggedMinutes ? `✓ ${a.exercise.name}` : a.exercise.name,
    start: parseLocalDate(a.dueDate),
    end: parseLocalDate(a.dueDate),
    allDay: true,
    resource: a,
  }));

  const gameEvents = games.map((g) => ({
    id: g._id,
    type: 'game',
    title: `🏆 ${g.title}`,
    start: parseLocalDate(g.date),
    end: parseLocalDate(g.date),
    allDay: true,
    resource: g,
  }));

  const events = [...exerciseEvents, ...gameEvents];

  useEffect(() => {
    const rows = document.querySelectorAll(".rbc-row-content[role=\"row\"]");
    rows.forEach((row) => row.removeAttribute("role"));
  }, [events]);

  // Clicking any event scrolls down to and populates the bottom panel, instead of a modal
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    document.getElementById('selected-event-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleLogTime = async (e) => {
    e.preventDefault();
    try {
      await logExerciseTime(selectedEvent.resource._id, Number(minutes));
      setMsg('Time logged.');
      setSelectedEvent(null);
      setMinutes('');
      const { data } = await getMyAssignments(range);
      setAssignments(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to log time.');
    }
  };

  const handleLogMeal = async (e) => {
    e.preventDefault();
    await logMeal({
      ...meal,
      date: meal.date ? parseLocalDate(meal.date).toISOString() : new Date().toISOString(),
    });
    setMeal({ name: '', calories: '', time: 'Breakfast', date: '' });
    const { data } = await getMyMeals(mealDate);
    setMeals(data);
  };

  const handleUpdateMeal = async (e) => {
    e.preventDefault();
    try {
      await updateMeal(editingMeal._id, {
        name: editingMeal.meal,
        calories: editingMeal.calories,
        time: editingMeal.time,
        date: parseLocalDate(editingMeal.date).toISOString(),
      });
      setMsg('Meal updated.');
      setEditingMeal(null);
      const { data } = await getMyMeals(mealDate);
      setMeals(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to update meal.');
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm('Delete this meal log?')) return;
    try {
      await deleteMeal(id);
      setMsg('Meal deleted.');
      const { data } = await getMyMeals(mealDate);
      setMeals(data);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to delete meal.');
    }
  };

  function parseLocalDate(dateInput) {
    if (!dateInput) return null;
    const datePart = typeof dateInput === 'string' ? dateInput.split('T')[0] : dayjs(dateInput).format('YYYY-MM-DD');
    return new Date(`${datePart}T00:00:00`);
  }

  return (
    <main className="theme-page" aria-labelledby="athlete-heading">
      <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 id="athlete-heading" className="theme-heading mb-0">My Calendar</h2>
          <Button variant="outline-secondary" size="sm" className="theme-btn-outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>

        {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

        <div style={{ height: 600 }} className="mb-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            onRangeChange={handleRangeChange}
            eventPropGetter={(event) => {
              const bg = event.type === 'game'
                ? '#1f4d3d'
                : event.resource.loggedMinutes ? '#2f8f5b' : '#ff6b4a';
              const textColor = event.type !== 'game' && !event.resource.loggedMinutes
                ? '#1c1f26' // dark text for the coral "not completed" events
                : '#ffffff'; // white text for forest and green events
              return {
                style: { backgroundColor: bg, color: textColor },
              };
            }}
          />
        </div>

        <div id="selected-event-panel">
          {selectedEvent && (
            <Card className="mb-4 theme-card">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <Card.Title className="theme-heading">{selectedEvent.title}</Card.Title>
                  <Button size="sm" className="theme-btn-outline" onClick={() => setSelectedEvent(null)}>
                    Close
                  </Button>
                </div>

                {selectedEvent.type === 'game' ? (
                  <div>
                    {selectedEvent.resource.location && <p>Location: {selectedEvent.resource.location}</p>}
                    <p className="theme-muted mb-0">{parseLocalDate(selectedEvent.resource.date).toLocaleDateString()}</p>
                  </div>
                ) : selectedEvent.resource.loggedMinutes ? (
                  <p className="mb-0">Logged: {selectedEvent.resource.loggedMinutes} minutes</p>
                ) : (
                  <Form onSubmit={handleLogTime} className="d-flex gap-2 align-items-end">
                    <Form.Group controlId="log-time-minutes">
                      <Form.Label>Minutes completed</Form.Label>
                      <Form.Control
                        type="number"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        required
                      />
                    </Form.Group>
                    <Button type="submit" className="theme-btn-primary">Log Time</Button>
                  </Form>
                )}
              </Card.Body>
            </Card>
          )}

          <Row>
            <Col md={6}>
              <div className="theme-card mb-4">
                <h3 className="theme-heading">Log a Meal</h3>
                <Form onSubmit={handleLogMeal} className="d-flex gap-2 flex-wrap mb-3">
                  <Form.Group controlId="log-meal-name" className="mb-0">
                    <Form.Label className="visually-hidden">Meal name</Form.Label>
                    <Form.Control
                      placeholder="Meal name" value={meal.name}
                      onChange={(e) => setMeal({ ...meal, name: e.target.value })} required
                    />
                  </Form.Group>
                  <Form.Group controlId="log-meal-calories" className="mb-0">
                    <Form.Label className="visually-hidden">Calories</Form.Label>
                    <Form.Control
                      type="number" placeholder="Calories" style={{ maxWidth: 140 }}
                      value={meal.calories}
                      onChange={(e) => setMeal({ ...meal, calories: e.target.value })} required
                    />
                  </Form.Group>
                  <Form.Group controlId="log-meal-type" className="mb-0">
                    <Form.Label className="visually-hidden">Meal type</Form.Label>
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
                  </Form.Group>
                  <Form.Group controlId="log-meal-date" className="mb-0">
                    <Form.Label className="visually-hidden">Meal date</Form.Label>
                    <Form.Control
                      type="date" style={{ maxWidth: 180 }}
                      value={meal.date}
                      onChange={(e) => setMeal({ ...meal, date: e.target.value })}
                    />
                  </Form.Group>
                  <Button type="submit" className="theme-btn-primary">Log</Button>
                </Form>

                <div className="d-flex align-items-center gap-2 mb-3">
                  <h3 className="theme-heading mb-0">Meals</h3>
                  <Button
                    size="sm" className="theme-btn-outline"
                    aria-label="View previous day"
                    onClick={() => setMealDate(dayjs(mealDate).subtract(1, 'day').format('YYYY-MM-DD'))}
                  >
                    ‹
                  </Button>
                  <Form.Group controlId="view-meal-date" className="mb-0">
                    <Form.Label className="visually-hidden">Viewing meals for date</Form.Label>
                    <Form.Control
                      type="date" style={{ maxWidth: 180 }}
                      value={mealDate}
                      onChange={(e) => setMealDate(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    size="sm" className="theme-btn-outline"
                    aria-label="View next day"
                    onClick={() => setMealDate(dayjs(mealDate).add(1, 'day').format('YYYY-MM-DD'))}
                  >
                    ›
                  </Button>
                  <Button
                    size="sm" className="theme-btn-outline"
                    onClick={() => setMealDate(dayjs().format('YYYY-MM-DD'))}
                  >
                    Today
                  </Button>
                </div>

                <ListGroup>
                  {meals.map((m) => (
                    <ListGroup.Item key={m._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{m.meal}</strong> — {m.calories} cal
                        <span className="theme-muted ms-2">{parseLocalDate(m.date).toLocaleDateString()}</span>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg="secondary">{m.time}</Badge>
                        <Button size="sm" className="theme-btn-outline" onClick={() => setEditingMeal({
                          ...m,
                          date: m.date.split('T')[0],
                        })}>
                          Edit
                        </Button>
                        <Button size="sm" className="theme-btn-danger" onClick={() => handleDeleteMeal(m._id)}>
                          Delete
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            </Col>
          </Row>
        </div>

        <Modal show={!!editingMeal} onHide={() => setEditingMeal(null)}>
          <Modal.Header closeButton><Modal.Title>Edit Meal</Modal.Title></Modal.Header>
          <Modal.Body>
            {editingMeal && (
              <Form onSubmit={handleUpdateMeal}>
                <Form.Group className="mb-2" controlId="edit-meal-name">
                  <Form.Label>Meal name</Form.Label>
                  <Form.Control
                    value={editingMeal.meal}
                    onChange={(e) => setEditingMeal({ ...editingMeal, meal: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="edit-meal-calories">
                  <Form.Label>Calories</Form.Label>
                  <Form.Control
                    type="number"
                    value={editingMeal.calories}
                    onChange={(e) => setEditingMeal({ ...editingMeal, calories: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2" controlId="edit-meal-type">
                  <Form.Label>Meal type</Form.Label>
                  <Form.Select
                    value={editingMeal.time}
                    onChange={(e) => setEditingMeal({ ...editingMeal, time: e.target.value })}
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Snack</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3" controlId="edit-meal-date">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={editingMeal.date}
                    onChange={(e) => setEditingMeal({ ...editingMeal, date: e.target.value })}
                    required
                  />
                </Form.Group>
                <Button type="submit" size="sm" className="theme-btn-primary">Save Changes</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </main>
  );
}