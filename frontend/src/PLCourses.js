import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import './plstyle.css';

const PLCourses = () => {
  const { user } = React.useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classForm, setClassForm] = useState({ class_name: '', venue: '', scheduled_time: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', faculty_id: '', semester: '', description: '' });
  const [assignForm, setAssignForm] = useState({ class_id: '', lecturer_id: '' });
  const [assignCoursesForm, setAssignCoursesForm] = useState({ class_id: '', course_ids: [] });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCoursesForm, setShowAddCoursesForm] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [showAssignLecturerForm, setShowAssignLecturerForm] = useState(false);
  const [showAssignCoursesForm, setShowAssignCoursesForm] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Please log in');
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
        const [coursesRes, classesRes, lecturersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/v1/pl/courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/v1/pl/classes', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/v1/pl/lecturers', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        setLecturers(Array.isArray(lecturersRes.data) ? lecturersRes.data : []);
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching data');
        setCourses([]);
        setClasses([]);
        setLecturers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleAddCourse = async () => {
    if (!courseForm.name || !courseForm.code || !courseForm.faculty_id || !courseForm.semester) {
      setError('Please fill in all required fields for course');
      return;
    }
    setLoading(true);
    try {
      setError('');
      setSuccess('');
      await axios.post('http://localhost:5000/api/v1/pl/courses', {
        ...courseForm,
        faculty_id: parseInt(courseForm.faculty_id),
        semester: parseInt(courseForm.semester)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Course added successfully');
      setCourseForm({ name: '', code: '', faculty_id: '', semester: '', description: '' });
      const res = await axios.get('http://localhost:5000/api/v1/pl/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding course');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!classForm.class_name) {
      setError('Class name is required');
      return;
    }
    setLoading(true);
    try {
      setError('');
      setSuccess('');
      await axios.post('http://localhost:5000/api/v1/pl/classes', {
        ...classForm
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Class added successfully');
      setClassForm({ class_name: '', venue: '', scheduled_time: '' });
      const classesRes = await axios.get('http://localhost:5000/api/v1/pl/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error adding class');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignLecturer = async () => {
    if (!assignForm.class_id || !assignForm.lecturer_id) {
      setError('Please select a class and lecturer');
      return;
    }
    setLoading(true);
    try {
      setError('');
      setSuccess('');
      await axios.put(`http://localhost:5000/api/v1/pl/classes/${assignForm.class_id}/assign`, {
        lecturer_id: parseInt(assignForm.lecturer_id)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Lecturer assigned successfully');
      setAssignForm({ class_id: '', lecturer_id: '' });
      const res = await axios.get('http://localhost:5000/api/v1/pl/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error assigning lecturer');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourses = async () => {
    if (!assignCoursesForm.class_id || assignCoursesForm.course_ids.length === 0) {
      setError('Please select a class and at least one course');
      return;
    }
    setLoading(true);
    try {
      setError('');
      setSuccess('');
      await axios.post(`http://localhost:5000/api/v1/pl/classes/${assignCoursesForm.class_id}/assign-courses`, {
        course_ids: assignCoursesForm.course_ids.map(id => parseInt(id))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Courses assigned successfully');
      setAssignCoursesForm({ class_id: '', course_ids: [] });
      const res = await axios.get('http://localhost:5000/api/v1/pl/classes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Error assigning courses');
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseSelection = (courseId) => {
    setAssignCoursesForm({
      ...assignCoursesForm,
      course_ids: assignCoursesForm.course_ids.includes(courseId)
        ? assignCoursesForm.course_ids.filter(id => id !== courseId)
        : [...assignCoursesForm.course_ids, courseId]
    });
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="component-container">
      <h2 className="section-title">Manage Courses and Classes</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <div className="form-container">
        <div>
          <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer' }}
            onClick={() => setShowAddCoursesForm(!showAddCoursesForm)}>Add Courses</h3>
          <div className={`form-section ${showAddCoursesForm ? 'active' : ''}`}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Course Name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Course Code"
                value={courseForm.code}
                onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Faculty ID"
                value={courseForm.faculty_id}
                onChange={(e) => setCourseForm({ ...courseForm, faculty_id: e.target.value })}
                className="form-input"
              />
              <input
                type="number"
                placeholder="Semester"
                value={courseForm.semester}
                onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                className="form-input"
              />
              <textarea
                placeholder="Description (optional)"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="form-textarea"
              />
              <button onClick={handleAddCourse} className="form-button" disabled={loading}>
                {loading ? 'Adding...' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer' }}
            onClick={() => setShowAddClassForm(!showAddClassForm)}>Add Class</h3>
          <div className={`form-section ${showAddClassForm ? 'active' : ''}`}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Class Name"
                value={classForm.class_name}
                onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Venue (optional)"
                value={classForm.venue}
                onChange={(e) => setClassForm({ ...classForm, venue: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Scheduled Time (optional)"
                value={classForm.scheduled_time}
                onChange={(e) => setClassForm({ ...classForm, scheduled_time: e.target.value })}
                className="form-input"
              />
              <button onClick={handleAddClass} className="form-button" disabled={loading}>
                {loading ? 'Adding...' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer' }}
            onClick={() => setShowAssignLecturerForm(!showAssignLecturerForm)}>Assign Lecturer</h3>
          <div className={`form-section ${showAssignLecturerForm ? 'active' : ''}`}>
            <div className="form-group">
              <select
                value={assignForm.class_id}
                onChange={(e) => setAssignForm({ ...assignForm, class_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select Class</option>
                {classes.map(cls =>
                  <option key={cls.id} value={cls.id}>
                    {`${cls.class_name} (${Array.isArray(cls.courses) ? cls.courses.map(c => c.code).join(', ') : 'No courses'})`}
                  </option>
                )}
              </select>
              <select
                value={assignForm.lecturer_id}
                onChange={(e) => setAssignForm({ ...assignForm, lecturer_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(lecturer =>
                  <option key={lecturer.id} value={lecturer.id}>{lecturer.full_name || 'Unnamed Lecturer'}</option>
                )}
              </select>
              <button onClick={handleAssignLecturer} className="form-button" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Lecturer'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer' }}
            onClick={() => setShowAssignCoursesForm(!showAssignCoursesForm)}>Assign Courses</h3>
          <div className={`form-section ${showAssignCoursesForm ? 'active' : ''}`}>
            <div className="form-group">
              <select
                value={assignCoursesForm.class_id}
                onChange={(e) => setAssignCoursesForm({ ...assignCoursesForm, class_id: e.target.value })}
                className="form-select"
              >
                <option value="">Select Class</option>
                {classes.map(cls =>
                  <option key={cls.id} value={cls.id}>
                    {`${cls.class_name} (${Array.isArray(cls.courses) ? cls.courses.map(c => c.code).join(', ') : 'No courses'})`}
                  </option>
                )}
              </select>
              <div className="checkbox-container">
                <h4 className="form-label">Select Courses (max 6):</h4>
                {courses.map(course =>
                  <div key={course.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={assignCoursesForm.course_ids.includes(String(course.id))}
                      onChange={() => toggleCourseSelection(String(course.id))}
                    />
                    <span>{`${course.name} (${course.code})`}</span>
                  </div>
                )}
              </div>
              <button onClick={handleAssignCourses} className="form-button" disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Courses'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Courses</h3>
      {courses.length === 0
        ? <p className="no-data">No courses found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Code</th>
                <th>Semester</th>
                <th>Faculty ID</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course =>
                <tr key={course.id}>
                  <td>{course.name || 'N/A'}</td>
                  <td>{course.code || 'N/A'}</td>
                  <td>{course.semester || 'N/A'}</td>
                  <td>{course.faculty_id || 'N/A'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Classes</h3>
      {classes.length === 0
        ? <p className="no-data">No classes found.</p>
        : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Courses</th>
                <th>Venue</th>
                <th>Time</th>
                <th>Lecturer</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls =>
                <tr key={cls.id}>
                  <td>{cls.class_name || 'N/A'}</td>
                  <td>{Array.isArray(cls.courses) ? cls.courses.map(c => c.name).join(', ') : 'None'}</td>
                  <td>{cls.venue || 'N/A'}</td>
                  <td>{cls.scheduled_time || 'N/A'}</td>
                  <td>{cls.lecturer_name || 'Unassigned'}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default PLCourses;