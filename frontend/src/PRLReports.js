import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './prlstyle.css';

const PRLReports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/v1/prl/reports', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => setReports(res.data))
      .catch(err => {
        console.error('Error fetching reports:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          config: err.config
        });
        alert('Error fetching reports. Check console for details.');
      });
  }, []);

  const handleFeedback = async (id, feedback) => {
    if (!feedback.trim()) {
      alert('Feedback cannot be empty');
      return;
    }
    try {
      const response = await axios.put(
        `http://localhost:5000/api/v1/prl/reports/${id}`,
        { feedback },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setReports(reports.map(r => r.id === id ? { ...r, prl_feedback: feedback, status: 'reviewed' } : r));
      alert('Feedback submitted successfully');
    } catch (err) {
      console.error('Error adding feedback:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config
      });
      const errorMsg = err.response?.data?.error || 'An unexpected error occurred. Check server logs.';
      alert(`Error adding feedback: ${errorMsg}. Check console for details.`);
    }
  };

  const handleSendToPL = async (id) => {
    try {
      const report = reports.find(r => r.id === id);
      if (!report.prl_feedback || report.status !== 'reviewed') {
        alert('Please add feedback and review the report before sending to PL');
        return;
      }
      await axios.put(
        `http://localhost:5000/api/v1/prl/reports/${id}/send-to-pl`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      setReports(reports.map(r => r.id === id ? { ...r, sent_to_pl: true, status: 'sent' } : r));
      alert('Report sent to PL successfully');
    } catch (err) {
      console.error('Error sending report to PL:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        config: err.config
      });
      alert('Error sending report to PL. Check console for details.');
    }
  };

  return (
    <div className="component-container">
      <h2 className="section-title">Reports to Review</h2>
      {reports.length === 0 ? (
        <p className="no-data">No reports found.</p>
      ) : (
        <table className="prl-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Date</th>
              <th>Topic</th>
              <th>Feedback</th>
              <th>Action</th>
              <th>Send to PL</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id}>
                <td>{report.week}</td>
                <td>{report.lecture_date}</td>
                <td>{report.topic_taught}</td>
                <td>{report.prl_feedback || 'Pending'}</td>
                <td>
                  <textarea
                    placeholder="Add feedback"
                    onBlur={(e) => handleFeedback(report.id, e.target.value)}
                    className="form-textarea"
                    defaultValue={report.prl_feedback || ''}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleSendToPL(report.id)}
                    className="form-button"
                    disabled={!report.prl_feedback || report.status !== 'reviewed' || report.sent_to_pl}
                  >
                    {report.sent_to_pl ? 'Sent' : 'Send to PL'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PRLReports;