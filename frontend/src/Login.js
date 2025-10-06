import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/login', form);
      localStorage.setItem('token', res.data.token);
      const userRes = await axios.get('http://localhost:5000/api/v1/users/me', {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      setUser(userRes.data);
      navigate('/dashboard');
    } catch (err) {
      alert('Login failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
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
        <button onClick={handleSubmit} className="submit-button">Login</button>
      </div>
    </div>
  );
};

export default Login;