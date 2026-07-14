import { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, ListGroup, Badge } from 'react-bootstrap';
import { createExercise, assignExercise, addTeamAthlete, getExercises, getTeamMembers, getAssignmentsForMember } from '../api/assignments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CoachDashboard() {
  const [exercise, setExercise] = useState({ name: '', description: '', targetDurationMinutes: 30 });
  const [assignment, setAssignment] = useState({ exerciseId: '', athleteId: '', dueDate: '' });
  const [athleteEmail, setAthleteEmail] = useState('');
  const [msg, setMsg] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProgressMember, setSelectedProgressMember] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const handleLogout = () => {
  logout();
  navigate('/login');
  };

  const loadDropdownData = () => {
    getExercises().then(({ data }) => setExercises(data));
    getTeamMembers().then(({ data }) => setTeamMembers(data));
  }

  useEffect(loadDropdownData, []);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    await createExercise(exercise);
    setMsg(`Exercise "${exercise.name}" created.`);
    setExercise({ name: '', description: '', targetDurationMinutes: 30 });
    loadDropdownData();
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
    loadDropdownData();
  };

  const viewProgress = async (athleteId) => {
    const { data } = await getAssignmentsForMember(athleteId);
    setSelectedProgressMember({athleteId, assignments: data });
  }

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
            <Form.Select
              className="mb-2" value={assignment.exerciseId}
              onChange={(e) => setAssignment({ ...assignment, exerciseId: e.target.value })} required
            >
              <option value="">Select exercise...</option>
              {exercises.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.name}</option>
              ))}
            </Form.Select>
            <Form.Select
              className="mb-2" value={assignment.athleteId}
              onChange={(e) => setAssignment({ ...assignment, athleteId: e.target.value })} required
            >
              <option value="">Select athlete...</option>
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>{m.firstName} {m.lastName}</option>
              ))}
            </Form.Select>
            <Form.Control
              className="mb-2" type="date"
              value={assignment.dueDate}
              onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })} required
            />
            <Button type="submit" size="sm">Assign</Button>
          </Form>
        </Col>
      </Row>

      <hr className="my-4" />

      <h5>Team Progress</h5>
      <ListGroup className="mb-3">
        {teamMembers.map((m) => (
          <ListGroup.Item key={m._id} className="d-flex justify-content-between align-items-center">
            {m.firstName} {m.lastName}
            <Button size="sm" variant="outline-secondary" onClick={() => viewProgress(m)}>
              View Progress
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {selectedProgressMember && (
        <div>
          <h6>{selectedProgressMember.athlete.firstName}'s Assignments</h6>
          <ListGroup>
            {selectedProgress.assignments.map((a) => (
              <ListGroup.Item key={a._id} className="d-flex justify-content-between align-items-center">
                {a.exercise.name} — due {new Date(a.dueDate).toLocaleDateString()}
                <Badge bg={a.completed ? 'success' : 'secondary'}>
                  {a.completed ? 'Completed' : 'Not completed'}
                </Badge>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}

      <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Sign Out</Button>
    </Container>
  );
}
