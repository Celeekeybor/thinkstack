import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Notification from './Notification';

function AdminPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/submissions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setSubmissions(res.data));
  }, []);

  const handleUpdate = async (id, status, score) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/submissions/${id}`, { status, score }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(submissions.map(sub =>
        sub.id === id ? { ...sub, status, score } : sub
      ));
      setNotification(`Submission ${id} updated successfully!`);
    } catch (error) {
      setNotification('Update failed');
    }
  };

  return (
    <div>
      <Notification message={notification} onClose={() => setNotification(null)} />
      <h3>Review Submissions</h3>
      <a
        href={`${process.env.REACT_APP_API_URL}/api/export-submissions`}
        className="btn btn-primary bg-gradient mb-3"
        download
      >
        Export as CSV
      </a>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>GitHub</th>
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
              <td>{sub.description}</td>
              <td><a href={sub.github_url} target="_blank" rel="noopener noreferrer">Link</a></td>
              <td>{sub.tech_stack}</td>
              <td>
                <select
                  value={sub.status}
                  onChange={(e) => handleUpdate(sub.id, e.target.value, sub.score)}
                  className="form-select"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </td>
              <td>
                <input
                  type="number"
                  value={sub.score || ''}
                  onChange={(e) => handleUpdate(sub.id, sub.status, e.target.value)}
                  className="form-control"
                  min="0"
                  max="100"
                />
              </td>
              <td>
                <button
                  className="btn btn-primary bg-gradient"
                  onClick={() => handleUpdate(sub.id, sub.status, sub.score)}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;