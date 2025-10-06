const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const Joi = require('joi');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456', // Replace with your MySQL password
  database: 'luct'
});

const SECRET_KEY = process.env.SECRET_KEY || 'your_jwt_secret';

// Middleware to verify JWT
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded JWT:', decoded); // Debug user ID
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based middleware
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
  next();
};

// PRL faculty access check
const checkPRLAccess = async (req, res, next) => {
  if (req.user.role !== 'prl') return next();
  const facultyId = req.body.faculty_id || req.params.facultyId || req.query.facultyId;
  if (!facultyId) return res.status(400).json({ error: 'Faculty ID required' });
  const [rows] = await db.query(
    'SELECT * FROM prl_faculty_assignments WHERE prl_user_id = ? AND faculty_id = ?',
    [req.user.id, facultyId]
  );
  if (rows.length === 0) return res.status(403).json({ error: 'Not assigned to this faculty' });
  next();
};

// PRL middleware to get assigned faculty_id
const getPRLFaculty = async (req, res, next) => {
  if (req.user.role !== 'prl') return next();
  try {
    const [rows] = await db.query(
      'SELECT faculty_id FROM prl_faculty_assignments WHERE prl_user_id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(403).json({ error: 'No faculty assigned to this PRL' });
    }
    req.assignedFacultyId = rows[0].faculty_id;
    next();
  } catch (err) {
    console.error('PRL faculty fetch error:', err);
    res.status(500).json({ error: 'Server error in PRL faculty assignment' });
  }
};

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'lecturer', 'prl', 'pl').required(),
  full_name: Joi.string().required(),
  email: Joi.string().email().required(),
  faculty_id: Joi.number().integer().allow(null)
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const courseSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  faculty_id: Joi.number().integer().required(),
  semester: Joi.number().integer().required(),
  description: Joi.string().allow('')
});

const classSchema = Joi.object({
  class_name: Joi.string().required(),
  venue: Joi.string().allow('').optional(),
  scheduled_time: Joi.string().allow('').optional()
});

const assignLecturerSchema = Joi.object({
  lecturer_id: Joi.number().integer().required()
});

const assignCoursesSchema = Joi.object({
  course_ids: Joi.array().items(Joi.number().integer()).min(1).required()
});

const ratingSchema = Joi.object({
  target_type: Joi.string().valid('course', 'lecturer', 'class').required(),
  target_id: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().allow('').optional()
});

const reportSchema = Joi.object({
  faculty_id: Joi.number().integer().required(),
  class_id: Joi.number().integer().required(),
  week: Joi.number().integer().required(),
  lecture_date: Joi.string().required(),
  actual_students: Joi.number().integer().required(),
  topic_taught: Joi.string().required(),
  learning_outcomes: Joi.string().required(),
  recommendations: Joi.string().allow('').optional()
});

// Auth: Register
app.post('/api/v1/auth/register', async (req, res) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password, role, full_name, email, faculty_id } = req.body;
  if (faculty_id) {
    const [rows] = await db.query('SELECT id FROM faculties WHERE id = ?', [faculty_id]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid faculty_id' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, role, full_name, email, faculty_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, role, full_name, email, faculty_id || null]
    );
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: `Duplicate entry: ${err.sqlMessage.includes('username') ? 'Username' : 'Email'} already exists` });
    }
    res.status(400).json({ error: `Error registering user: ${err.message}` });
  }
});

// Auth: Login
app.post('/api/v1/auth/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { username, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role, faculty_id: user.faculty_id }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Auth: Get current user
app.get('/api/v1/users/me', authenticate, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, role, full_name, email, faculty_id FROM users WHERE id = ?',
    [req.user.id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

// Student: Monitoring (enrolled classes)
app.get('/api/v1/students/monitoring', authenticate, restrictTo('student'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT c.id, c.class_name, c.venue, c.scheduled_time FROM enrollments e JOIN classes c ON e.class_id = c.id WHERE e.student_id = ?',
    [req.user.id]
  );
  const classes = await Promise.all(rows.map(async cls => {
    const [courses] = await db.query(
      'SELECT co.id, co.name, co.code FROM class_courses cc JOIN courses co ON cc.course_id = co.id WHERE cc.class_id = ?',
      [cls.id]
    );
    return { ...cls, courses };
  }));
  res.json(classes);
});

// Student: Submit registration
app.post('/api/v1/students/register', authenticate, restrictTo('student'), async (req, res) => {
  const { class_id, course_ids } = req.body;
  try {
    console.log('Registering student for class:', { class_id, course_ids });
    const [classRows] = await db.query('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (classRows.length === 0) {
      return res.status(400).json({ error: 'Invalid class ID' });
    }
    const [validCourses] = await db.query(
      'SELECT course_id FROM class_courses WHERE class_id = ? AND course_id IN (?)',
      [class_id, course_ids]
    );
    if (validCourses.length !== course_ids.length) {
      return res.status(400).json({ error: 'One or more course IDs are invalid for this class' });
    }
    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
      [req.user.id, class_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }
    await db.query(
      'INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)',
      [req.user.id, class_id]
    );
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error('Error registering student:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Student: Submit rating
app.post('/api/v1/students/rating', authenticate, restrictTo('student'), async (req, res) => {
  const { error } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { target_type, target_id, rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (rater_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, target_type, target_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Error submitting rating' });
  }
});

// Lecturer: Get assigned classes
app.get('/api/v1/lecturers/classes', authenticate, restrictTo('lecturer'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT c.id, c.class_name, c.venue, c.scheduled_time FROM classes c WHERE c.lecturer_id = ?',
    [req.user.id]
  );
  const classes = await Promise.all(rows.map(async cls => {
    const [courses] = await db.query(
      'SELECT co.id, co.name, co.code FROM class_courses cc JOIN courses co ON cc.course_id = co.id WHERE cc.class_id = ?',
      [cls.id]
    );
    return { ...cls, courses };
  }));
  res.json(classes);
});

// Lecturer: Submit report
app.post('/api/v1/lecturers/reports', authenticate, restrictTo('lecturer'), checkPRLAccess, async (req, res) => {
  const { error } = reportSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { faculty_id, class_id, week, lecture_date, actual_students, topic_taught, learning_outcomes, recommendations } = req.body;
  const [enrollments] = await db.query('SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?', [class_id]);
  const total_registered = enrollments[0].count;
  try {
    await db.query(
      'INSERT INTO reports (faculty_id, class_id, week, lecture_date, actual_students, total_registered, topic_taught, learning_outcomes, recommendations, lecturer_id) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [faculty_id, class_id, week, lecture_date, actual_students, total_registered, topic_taught, learning_outcomes, recommendations || null, req.user.id]
    );
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Error submitting report' });
  }
});

// Lecturer: Monitoring (own reports)
app.get('/api/v1/lecturers/monitoring', authenticate, restrictTo('lecturer'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT r.id, r.week, r.lecture_date, r.topic_taught, r.status, r.prl_feedback FROM reports r WHERE r.lecturer_id = ?',
    [req.user.id]
  );
  res.json(rows);
});

// Lecturer: Submit rating
app.post('/api/v1/lecturers/rating', authenticate, restrictTo('lecturer'), async (req, res) => {
  const { error } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { target_type, target_id, rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (rater_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, target_type, target_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Error submitting rating' });
  }
});

// Lecturer: Get assigned faculties
app.get('/api/v1/lecturers/faculties', authenticate, restrictTo('lecturer'), async (req, res) => {
  console.log('Route /api/v1/lecturers/faculties registered and hit');
  try {
    console.log('User faculty_id:', req.user.faculty_id);
    const [rows] = await db.query('SELECT id, name FROM faculties WHERE id = ?', [req.user.faculty_id]);
    if (rows.length === 0) {
      console.log('No match found, fetching all faculties');
      const [allFaculties] = await db.query('SELECT id, name FROM faculties');
      return res.json(allFaculties.length > 0 ? allFaculties : [{ id: null, name: 'No faculties available' }]);
    }
    res.json(rows);
  } catch (err) {
    console.error('Lecturer faculties fetch error:', err);
    res.status(500).json({ error: 'Server error fetching faculties' });
  }
});

// PRL: View courses
app.get('/api/v1/prl/courses', authenticate, restrictTo('prl'), getPRLFaculty, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, code, semester, description FROM courses WHERE faculty_id = ?',
      [req.assignedFacultyId]
    );
    res.json(rows);
  } catch (err) {
    console.error('PRL courses query error:', err);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

// PRL: View reports
app.get('/api/v1/prl/reports', authenticate, restrictTo('prl'), getPRLFaculty, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.week, r.lecture_date, r.actual_students, r.total_registered, r.topic_taught, 
              r.learning_outcomes, r.recommendations, r.status, r.prl_feedback 
       FROM reports r 
       JOIN classes c ON r.class_id = c.id 
       JOIN class_courses cc ON c.id = cc.class_id 
       JOIN courses co ON cc.course_id = co.id 
       WHERE co.faculty_id = ? AND r.status = "submitted"`,
      [req.assignedFacultyId]
    );
    res.json(rows);
  } catch (err) {
    console.error('PRL reports query error:', err);
    res.status(500).json({ error: 'Server error fetching reports' });
  }
});

// PRL: View classes
app.get('/api/v1/prl/classes', authenticate, restrictTo('prl'), getPRLFaculty, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT c.id, c.class_name, GROUP_CONCAT(co.name) as course_name, GROUP_CONCAT(co.code) as course_code, 
              c.venue, c.scheduled_time 
       FROM classes c 
       JOIN class_courses cc ON c.id = cc.class_id 
       JOIN courses co ON cc.course_id = co.id 
       WHERE co.faculty_id = ? 
       GROUP BY c.id`,
      [req.assignedFacultyId]
    );
    res.json(rows);
  } catch (err) {
    console.error('PRL classes query error:', err);
    res.status(500).json({ error: 'Server error fetching classes' });
  }
});

// PRL: Update report feedback
app.put('/api/v1/prl/reports/:id', authenticate, restrictTo('prl'), getPRLFaculty, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' });
  }

  try {
    // Check if the report exists and belongs to the PRL's assigned faculty
    const [rows] = await db.query(
      `SELECT r.id, r.class_id, r.status 
       FROM reports r 
       JOIN classes c ON r.class_id = c.id 
       JOIN class_courses cc ON c.id = cc.class_id 
       JOIN courses co ON cc.course_id = co.id 
       WHERE r.id = ? AND co.faculty_id = ?`,
      [id, req.assignedFacultyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const report = rows[0];
    if (report.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted reports can be reviewed' });
    }

    // Update the report with feedback and status
    await db.query(
      'UPDATE reports SET prl_feedback = ?, status = ? WHERE id = ?',
      [feedback, 'reviewed', id]
    );

    // Fetch the updated report to return
    const [updatedRows] = await db.query(
      'SELECT id, week, lecture_date, actual_students, total_registered, topic_taught, learning_outcomes, recommendations, status, prl_feedback FROM reports WHERE id = ?',
      [id]
    );

    res.json(updatedRows[0]);
  } catch (err) {
    console.error('Error updating report feedback:', err);
    res.status(500).json({ error: 'Server error updating report feedback' });
  }
});

// PRL: Send report to PL
app.put('/api/v1/prl/reports/:id/send-to-pl', authenticate, restrictTo('prl'), getPRLFaculty, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the report exists and belongs to the PRL's assigned faculty
    const [rows] = await db.query(
      `SELECT r.id, r.class_id, r.status 
       FROM reports r 
       JOIN classes c ON r.class_id = c.id 
       JOIN class_courses cc ON c.id = cc.class_id 
       JOIN courses co ON cc.course_id = co.id 
       WHERE r.id = ? AND co.faculty_id = ?`,
      [id, req.assignedFacultyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found or access denied' });
    }

    const report = rows[0];
    if (report.status !== 'reviewed') {
      return res.status(400).json({ error: 'Only reviewed reports can be sent to PL' });
    }

    // Update the report status
    await db.query(
      'UPDATE reports SET sent_to_pl = ?, status = ? WHERE id = ?',
      [true, 'sent', id]
    );

    res.json({ message: 'Report sent to PL' });
  } catch (err) {
    console.error('Error sending report to PL:', err);
    res.status(500).json({ error: 'Server error sending report to PL' });
  }
});

// PRL: Submit rating
app.post('/api/v1/prl/rating', authenticate, restrictTo('prl'), async (req, res) => {
  const { error } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { target_type, target_id, rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (rater_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, target_type, target_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Error submitting rating' });
  }
});

// PL: View all courses
app.get('/api/v1/pl/courses', authenticate, restrictTo('pl'), async (req, res) => {
  const [rows] = await db.query('SELECT id, name, code, semester, description, faculty_id FROM courses');
  res.json(rows);
});

// PL: Add course
app.post('/api/v1/pl/courses', authenticate, restrictTo('pl'), async (req, res) => {
  const { error } = courseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, code, faculty_id, semester, description } = req.body;
  try {
    await db.query(
      'INSERT INTO courses (name, code, faculty_id, semester, description) VALUES (?, ?, ?, ?, ?)',
      [name, code, faculty_id, semester, description || null]
    );
    res.status(201).json({ message: 'Course added' });
  } catch (err) {
    res.status(400).json({ error: 'Error adding course' });
  }
});

// PL: Add class
app.post('/api/v1/pl/classes', authenticate, restrictTo('pl'), async (req, res) => {
  const { error } = classSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { class_name, venue, scheduled_time } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO classes (class_name, venue, scheduled_time) VALUES (?, ?, ?)',
      [class_name, venue || null, scheduled_time || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Class added' });
  } catch (err) {
    res.status(400).json({ error: `Error adding class: ${err.message}` });
  }
});

// PL: Assign courses to class
app.post('/api/v1/pl/classes/:id/assign-courses', authenticate, restrictTo('pl'), async (req, res) => {
  const { error } = assignCoursesSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { course_ids } = req.body;
  const classId = req.params.id;
  try {
    const [validCourses] = await db.query('SELECT id FROM courses WHERE id IN (?)', [course_ids]);
    if (validCourses.length !== course_ids.length) {
      return res.status(400).json({ error: 'One or more course IDs are invalid' });
    }
    for (const courseId of course_ids) {
      await db.query('INSERT INTO class_courses (class_id, course_id) VALUES (?, ?)', [classId, courseId]);
    }
    res.status(201).json({ message: 'Courses assigned to class' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ error: err.message });
    }
    res.status(400).json({ error: `Error assigning courses: ${err.message}` });
  }
});

// PL: Assign lecturer to class
app.put('/api/v1/pl/classes/:id/assign', authenticate, restrictTo('pl'), async (req, res) => {
  const { error } = assignLecturerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { lecturer_id } = req.body;
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE id = ? AND role = "lecturer"', [lecturer_id]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid lecturer ID' });
    await db.query('UPDATE classes SET lecturer_id = ? WHERE id = ?', [lecturer_id, req.params.id]);
    res.json({ message: 'Lecturer assigned' });
  } catch (err) {
    res.status(400).json({ error: 'Error assigning lecturer' });
  }
});

// PL: View all classes
app.get('/api/v1/pl/classes', authenticate, restrictTo('pl'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT c.id, c.class_name, c.venue, c.scheduled_time, u.full_name as lecturer_name FROM classes c LEFT JOIN users u ON c.lecturer_id = u.id'
  );
  const classes = await Promise.all(rows.map(async cls => {
    const [courses] = await db.query(
      'SELECT co.id, co.name, co.code FROM class_courses cc JOIN courses co ON cc.course_id = co.id WHERE cc.class_id = ?',
      [cls.id]
    );
    return { ...cls, courses };
  }));
  res.json(classes);
});

// PL: View all lecturers
app.get('/api/v1/pl/lecturers', authenticate, restrictTo('pl'), async (req, res) => {
  const [rows] = await db.query('SELECT id, full_name, email, faculty_id FROM users WHERE role = "lecturer"');
  res.json(rows);
});

// PL: View reviewed reports
app.get('/api/v1/pl/reports', authenticate, restrictTo('pl'), async (req, res) => {
  const [rows] = await db.query(
    'SELECT r.id, r.week, r.lecture_date, r.topic_taught, r.prl_feedback, r.status ' +
    'FROM reports r WHERE r.status = "reviewed"'
  );
  res.json(rows);
});

// PL: Assign faculty to PRL
app.post('/api/v1/pl/assign-faculty', authenticate, restrictTo('pl'), async (req, res) => {
  const schema = Joi.object({
    prl_user_id: Joi.number().integer().required(),
    faculty_id: Joi.number().integer().required()
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { prl_user_id, faculty_id } = req.body;
  try {
    const [prlUsers] = await db.query('SELECT id FROM users WHERE id = ? AND role = "prl"', [prl_user_id]);
    if (prlUsers.length === 0) {
      return res.status(400).json({ error: 'Invalid PRL user ID' });
    }
    const [faculties] = await db.query('SELECT id FROM faculties WHERE id = ?', [faculty_id]);
    if (faculties.length === 0) {
      return res.status(400).json({ error: 'Invalid faculty ID' });
    }
    const [existing] = await db.query(
      'SELECT id FROM prl_faculty_assignments WHERE prl_user_id = ? AND faculty_id = ?',
      [prl_user_id, faculty_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'This PRL is already assigned to this faculty' });
    }
    await db.query(
      'INSERT INTO prl_faculty_assignments (prl_user_id, faculty_id, assigned_by_pl_id, assigned_date) VALUES (?, ?, ?, CURDATE())',
      [prl_user_id, faculty_id, req.user.id]
    );
    res.status(201).json({ message: 'Faculty assigned successfully' });
  } catch (err) {
    console.error('Assign faculty error:', err);
    res.status(500).json({ error: `Error assigning faculty: ${err.message}` });
  }
});

// PL: Submit rating
app.post('/api/v1/pl/rating', authenticate, restrictTo('pl'), async (req, res) => {
  const { error } = ratingSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { target_type, target_id, rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (rater_id, target_type, target_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, target_type, target_id, rating, comment || null]
    );
    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(400).json({ error: 'Error submitting rating' });
  }
});

// PL: Monitoring
app.get('/api/v1/pl/monitoring', authenticate, restrictTo('pl'), async (req, res) => {
  const [reports] = await db.query('SELECT id, week, lecture_date, status, prl_feedback FROM reports');
  const [ratings] = await db.query('SELECT id, target_type, target_id, rating, comment FROM ratings');
  res.json({ reports, ratings });
});

// Utility: Get enrollment count for a class
app.get('/api/v1/classes/:id/enrollments/count', authenticate, async (req, res) => {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?', [req.params.id]);
  res.json(rows[0]);
});

// Get courses for a specific class
app.get('/api/v1/classes/:id/courses', authenticate, async (req, res) => {
  const classId = req.params.id;
  try {
    console.log(`Fetching courses for class ID: ${classId}`);
    const [rows] = await db.query(
      'SELECT co.id, co.name, co.code FROM class_courses cc JOIN courses co ON cc.course_id = co.id WHERE cc.class_id = ?',
      [classId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No courses found for this class' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Error fetching courses for class:', err);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

// Get all classes for student registration
app.get('/api/v1/classes', authenticate, restrictTo('student'), async (req, res) => {
  try {
    console.log('Fetching all classes for student');
    const [rows] = await db.query(
      'SELECT c.id, c.class_name, c.venue, c.scheduled_time FROM classes c'
    );
    const classes = await Promise.all(rows.map(async cls => {
      const [courses] = await db.query(
        'SELECT co.id, co.name, co.code FROM class_courses cc JOIN courses co ON cc.course_id = co.id WHERE cc.class_id = ?',
        [cls.id]
      );
      return { ...cls, courses };
    }));
    if (classes.length === 0) {
      return res.status(404).json({ error: 'No classes available' });
    }
    res.json(classes);
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Server error fetching classes' });
  }
});

// PL: View all PRL users
app.get('/api/v1/pl/prl-users', authenticate, restrictTo('pl'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, full_name, email FROM users WHERE role = "prl"');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No PRL users found' });
    }
    res.json(rows);
  } catch (err) {
    console.error('PRL users fetch error:', err);
    res.status(500).json({ error: 'Server error fetching PRL users' });
  }
});

// PL: View all faculties
app.get('/api/v1/pl/faculties', authenticate, restrictTo('pl'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM faculties');
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No faculties found' });
    }
    res.json(rows);
  } catch (err) {
    console.error('Faculties fetch error:', err);
    res.status(500).json({ error: 'Server error fetching faculties' });
  }
});

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));