import React, { useContext, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import LecturerClasses from './LecturerClasses';
import LecturerRating from './LecturerRating';
import PLClasses from './PLClasses';
import PLCourses from './PLCourses';
import PLLecturers from './PLLecturers';
import PLRating from './PLRating';
import PLRegistrations from './PLRegistrations';
import PLReports from './PLReports';
import PRLClasses from './PRLClasses';
import PRLCourses from './PRLCourses';
import PRLRating from './PRLRating';
import PRLReports from './PRLReports';
import ReportForm from './ReportForm';
import StudentMonitoring from './StudentMonitoring';
import StudentRating from './StudentRating';
import StudentRegistration from './StudentRegistration';
import PLAssignFaculty from './PLAssignFaculty';
import './Dashboard.css';

// Simple Error Boundary component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    const errorHandler = (error, errorInfo) => {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return React.createElement(
      'div',
      { className: 'error-message' },
      'An error occurred. Please refresh the page or try again later.'
    );
  }

  return children;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return React.createElement('div', { className: 'login-prompt' }, 'Please log in');
  }

  const navItems = {
    student: [
      { path: 'registration', label: 'Registration', component: React.createElement(StudentRegistration) },
      { path: 'monitoring', label: 'Monitoring', component: React.createElement(StudentMonitoring) },
      { path: 'rating', label: 'Rating', component: React.createElement(StudentRating) }
    ],
    lecturer: [
      { path: 'classes', label: 'Classes', component: React.createElement(LecturerClasses) },
      { path: 'reports', label: 'Reports', component: React.createElement(ReportForm) },
      { path: 'monitoring', label: 'Monitoring', component: React.createElement(StudentMonitoring) },
      { path: 'rating', label: 'Rating', component: React.createElement(LecturerRating) }
    ],
    prl: [
      { path: 'courses', label: 'Courses', component: React.createElement(PRLCourses) },
      { path: 'reports', label: 'Reports', component: React.createElement(PRLReports) },
      { path: 'monitoring', label: 'Monitoring', component: React.createElement(StudentMonitoring) },
      { path: 'rating', label: 'Rating', component: React.createElement(PRLRating) },
      { path: 'classes', label: 'Classes', component: React.createElement(PRLClasses) }
    ],
    pl: [
      { path: 'courses', label: 'Courses', component: React.createElement(PLCourses) },
      { path: 'reports', label: 'Reports', component: React.createElement(PLReports) },
      { path: 'monitoring', label: 'Monitoring', component: React.createElement(StudentMonitoring) },
      { path: 'classes', label: 'Classes', component: React.createElement(PLClasses) },
      { path: 'lecturers', label: 'Lecturers', component: React.createElement(PLLecturers) },
      { path: 'rating', label: 'Rating', component: React.createElement(PLRating) },
      { path: 'registrations', label: 'Registrations', component: React.createElement(PLRegistrations) },
      { path: 'pl-assign-faculty', label: 'Assign Faculty', component: React.createElement(PLAssignFaculty) }
    ]
  };

  return React.createElement(
    ErrorBoundary,
    null,
    React.createElement(
      'div',
      { className: 'dashboard-container' },
      React.createElement('h1', { className: 'dashboard-title' }, `Dashboard - ${user.role.toUpperCase()}`),
      React.createElement(
        'nav',
        { className: 'nav-bar' },
        navItems[user.role].map(item =>
          React.createElement(
            Link,
            { key: item.path, to: `/dashboard/${item.path}`, className: 'nav-link' },
            item.label
          )
        )
      ),
      React.createElement(
        Routes,
        null,
        navItems[user.role].map(item =>
          React.createElement(Route, { key: item.path, path: item.path, element: item.component })
        ),
        React.createElement(Route, { path: '/', element: React.createElement('div', { className: 'default-message' }, 'Select an option from the navigation bar') })
      )
    )
  );
};

export default Dashboard;
