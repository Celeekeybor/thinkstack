import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AdminPanel from '../components/AdminPanel';

ChartJS.register(ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [techStats, setTechStats] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${process.env.REACT_APP_API_URL}/api/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setStats(res.data));
    axios.get(`${process.env.REACT_APP_API_URL}/api/tech-stats`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setTechStats(res.data));
  }, []);

  const statusData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [{
      label: 'Submissions',
      data: [
        stats.by_status?.Pending || 0,
        stats.by_status?.Approved || 0,
        stats.by_status?.Rejected || 0
      ],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }],
  };

  const techData = {
    labels: Object.keys(techStats),
    datasets: [{
      label: 'Tech Stack Usage',
      data: Object.values(techStats),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
    }],
  };

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      <div className="row">
        <div className="col-md-6">
          <div className="card p-4 mb-4">
            <h3>Submission Status</h3>
            <Pie data={statusData} />
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-4 mb-4">
            <h3>Tech Stack Usage</h3>
            <Pie data={techData} />
          </div>
        </div>
      </div>
      <AdminPanel />
    </div>
  );
}

export default AdminDashboard;