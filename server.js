const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;

// ✅ Updated Database Connection Setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://dread_forum_user:tFl8I6hKobuUW2VmsDdaKKgBLlM5kk1I@dpg-cuefn11u0jms73calkn0-a.oregon-postgres.render.com/dread_forum",
  ssl: { rejectUnauthorized: false },
});

// ✅ Set search path explicitly to the public schema
pool.query('SET search_path TO public;').catch((err) => {
  console.error('Error setting search_path:', err);
});

// ✅ Test database connection
pool.query('SELECT * FROM public.threads LIMIT 1', (err, res) => {
  if (err) {
    console.error('❌ Error: Threads table not found:', err.message);
  } else {
    console.log('✅ Threads table exists:', res.rows);
  }
});

// ✅ Set up CORS
const corsOptions = {
  origin: 'https://spencergit-tech.github.io', // Frontend URL
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));
app.use(express.json());

// ✅ Create 'uploads' folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Root route
app.get('/', (req, res) => {
  res.send('Backend API is working!');
});

// ✅ Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// ✅ Create a new thread or reply
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating thread/reply:', error.message);
    res.status(500).json({ message: 'Error creating thread/reply', error: error.message });
  }
});

// ✅ Fetch all main threads
app.get('/api/threads', async (req, res) => {
  try {
    const query = 'SELECT * FROM public.threads WHERE parent_id IS NULL ORDER BY timestamp DESC';
    console.log('🛠 Running query:', query);
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Database Query Error:', error.message);
    res.status(500).json({ message: 'Error fetching threads', error: error.message });
  }
});

// ✅ Fetch replies for a specific thread
app.get('/api/threads/:thread_id/replies', async (req, res) => {
  const { thread_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM public.threads WHERE parent_id = $1 ORDER BY timestamp ASC',
      [thread_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching replies:', error.message);
    res.status(500).json({ message: 'Error fetching replies', error: error.message });
  }
});

// ✅ Serve static images from "uploads"
app.use('/uploads', express.static('uploads'));

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
