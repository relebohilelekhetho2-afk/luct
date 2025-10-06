import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLRating = () => {
  const { user } = React.useContext(AuthContext);
  const [ratings, setRatings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState({ lecturerId: '', rating: '', comment: '' });

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

    axios.get('http://localhost:5000/api/v1/pl/ratings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setRatings(res.data))
      .catch(err => setError(err.response?.data?.error || 'Error fetching ratings'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmitRating = () => {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:5000/api/v1/pl/ratings', newRating, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setRatings([...ratings, res.data]);
        setNewRating({ lecturerId: '', rating: '', comment: '' });
      })
      .catch(err => setError(err.response?.data?.error || 'Error submitting rating'));
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">PL Ratings</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-container">
        <div className="form-group">
          <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Submit New Rating</h3>
          <input
            type="text"
            placeholder="Lecturer ID"
            value={newRating.lecturerId}
            onChange={e => setNewRating({ ...newRating, lecturerId: e.target.value })}
            className="form-input"
          />
          <input
            type="number"
            placeholder="Rating (1-5)"
            value={newRating.rating}
            onChange={e => setNewRating({ ...newRating, rating: e.target.value })}
            className="form-input"
          />
          <textarea
            placeholder="Comment"
            value={newRating.comment}
            onChange={e => setNewRating({ ...newRating, comment: e.target.value })}
            className="form-textarea"
          />
          <button onClick={handleSubmitRating} className="form-button">Submit Rating</button>
        </div>
      </div>
      {ratings.length === 0
        ? <p className="no-data">No ratings found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Lecturer ID</th>
                <th>Rating</th>
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map(rating =>
                <tr key={rating.id}>
                  <td>{rating.lecturerId}</td>
                  <td>{rating.rating}</td>
                  <td>{rating.comment || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PLRating;