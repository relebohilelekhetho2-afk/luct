import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({ username: '', password: '', role: 'student', full_name: '', email: '', faculty_id: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    // Client-side validation
    if (!form.username || !form.password || !form.role || !form.full_name || !form.email) {
      setError('Please fill in all required fields: username, password, role, full name, and email');
      return;
    }
    if (!['student', 'lecturer', 'prl', 'pl'].includes(form.role)) {
      setError('Invalid role selected');
      return;
    }
    if (form.faculty_id && isNaN(form.faculty_id)) {
      setError('Faculty ID must be a number');
      return;
    }

    console.log('Submitting form:', form); // Debug: Log form data

    try {
      setError('');
      await axios.post('http://localhost:5000/api/v1/auth/register', {
        ...form,
        faculty_id: form.faculty_id ? parseInt(form.faculty_id) : null // Convert faculty_id to number or null
      });
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', errorMessage);
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="form-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="form-input"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="form-input"
        >
          <option value="student">Student</option>
          <option value="lecturer">Lecturer</option>
          <option value="prl">Principal Lecturer</option>
          <option value="pl">Program Leader</option>
        </select>
        <input
          type="text"
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="form-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="form-input"
        />
        <input
          type="number"
          placeholder="Faculty ID (optional)"
          value={form.faculty_id}
          onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
          className="form-input"
        />
        <button onClick={handleSubmit} className="submit-button">Register</button>
      </div>
    </div>
  );
};

export default Register;