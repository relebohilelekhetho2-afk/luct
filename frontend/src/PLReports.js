import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLReports = () => {
  const { user } = React.useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setError('Please log in');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    axios.get('http://localhost:5000/api/v1/pl/reports', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setReports(res.data))
      .catch(err => setError(err.response?.data?.error || 'Error fetching reports'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">PL Reports</h2>
      {error && <div className="error-message">{error}</div>}
      {reports.length === 0
        ? <p className="no-data">No reports found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Title</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report =>
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.title}</td>
                  <td>{report.date || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PLReports;