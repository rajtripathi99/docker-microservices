/**
 * Express application module
 * Defines the REST API endpoints for user management
 * Includes CRUD operations for users and a health check endpoint
 */

import express from 'express';
import { query } from './db.js';

const app = express();

app.use(express.json());

/**
 * Health check endpoint
 * @route GET /ping
 * @returns {string} 'pong' if the server is running
 */
app.get('/ping', (req, res) => {
  res.send('pong');
});

/**
 * Get all users
 * @route GET /api/users
 * @returns {Array} List of all users
 */
app.get('/api/users', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @param {string} req.params.id - User ID
 * @returns {Object} User object
 */
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create a new user
 * @route POST /api/users
 * @param {Object} req.body - User data
 * @param {string} req.body.name - User's name
 * @param {string} req.body.email - User's email
 * @returns {Object} Created user object
 */
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const result = await query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update an existing user
 * @route PUT /api/users/:id
 * @param {string} req.params.id - User ID
 * @param {Object} req.body - Updated user data
 * @param {string} req.body.name - Updated name
 * @param {string} req.body.email - Updated email
 * @returns {Object} Updated user object
 */
app.put('/api/users/:id', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const result = await query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Delete a user
 * @route DELETE /api/users/:id
 * @param {string} req.params.id - User ID to delete
 * @returns {number} 204 status code on success
 */
app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🚫 This route will NOT be tested (lowers coverage to ~80–85%)
if (process.env.NODE_ENV === 'something-impossible') {
  app.get('/untested', (req, res) => {
    res.send('This is not tested!');
  });
}

export function createApp() {
  return app;
}

export default app;
