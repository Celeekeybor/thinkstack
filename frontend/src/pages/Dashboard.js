import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SubmissionForm from '../components/SubmissionForm';

function Dashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/submissions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setSubmissions(res.data));
  }, []);

  const handleEdit = (submission) => {
    setEditingId(submission.id);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome! View your submissions below or <a href="/submit">submit a new project</a>.</p>
      {editingId && <SubmissionForm submissionId={editingId} onCancel={() => setEditingId(null)} />}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Tech Stack</th>
            <th>Status</th>
            <th>Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map(sub => (
            <tr key={sub.id}>
              <td>{sub.title}</td>
              <td>{sub.tech_stack}</td>
              <td>{sub.status}</td>
              <td>{sub.score || 'N/A'}</td>
              <td>
                {sub.status === 'Pending' && (
                  <button className="btn btn-primary btn-sm bg-gradient" onClick={() => handleEdit(sub)}>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;