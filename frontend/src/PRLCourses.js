import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './prlstyle.css';

const PRLCourses = () => {
  const { user } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'prl') {
      setError('Please log in as a Principal Lecturer');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    const fetchCourses = async () => {
      try {
        setError('');
        const response = await axios.get('http://localhost:5000/api/v1/prl/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('PRL Courses response:', response.data);
        setCourses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        const errorMessage = err.response?.status === 403
          ? 'No faculty assigned to your account. Please contact the Programme Leader to get a faculty assigned.'
          : err.response?.status === 500
            ? 'Server error. Please check the backend configuration.'
            : err.response?.data?.error || 'Error fetching courses';
        setError(errorMessage);
        console.error('PRL Courses fetch error:', err.response?.data || err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [user]);

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">PRL Courses</h2>
      {error && <div className="error-message">{error}</div>}
      {courses.length === 0 && !error
        ? <p className="no-data">No courses found.</p>
        : (
          <table className="prl-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Code</th>
                <th>Semester</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course =>
                <tr key={course.id}>
                  <td>{course.name || 'N/A'}</td>
                  <td>{course.code || 'N/A'}</td>
                  <td>{course.semester || 'N/A'}</td>
                  <td>{course.description || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PRLCourses;