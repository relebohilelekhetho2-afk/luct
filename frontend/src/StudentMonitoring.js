import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './sstyle.css'; // Import the new CSS file

const StudentMonitoring = () => {
  const { user } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      setError('Please log in as a student');
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      setError('Access denied: You must be a student to view this page');
      return;
    }
    const fetchClasses = async () => {
      try {
        console.log('Fetching student monitoring data for user:', user);
        const res = await axios.get('http://localhost:5000/api/v1/students/monitoring', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setClasses(res.data);
      } catch (err) {
        console.error('Monitoring error:', err.response?.data);
        setError(err.response?.data || 'Error fetching enrolled classes');
      }
    };
    fetchClasses();
  }, [user, navigate]);

  return (
    <div className="component-container">
      <h2 className="section-title">Student Monitoring</h2>
      {error && <div className="error-message">{error}</div>}
      {classes.length === 0 && !error ? (
        <p className="no-data">No enrolled classes found.</p>
      ) : (
        <table className="classes-table">
          <thead>
            <tr className="table-header">
              <th className="table-cell">Class Name</th>
              <th className="table-cell">Courses</th>
              <th className="table-cell">Codes</th>
              <th className="table-cell">Venue</th>
              <th className="table-cell">Time</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(cls => (
              <tr key={cls.id} className="table-row">
                <td className="table-cell">{cls.class_name}</td>
                <td className="table-cell">{cls.course_name || 'None'}</td>
                <td className="table-cell">{cls.course_code || 'None'}</td>
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

export default StudentMonitoring;