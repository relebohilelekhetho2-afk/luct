import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLLecturers = () => {
  const { user } = React.useContext(AuthContext);
  const [lecturers, setLecturers] = useState([]);
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

    axios.get('http://localhost:5000/api/v1/pl/lecturers', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setLecturers(res.data))
      .catch(err => setError(err.response?.data?.error || 'Error fetching lecturers'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">PL Lecturers</h2>
      {error && <div className="error-message">{error}</div>}
      {lecturers.length === 0
        ? <p className="no-data">No lecturers found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {lecturers.map(lecturer =>
                <tr key={lecturer.id}>
                  <td>{lecturer.name}</td>
                  <td>{lecturer.email}</td>
                  <td>{lecturer.department || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PLLecturers;