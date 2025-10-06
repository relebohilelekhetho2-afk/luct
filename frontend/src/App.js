import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import './App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data);
        })
        .catch(err => {
          console.error('Error fetching user:', err);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return React.createElement('div', { className: 'loading-container' }, 'Loading...');
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, setUser } },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        'nav',
        { className: 'nav-bar' },
        React.createElement(
          'div',
          { className: 'nav-links' },
          React.createElement(Link, { to: '/', className: 'nav-link' }, 'Home'),
          user && React.createElement(Link, { to: '/dashboard', className: 'nav-link' }, 'Dashboard')
        ),
        user
          ? React.createElement(
              'button',
              {
                onClick: () => { localStorage.removeItem('token'); setUser(null); },
                className: 'logout-button'
              },
              'Logout'
            )
          : React.createElement(
              'div',
              { className: 'auth-links' },
              React.createElement(Link, { to: '/login', className: 'nav-link' }, 'Login'),
              React.createElement(Link, { to: '/register', className: 'nav-link' }, 'Register')
            )
      ),
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/',
          element: React.createElement('div', { className: 'home-container' },
            React.createElement('h1', { className: 'home-title' }, 'Welcome to LUCT Reporting System')
          )
        }),
        React.createElement(Route, { path: '/login', element: React.createElement(Login) }),
        React.createElement(Route, { path: '/register', element: React.createElement(Register) }),
        React.createElement(Route, { path: '/dashboard/*', element: React.createElement(Dashboard) })
      )
    )
  );
};

export default App;