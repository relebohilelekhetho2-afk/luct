import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './sstyle.css'; // Import the new CSS file

const StudentRegistration = () => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    class_id: '',
    course_ids: []
  });
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    console.log('StudentRegistration user:', user);
    const fetchClasses = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/v1/classes', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log('Classes response:', res.data);
        setClasses(res.data);
      } catch (err) {
        const errorMessage = err.response?.status === 404
          ? 'API endpoint /api/v1/classes not found. Please check the server configuration.'
          : 'Error fetching classes';
        setError(errorMessage);
        console.error('Fetch classes error:', err.response?.data || err.message);
      }
    };
    if (user && user.role === 'student') {
      fetchClasses();
    } else {
      setError('Please log in as a student');
    }
  }, [user]);

  useEffect(() => {
    if (form.class_id) {
      const fetchCourses = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/v1/classes/${form.class_id}/courses`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          console.log('Courses response:', res.data);
          setCourses(res.data);
          setForm({ ...form, course_ids: [] }); // Reset course selection
        } catch (err) {
          setError('Error fetching courses');
          console.error('Fetch courses error:', err.response?.data || err.message);
        }
      };
      fetchCourses();
    } else {
      setCourses([]);
      setForm({ ...form, course_ids: [] });
    }
  }, [form.class_id]);

  const handleCourseToggle = (courseId) => {
    setForm((prev) => {
      const course_ids = prev.course_ids.includes(courseId)
        ? prev.course_ids.filter(id => id !== courseId)
        : [...prev.course_ids, courseId];
      return { ...prev, course_ids };
    });
  };

  const handleSubmit = async () => {
    if (!form.class_id || form.course_ids.length === 0) {
      setError('Please select a class and at least one course');
      return;
    }
    try {
      setError('');
      setSuccess('');
      const payload = {
        class_id: parseInt(form.class_id),
        course_ids: form.course_ids.map(id => parseInt(id))
      };
      console.log('Submitting registration:', payload);
      await axios.post('http://localhost:5000/api/v1/students/register', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Registration request submitted');
      setForm({ class_id: '', course_ids: [] });
      setCourses([]);
    } catch (err) {
      setError(err.response?.data || 'Error submitting registration');
      console.error('Submit registration error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="component-container">
      <h2 className="section-title">Student Registration</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-container">
        <div className="form-group">
          <label className="form-label">Class</label>
          <select
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            className="form-select"
          >
            <option value="">Select Class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.class_name} ({cls.courses.map(c => c.code).join(', ') || 'No courses'})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Courses</label>
          <div className="space-y-2">
            {courses.length === 0 && form.class_id && <p className="no-data">No courses available for this class</p>}
            {courses.map(course => (
              <div key={course.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={form.course_ids.includes(course.id)}
                  onChange={() => handleCourseToggle(course.id)}
                  className="mr-2"
                />
                <span className="form-label">{course.name} ({course.code})</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={handleSubmit} className="form-button">Submit Registration</button>
      </div>
    </div>
  );
};

export default StudentRegistration;