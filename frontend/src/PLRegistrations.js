import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLRegistrations = () => {
  const { user } = useContext(AuthContext);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/pl/registrations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Registrations response:', res.data);
        setRegistrations(res.data);
      } catch (err) {
        setError('Error fetching registrations');
        console.error('Fetch registrations error:', err.response?.data || err.message);
      }
    };
    if (user && user.role === 'pl') {
      fetchRegistrations();
    } else {
      setError('Please log in as a Program Leader');
    }
  }, [user]);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccess('');
      await axios.put(`http://localhost:5000/api/v1/pl/registrations/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Registration approved');
      setRegistrations(registrations.filter(reg => reg.id !== id));
    } catch (err) {
      setError(err.response?.data || 'Error approving registration');
      console.error('Approve error:', err.response?.data || err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      setError('');
      setSuccess('');
      await axios.put(`http://localhost:5000/api/v1/pl/registrations/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Registration rejected');
      setRegistrations(registrations.filter(reg => reg.id !== id));
    } catch (err) {
      setError(err.response?.data || 'Error rejecting registration');
      console.error('Reject error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="component-container">
      <h2 className="section-title">Pending Registration Requests</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-container">
        {registrations.length === 0 && <p className="no-data">No pending registrations</p>}
        {registrations.map(reg => (
          <div key={reg.id} className="registration-item">
            <div>
              <p><strong>Student:</strong> {reg.student_name}</p>
              <p><strong>Class:</strong> {reg.class_name}</p>
              <p><strong>Course:</strong> {reg.course_name} ({reg.course_code})</p>
              <p><strong>Request Date:</strong> {new Date(reg.request_date).toLocaleString()}</p>
            </div>
            <div className="action-buttons">
              <button onClick={() => handleApprove(reg.id)} className="approve-btn">Approve</button>
              <button onClick={() => handleReject(reg.id)} className="reject-btn">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PLRegistrations;