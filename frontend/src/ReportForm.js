import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './ReportForm.css';

const ReportForm = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    faculty_id: user?.faculty_id || '',
    class_id: '',
    week: '',
    lecture_date: '',
    actual_students: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: ''
  });
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError('');
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }
        if (!user || user.role !== 'lecturer') {
          setError('Please log in as a lecturer');
          setLoading(false);
          return;
        }
        const classesRes = await axios.get('http://localhost:5000/api/v1/lecturers/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const facultiesRes = await axios.get('http://localhost:5000/api/v1/lecturers/faculties', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Classes endpoint called:', 'http://localhost:5000/api/v1/lecturers/classes');
        console.log('Faculties endpoint called:', 'http://localhost:5000/api/v1/lecturers/faculties');
        console.log('Classes response:', classesRes.data);
        console.log('Faculties response:', facultiesRes.data);
        const classesData = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.data || []);
        const facultiesData = Array.isArray(facultiesRes.data) ? facultiesRes.data : (facultiesRes.data.data || []);
        setClasses(classesData);
        setFaculties(facultiesData);
        if (user?.faculty_id && facultiesData.length > 0) {
          const defaultFaculty = facultiesData.find(fac => fac.id === parseInt(user.faculty_id));
          if (defaultFaculty) {
            setForm(prev => ({ ...prev, faculty_id: user.faculty_id }));
          }
        }
      } catch (err) {
        const errorMsg = err.response?.status === 404
          ? `Endpoint not found: ${err.config.url} (Status: ${err.response.status}). Ensure the server is updated with /api/v1/lecturers/faculties.`
          : err.response?.data?.message || 'Error fetching classes or faculties';
        setError(errorMsg);
        console.error('Fetch error:', err.response?.data || err.message, 'Config:', err.config, 'Stack:', err.stack);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    const fetchCoursesAndEnrollments = async () => {
      if (form.class_id) {
        try {
          setError('');
          const token = localStorage.getItem('token');
          const coursesRes = await axios.get(`http://localhost:5000/api/v1/classes/${form.class_id}/courses`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const enrollmentsRes = await axios.get(`http://localhost:5000/api/v1/classes/${form.class_id}/enrollments/count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Courses endpoint called:', `http://localhost:5000/api/v1/classes/${form.class_id}/courses`);
          console.log('Enrollments endpoint called:', `http://localhost:5000/api/v1/classes/${form.class_id}/enrollments/count`);
          console.log('Courses response:', coursesRes.data);
          console.log('Enrollments response:', enrollmentsRes.data);
          const coursesData = Array.isArray(coursesRes.data) ? coursesRes.data : (coursesRes.data.data || []);
          setCourses(coursesData);
          setTotalRegistered(Number.isInteger(enrollmentsRes.data.count) ? enrollmentsRes.data.count : (enrollmentsRes.data.data?.count || 0));
        } catch (err) {
          const errorMsg = err.response?.status === 404
            ? `Endpoint not found: ${err.config.url} (Status: ${err.response.status})`
            : err.response?.data?.message || 'Error fetching courses or enrollment count';
          setError(errorMsg);
          console.error('Courses/enrollment error:', err.response?.data || err.message, 'Config:', err.config);
          setCourses([]);
          setTotalRegistered(0);
        }
      } else {
        setCourses([]);
        setTotalRegistered(0);
      }
    };
    fetchCoursesAndEnrollments();
  }, [form.class_id]);

  const handleSubmit = async () => {
    if (!form.faculty_id || !form.class_id || !form.week || !form.lecture_date || !form.actual_students || !form.topic_taught || !form.learning_outcomes) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const token = localStorage.getItem('token');
      const payload = {
        faculty_id: parseInt(form.faculty_id),
        class_id: parseInt(form.class_id),
        week: parseInt(form.week),
        lecture_date: form.lecture_date,
        actual_students: parseInt(form.actual_students),
        topic_taught: form.topic_taught,
        learning_outcomes: form.learning_outcomes,
        recommendations: form.recommendations || null
      };
      console.log('Submitting report:', payload);
      await axios.post('http://localhost:5000/api/v1/lecturers/reports', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Report submitted successfully');
      setForm({
        faculty_id: user?.faculty_id || '',
        class_id: '',
        week: '',
        lecture_date: '',
        actual_students: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: ''
      });
      setTotalRegistered(0);
      setCourses([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting report');
      console.error('Submit report error:', err.response?.data || err.message);
    }
  };

  const selectedClass = classes.find(cls => cls.id === parseInt(form.class_id));
  const selectedFaculty = faculties.find(fac => fac.id === parseInt(form.faculty_id));
  const selectedCourse = courses.find(course => course.id === parseInt(form.course_id));

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="report-form-container">
      <h2 className="section-title">Submit Lecturer Report</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-group">
        <div className="form-field">
          <label className="form-label">Faculty Name</label>
          <select
            value={form.faculty_id}
            onChange={(e) => setForm({ ...form, faculty_id: e.target.value, class_id: '', course_id: '' })}
            className="form-input"
            disabled={loading}
          >
            <option value="">Select Faculty</option>
            {faculties.map(fac => (
              <option key={fac.id} value={fac.id}>
                {fac.name || 'N/A'}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Class Name</label>
          <select
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            className="form-input"
            disabled={loading || !form.faculty_id}
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {`${cls.class_name || 'N/A'} (${cls.course_code || 'No courses'})`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Course</label>
          <select
            value={form.course_id}
            onChange={(e) => setForm({ ...form, course_id: e.target.value })}
            className="form-input"
            disabled={loading || !form.class_id}
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {`${course.name || 'N/A'} (${course.code || 'N/A'})`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Lecturer’s Name</label>
          <input
            type="text"
            value={user?.full_name || 'N/A'}
            readOnly
            className="form-input readonly"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Venue</label>
          <input
            type="text"
            value={selectedClass?.venue || 'N/A'}
            readOnly
            className="form-input readonly"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Scheduled Lecture Time</label>
          <input
            type="text"
            value={selectedClass?.scheduled_time || 'N/A'}
            readOnly
            className="form-input readonly"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Week</label>
          <input
            type="number"
            placeholder="Week"
            value={form.week}
            onChange={(e) => setForm({ ...form, week: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Lecture Date</label>
          <input
            type="date"
            placeholder="Lecture Date"
            value={form.lecture_date}
            onChange={(e) => setForm({ ...form, lecture_date: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Actual Students Present</label>
          <input
            type="number"
            placeholder="Actual Students Present"
            value={form.actual_students}
            onChange={(e) => setForm({ ...form, actual_students: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Total Registered Students</label>
          <input
            type="number"
            value={totalRegistered}
            readOnly
            className="form-input readonly"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Topic Taught</label>
          <input
            type="text"
            placeholder="Topic Taught"
            value={form.topic_taught}
            onChange={(e) => setForm({ ...form, topic_taught: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Learning Outcomes</label>
          <textarea
            placeholder="Learning Outcomes"
            value={form.learning_outcomes}
            onChange={(e) => setForm({ ...form, learning_outcomes: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <div className="form-field">
          <label className="form-label">Recommendations</label>
          <textarea
            placeholder="Recommendations (optional)"
            value={form.recommendations}
            onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
            className="form-input"
            disabled={loading}
          />
        </div>
        <button onClick={handleSubmit} className="submit-button" disabled={loading}>
          Submit Report
        </button>
      </div>
    </div>
  );
};

export default ReportForm;