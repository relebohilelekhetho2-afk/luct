import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './prlstyle.css';

const PRLClasses = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'prl') {
      setError('Please log in as a Principal Lecturer');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      return;
    }

    axios.get('http://localhost:5000/api/v1/prl/classes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setClasses(res.data))
      .catch(err => setError('Error fetching classes'));
  }, [user]);

  return (
    <div className="component-container">
      <h2 className="section-title">Classes in Faculty</h2>
      {error && <div className="error-message">{error}</div>}
      {classes.length === 0 ? (
        <p className="no-data">No classes found.</p>
      ) : (
        <table className="prl-table">
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
            {classes.map(cls => (
              <tr key={cls.id}>
                <td>{cls.class_name}</td>
                <td>{cls.course_name || 'None'}</td>
                <td>{cls.course_code || 'None'}</td>
                <td>{cls.venue || 'N/A'}</td>
                <td>{cls.scheduled_time || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PRLClasses;