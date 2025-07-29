import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState({});

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setProfile(res.data))
      .catch(err => console.error('Error fetching profile:', err));
  }, []);

  return (
    <div>
      <h1 className="text-center">Profile</h1>
      <div className="card p-4 mx-auto" style={{ maxWidth: '600px', borderRadius: '10px' }}>
        <h3>{profile.username}</h3>
        <p>Email: {profile.email}</p>
        <p>Role: {profile.is_admin ? 'Admin' : 'User'}</p>
        <h4>Your Submissions</h4>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Title</th>
              <th>Tech Stack</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {profile.submissions?.map(sub => (
              <tr key={sub.id}>
                <td>{sub.title}</td>
                <td>{sub.tech_stack}</td>
                <td>{sub.status}</td>
                <td>{sub.score || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Profile;