import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './style.css';

const LecturerClasses = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'lecturer') {
      setError('Please log in as a lecturer');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    const fetchClasses = async () => {
      try {
        setError('');
        const response = await axios.get('http://localhost:5000/api/v1/lecturers/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Classes response:', response.data);
        setClasses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'Classes endpoint not found. Please check the server configuration.'
          : err.response?.data?.error || 'Error fetching classes';
        setError(errorMessage);
        console.error('Fetch error:', err.response?.data || err.message);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">Lecturer Classes</h2>
      {error && <div className="error-message">{error}</div>}
      {classes.length === 0 && !error
        ? <p className="no-data">No classes found.</p>
        : (
          <table className="classes-table">
            <thead>
              <tr className="table-header">
                <th className="table-cell">Class Name</th>
                <th className="table-cell">Courses</th>
                <th className="table-cell">Venue</th>
                <th className="table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id} className="table-row">
                  <td className="table-cell">{cls.class_name || 'N/A'}</td>
                  <td className="table-cell">
                    {Array.isArray(cls.courses) ? cls.courses.map(c => c.name || 'N/A').join(', ') : 'None'}
                  </td>
                  <td className="table-cell">{cls.venue || 'N/A'}</td>
                  <td className="table-cell">{cls.scheduled_time || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default LecturerClasses;