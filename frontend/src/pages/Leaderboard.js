import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Leaderboard() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/leaderboard`)
      .then(res => setSubmissions(res.data))
      .catch(err => console.error('Error fetching leaderboard:', err));
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Title</th>
            <th>Username</th>
            <th>Tech Stack</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub, index) => (
            <tr key={sub.id}>
              <td>
                {index === 0 && <span className="badge bg-warning">🥇</span>}
                {index === 1 && <span className="badge bg-secondary">🥈</span>}
                {index === 2 && <span className="badge bg-bronze">🥉</span>}
                {index > 2 && index + 1}
              </td>
              <td>{sub.title}</td>
              <td>{sub.username}</td>
              <td>{sub.tech_stack}</td>
              <td>{sub.score}</td>
              <td>
                <span className={`badge ${sub.status === 'Approved' ? 'bg-success' : sub.status === 'Rejected' ? 'bg-danger' : 'bg-warning'}`}>
                  {sub.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;