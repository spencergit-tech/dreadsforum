const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// Set up database connection using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:nuxtxfgeaeoosizrqqkv@db.nuxtxfgeaeoosizrqqkv.supabase.co:5432/postgres"
  ssl: {rejectUnauthorized: false },
});

// Test database connection
pool.query('SELECT * FROM public.threads LIMIT 1', (err, res) => {
  if (err) {
    console.error('Threads table not found:', err);
  } else {
    console.log('Threads table exists:', res.rows);
  }
});

// Set search path explicitly to public schema
pool.on('connect', async (client) => {
  await client.query('SET search_path TO public;');
});

// Set up CORS to allow frontend to make requests to this API
const corsOptions = {
  origin: 'https://spencergit-tech.github.io', // Your frontend URL
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Create 'uploads' folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Root route
app.get('/', (req, res) => {
  res.send('Backend API is working!');
});

// Set up multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder to save the images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

// API endpoint to create a new thread or reply
app.post('/api/threads', async (req, res) => {
  const { username, subject, comment, parent_id } = req.body;

  if (!username || !comment) {
    return res.status(400).json({ message: 'Username and comment are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO public.threads (username, subject, comment, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, subject, comment, parent_id]
    );

    res.status(201).json(result.rows[0]); // Return the created thread or reply
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating thread/reply', error: error.message });
  }
});

// API endpoint to fetch all main threads
app.get('/api/threads', async (req, res) => {
  try {
    const query = 'SELECT * FROM public.threads WHERE parent_id IS NULL ORDER BY timestamp DESC';
    console.log('Running query:', query); // ✅ Log query
    const result = await pool.query(query);
    res.status(200).json(result.rows); // Return all threads
  } catch (error) {
    console.error('Database Query Error:', error); // ✅ Log full error
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

// API endpoint to fetch replies for a specific thread
app.get('/api/threads/:thread_id/replies', async (req, res) => {
  const { thread_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM public.threads WHERE parent_id = $1 ORDER BY timestamp ASC',
      [thread_id]
    );
    res.status(200).json(result.rows); // Return replies
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching replies', error: error.message });
  }
});

// Serve static files (images) from the "uploads" folder
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
