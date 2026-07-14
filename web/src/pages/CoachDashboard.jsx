import { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { createExercise, assignExercise, addTeamAthlete } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CoachDashboard() {
  const [exercise, setExercise] = useState({ name: '', description: '', targetDurationMinutes: 30 });
  const [assignment, setAssignment] = useState({ exerciseId: '', athleteId: '', dueDate: '' });
  const [athleteEmail, setAthleteEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
  logout();
  navigate('/login');
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    const { data } = await createExercise(exercise);
    setMsg(`Exercise "${data.name}" created.`);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    await assignExercise(assignment);
    setMsg('Assigned.');
  };

  const handleAddAthlete = async (e) => {
    e.preventDefault();
    await addTeamAthlete(athleteEmail);
    setMsg(`Added ${athleteEmail} to your team.`);
    setAthleteEmail('');
  };

  return (
    <Container className="mt-4">
      <h2>Coach Dashboard</h2>
      {msg && <Alert variant="info" onClose={() => setMsg(null)} dismissible>{msg}</Alert>}

      <Row className="mt-4">
        <Col md={4}>
          <h5>Add Team Athlete</h5>
          <Form onSubmit={handleAddAthlete}>
            <Form.Control
              className="mb-2" placeholder="athlete@email.com"
              value={athleteEmail} onChange={(e) => setAthleteEmail(e.target.value)} required
            />
            <Button type="submit" size="sm">Add Athlete</Button>
          </Form>
        </Col>

        <Col md={4}>
          <h5>Create Exercise</h5>
          <Form onSubmit={handleCreateExercise}>
            <Form.Control
              className="mb-2" placeholder="Exercise name"
              value={exercise.name}
              onChange={(e) => setExercise({ ...exercise, name: e.target.value })} required
            />
            <Form.Control
              className="mb-2" placeholder="Description" as="textarea" rows={2}
              value={exercise.description}
              onChange={(e) => setExercise({ ...exercise, description: e.target.value })}
            />
            <Button type="submit" size="sm">Create</Button>
          </Form>
        </Col>

        <Col md={4}>
          <h5>Assign Exercise</h5>
          <Form onSubmit={handleAssign}>
            <Form.Control
              className="mb-2" placeholder="Exercise ID"
              value={assignment.exerciseId}
              onChange={(e) => setAssignment({ ...assignment, exerciseId: e.target.value })} required
            />
            <Form.Control
              className="mb-2" placeholder="Athlete ID"
              value={assignment.athleteId}
              onChange={(e) => setAssignment({ ...assignment, athleteId: e.target.value })} required
            />
            <Form.Control
              className="mb-2" type="date"
              value={assignment.dueDate}
              onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} required
            />
            <Button type="submit" size="sm">Assign</Button>
          </Form>
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Sign Out</Button>
        </Col>
      </Row>
    </Container>
  );
}
