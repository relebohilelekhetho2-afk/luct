import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLClasses = () => {
  const { user } = React.useContext(AuthContext);
  const [classes, setClasses] = useState([]);
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

    axios.get('http://localhost:5000/api/v1/pl/classes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setClasses(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Error fetching classes');
        setClasses([]); // Reset to empty array on error
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">PL Classes</h2>
      {classes.length === 0
        ? <p className="no-data">No classes found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Courses</th>
                <th>Codes</th>
                <th>Venue</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls =>
                <tr key={cls.id}>
                  <td>{cls.class_name || 'N/A'}</td>
                  <td>{Array.isArray(cls.courses) ? cls.courses.map(c => c.name).join(', ') : 'None'}</td>
                  <td>{Array.isArray(cls.courses) ? cls.courses.map(c => c.code).join(', ') : 'None'}</td>
                  <td>{cls.venue || 'N/A'}</td>
                  <td>{cls.scheduled_time || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PLClasses;