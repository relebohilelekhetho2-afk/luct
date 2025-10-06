import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLAssignFaculty = () => {
  const { user } = useContext(AuthContext);
  const [prlUsers, setPrlUsers] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [form, setForm] = useState({ prl_user_id: '', faculty_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'pl') {
      setError('Please log in as a Programme Leader');
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found. Please log in.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError('');
        const [prlResponse, facultyResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/v1/pl/prl-users', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/v1/pl/faculties', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        console.log('PRL users response:', prlResponse.data);
        console.log('Faculties response:', facultyResponse.data);
        setPrlUsers(Array.isArray(prlResponse.data) ? prlResponse.data : []);
        setFaculties(Array.isArray(facultyResponse.data) ? facultyResponse.data : []);
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'No faculties or PRL users available. Please contact an admin to add faculties or PRL users.'
          : err.response?.status === 403
            ? 'Access denied: Please log in as a Programme Leader.'
            : err.response?.status === 500
              ? 'Server error. Please check the backend configuration.'
              : err.response?.data?.error || 'Error fetching data';
        setError(errorMessage);
        console.error('Fetch error:', err.response?.data || err.message);
        setPrlUsers([]);
        setFaculties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubmit = async () => {
    if (!form.prl_user_id || !form.faculty_id) {
      setError('Please select a PRL user and a faculty');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const payload = {
        prl_user_id: parseInt(form.prl_user_id),
        faculty_id: parseInt(form.faculty_id)
      };
      const response = await axios.post('http://localhost:5000/api/v1/pl/assign-faculty', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(response.data.message || 'Faculty assigned successfully');
      setForm({ prl_user_id: '', faculty_id: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Error assigning faculty');
      console.error('Assign faculty error:', err.response?.data || err.message);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">Assign Faculty to PRL</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-container">
        <div className="form-group">
          <div className="form-field">
            <label className="form-label">PRL User</label>
            <select
              value={form.prl_user_id}
              onChange={(e) => setForm({ ...form, prl_user_id: e.target.value })}
              className="form-select"
            >
              <option value="">Select PRL User</option>
              {prlUsers.map(user =>
                <option key={user.id} value={user.id}>
                  {user.full_name || 'N/A'}
                </option>
              )}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Faculty</label>
            <select
              value={form.faculty_id}
              onChange={(e) => setForm({ ...form, faculty_id: e.target.value })}
              className="form-select"
            >
              <option value="">Select Faculty</option>
              {faculties.map(faculty =>
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name || 'N/A'}
                </option>
              )}
            </select>
          </div>
          <button onClick={handleSubmit} className="submit-button">Assign Faculty</button>
        </div>
      </div>
    </div>
  );
};

export default PLAssignFaculty;