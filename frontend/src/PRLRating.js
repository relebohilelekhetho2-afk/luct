import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './prlstyle.css';

const PRLRating = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ target_type: 'course', target_id: '', rating: '', comment: '' });
  const [targets, setTargets] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      .then(res => setTargets(res.data))
      .catch(err => setError('Error fetching targets'));
  }, [user]);

  const handleSubmit = async () => {
    if (!form.target_type || !form.target_id || !form.rating || form.rating < 1 || form.rating > 5) {
      setError('Please select a valid target and rating (1-5)');
      return;
    }
    try {
      setError('');
      setSuccess('');
      await axios.post('http://localhost:5000/api/v1/prl/rating', {
        ...form,
        target_id: parseInt(form.target_id),
        rating: parseInt(form.rating)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Rating submitted');
      setForm({ target_type: 'course', target_id: '', rating: '', comment: '' });
    } catch (err) {
      setError(err.response?.data || 'Error submitting rating');
    }
  };

  return (
    <div className="component-container">
      <h2 className="section-title">Submit Rating</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-container">
        <div className="form-group">
          <select
            value={form.target_type}
            onChange={(e) => setForm({ ...form, target_type: e.target.value, target_id: '' })}
            className="form-select"
          >
            <option value="course">Course</option>
            <option value="lecturer">Lecturer</option>
            <option value="class">Class</option>
          </select>
          <select
            value={form.target_id}
            onChange={(e) => setForm({ ...form, target_id: e.target.value })}
            className="form-select"
          >
            <option value="">Select Target</option>
            {targets.map(target => (
              <option key={target.id} value={target.id}>
                {form.target_type === 'course' ? target.course_name : form.target_type === 'class' ? target.class_name : 'Lecturer'}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Rating (1-5)"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
            className="form-input"
          />
          <textarea
            placeholder="Comment (optional)"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="form-textarea"
          />
          <button onClick={handleSubmit} className="form-button">Submit Rating</button>
        </div>
      </div>
    </div>
  );
};

export default PRLRating;